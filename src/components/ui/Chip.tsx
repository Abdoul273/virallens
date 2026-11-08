import type { ButtonHTMLAttributes, ReactNode } from "react";
import { BarChart3, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types";

/** Evidence chip: timestamp chips are interactive (seek), metric chips are static. */
export function EvidenceChip({
  evidence,
  onSeek,
}: {
  evidence: Evidence;
  onSeek?: (t: number) => void;
}) {
  if (evidence.kind === "timestamp" && evidence.time !== undefined) {
    return (
      <button
        type="button"
        onClick={() => onSeek?.(evidence.time!)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 text-xs font-semibold text-accent transition hover:bg-accent/20"
        aria-label={`Aller à ${evidence.label}`}
      >
        <Play className="size-3 fill-current" aria-hidden />
        {evidence.label}
      </button>
    );
  }
  return (
    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 text-xs font-medium text-fg">
      <BarChart3 className="size-3.5 text-muted" aria-hidden />
      {evidence.label}
    </span>
  );
}

/** Toggleable filter chip. */
export function FilterChip({
  active,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition",
        active
          ? "border-transparent bg-fg text-bg"
          : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center rounded-lg border border-line bg-surface-2 px-2.5 text-sm font-medium text-fg">
      {children}
    </span>
  );
}
