import { useState } from "react";
import { formatCompact } from "@/lib/utils";
import type { ScatterPoint } from "@/types";
import { useWidth } from "./useWidth";

const colors = { top: "var(--success)", mid: "var(--warning)", flop: "var(--danger)" };

/** Duration (x) vs views (y, log scale). */
export function ScatterChart({ data, height = 240 }: { data: ScatterPoint[]; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<ScatterPoint | null>(null);
  const pad = { l: 40, r: 12, t: 12, b: 26 };
  const iw = w - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const maxD = 70;
  const lmin = Math.log10(1000);
  const lmax = Math.log10(300000);
  const x = (d: number) => pad.l + (d / maxD) * iw;
  const y = (v: number) => pad.t + (1 - (Math.log10(v) - lmin) / (lmax - lmin)) * ih;
  return (
    <div ref={ref} className="relative w-full">
      <svg width={w} height={height} role="img" aria-label="Nuage de points durée contre vues">
        <rect
          x={x(15)}
          y={pad.t}
          width={x(26) - x(15)}
          height={ih}
          fill="var(--success)"
          opacity={0.08}
          rx={6}
        />
        <text
          x={(x(15) + x(26)) / 2}
          y={pad.t + 14}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--success)"
        >
          zone idéale
        </text>
        {[1000, 10000, 100000].map((v) => (
          <g key={v}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--subtle)">
              {formatCompact(v)}
            </text>
          </g>
        ))}
        {[0, 15, 30, 45, 60].map((d) => (
          <text
            key={d}
            x={x(d)}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--subtle)"
          >
            {d} s
          </text>
        ))}
        {data.map((p) => (
          <circle
            key={p.label}
            cx={x(p.durationSec)}
            cy={y(Math.max(1000, p.views))}
            r={hover === p ? 8 : 6}
            fill={colors[p.group]}
            fillOpacity={0.85}
            stroke="var(--bg)"
            strokeWidth={2}
            onMouseEnter={() => setHover(p)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer transition-all"
          />
        ))}
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-48 rounded-lg border border-line-strong bg-solid px-3 py-2 text-xs shadow-xl"
          style={{
            left: Math.min(x(hover.durationSec) + 10, w - 190),
            top: Math.max(0, y(Math.max(1000, hover.views)) - 50),
          }}
        >
          <p className="font-semibold text-fg">{hover.label}</p>
          <p className="text-muted">
            {hover.durationSec} s · {formatCompact(hover.views)} vues
          </p>
        </div>
      )}
    </div>
  );
}
