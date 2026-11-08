/** Shared fetch for the Gemini REST API: timeout, abort, network detection, typed errors. */
import { GeminiError } from "./errors";

interface ApiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      "@type"?: string;
      reason?: string;
      retryDelay?: string;
      violations?: Array<{ quotaId?: string; quotaValue?: string }>;
    }>;
  };
}

/** "37s" / "1.5s" (google.protobuf.Duration JSON) → ms. */
function parseDuration(v?: string): number | undefined {
  const m = v?.match(/^(\d+(?:\.\d+)?)s$/);
  return m ? Math.round(Number(m[1]) * 1000) : undefined;
}

/** Retry-After header: delta-seconds or HTTP date → ms. */
export function parseRetryAfter(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(0, n * 1000);
  const d = Date.parse(v);
  return Number.isNaN(d) ? undefined : Math.max(0, d - Date.now());
}

const q = (model?: string) => (model ? ` « ${model} »` : "");

/** Map an HTTP error response from Google to a typed GeminiError (keeps Google's status/message). */
export function mapHttpError(
  status: number,
  body: ApiErrorBody,
  model?: string,
  retryAfterHeaderMs?: number,
): GeminiError {
  const err = body.error ?? {};
  const msg = err.message ?? "";
  const apiStatus = err.status;
  const details = err.details ?? [];
  const reasons = details.map((d) => d.reason).filter(Boolean);
  const retryAfterMs =
    parseDuration(details.find((d) => d.retryDelay)?.retryDelay) ?? retryAfterHeaderMs;
  const detail = `${status} ${apiStatus ?? ""} ${msg}`.trim();
  const base = { status, detail, model, apiStatus, apiMessage: msg || undefined, retryAfterMs };

  if (
    reasons.includes("API_KEY_INVALID") ||
    /api key not valid|API_KEY_INVALID|api key expired/i.test(msg)
  )
    return new GeminiError("invalid_key", base);
  if (status === 400 && /location is not supported|user location/i.test(msg))
    return new GeminiError("permission_denied", {
      ...base,
      message:
        "Région non prise en charge : l’API Gemini n’est pas disponible depuis ton pays (400 FAILED_PRECONDITION).",
    });
  if (
    status === 404 ||
    apiStatus === "NOT_FOUND" ||
    (status === 400 &&
      /not supported for generatecontent|not found for api version|is not found/i.test(msg))
  )
    return new GeminiError("model_not_found", {
      ...base,
      message: `Le modèle${q(model)} n’est pas disponible pour cette clé (${status} ${apiStatus ?? "NOT_FOUND"}). Choisis-en un autre dans Réglages.`,
    });
  if (status === 401) return new GeminiError("invalid_key", base);
  if (status === 403 || apiStatus === "PERMISSION_DENIED")
    return new GeminiError("permission_denied", {
      ...base,
      message: `Accès refusé (${status} ${apiStatus ?? "PERMISSION_DENIED"}) : la clé n’a pas la permission d’utiliser${q(model) || " l’API Gemini"}, l’API n’est pas activée sur son projet Google Cloud, ou ta région n’est pas prise en charge.`,
    });
  if (status === 429 || apiStatus === "RESOURCE_EXHAUSTED") {
    const violations = details.flatMap((d) => d.violations ?? []);
    const quotaIds = violations.map((v) => v.quotaId ?? "").filter(Boolean);
    const freeTier = quotaIds.some((x) => /free/i.test(x)) || /free[_ -]?tier/i.test(msg);
    const zeroLimit = /limit:\s*0\b/i.test(msg) || violations.some((v) => v.quotaValue === "0");
    const daily = quotaIds.some((x) => /PerDay/i.test(x)) || /per day|daily/i.test(msg);
    const minute = quotaIds.some((x) => /PerMinute/i.test(x)) || /per minute/i.test(msg);
    const quotaScope = daily ? "day" : minute ? "minute" : "unknown";
    const extra = { ...base, quotaIds, quotaScope } as const;
    const wait = retryAfterMs
      ? ` Google suggère d’attendre ${Math.ceil(retryAfterMs / 1000)} s.`
      : "";
    if (freeTier && zeroLimit)
      return new GeminiError("free_tier_limit", {
        ...extra,
        message: `Le modèle${q(model)} n’est pas inclus dans l’offre gratuite de ta clé (limite 0, 429 RESOURCE_EXHAUSTED). Choisis un modèle Flash stable ou active la facturation sur Google AI Studio.`,
      });
    if (daily)
      return new GeminiError(freeTier ? "free_tier_limit" : "quota_exceeded", {
        ...extra,
        message: `Quota journalier épuisé pour${q(model) || " ce modèle"} (429 RESOURCE_EXHAUSTED). Il se réinitialise chaque jour (minuit, heure du Pacifique) : choisis un autre modèle ou active la facturation.`,
      });
    if (minute)
      return new GeminiError("rate_limited", {
        ...extra,
        retryable: true,
        message: `Limite de débit par minute atteinte pour${q(model) || " ce modèle"} (429 RESOURCE_EXHAUSTED).${wait || " Patiente une minute puis réessaie."}`,
      });
    return new GeminiError("rate_limited", {
      ...extra,
      retryable: true,
      message: `Quota ou limite de débit atteint pour${q(model) || " ce modèle"} (429 ${apiStatus ?? "RESOURCE_EXHAUSTED"}). Google n’a pas précisé s’il s’agit du quota journalier ou par minute.${wait}`,
    });
  }
  if (status === 503 || apiStatus === "UNAVAILABLE")
    return new GeminiError("overloaded", {
      ...base,
      retryable: true,
      message: `Le modèle${q(model)} est surchargé chez Google (${status} ${apiStatus ?? "UNAVAILABLE"}). Ce n’est pas un problème de clé : réessaie dans un instant ou choisis un autre modèle.`,
    });
  if (status === 413)
    return new GeminiError("bad_request", {
      ...base,
      message: "Requête trop volumineuse (413) : réduis le texte ou le nombre de captures.",
    });
  if (status >= 500)
    return new GeminiError("server", {
      ...base,
      retryable: true,
      message:
        `Erreur interne chez Google (${status} ${apiStatus ?? ""}) avec${q(model) || " ce modèle"}. Réessaie dans quelques minutes.`.replace(
          " )",
          ")",
        ),
    });
  if (status === 400)
    return new GeminiError("bad_request", {
      ...base,
      message: `Requête invalide (400 ${apiStatus ?? "INVALID_ARGUMENT"}) : Gemini a refusé les paramètres ou les données envoyés${q(model) ? ` à${q(model)}` : ""}. Voir le message de Google dans les détails techniques.`,
    });
  return new GeminiError("unknown", base);
}

