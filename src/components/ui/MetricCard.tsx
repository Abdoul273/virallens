import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/charts/Sparkline";

interface Props {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  spark?: number[];
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  hint,
  spark,
  icon,
  className,
}: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn("glass flex flex-col rounded-2xl p-4 md:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="tabular text-3xl leading-none font-bold tracking-tight text-fg md:text-4xl">
          {value}
        </span>
        {unit && <span className="text-base font-semibold text-muted">{unit}</span>}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[13px] font-semibold",
              up ? "text-success" : "text-danger",
            )}
          >
            {up ? (
              <ArrowUpRight className="size-4" aria-hidden />
            ) : (
              <ArrowDownRight className="size-4" aria-hidden />
            )}
            {deltaLabel}
            <span className="sr-only">{up ? "en hausse" : "en baisse"}</span>
          </span>
        )}
        {spark && <Sparkline data={spark} positive={up} />}
      </div>
      {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
    </div>
  );
}
