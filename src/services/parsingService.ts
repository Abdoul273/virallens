/**
 * TikTok Studio stats extraction with Gemini structured output.
 * Input: raw pasted text (FR/EN, messy) and/or up to 4 screenshots.
 * Output: StudioStats where unknown fields are null (never invented).
 */
import { STATS_IMPORT } from "@/config";
import { imageToBase64 } from "@/lib/media";
import { emptyStats } from "@/lib/metrics";
import type { StudioStats, TrafficSources } from "@/types";
import { GeminiError } from "./errors";
import { generateJson, type GeminiPart, type GeminiSchema } from "./geminiService";

const num = (description: string): GeminiSchema => ({
  type: "NUMBER",
  nullable: true,
  description,
});

const TRAFFIC_KEYS: (keyof TrafficSources)[] = [
  "forYou",
  "profile",
  "search",
  "following",
  "sound",
];

export const STUDIO_STATS_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    caption: {
      type: "STRING",
      nullable: true,
      description: "Video caption/description text without hashtags",
    },
    hashtags: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Hashtags found, each starting with #",
    },
    publishDate: {
      type: "STRING",
      nullable: true,
      description: "Publish date as YYYY-MM-DDTHH:mm, or YYYY-MM-DD if no time",
    },
    durationSec: num("Video duration in seconds"),
    views: num("Total video views"),
    likes: num("Total likes"),
    comments: num("Total comments"),
    shares: num("Total shares"),
    saves: num("Total saves / favorites / enregistrements"),
    avgWatchTimeSec: num("Average watch time in seconds"),
    completionRatePct: num("Percentage of viewers who watched the full video, 0-100"),
    newFollowers: num("New followers gained from this video"),
    trafficSources: {
      type: "OBJECT",
      description: "Traffic source shares in percent (0-100)",
      properties: {
        forYou: num("For You / Pour toi %"),
        profile: num("Personal profile / Profil personnel %"),
        search: num("Search / Recherche %"),
        following: num("Following / Abonnements %"),
        sound: num("Sound / Son %"),
      },
      required: TRAFFIC_KEYS,
      propertyOrdering: TRAFFIC_KEYS,
    },
    searchQueries: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Search terms that led viewers to the video",
    },
    retentionDropSec: num(
      "Second where the retention curve drops most sharply, only if explicitly visible",
    ),
    dataStatus: {
      type: "STRING",
      enum: ["processing", "ok"],
      description:
        "'processing' if the page says data is still being processed/updated, otherwise 'ok'",
    },
  },
  required: [
    "caption",
    "hashtags",
    "publishDate",
    "durationSec",
    "views",
    "likes",
    "comments",
    "shares",
    "saves",
    "avgWatchTimeSec",
    "completionRatePct",
    "newFollowers",
    "trafficSources",
    "searchQueries",
    "retentionDropSec",
    "dataStatus",
  ],
};
STUDIO_STATS_SCHEMA.propertyOrdering = STUDIO_STATS_SCHEMA.required;

const SYSTEM = `You extract analytics from TikTok Studio video analytics pages (web or app), in French or English.
Rules:
- Only report values that are explicitly present in the provided text or screenshots. If a value is absent, unreadable or ambiguous, return null. NEVER estimate, compute or invent.
- Convert abbreviations to plain numbers: "1,2 k"/"1.2K" = 1200, "3,4 M" = 3400000, "1 842" = 1842. French decimal comma = decimal point.
- Durations to seconds: "0:34" = 34, "1min 5s" = 65, "6,1 s" = 6.1.
- Percentages as numbers 0-100 without the % sign.
- Labels (FR → field): Vues/Vues de la vidéo → views; J'aime → likes; Commentaires → comments; Partages → shares; Enregistrements/Favoris → saves; Durée de visionnage moyenne → avgWatchTimeSec; A regardé la vidéo en entier → completionRatePct; Nouveaux followers/abonnés → newFollowers; Pour toi → forYou; Profil personnel → profile; Recherche → search; Abonnements/Suivis → following; Son → sound.
- Labels (EN): Video views, Likes, Comments, Shares, Saves/Favorites, Average watch time, Watched full video, New followers, For You, Personal profile, Search, Following, Sound.
- "Total play time" is NOT average watch time. Do not confuse followers total with new followers.
- If several sources disagree, prefer the screenshot with the most specific label.
- dataStatus = "processing" only if the page explicitly says data is being processed / not yet available.`;

