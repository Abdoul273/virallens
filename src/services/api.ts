/**
 * Mock service layer used when "Mode démo" is ON.
 * Real implementations live in geminiService.ts / parsingService.ts.
 * Every function returns a Promise so the UI already
 * handles async/loading/error. To go live, replace the bodies with real calls
 * (e.g. Gemini via the user's API key) and keep the same signatures.
 */
import { COMPARE, CHAT_FALLBACK, CHAT_REPLIES, PARSED_STATS, REPORT } from "@/data/mockData";
import type {
  AnalysisContext,
  CompareResult,
  StudioStats,
  PublicStats,
  VideoReport,
} from "@/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Parse the raw text pasted from TikTok Studio (or OCR'd screenshots). */
export async function parseStudioStats(input: {
  text?: string;
  screenshots?: File[];
}): Promise<StudioStats> {
  await wait(1100);
  const hasText = (input.text ?? "").trim().length >= 20;
  const hasShots = (input.screenshots ?? []).length > 0;
  if (!hasText && !hasShots) {
    throw new Error(
      "Impossible de lire ces données. Copie toute la page « Analyse » de la vidéo, ou ajoute des captures.",
    );
  }
  return structuredClone(PARSED_STATS);
}

export interface AnalyzeInput {
  video: File | null;
  title: string;
  caption: string;
  hook: string;
  stats: StudioStats;
  context: AnalysisContext;
}

/** Full analysis: video + stats + context → report. */
export async function analyzeVideo(_input: AnalyzeInput): Promise<VideoReport> {
  await wait(400);
  return structuredClone(REPORT);
}

/** Compare the user's video with another creator's video. */
export async function compareVideos(_input: {
  myVideoId: string;
  otherVideo: File | null;
  otherStats?: Partial<PublicStats>;
}): Promise<CompareResult> {
  await wait(1600);
  return structuredClone(COMPARE);
}

/** Coach chat about one report. */
export async function askCoach(_videoId: string, question: string): Promise<string> {
  await wait(1200);
  return CHAT_REPLIES[question] ?? CHAT_FALLBACK;
}
