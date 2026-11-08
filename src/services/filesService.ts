/**
 * Gemini Files API (browser): upload a video, wait until Google has processed it, delete it.
 * Upload uses a single multipart request so we never need to read response headers
 * (the resumable protocol's x-goog-upload-url header is not always readable cross-origin).
 */
import { GEMINI_API_BASE, GEMINI_TIMEOUTS, VIDEO_ANALYSIS } from "@/config";
import { GeminiError } from "./errors";
import { mapHttpError, parseRetryAfter, requestJson } from "./http";

const UPLOAD_URL = GEMINI_API_BASE.replace("/v1beta", "/upload/v1beta") + "/files";

export interface GeminiFile {
  name: string; // "files/abc123"
  uri: string;
  mimeType: string;
  state: "STATE_UNSPECIFIED" | "PROCESSING" | "ACTIVE" | "FAILED";
  error?: { message?: string };
}

/** Multipart upload with progress (XHR: fetch has no upload progress). */
export function uploadFile(
  apiKey: string,
  file: Blob,
  opts: {
    mimeType: string;
    displayName: string;
    signal?: AbortSignal;
    onProgress?: (p: number) => void;
  },
): Promise<GeminiFile> {
  const boundary = `vl-${crypto.randomUUID()}`;
  const meta = JSON.stringify({ file: { displayName: opts.displayName.slice(0, 120) } });
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n`,
    `--${boundary}\r\nContent-Type: ${opts.mimeType}\r\n\r\n`,
    file,
    `\r\n--${boundary}--\r\n`,
  ]);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${UPLOAD_URL}?uploadType=multipart`);
    xhr.timeout = GEMINI_TIMEOUTS.videoUploadMs;
    xhr.setRequestHeader("x-goog-api-key", apiKey);
    xhr.setRequestHeader("X-Goog-Upload-Protocol", "multipart");
    xhr.setRequestHeader("Content-Type", `multipart/related; boundary=${boundary}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
    const onAbort = () => xhr.abort();
    opts.signal?.addEventListener("abort", onAbort);
    const done = () => opts.signal?.removeEventListener("abort", onAbort);

    xhr.onload = () => {
      done();
      let json: any = null;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        /* non-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.file?.name) return resolve(json.file);
      if (xhr.status >= 200 && xhr.status < 300)
        return reject(
          new GeminiError("unknown", {
            status: xhr.status,
            detail: "Réponse d’upload inattendue (pas d’objet file)",
          }),
        );
      reject(
        mapHttpError(
          xhr.status,
          json ?? {},
          undefined,
          parseRetryAfter(xhr.getResponseHeader("retry-after")),
        ),
      );
    };
    xhr.onerror = () => {
      done();
      reject(
        new GeminiError("network", {
          message:
            "L’envoi de la vidéo à Google a échoué (connexion coupée, pare-feu, VPN ou bloqueur de pub).",
          detail: "XHR error pendant l’upload vers l’API Files",
        }),
      );
    };
    xhr.ontimeout = () => {
      done();
      reject(
        new GeminiError("timeout", {
          message: "L’envoi de la vidéo prend trop de temps. Vérifie ta connexion puis réessaie.",
          detail: `Upload > ${GEMINI_TIMEOUTS.videoUploadMs / 1000} s`,
        }),
      );
    };
    xhr.onabort = () => {
      done();
      reject(new GeminiError("aborted"));
    };
    xhr.send(body);
  });
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new GeminiError("aborted"));
    });
  });

/** Poll until the file is ACTIVE (videos are processed asynchronously by Google). */
export async function waitForActive(
  apiKey: string,
  file: GeminiFile,
  signal?: AbortSignal,
): Promise<GeminiFile> {
  const deadline = Date.now() + GEMINI_TIMEOUTS.videoProcessingMs;
  let f = file;
  while (f.state !== "ACTIVE") {
    if (f.state === "FAILED")
      throw new GeminiError("bad_request", {
        message:
          "Google n’a pas pu traiter cette vidéo (format ou codec non pris en charge). Exporte-la en MP4 (H.264) puis réessaie.",
        apiMessage: f.error?.message,
        detail: `File ${f.name} state FAILED`,
      });
    if (Date.now() > deadline)
      throw new GeminiError("timeout", {
        message: "Google met trop de temps à préparer la vidéo. Réessaie dans quelques minutes.",
        detail: `File ${f.name} still ${f.state}`,
      });
    await sleep(VIDEO_ANALYSIS.pollIntervalMs, signal);
    f = await requestJson<GeminiFile>(`${GEMINI_API_BASE}/${f.name}`, {
      method: "GET",
      apiKey,
      timeoutMs: 20_000,
      signal,
    });
  }
  return f;
}

/** Best effort: files expire after 48 h anyway. */
export async function deleteFile(apiKey: string, name: string): Promise<void> {
  try {
    await requestJson(`${GEMINI_API_BASE}/${name}`, {
      method: "DELETE",
      apiKey,
      timeoutMs: 15_000,
    });
  } catch {
    /* ignore */
  }
}
