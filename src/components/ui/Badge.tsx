import type { ReactNode } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { cn, scoreTone } from "@/lib/utils";
import type { Confidence, Level, Severity } from "@/types";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";
const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/25",
  danger: "bg-danger/12 text-danger border-danger/25",
  info: "bg-info/12 text-info border-info/25",
  accent: "bg-accent/12 text-accent border-accent/25",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const sevMap: Record<Severity, { tone: BadgeTone; label: string }> = {
  high: { tone: "danger", label: "Critique" },
  medium: { tone: "warning", label: "Modéré" },
  low: { tone: "info", label: "Mineur" },
};
export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = sevMap[severity];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const confMap: Record<Confidence, { tone: BadgeTone; label: string; icon: ReactNode }> = {
  low: { tone: "danger", label: "Faible", icon: <ShieldAlert className="size-3.5" /> },
  medium: { tone: "warning", label: "Moyenne", icon: <ShieldQuestion className="size-3.5" /> },
  high: { tone: "success", label: "Élevée", icon: <ShieldCheck className="size-3.5" /> },
};
export function ConfidenceBadge({ level }: { level: Confidence }) {
  const c = confMap[level];
  return (
    <Badge tone={c.tone} icon={c.icon}>
      Confiance : {c.label}
    </Badge>
  );
}

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const t = scoreTone(score);
  return (
    <span
      className={cn(
        "tabular inline-flex h-7 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-bold",
        tones[t],
        className,
      )}
      aria-label={`Score ${score}`}
    >
      {score}
    </span>
  );
}

const levelTone: Record<Level, BadgeTone> = {
  fort: "success",
  moyen: "warning",
  faible: "neutral",
};
const effortTone: Record<Level, BadgeTone> = {
  faible: "success",
  moyen: "warning",
  fort: "danger",
};
export function ImpactBadge({ level }: { level: Level }) {
  return <Badge tone={levelTone[level]}>Impact {level}</Badge>;
}
export function EffortBadge({ level }: { level: Level }) {
  return <Badge tone={effortTone[level]}>Effort {level}</Badge>;
}

export function InsufficientDataBadge() {
  return (
    <Badge tone="warning" icon={<AlertTriangle className="size-3.5" />}>
      Données insuffisantes
    </Badge>
  );
}