/** fetch + JSON with timeout. Throws GeminiError on any failure. */
export async function requestJson<T>(
  url: string,
  init: RequestInit & { apiKey: string; timeoutMs: number; signal?: AbortSignal; model?: string },
): Promise<T> {
  const { apiKey, timeoutMs, signal, model, headers, ...rest } = init;
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(headers as Record<string, string>), "x-goog-api-key": apiKey },
      signal: ctrl.signal,
    });
  } catch (e) {
    if (timedOut)
      throw new GeminiError("timeout", {
        retryable: true,
        model,
        detail: `Pas de réponse après ${Math.round(timeoutMs / 1000)} s`,
      });
    if (signal?.aborted) throw new GeminiError("aborted", { model });
    throw new GeminiError("network", {
      detail: e instanceof Error ? e.message : String(e),
      retryable: true,
      model,
    });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  let rawBody = "";
  let body: any = null;
  try {
    rawBody = await res.text();
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    /* non-JSON body (proxy / firewall page) */
  }
  if (!res.ok) {
    // A non-JSON error page means something between the browser and Google answered.
    if (!body?.error && (res.status >= 520 || /disallowed|blocked|forbidden|denied/i.test(rawBody)))
      throw new GeminiError("network", {
        status: res.status,
        model,
        detail: `${res.status} ${rawBody.slice(0, 120)}`,
      });
    throw mapHttpError(
      res.status,
      body ?? {},
      model,
      parseRetryAfter(res.headers.get("retry-after")),
    );
  }
  return body as T;
}
