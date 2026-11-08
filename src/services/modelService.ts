/**
 * Gemini model discovery and selection.
 * - listModels(): ListModels with pagination, keeps models supporting generateContent
 * - pickDefaultModel() / pickAdvancedModel(): automatic choices
 * - getModel(): the ONE function every Gemini call uses to know which model to hit
 */
import { GEMINI_API_BASE, GEMINI_FALLBACK_MODELS, GEMINI_TIMEOUTS, STORAGE_KEYS } from "@/config";
import { requestJson } from "./http";

export interface GeminiModel {
  /** id without the "models/" prefix, e.g. "gemini-2.5-flash" */
  id: string;
  displayName: string;
  description: string;
  version: string;
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
  methods: string[];
}

export type ModelKind = "main" | "advanced";

/** Stored value for "advanced model = same as main". */
export const SAME_AS_MAIN = "same-as-main";

interface RawModel {
  name?: string;
  baseModelId?: string;
  version?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

/** GET /v1beta/models, following nextPageToken. Only generateContent-capable models are returned. */
export async function listModels(apiKey: string, signal?: AbortSignal): Promise<GeminiModel[]> {
  const out: GeminiModel[] = [];
  let pageToken = "";
  for (let page = 0; page < 20; page++) {
    const url = `${GEMINI_API_BASE}/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const body = await requestJson<{ models?: RawModel[]; nextPageToken?: string }>(url, {
      method: "GET",
      apiKey: apiKey.trim(),
      timeoutMs: GEMINI_TIMEOUTS.listModelsMs,
      signal,
    });
    for (const m of body?.models ?? []) {
      const methods = m.supportedGenerationMethods ?? [];
      if (!m.name || !methods.includes("generateContent")) continue;
      const id = m.name.replace(/^models\//, "");
      out.push({
        id,
        displayName: m.displayName || id,
        description: m.description ?? "",
        version: m.version ?? "",
        inputTokenLimit: m.inputTokenLimit ?? null,
        outputTokenLimit: m.outputTokenLimit ?? null,
        methods,
      });
    }
    pageToken = body?.nextPageToken ?? "";
    if (!pageToken) break;
  }
  // de-duplicate (defensive) and keep a stable, newest-first order
  const unique = [...new Map(out.map((m) => [m.id, m])).values()];
  return unique.sort(compareNewest);
}

/** Fallback entries (used only when ListModels fails). */
export function fallbackModels(): GeminiModel[] {
  return GEMINI_FALLBACK_MODELS.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    description: "",
    version: "",
    inputTokenLimit: null,
    outputTokenLimit: null,
    methods: ["generateContent"],
  }));
}

/* ---------- ranking ---------- */

/** Numeric version parsed from the id: "gemini-2.5-flash" → 2.5, "gemini-flash-latest" → 0. */
export function modelVersion(id: string): number {
  const m = id.match(/gemini-(\d+(?:\.\d+)?)/i);
  return m ? Number(m[1]) : 0;
}

/** Preview / experimental / custom variants: manual choice only, never auto-selected first. */
export const isPreview = (id: string) => /preview|exp|latest-custom|custom-tools/i.test(id);

/** Newest first: higher version, then stable before preview, then later dated ids. */
export function compareNewest(a: GeminiModel, b: GeminiModel): number {
  const v = modelVersion(b.id) - modelVersion(a.id);
  if (v) return v;
  const p = Number(isPreview(a.id)) - Number(isPreview(b.id));
  if (p) return p;
  return b.id.localeCompare(a.id);
}

/** Never picked automatically (default or fallback). Still selectable manually. */
const AUTO_EXCLUDED = [
  "custom-tools",
  "image",
  "tts",
  "live",
  "audio",
  "embedding",
  "robotics",
  "computer-use",
];
export const autoEligible = (id: string) =>
  /^gemini/i.test(id) && !AUTO_EXCLUDED.some((t) => id.toLowerCase().includes(t));

const isFlash = (id: string) => /flash/i.test(id);
const isPro = (id: string) => /-pro\b|-pro-/i.test(id);
const isLite = (id: string) => /lite/i.test(id);

/** Within a tier: full models before "lite", then newest. */
const tierSort = (a: GeminiModel, b: GeminiModel) =>
  Number(isLite(a.id)) - Number(isLite(b.id)) || compareNewest(a, b);

/**
 * Automatic order used for the default choice and for fallback:
 * 1. stable Flash  2. preview Flash  3. Pro (stable, then preview).
 */
export function rankCandidates(models: GeminiModel[]): GeminiModel[] {
  const ok = models.filter((m) => autoEligible(m.id));
  const stableFlash = ok.filter((m) => isFlash(m.id) && !isPreview(m.id)).sort(tierSort);
  const previewFlash = ok.filter((m) => isFlash(m.id) && isPreview(m.id)).sort(tierSort);
  const pro = ok
    .filter((m) => isPro(m.id))
    .sort((a, b) => Number(isPreview(a.id)) - Number(isPreview(b.id)) || compareNewest(a, b));
  return [...stableFlash, ...previewFlash, ...pro];
}

/** Candidate ids to try after `failed` (excluding already tried ones). */
export function fallbackCandidates(models: GeminiModel[], exclude: string[], max = 3): string[] {
  return rankCandidates(models)
    .map((m) => m.id)
    .filter((id) => !exclude.includes(id))
    .slice(0, max);
}

/** Default main model: newest STABLE Flash (non-lite first). */
export function pickDefaultModel(models: GeminiModel[]): string | null {
  return rankCandidates(models)[0]?.id ?? models.find((m) => autoEligible(m.id))?.id ?? null;
}

/** Default advanced model: stable Pro first, then preview Pro, else the main model. */
export function pickAdvancedModel(models: GeminiModel[], mainId: string | null): string | null {
  const pro = models
    .filter((m) => isPro(m.id) && autoEligible(m.id))
    .sort((a, b) => Number(isPreview(a.id)) - Number(isPreview(b.id)) || compareNewest(a, b));
  return pro[0]?.id ?? mainId;
}

/* ---------- automatic fallback setting ---------- */

export function isFallbackEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.modelFallback) !== "off";
  } catch {
    return true;
  }
}

export function setFallbackEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.modelFallback, on ? "on" : "off");
  } catch {
    /* storage disabled */
  }
}

/* ---------- selection persistence ---------- */

const storageKey = (kind: ModelKind) =>
  kind === "main" ? STORAGE_KEYS.model : STORAGE_KEYS.modelAdvanced;

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/** Raw stored choice ("" when the user never chose). */
export function getStoredModel(kind: ModelKind): string {
  return read(storageKey(kind));
}

export function setStoredModel(kind: ModelKind, id: string) {
  try {
    if (id) localStorage.setItem(storageKey(kind), id);
    else localStorage.removeItem(storageKey(kind));
  } catch {
    /* storage disabled */
  }
}

/**
 * The model id to use for a Gemini call.
 * main: stored choice → first fallback. advanced: stored choice → main model.
 */
export function getModel(kind: ModelKind = "main"): string {
  const main = read(STORAGE_KEYS.model) || GEMINI_FALLBACK_MODELS[0].id;
  if (kind === "main") return main;
  const adv = read(STORAGE_KEYS.modelAdvanced);
  return adv && adv !== SAME_AS_MAIN ? adv : main;
}

/* ---------- cache (per key, so a new key triggers a fresh list) ---------- */

const fingerprint = (apiKey: string) => `${apiKey.length}:${apiKey.slice(-6)}`;

export function loadModelsCache(apiKey: string): GeminiModel[] | null {
  try {
    const raw = JSON.parse(read(STORAGE_KEYS.modelsCache) || "null") as {
      fp: string;
      models: GeminiModel[];
    } | null;
    return raw && raw.fp === fingerprint(apiKey) && Array.isArray(raw.models) ? raw.models : null;
  } catch {
    return null;
  }
}

export function saveModelsCache(apiKey: string, models: GeminiModel[]) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.modelsCache,
      JSON.stringify({ fp: fingerprint(apiKey), models }),
    );
  } catch {
    /* ignore */
  }
}

export function clearModelSettings() {
  try {
    [STORAGE_KEYS.model, STORAGE_KEYS.modelAdvanced, STORAGE_KEYS.modelsCache].forEach((k) =>
      localStorage.removeItem(k),
    );
  } catch {
    /* ignore */
  }
}

/* ---------- capabilities (best effort: ListModels does not expose input modalities) ---------- */

export type VideoSupport = "likely" | "unlikely" | "unknown";

export function videoSupport(id: string): VideoSupport {
  const s = id.toLowerCase();
  if (/embedding|tts|aqa|imagen|veo|image-generation|-image|native-audio|live/.test(s))
    return "unlikely";
  if (s.startsWith("gemma") || s.startsWith("learnlm")) return "unlikely";
  if (s.startsWith("gemini")) {
    const v = modelVersion(s);
    if (v >= 1.5 || /latest/.test(s)) return "likely";
    if (v > 0) return "unlikely"; // gemini-1.0
  }
  return "unknown";
}

/**
 * Lowest-latency thinking settings per model family (best effort):
 * - 2.5 Flash / Flash-Lite: thinking can be disabled (budget 0)
 * - 2.5 Pro: thinking cannot be disabled, minimum budget 128
 * - Gemini 3+: uses thinkingLevel; "low" keeps latency down (default is high)
 * - others (2.0, 1.5, gemma…): no thinkingConfig
 * If a model rejects it, geminiService retries once without thinkingConfig.
 */
export function thinkingConfigFor(
  id: string,
  budgetFor25Flash: number | null,
): Record<string, unknown> | null {
  const s = id.toLowerCase();
  if (/gemini-2\.5-flash/.test(s))
    return budgetFor25Flash === null ? null : { thinkingBudget: budgetFor25Flash };
  if (/gemini-2\.5-pro/.test(s)) return { thinkingBudget: 128 };
  if (modelVersion(s) >= 3 || /gemini-(flash|pro)-latest/.test(s)) return { thinkingLevel: "low" };
  return null;
}
