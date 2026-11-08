/**
 * Domain types for ViralLens.
 * These shapes are what a real backend (e.g. Gemini-powered analysis) should return.
 */

export type Screen =
  | "onboarding"
  | "dashboard"
  | "new"
  | "analyzing"
  | "report"
  | "compare"
  | "library"
  | "patterns"
  | "settings"
  | "design";

/** Demo-only switch to preview every screen state. */
export type ViewState = "success" | "loading" | "empty" | "error";

export type Severity = "high" | "medium" | "low";
export type Confidence = "low" | "medium" | "high";
export type Level = "fort" | "moyen" | "faible";
export type Goal = "followers" | "views" | "sales";

export interface VideoSummary {
  id: string;
  title: string;
  thumbnail: string;
  score: number;
  views: number;
  retention: number; // median retention %
  durationSec: number;
  publishedAt: string; // ISO date
  niche: string;
  hookType: string;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta: number; // percentage points or %, sign = trend
  deltaLabel: string;
  hint: string;
  spark: number[];
}

export interface Evidence {
  label: string;
  kind: "metric" | "timestamp";
  time?: number; // seconds, for timestamp chips
}

export interface Diagnosis {
  id: string;
  title: string;
  description: string;
  probability: number; // 0-100
  severity: Severity;
  evidence: Evidence[];
}

export interface RetentionPoint {
  t: number; // seconds
  pct: number; // % viewers still watching
}

export interface Scene {
  start: number;
  end: number;
  label: string;
  thumbnail: string;
}

export interface TextOverlay {
  start: number;
  end: number;
  text: string;
}

export interface AudioEvent {
  t: number;
  label: string;
}

export interface VideoTimeline {
  scenes: Scene[];
  overlays: TextOverlay[];
  audio: AudioEvent[];
  cuts: number[];
}

export interface SubScore {
  key: "hook" | "pacing" | "clarity" | "emotion" | "shareability" | "seo";
  label: string;
  score: number;
  explanation: string;
}

export interface HookFrame {
  t: string;
  sees: string;
  hears: string;
}

export interface HookProposal {
  type: string;
  text: string;
  visual: string;
}

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  impact: Level;
  effort: Level;
}

export interface CaptionOptimization {
  current: string;
  suggested: string;
  hashtags: string[];
  keywords: string[];
}

export interface EditStep {
  t: number;
  type: "move" | "text" | "cut" | "zoom" | "audio" | "loop";
  title: string;
  detail: string;
}

export interface VideoReport {
  videoId: string;
  durationSec: number;
  globalScore: number;
  verdict: string;
  confidence: Confidence;
  diagnoses: Diagnosis[];
  retention: RetentionPoint[];
  dropOffAt: number;
  timeline: VideoTimeline;
  subScores: SubScore[];
  hookFrames: HookFrame[];
  hookProposals: HookProposal[];
  actions: ActionItem[];
  caption: CaptionOptimization;
  editPlan: EditStep[];
}

/** Traffic source shares in % (0-100). null = not found in the source data. */
export interface TrafficSources {
  forYou: number | null;
  profile: number | null;
  search: number | null;
  following: number | null;
  sound: number | null;
}

/**
 * Stats extracted from a TikTok Studio analytics page.
 * Every field is nullable: unknown values must stay null, never invented.
 */
export interface StudioStats {
  caption: string | null;
  hashtags: string[];
  publishDate: string | null; // "YYYY-MM-DDTHH:mm" (local) or "YYYY-MM-DD"
  durationSec: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  avgWatchTimeSec: number | null;
  completionRatePct: number | null;
  newFollowers: number | null;
  trafficSources: TrafficSources;
  searchQueries: string[];
  retentionDropSec: number | null;
  dataStatus: "processing" | "ok";
}

/** @deprecated kept as an alias for older imports */
export type ParsedStats = StudioStats;

/** Ratios computed locally from StudioStats (all in %). null when inputs are missing. */
export interface DerivedMetrics {
  retentionPct: number | null;
  engagementRatePct: number | null;
  shareRatePct: number | null;
  saveRatePct: number | null;
}

/** An analysis persisted in IndexedDB (real mode). */
export interface SavedAnalysis {
  id: string;
  createdAt: string; // ISO
  status: "stats_imported" | "analyzed";
  title: string;
  caption: string;
  hook: string;
  video: {
    name: string;
    size: number;
    durationSec: number | null;
    thumbnail: string | null;
  } | null;
  stats: StudioStats;
  derived: DerivedMetrics;
  context: AnalysisContext;
  /** Real Gemini video analysis, present once status = "analyzed". */
  report?: VideoAiReport;
}

/** Report produced by the real Gemini video analysis (validated before saving). */
export interface VideoAiReport {
  analyzedAt: string; // ISO
  /** Model that actually answered (may differ from the selected one after fallback). */
  model: string;
  durationSec: number | null;
  globalScore: number;
  verdict: string;
  confidence: Confidence;
  diagnoses: Diagnosis[];
  hook: {
    assessment: string;
    frames: HookFrame[];
    proposals: HookProposal[];
  };
  subScores: SubScore[];
  actions: ActionItem[];
  caption: CaptionOptimization;
  editPlan: EditStep[];
}

export interface AnalysisContext {
  niche: string;
  audience: string;
  language: string;
  goal: Goal;
}

export interface CompareRow {
  aspect: string;
  mine: string;
  theirs: string;
  winner: "mine" | "theirs" | "tie";
}

export interface PublicStats {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface CompareResult {
  other: {
    title: string;
    creator: string;
    thumbnail: string;
    durationSec: number;
    stats: PublicStats;
  };
  axes: string[];
  mineScores: number[];
  theirScores: number[];
  rows: CompareRow[];
  theyDoBetter: string[];
  youDoBetter: string[];
  inspiration: string[];
}

export interface ScatterPoint {
  durationSec: number;
  views: number;
  label: string;
  group: "top" | "flop" | "mid";
}

export interface HookTypePerf {
  type: string;
  avgViews: number;
  count: number;
}

export interface PatternInsight {
  title: string;
  detail: string;
  stat: string;
}

export interface PatternsData {
  minVideos: number;
  scatter: ScatterPoint[];
  heatmapDays: string[];
  heatmapSlots: string[];
  heatmap: number[][]; // [day][slot] avg views (k)
  hookTypes: HookTypePerf[];
  insights: PatternInsight[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  text: string;
}

export interface OnboardingSlide {
  title: string;
  body: string;
  image: string;
}
