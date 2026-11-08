import { formatTime } from "@/lib/utils";
import type { RetentionPoint } from "@/types";
import { useWidth } from "./useWidth";

interface Props {
  data: RetentionPoint[];
  duration: number;
  dropOffAt: number;
  currentTime: number;
  onSeek: (t: number) => void;
  height?: number;
}

export const CHART_PAD = { l: 34, r: 12 };

/** Retention line chart. Horizontal padding is exported so the timeline below aligns with it. */
export function RetentionChart({
  data,
  duration,
  dropOffAt,
  currentTime,
  onSeek,
  height = 200,
}: Props) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const pt = 12;
  const pb = 22;
  const iw = Math.max(10, w - CHART_PAD.l - CHART_PAD.r);
  const ih = height - pt - pb;
  const x = (t: number) => CHART_PAD.l + (t / duration) * iw;
  const y = (p: number) => pt + (1 - p / 100) * ih;
  const line = data
    .map((d, i) => `${i ? "L" : "M"}${x(d.t).toFixed(1)},${y(d.pct).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(duration)},${y(0)} L${x(0)},${y(0)} Z`;
  const drop = data.find((d) => d.t === dropOffAt);
  const cur = data.reduce(
    (a, b) => (Math.abs(b.t - currentTime) < Math.abs(a.t - currentTime) ? b : a),
    data[0],
  );
  const ticks = [0, 25, 50, 75, 100];
  const xTicks = Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => i * 5);

  const handle = (clientX: number, rect: DOMRect) => {
    const t = ((clientX - rect.left - CHART_PAD.l) / iw) * duration;
    onSeek(Math.max(0, Math.min(duration, Math.round(t))));
  };

  return (
    <div ref={ref} className="w-full">
      <svg
        width={w}
        height={height}
        className="cursor-crosshair touch-none select-none"
        role="img"
        aria-label={`Courbe de rétention. Décrochage principal à ${formatTime(dropOffAt)}.`}
        onPointerDown={(e) => handle(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerMove={(e) =>
          e.buttons === 1 && handle(e.clientX, e.currentTarget.getBoundingClientRect())
        }
      >
        <defs>
          <linearGradient id="ret-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff4d94" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9b6bff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ret-line" x1="0" x2="1">
            <stop offset="0%" stopColor="#ff4d94" />
            <stop offset="100%" stopColor="#9b6bff" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={CHART_PAD.l}
              x2={w - CHART_PAD.r}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeDasharray={t === 0 ? "" : "3 4"}
            />
            <text
              x={CHART_PAD.l - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--subtle)"
              className="tabular"
            >
              {t}%
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--subtle)"
            className="tabular"
          >
            {formatTime(t)}
          </text>
        ))}
        {/* drop-off zone */}
        <rect
          x={x(dropOffAt - 0.5)}
          y={pt}
          width={x(dropOffAt + 3) - x(dropOffAt - 0.5)}
          height={ih}
          fill="var(--danger)"
          opacity={0.1}
          rx={4}
        />
        <path d={area} fill="url(#ret-area)" />
        <path
          d={line}
          fill="none"
          stroke="url(#ret-line)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {drop && (
          <g>
            <circle cx={x(drop.t)} cy={y(drop.pct)} r={9} fill="var(--danger)" opacity={0.2} />
            <circle
              cx={x(drop.t)}
              cy={y(drop.pct)}
              r={4.5}
              fill="var(--danger)"
              stroke="var(--bg)"
              strokeWidth={2}
            />
            <g transform={`translate(${Math.min(x(drop.t) + 8, w - 120)}, ${y(drop.pct) - 34})`}>
              <rect width={110} height={22} rx={6} fill="var(--danger)" />
              <text x={55} y={15} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">
                Décrochage {formatTime(drop.t)}
              </text>
            </g>
          </g>
        )}
        {/* playhead */}
        <line
          x1={x(currentTime)}
          x2={x(currentTime)}
          y1={pt}
          y2={pt + ih}
          stroke="var(--fg)"
          strokeWidth={1.5}
        />
        <circle
          cx={x(cur.t)}
          cy={y(cur.pct)}
          r={5}
          fill="var(--fg)"
          stroke="var(--bg)"
          strokeWidth={2}
        />
        <g
          transform={`translate(${Math.max(CHART_PAD.l, Math.min(x(currentTime) - 26, w - CHART_PAD.r - 52))}, ${pt})`}
        >
          <rect width={52} height={20} rx={6} fill="var(--fg)" />
          <text
            x={26}
            y={14}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--bg)"
            className="tabular"
          >
            {cur.pct}%
          </text>
        </g>
      </svg>
    </div>
  );
}
