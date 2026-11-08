import { cn } from "@/lib/utils";
import { SeverityBadge } from "@/components/ui/Badge";
import { EvidenceChip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/Stepper";
import type { Diagnosis, Severity } from "@/types";

const bar: Record<Severity, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};
const edge: Record<Severity, string> = {
  high: "before:bg-danger",
  medium: "before:bg-warning",
  low: "before:bg-info",
};

export function DiagnosisList({
  items,
  onSeek,
}: {
  items: Diagnosis[];
  onSeek: (t: number) => void;
}) {
  return (
    <ol className="space-y-3">
      {items.map((d, i) => (
        <li
          key={d.id}
          className={cn(
            "glass relative overflow-hidden rounded-2xl p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 md:p-5 md:pl-6",
            edge[d.severity],
          )}
        >
          <div className="flex items-start gap-3">
            <span className="tabular grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-sm font-bold text-fg">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-[15px] leading-snug font-semibold text-fg md:text-base">
                  {d.title}
                </h3>
                <SeverityBadge severity={d.severity} />
              </div>
              <p className="mt-1.5 text-sm text-muted">{d.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar
                  value={d.probability}
                  tone={bar[d.severity]}
                  className="flex-1"
                  label="Probabilité"
                />
                <span className="tabular w-20 shrink-0 text-right text-xs font-semibold text-fg">
                  {d.probability} % probable
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.evidence.map((e) => (
                  <EvidenceChip key={e.label} evidence={e} onSeek={onSeek} />
                ))}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
