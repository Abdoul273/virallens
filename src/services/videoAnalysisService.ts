/**
 * Real video analysis with Gemini:
 * 1. send the video (inline if small, otherwise Files API upload + wait until ACTIVE)
 * 2. one structured generateContent call with the stats + context
 * 3. strict validation / normalization of the JSON before it is saved
 */
import { GEMINI_TIMEOUTS, VIDEO_ANALYSIS } from "@/config";
import { formatPct } from "@/lib/metrics";
import { formatTime } from "@/lib/utils";
import type {
  ActionItem,
  Confidence,
  Diagnosis,
  EditStep,
  Evidence,
  HookFrame,
  HookProposal,
  Level,
  SavedAnalysis,
  Severity,
  SubScore,
  VideoAiReport,
} from "@/types";
import { GeminiError } from "./errors";
import { deleteFile, uploadFile, waitForActive } from "./filesService";
import {
  generateTextResult,
  tryParseJson,
  type GeminiPart,
  type GeminiSchema,
} from "./geminiService";
import { videoMimeType } from "./videoSession";

export type AnalysisPhase = "upload" | "processing" | "analysis" | "saving";

export interface AnalysisProgress {
  phase: AnalysisPhase;
  /** 0..1 for the upload phase. */
  progress?: number;
}

/* ---------------- schema ---------------- */

const S = (description?: string): GeminiSchema => ({
  type: "STRING",
  ...(description ? { description } : {}),
});
const LEVEL: GeminiSchema = { type: "STRING", enum: ["fort", "moyen", "faible"] };

export const VIDEO_REPORT_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    globalScore: { type: "INTEGER", description: "0-100, potentiel global de la vidéo" },
    verdict: S("Une phrase, le problème n°1 et pourquoi, avec un chiffre si possible"),
    confidence: { type: "STRING", enum: ["low", "medium", "high"] },
    diagnoses: {
      type: "ARRAY",
      description: "3 à 6 causes de sous-performance, de la plus probable à la moins probable",
      items: {
        type: "OBJECT",
        properties: {
          title: S(),
          description: S("Ce qui se passe et pourquoi ça fait décrocher, concret"),
          probability: { type: "INTEGER", description: "0-100" },
          severity: { type: "STRING", enum: ["high", "medium", "low"] },
          evidence: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                kind: { type: "STRING", enum: ["timestamp", "metric"] },
                label: S("Pour timestamp : ce qu’on voit. Pour metric : la stat citée"),
                timeSec: {
                  type: "NUMBER",
                  nullable: true,
                  description: "secondes depuis le début",
                },
              },
              required: ["kind", "label"],
            },
          },
        },
        required: ["title", "description", "probability", "severity", "evidence"],
      },
    },
    hook: {
      type: "OBJECT",
      properties: {
        assessment: S("Évaluation des 3 premières secondes"),
        frames: {
          type: "ARRAY",
          description: "0s, 1s, 2s, 3s : ce que le spectateur voit et entend réellement",
          items: {
            type: "OBJECT",
            properties: { timeSec: { type: "NUMBER" }, sees: S(), hears: S() },
            required: ["timeSec", "sees", "hears"],
          },
        },
        proposals: {
          type: "ARRAY",
          description: "3 accroches réécrites, la meilleure en premier",
          items: {
            type: "OBJECT",
            properties: {
              type: S("Ex. Résultat d’abord, Question, Contradiction"),
              text: S("Phrase dite/affichée"),
              visual: S("Plan à montrer"),
            },
            required: ["type", "text", "visual"],
          },
        },
      },
      required: ["assessment", "frames", "proposals"],
    },
    subScores: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: {
            type: "STRING",
            enum: ["hook", "pacing", "clarity", "emotion", "shareability", "seo"],
          },
          score: { type: "INTEGER", description: "0-100" },
          explanation: S("Une phrase"),
        },
        required: ["key", "score", "explanation"],
      },
    },
    actions: {
      type: "ARRAY",
      description: "4 à 6 actions concrètes, la plus rentable en premier",
      items: {
        type: "OBJECT",
        properties: { title: S(), detail: S(), impact: LEVEL, effort: LEVEL },
        required: ["title", "detail", "impact", "effort"],
      },
    },
    caption: {
      type: "OBJECT",
      properties: {
        suggested: S("Légende réécrite, sans hashtags"),
        hashtags: { type: "ARRAY", items: S() },
        keywords: { type: "ARRAY", items: S("Mots-clés de recherche TikTok") },
      },
      required: ["suggested", "hashtags", "keywords"],
    },
    editPlan: {
      type: "ARRAY",
      description: "Plan de remontage de CETTE vidéo, dans l’ordre chronologique",
      items: {
        type: "OBJECT",
        properties: {
          timeSec: { type: "NUMBER" },
          type: { type: "STRING", enum: ["move", "text", "cut", "zoom", "audio", "loop"] },
          title: S(),
          detail: S(),
        },
        required: ["timeSec", "type", "title", "detail"],
      },
    },
  },
  required: [
    "globalScore",
    "verdict",
    "confidence",
    "diagnoses",
    "hook",
    "subScores",
    "actions",
    "caption",
    "editPlan",
  ],
};

