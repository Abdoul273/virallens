/**
 * Video files imported during this browser session, keyed by analysis id.
 * Files are NOT persisted (IndexedDB only keeps metadata), so after a reload
 * the user must re-import the video to run the AI analysis.
 */
const files = new Map<string, File>();

export const videoSession = {
  get: (id: string) => files.get(id) ?? null,
  set: (id: string, f: File) => void files.set(id, f),
  remove: (id: string) => void files.delete(id),
};

/** Same file as the one imported in step 1? (name + size; lastModified is not stored). */
export function matchesSavedVideo(f: File, saved: { name: string; size: number } | null): boolean {
  return !saved || (f.size === saved.size && f.name === saved.name);
}

export const isSupportedVideo = (f: File) =>
  /video\/(mp4|quicktime)/.test(f.type) || /\.(mp4|mov)$/i.test(f.name);

export const videoMimeType = (f: File) =>
  f.type && f.type.startsWith("video/")
    ? f.type
    : /\.mov$/i.test(f.name)
      ? "video/quicktime"
      : "video/mp4";
