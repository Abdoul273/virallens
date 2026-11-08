/**
 * Minimal Gemini REST client (no SDK) with:
 * - per-attempt timeout (AbortController)
 * - up to 3 attempts on 503 / 429 / 5xx with exponential backoff + jitter,
 *   honouring RetryInfo.retryDelay and the Retry-After header
 * - automatic fallback to the next candidate model (503 / 429 / 404), can be disabled in Réglages
 * - structured JSON output + one "repair" retry when the JSON is invalid
 * - typed French errors (GeminiError) that keep Google's HTTP status, error status and message
 */
import {
  GEMINI_API_BASE,
  GEMINI_FALLBACK_MAX,
  GEMINI_RETRY,
  GEMINI_THINKING_BUDGET,
  GEMINI_TIMEOUTS,
} from "@/config";
import { GeminiError } from "./errors";
import { requestJson } from "./http";
import {
  fallbackCandidates,
  fallbackModels,
  getModel,
  isFallbackEnabled,
  loadModelsCache,
  thinkingConfigFor,
  type ModelKind,
} from "./modelService";

/** Fired on window when a call finally fails because the model is unavailable for this key. */
export const MODEL_UNAVAILABLE_EVENT = "vl:model-unavailable";
/** Fired on window when another model answered because the selected one failed. */
export const MODEL_FALLBACK_EVENT = "vl:model-fallback";

export interface ModelFallbackDetail {
  used: string;
  failed: string;
  error: GeminiError;
}

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

/** Subset of the OpenAPI schema format accepted by Gemini `responseSchema`. */
export interface GeminiSchema {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN";
  description?: string;
  nullable?: boolean;
  enum?: string[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  propertyOrdering?: string[];
}

interface GenerateOptions {
  apiKey: string;
  /** Explicit model id. Defaults to getModel(modelKind). */
  model?: string;
  /** Attempts per model on retryable errors (503, 429, 5xx, timeout). Default GEMINI_RETRY.maxAttempts. */
  maxAttempts?: number;
  /** Retry on client-side timeouts too. Default true. */
  retryTimeouts?: boolean;
  /**
   * Try other models when this one fails with 503 / 429 / 404.
   * Default: true unless an explicit `model` is given; always off when disabled in Réglages.
   */
  allowFallback?: boolean;
  /** Which configured model to use when `model` is not given. Default "main". */
  modelKind?: ModelKind;
  parts: GeminiPart[];
  systemInstruction?: string;
  responseSchema?: GeminiSchema;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new GeminiError("aborted"));
    });
  });

/** Wait before the next attempt, or null when we should stop retrying this model. */
function retryDelayFor(e: GeminiError, attempt: number): number | null {
  if (e.retryAfterMs !== undefined) {
    if (e.retryAfterMs > GEMINI_RETRY.maxHonouredDelayMs) return null;
    return e.retryAfterMs + Math.random() * 500;
  }
  const exp = GEMINI_RETRY.baseDelayMs * 2 ** attempt;
  // "equal jitter": half fixed, half random
  return Math.min(GEMINI_RETRY.maxDelayMs, exp / 2 + Math.random() * (exp / 2));
}