/* ---------------- prompt ---------------- */

const SYSTEM = `Tu es ViralLens, un coach TikTok expert en rétention. Tu regardes la vidéo fournie image par image, tu écoutes l’audio, et tu expliques pourquoi elle sous-performe et comment la corriger.
Règles :
- Réponds UNIQUEMENT en français, en tutoyant, phrases courtes et concrètes.
- Base-toi sur ce que tu vois et entends RÉELLEMENT dans la vidéo. Chaque diagnostic doit citer au moins un horodatage précis (timeSec en secondes) et, si possible, une statistique fournie.
- N’invente jamais de statistiques : utilise seulement celles fournies. Si une stat manque, n’en parle pas.
- Tous les horodatages doivent être compris entre 0 et la durée de la vidéo.
- Classe les diagnostics du plus probable au moins probable. Les probabilités sont indépendantes (pas forcément une somme de 100).
- Les scores vont de 0 à 100. Fournis les 6 sous-scores : hook, pacing, clarity, emotion, shareability, seo.
- confidence = "low" si la vidéo est peu lisible ou si les stats sont très incomplètes.`;

const v = (x: number | null, unit = "") => (x === null ? null : `${x}${unit}`);

function buildContext(a: SavedAnalysis, durationSec: number | null): string {
  const s = a.stats;
  const lines: [string, string | null][] = [
    ["Titre", a.title],
    ["Légende", a.caption || s.caption],
    ["Accroche prévue par le créateur", a.hook || null],
    ["Hashtags", s.hashtags.join(" ") || null],
    ["Durée", durationSec !== null ? `${durationSec} s` : null],
    ["Vues", v(s.views)],
    ["J’aime", v(s.likes)],
    ["Commentaires", v(s.comments)],
    ["Partages", v(s.shares)],
    ["Enregistrements", v(s.saves)],
    ["Nouveaux abonnés", v(s.newFollowers)],
    ["Durée de visionnage moyenne", v(s.avgWatchTimeSec, " s")],
    ["Taux de vidéo regardée en entier", v(s.completionRatePct, " %")],
    [
      "Rétention moyenne (visionnage / durée)",
      a.derived.retentionPct === null ? null : formatPct(a.derived.retentionPct),
    ],
    [
      "Taux d’engagement",
      a.derived.engagementRatePct === null ? null : formatPct(a.derived.engagementRatePct),
    ],
    [
      "Décrochage principal",
      s.retentionDropSec === null ? null : `${formatTime(s.retentionDropSec)}`,
    ],
    [
      "Sources de trafic",
      Object.entries(s.trafficSources)
        .filter(([, x]) => x !== null)
        .map(([k, x]) => `${k} ${x} %`)
        .join(", ") || null,
    ],
    ["Recherches", s.searchQueries.join(", ") || null],
    ["Niche", a.context.niche || null],
    ["Audience", a.context.audience || null],
    ["Langue de la vidéo", a.context.language],
    [
      "Objectif",
      { followers: "gagner des abonnés", views: "maximiser les vues", sales: "vendre" }[
        a.context.goal
      ],
    ],
  ];
  return [
    "Analyse cette vidéo TikTok. Données TikTok Studio et contexte fournis par le créateur :",
    ...lines.filter(([, x]) => x).map(([k, x]) => `- ${k} : ${x}`),
  ].join("\n");
}

/* ---------------- validation ---------------- */

