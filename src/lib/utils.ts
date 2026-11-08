export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const nf = new Intl.NumberFormat("fr-FR");
export const formatNumber = (n: number) => nf.format(n);

export function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (n >= 10_000) return `${Math.round(n / 1000)} k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")} k`;
  return String(n);
}

export function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatBytes(b: number) {
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.round(b / 1024)} Ko`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export type Tone = "success" | "warning" | "danger";
export function scoreTone(score: number): Tone {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  return "danger";
}

export const toneText: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};
export const toneVar: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};