/** One generateContent call with timeout. */
async function callOnce(
  opts: GenerateOptions & { model: string; noThinking?: boolean },
): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0,
    maxOutputTokens: opts.maxOutputTokens ?? 4096,
  };
  if (opts.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = opts.responseSchema;
  }
  const thinking = opts.noThinking ? null : thinkingConfigFor(opts.model, GEMINI_THINKING_BUDGET);
  if (thinking) generationConfig.thinkingConfig = thinking;

  const body = await requestJson<any>(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(opts.model)}:generateContent`,
    {
      method: "POST",
      apiKey: opts.apiKey,
      model: opts.model,
      timeoutMs: opts.timeoutMs ?? GEMINI_TIMEOUTS.extractionMs,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: opts.parts }],
        ...(opts.systemInstruction
          ? { systemInstruction: { parts: [{ text: opts.systemInstruction }] } }
          : {}),
        generationConfig,
      }),
    },
  );

  if (body?.promptFeedback?.blockReason)
    throw new GeminiError("safety_blocked", { detail: body.promptFeedback.blockReason });
  const cand = body?.candidates?.[0];
  if (!cand) throw new GeminiError("invalid_json", { detail: "no candidates" });
  if (cand.finishReason === "SAFETY" || cand.finishReason === "PROHIBITED_CONTENT")
    throw new GeminiError("safety_blocked", { detail: cand.finishReason });
  const text: string = (cand.content?.parts ?? [])
    .filter((p: { thought?: boolean; text?: string }) => !p.thought && typeof p.text === "string")
    .map((p: { text: string }) => p.text)
    .join("");
  return text;
}

/** generateContent on ONE model with retries. Annotates the thrown error with model + attempts. */
async function generateOnModel(opts: GenerateOptions, model: string): Promise<string> {
  const maxAttempts = Math.max(1, opts.maxAttempts ?? GEMINI_RETRY.maxAttempts);
  let attempt = 0;
  let noThinking = false;
  for (;;) {
    try {
      return await callOnce({ ...opts, model, noThinking });
    } catch (e) {
      const err = e instanceof GeminiError ? e : new GeminiError("unknown", { detail: String(e) });
      err.model ??= model;
      // Some models reject thinkingConfig: retry once without it (does not count as an attempt).
      if (
        err.code === "bad_request" &&
        !noThinking &&
        /thinking/i.test(`${err.apiMessage ?? ""} ${err.detail ?? ""}`)
      ) {
        noThinking = true;
        continue;
      }
      attempt++;
      err.attempts = attempt;
      // Network errors are usually a hard block (CORS, adblock, offline, proxy): retry at most once.
      const limit =
        err.code === "network"
          ? Math.min(maxAttempts, err.status ? 1 : 2)
          : err.code === "timeout" && opts.retryTimeouts === false
            ? 1
            : maxAttempts;
      if (!err.retryable || attempt >= limit || opts.signal?.aborted) throw err;
      const delay = retryDelayFor(err, attempt - 1);
      if (delay === null) throw err;
      await sleep(delay, opts.signal);
    }
  }
}

/** Errors that justify trying another model. */
export function isFallbackWorthy(e: GeminiError): boolean {
  return (
    e.status === 503 ||
    e.status === 429 ||
    e.status === 404 ||
    ["overloaded", "rate_limited", "quota_exceeded", "free_tier_limit", "model_not_found"].includes(
      e.code,
    )
  );
}

/** generateContent with retries and automatic model fallback. Returns the text and the model that answered. */
export async function generateTextResult(
  opts: GenerateOptions,
): Promise<{ text: string; model: string }> {
  const model = opts.model ?? getModel(opts.modelKind ?? "main");
  try {
    return { text: await generateOnModel(opts, model), model };
  } catch (e) {
    const first = e as GeminiError;
    const allow = (opts.allowFallback ?? !opts.model) && isFallbackEnabled();
    if (!allow || !isFallbackWorthy(first) || opts.signal?.aborted) {
      notifyUnavailable(first, model);
      throw first;
    }
    const list = loadModelsCache(opts.apiKey) ?? fallbackModels();
    const tried = [{ model, status: first.status, apiStatus: first.apiStatus }];
    for (const alt of fallbackCandidates(list, [model], GEMINI_FALLBACK_MAX)) {
      try {
        const text = await generateOnModel(opts, alt);
        if (typeof window !== "undefined")
          window.dispatchEvent(
            new CustomEvent<ModelFallbackDetail>(MODEL_FALLBACK_EVENT, {
              detail: { used: alt, failed: model, error: first },
            }),
          );
        return { text, model: alt };
      } catch (e2) {
        const err2 = e2 as GeminiError;
        if (err2.code === "aborted") throw err2;
        tried.push({ model: alt, status: err2.status, apiStatus: err2.apiStatus });
        if (!isFallbackWorthy(err2)) break;
      }
    }
    first.triedModels = tried;
    if (tried.length > 1)
      first.message += ` Modèles de secours essayés sans succès : ${tried
        .slice(1)
        .map((t) => t.model)
        .join(", ")}.`;
    notifyUnavailable(first, model);
    throw first;
  }
}

function notifyUnavailable(err: GeminiError, model: string) {
  if (err.code === "model_not_found" && typeof window !== "undefined")
    window.dispatchEvent(
      new CustomEvent(MODEL_UNAVAILABLE_EVENT, { detail: { model, error: err } }),
    );
}

/** generateContent with retries and automatic fallback. */
export async function generateText(opts: GenerateOptions): Promise<string> {
  return (await generateTextResult(opts)).text;
}

/** Strip code fences / prose and parse JSON. Returns undefined when invalid. */
export function tryParseJson(text: string): unknown | undefined {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.search(/[[{]/);
  const last = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (first > 0 || (last >= 0 && last < t.length - 1)) t = t.slice(Math.max(0, first), last + 1);
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

/**
 * Structured JSON generation. If the model returns invalid JSON, we ask it once
 * to repair its own output against the same schema, then give up with `invalid_json`.
 */
export async function generateJson<T>(
  opts: GenerateOptions & { responseSchema: GeminiSchema },
): Promise<T> {
  const { text: raw, model } = await generateTextResult(opts);
  const parsed = tryParseJson(raw);
  if (parsed !== undefined && typeof parsed === "object" && parsed !== null) return parsed as T;

  // Repair with the model that actually answered (it may be a fallback).
  const repaired = await generateText({
    ...opts,
    model,
    allowFallback: opts.allowFallback ?? !opts.model,
    systemInstruction:
      "You repair malformed JSON. Return ONLY valid JSON matching the response schema. Do not add or invent values; use null for anything missing.",
    parts: [{ text: `Repair this into valid JSON:\n\n${raw.slice(0, 20_000)}` }],
  });
  const fixed = tryParseJson(repaired);
  if (fixed !== undefined && typeof fixed === "object" && fixed !== null) return fixed as T;
  throw new GeminiError("invalid_json", { detail: raw.slice(0, 300), model });
}

/** Tiny generateContent round-trip with a given model (never falls back to another model). */
export async function pingModel(
  apiKey: string,
  model: string,
  opts: { signal?: AbortSignal; maxAttempts?: number } = {},
): Promise<{ model: string; latencyMs: number }> {
  if (!apiKey.trim()) throw new GeminiError("missing_key", { model });
  const t0 = performance.now();
  await generateText({
    apiKey: apiKey.trim(),
    model,
    allowFallback: false,
    parts: [{ text: "Réponds uniquement par: OK" }],
    // generous: on thinking models the budget also covers internal reasoning
    maxOutputTokens: 512,
    timeoutMs: GEMINI_TIMEOUTS.testMs,
    maxAttempts: opts.maxAttempts ?? GEMINI_RETRY.maxAttempts,
    // a slow test should fail fast and clearly, not be retried for minutes
    retryTimeouts: false,
    signal: opts.signal,
  });
  return { model, latencyMs: Math.round(performance.now() - t0) };
}
