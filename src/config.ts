/**
 * Central app configuration.
 * The API key is NEVER stored in source code: it lives in the user's localStorage.
 * The model is NOT hardcoded: it is discovered with ListModels and chosen in Réglages
 * (see src/services/modelService.ts → getModel()).
 */

/**
 * Used ONLY when ListModels itself fails (network, proxy…), to populate the dropdown
 * and as a last-resort default. Ordered by preference.
 */
export const GEMINI_FALLBACK_MODELS: { id: string; displayName: string }[] = [
  { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash" },
  { id: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro" },
  { id: "gemini-1.5-flash", displayName: "Gemini 1.5 Flash" },
];

export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Where users create a key. */
export const GEMINI_KEY_URL = "https://aistudio.google.com/apikey";

/**
 * Thinking budget for gemini-2.5-flash* (0 = disabled). Other families get their own
 * low-latency setting, see thinkingConfigFor() in modelService.ts. null = never send it.
 */
export const GEMINI_THINKING_BUDGET: number | null = 0;

export const GEMINI_TIMEOUTS = {
  testMs: 45_000,
  listModelsMs: 15_000,
  extractionMs: 90_000,
  /** One generateContent call on a whole video (thinking models can be slow). */
  videoAnalysisMs: 240_000,
  /** Upload of the video file to the Gemini Files API. */
  videoUploadMs: 300_000,
  /** Max wait for Google to finish processing an uploaded video (state ACTIVE). */
  videoProcessingMs: 300_000,
};

export const VIDEO_ANALYSIS = {
  /** Files up to this size are sent inline (base64) in the request; bigger ones use the Files API. */
  maxInlineBytes: 14 * 1024 * 1024,
  /** Files API limit is 2 GB; TikTok exports are far smaller. */
  maxBytes: 2 * 1024 * 1024 * 1024,
  pollIntervalMs: 2_500,
};

export const GEMINI_RETRY = {
  /** Total attempts per model for 503 / 429 / 5xx / timeouts (1 call + 2 retries). */
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 20_000,
  /**
   * If Google asks us to wait longer than this (retryDelay / Retry-After), we stop retrying
   * this model and move on to the fallback instead of blocking the user.
   */
  maxHonouredDelayMs: 30_000,
};

/** Max alternative models tried by the automatic fallback / the connection test. */
export const GEMINI_FALLBACK_MAX = 3;

export const STATS_IMPORT = {
  maxScreenshots: 4,
  /** Screenshots are downscaled so the long side is at most this many pixels. */
  maxImageSide: 2000,
  maxTextChars: 30_000,
};

export const STORAGE_KEYS = {
  apiKey: "vl.geminiKey",
  demoMode: "vl.demoMode",
  model: "vl.model",
  modelAdvanced: "vl.modelAdvanced",
  modelsCache: "vl.modelsCache",
  modelFallback: "vl.modelFallback",
  profile: "vl.profile",
};
