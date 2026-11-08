import { useEffect, useId, useState } from "react";
import { cn, scoreTone, toneVar } from "@/lib/utils";

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  /** 'tone' colors by score, 'brand' uses the accent gradient */
  color?: "tone" | "brand";
  className?: string;
  showValue?: boolean;
}

export function ScoreRing({
  value,
  size = 96,
  stroke,
  label,
  color = "tone",
  className,
  showValue = true,
}: Props) {
  const id = useId();
  const sw = stroke ?? Math.max(4, Math.round(size / 11));
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(t);
  }, [value]);
  const stroke1 = color === "brand" ? `url(#g${id})` : toneVar[scoreTone(value)];
  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"} : ${value} sur 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4d94" />
            <stop offset="100%" stopColor="#9b6bff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke1}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div
              className="tabular leading-none font-bold tracking-tight text-fg"
              style={{ fontSize: size * 0.3 }}
            >
              {value}
            </div>
            {label && size >= 80 && (
              <div className="mt-1 text-[11px] font-medium text-muted">{label}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