const str = (x: unknown, max = 600) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const num = (x: unknown): number | null => {
  const n = typeof x === "string" ? Number(x.replace(",", ".")) : x;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const score = (x: unknown) => {
  const n = num(x);
  return n === null ? null : Math.round(clamp(n <= 1 && n > 0 ? n * 100 : n, 0, 100));
};
const oneOf = <T extends string>(x: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(x as T) ? (x as T) : fallback;
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {};

const SUB_LABELS: Record<SubScore["key"], string> = {
  hook: "Accroche",
  pacing: "Rythme",
  clarity: "Clarté",
  emotion: "Émotion",
  shareability: "Partage",
  seo: "SEO",
};
const LEVELS = ["fort", "moyen", "faible"] as const;

/**
 * Turns the raw model output into a safe VideoAiReport: clamps scores, keeps timestamps inside
 * the video, drops malformed items, sorts diagnoses. Throws if the core of the report is missing.
 */
export function validateVideoReport(
  raw: unknown,
  meta: { model: string; durationSec: number | null },
): VideoAiReport {
  const r = obj(raw);
  const dur = meta.durationSec && meta.durationSec > 0 ? meta.durationSec : null;
  const time = (x: unknown): number | null => {
    const n = num(x);
    if (n === null || n < 0) return null;
    // a timestamp past the end is a model error: drop it rather than invent a moment
    if (dur && n > dur + 1) return null;
    return Math.round((dur ? Math.min(n, dur) : n) * 10) / 10;
  };

  const diagnoses: Diagnosis[] = arr(r.diagnoses)
    .map((d, i) => {
      const o = obj(d);
      const title = str(o.title, 160);
      if (!title) return null;
      const evidence: Evidence[] = arr(o.evidence)
        .map((e): Evidence | null => {
          const eo = obj(e);
          const t = time(eo.timeSec ?? eo.time);
          const label = str(eo.label, 120);
          if (eo.kind === "timestamp" || (eo.kind !== "metric" && t !== null)) {
            if (t === null) return label ? { kind: "metric" as const, label } : null;
            return {
              kind: "timestamp" as const,
              time: t,
              label: `${formatTime(t)}${label ? ` · ${label}` : ""}`,
            };
          }
          return label ? { kind: "metric" as const, label } : null;
        })
        .filter((e): e is Evidence => !!e)
        // unique labels (used as React keys)
        .filter((e, j, all) => all.findIndex((x) => x.label === e.label) === j)
        .slice(0, 5);
      return {
        id: `d${i}`,
        title,
        description: str(o.description, 700),
        probability: score(o.probability) ?? 50,
        severity: oneOf<Severity>(o.severity, ["high", "medium", "low"], "medium"),
        evidence,
      };
    })
    .filter((d): d is Diagnosis => !!d)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8)
    .map((d, i) => ({ ...d, id: `d${i + 1}` }));

  const verdict = str(r.verdict, 400);
  if (!verdict || !diagnoses.length)
    throw new GeminiError("invalid_json", {
      model: meta.model,
      message:
        "Le rapport renvoyé par Gemini est incomplet (verdict ou diagnostics manquants). Relance l’analyse, ou choisis un autre modèle dans Réglages.",
      detail: JSON.stringify(raw).slice(0, 300),
    });

  const hook = obj(r.hook);
  const frames: HookFrame[] = arr(hook.frames)
    .map((f) => {
      const o = obj(f);
      const t = time(o.timeSec ?? o.t);
      const sees = str(o.sees, 300);
      if (!sees && !str(o.hears)) return null;
      return {
        t: t === null ? "—" : `${String(t).replace(".", ",")} s`,
        sees: sees || "—",
        hears: str(o.hears, 300) || "—",
      };
    })
    .filter((f): f is HookFrame => !!f)
    .slice(0, 6);
  const proposals: HookProposal[] = arr(hook.proposals)
    .map((p) => {
      const o = obj(p);
      const text = str(o.text, 300);
      return text
        ? { type: str(o.type, 60) || "Accroche", text, visual: str(o.visual, 300) }
        : null;
    })
    .filter((p): p is HookProposal => !!p)
    .slice(0, 3);

  const seen = new Set<string>();
  const subScores: SubScore[] = arr(r.subScores)
    .map((x) => {
      const o = obj(x);
      const key = o.key as SubScore["key"];
      const sc = score(o.score);
      if (!(key in SUB_LABELS) || sc === null || seen.has(key)) return null;
      seen.add(key);
      return { key, label: SUB_LABELS[key], score: sc, explanation: str(o.explanation, 300) };
    })
    .filter((x): x is SubScore => !!x)
    .sort(
      (a, b) => Object.keys(SUB_LABELS).indexOf(a.key) - Object.keys(SUB_LABELS).indexOf(b.key),
    );

  const actions: ActionItem[] = arr(r.actions)
    .map((x, i) => {
      const o = obj(x);
      const title = str(o.title, 160);
      return title
        ? {
            id: `a${i + 1}`,
            title,
            detail: str(o.detail, 500),
            impact: oneOf<Level>(o.impact, LEVELS, "moyen"),
            effort: oneOf<Level>(o.effort, LEVELS, "moyen"),
          }
        : null;
    })
    .filter((x): x is ActionItem => !!x)
    .slice(0, 8);

  const editPlan: EditStep[] = arr(r.editPlan)
    .map((x) => {
      const o = obj(x);
      const t = time(o.timeSec ?? o.t);
      const title = str(o.title, 160);
      if (t === null || !title) return null;
      return {
        t,
        type: oneOf<EditStep["type"]>(
          o.type,
          ["move", "text", "cut", "zoom", "audio", "loop"],
          "cut",
        ),
        title,
        detail: str(o.detail, 400),
      };
    })
    .filter((x): x is EditStep => !!x)
    .sort((a, b) => a.t - b.t)
    .slice(0, 10);

  const cap = obj(r.caption);
  const tags = (x: unknown, prefix = "") =>
    [
      ...new Set(
        arr(x)
          .map((t) => str(t, 60).replace(/^#?/, prefix))
          .filter((t) => t.replace(prefix, "")),
      ),
    ].slice(0, 10);

  const sub = subScores.length ? subScores.reduce((s, x) => s + x.score, 0) / subScores.length : 50;
  return {
    analyzedAt: new Date().toISOString(),
    model: meta.model,
    durationSec: dur,
    globalScore: score(r.globalScore) ?? Math.round(sub),
    verdict,
    confidence: oneOf<Confidence>(r.confidence, ["low", "medium", "high"], "medium"),
    diagnoses,
    hook: { assessment: str(hook.assessment, 600), frames, proposals },
    subScores,
    actions,
    caption: {
      current: "",
      suggested: str(cap.suggested, 500),
      hashtags: tags(cap.hashtags, "#"),
      keywords: tags(cap.keywords),
    },
    editPlan,
  };
}

/* ---------------- pipeline ---------------- */

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () =>
      reject(new GeminiError("unknown", { message: "Impossible de lire le fichier vidéo." }));
    r.readAsDataURL(file);
  });
}

