/** Browser-only media helpers (no upload: everything stays local). */

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = url;
  });
}

/** Downscale + re-encode an image so it stays small enough for an inline Gemini request. */
export async function imageToBase64(
  file: File,
  maxSide: number,
): Promise<{ mimeType: string; data: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    return { mimeType: "image/jpeg", data: dataUrl.split(",")[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Grab a small JPEG frame from a local video file. Resolves null if the browser can't decode it. */
export function captureVideoThumbnail(file: File, width = 270): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;
    const finish = (v: string | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(v);
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 4);
    };
    video.onseeked = () => {
      try {
        const h =
          Math.round((video.videoHeight / video.videoWidth) * width) ||
          Math.round(width * (16 / 9));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(video, 0, 0, width, h);
        finish(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    setTimeout(() => finish(null), 8000);
    video.src = url;
  });
}

/** Duration of a local video file in seconds, or null if the browser can't read it. */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;
    const finish = (v: number | null) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(v);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      finish(Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : null);
    video.onerror = () => finish(null);
    setTimeout(() => finish(null), 6000);
    video.src = url;
  });
}
