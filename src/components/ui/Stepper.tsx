import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const pct = ((current + 1) / steps.length) * 100;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted">
        <span>
          Étape {current + 1} sur {steps.length}
        </span>
        <span className="tabular">{Math.round(pct)} %</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol
        className="mt-4 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}
      >
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition",
                i < current
                  ? "bg-success text-bg"
                  : i === current
                    ? "bg-brand text-white"
                    : "bg-surface-2 text-subtle",
              )}
            >
              {i < current ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "truncate text-sm font-medium",
                i === current ? "text-fg" : "text-subtle",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  tone?: "brand" | "danger" | "warning" | "info" | "success";
  className?: string;
  label?: string;
}) {
  const color = {
    brand: "bg-brand",
    danger: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
    success: "bg-success",
  }[tone];
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-surface-2", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