/** Robust number coercion in case the model returns strings. */
function toNum(v: unknown, opts: { pct?: boolean; int?: boolean } = {}): number | null {
  if (v === null || v === undefined || v === "") return null;
  let n: number;
  if (typeof v === "number") n = v;
  else if (typeof v === "string") {
    const s = v
      .trim()
      .toLowerCase()
      .replace(/\s|\u202f|\u00a0/g, "")
      .replace("%", "");
    if (/^\d{1,3}(,\d{3})+$/.test(s)) return toNum(Number(s.replace(/,/g, "")), opts);
    const mult = /k$/.test(s) ? 1e3 : /m$/.test(s) ? 1e6 : 1;
    n = parseFloat(s.replace(/[km]$/, "").replace(",", ".")) * mult;
  } else return null;
  if (!Number.isFinite(n) || n < 0) return null;
  if (opts.pct && n > 100) return null;
  return opts.int ? Math.round(n) : Math.round(n * 100) / 100;
}

const toStrArr = (v: unknown): string[] =>
  Array.isArray(v)
    ? [
        ...new Set(
          v
            .filter((x): x is string => typeof x === "string")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ]
    : [];

function normalizeDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!m) return null;
  return m[2] ? `${m[1]}T${m[2]}` : m[1];
}

/** Defensive normalization: never trust the model's shape. */
export function normalizeStats(raw: unknown): StudioStats {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const t = (
    r.trafficSources && typeof r.trafficSources === "object" ? r.trafficSources : {}
  ) as Record<string, unknown>;
  const base = emptyStats();
  return {
    ...base,
    caption: typeof r.caption === "string" && r.caption.trim() ? r.caption.trim() : null,
    hashtags: [
      ...new Set(
        toStrArr(r.hashtags).map((h) => (h.startsWith("#") ? h : `#${h}`).replace(/\s+/g, "")),
      ),
    ],
    publishDate: normalizeDate(r.publishDate),
    durationSec: toNum(r.durationSec),
    views: toNum(r.views, { int: true }),
    likes: toNum(r.likes, { int: true }),
    comments: toNum(r.comments, { int: true }),
    shares: toNum(r.shares, { int: true }),
    saves: toNum(r.saves, { int: true }),
    avgWatchTimeSec: toNum(r.avgWatchTimeSec),
    completionRatePct: toNum(r.completionRatePct, { pct: true }),
    newFollowers: toNum(r.newFollowers, { int: true }),
    trafficSources: Object.fromEntries(
      TRAFFIC_KEYS.map((k) => [k, toNum(t[k], { pct: true })]),
    ) as unknown as TrafficSources,
    searchQueries: toStrArr(r.searchQueries),
    retentionDropSec: toNum(r.retentionDropSec),
    dataStatus: r.dataStatus === "processing" ? "processing" : "ok",
  };
}

/** Number of non-null scalar fields — used to tell the user how much was found. */
export function countFound(s: StudioStats): number {
  const scalars = [
    s.caption,
    s.publishDate,
    s.durationSec,
    s.views,
    s.likes,
    s.comments,
    s.shares,
    s.saves,
    s.avgWatchTimeSec,
    s.completionRatePct,
    s.newFollowers,
    s.retentionDropSec,
    ...TRAFFIC_KEYS.map((k) => s.trafficSources[k]),
  ];
  return (
    scalars.filter((v) => v !== null).length +
    (s.hashtags.length ? 1 : 0) +
    (s.searchQueries.length ? 1 : 0)
  );
}

export async function extractStudioStats(input: {
  apiKey: string;
  text?: string;
  screenshots?: File[];
  signal?: AbortSignal;
}): Promise<StudioStats> {
  const apiKey = input.apiKey.trim();
  if (!apiKey) throw new GeminiError("missing_key");
  const text = (input.text ?? "").trim().slice(0, STATS_IMPORT.maxTextChars);
  const shots = (input.screenshots ?? []).slice(0, STATS_IMPORT.maxScreenshots);
  if (text.length < 10 && shots.length === 0) throw new GeminiError("empty_input");

  const parts: GeminiPart[] = [];
  if (text) parts.push({ text: `Texte copié depuis TikTok Studio :\n"""\n${text}\n"""` });
  for (let i = 0; i < shots.length; i++) {
    try {
      parts.push({ text: `Capture d'écran ${i + 1} :` });
      parts.push({ inlineData: await imageToBase64(shots[i], STATS_IMPORT.maxImageSide) });
    } catch {
      throw new GeminiError("bad_request", { detail: `Capture ${i + 1} illisible` });
    }
  }
  parts.push({ text: "Extrais les statistiques selon le schéma. null pour toute valeur absente." });

  const raw = await generateJson<unknown>({
    modelKind: "main",
    apiKey,
    parts,
    systemInstruction: SYSTEM,
    responseSchema: STUDIO_STATS_SCHEMA,
    signal: input.signal,
  });
  return normalizeStats(raw);
}
