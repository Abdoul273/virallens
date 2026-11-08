import type { DerivedMetrics, StudioStats } from "@/types";

const ratio = (a: number | null, b: number | null) =>
  a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b) || b <= 0
    ? null
    : (a / b) * 100;

const round1 = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);

/** Ratios derived from extracted stats. Any missing input → null (never guessed). */
export function computeDerived(s: StudioStats): DerivedMetrics {
  const interactions =
    s.likes === null && s.comments === null && s.shares === null && s.saves === null
      ? null
      : (s.likes ?? 0) + (s.comments ?? 0) + (s.shares ?? 0) + (s.saves ?? 0);
  const retention = ratio(s.avgWatchTimeSec, s.durationSec);
  return {
    retentionPct: round1(retention === null ? null : Math.min(100, retention)),
    engagementRatePct: round1(ratio(interactions, s.views)),
    shareRatePct: round1(ratio(s.shares, s.views)),
    saveRatePct: round1(ratio(s.saves, s.views)),
  };
}

export const INSUFFICIENT_VIEWS = 100;
export const hasInsufficientData = (s: StudioStats) =>
  s.views !== null && s.views < INSUFFICIENT_VIEWS;

export function median(values: Array<number | null>): number | null {
  const v = values
    .filter((x): x is number => x !== null && Number.isFinite(x))
    .sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export const formatPct = (n: number | null, digits = 1) =>
  n === null ? "—" : `${n.toFixed(digits).replace(".", ",")} %`;

export function emptyStats(): StudioStats {
  return {
    caption: null,
    hashtags: [],
    publishDate: null,
    durationSec: null,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    avgWatchTimeSec: null,
    completionRatePct: null,
    newFollowers: null,
    trafficSources: { forYou: null, profile: null, search: null, following: null, sound: null },
    searchQueries: [],
    retentionDropSec: null,
    dataStatus: "ok",
  };
}