export async function analyzeSavedVideo(opts: {
  apiKey: string;
  analysis: SavedAnalysis;
  file: File;
  signal?: AbortSignal;
  onProgress?: (p: AnalysisProgress) => void;
}): Promise<VideoAiReport> {
  const { apiKey, analysis, file, signal, onProgress } = opts;
  if (!apiKey) throw new GeminiError("missing_key");
  if (file.size > VIDEO_ANALYSIS.maxBytes)
    throw new GeminiError("bad_request", { message: "Vidéo trop lourde (2 Go maximum)." });
  const mimeType = videoMimeType(file);
  const durationSec = analysis.video?.durationSec ?? analysis.stats.durationSec ?? null;

  let videoPart: GeminiPart;
  let uploadedName: string | null = null;
  if (file.size <= VIDEO_ANALYSIS.maxInlineBytes) {
    onProgress?.({ phase: "upload", progress: 0 });
    videoPart = { inlineData: { mimeType, data: await fileToBase64(file) } };
    onProgress?.({ phase: "upload", progress: 1 });
  } else {
    onProgress?.({ phase: "upload", progress: 0 });
    const uploaded = await uploadFile(apiKey, file, {
      mimeType,
      displayName: analysis.title || file.name,
      signal,
      onProgress: (p) => onProgress?.({ phase: "upload", progress: p }),
    });
    uploadedName = uploaded.name;
    onProgress?.({ phase: "processing" });
    const active = await waitForActive(apiKey, uploaded, signal);
    videoPart = { fileData: { mimeType: active.mimeType || mimeType, fileUri: active.uri } };
  }

  try {
    onProgress?.({ phase: "analysis" });
    const base = {
      apiKey,
      modelKind: "advanced" as const,
      systemInstruction: SYSTEM,
      responseSchema: VIDEO_REPORT_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 16_384,
      timeoutMs: GEMINI_TIMEOUTS.videoAnalysisMs,
      // a 4-minute call should not be silently repeated on timeout
      retryTimeouts: false,
      signal,
    };
    const first = await generateTextResult({
      ...base,
      parts: [videoPart, { text: buildContext(analysis, durationSec) }],
    });
    let parsed = tryParseJson(first.text);
    let model = first.model;
    if (parsed === undefined) {
      // one repair pass, text only (no need to resend the video)
      const fixed = await generateTextResult({
        ...base,
        model,
        allowFallback: true,
        systemInstruction:
          "You repair malformed JSON. Return ONLY valid JSON matching the response schema. Keep every value; do not invent new ones.",
        parts: [{ text: `Repair this into valid JSON:\n\n${first.text.slice(0, 40_000)}` }],
        timeoutMs: GEMINI_TIMEOUTS.extractionMs,
      });
      parsed = tryParseJson(fixed.text);
      model = fixed.model;
      if (parsed === undefined)
        throw new GeminiError("invalid_json", { model, detail: first.text.slice(0, 300) });
    }
    return validateVideoReport(parsed, { model, durationSec });
  } finally {
    if (uploadedName) void deleteFile(apiKey, uploadedName);
  }
}
