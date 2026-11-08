export interface RadarSeries {
  label: string;
  values: number[];
  color: string;
}

export function RadarChart({
  axes,
  series,
  size = 300,
}: {
  axes: string[];
  series: RadarSeries[];
  size?: number;
}) {
  const c = size / 2;
  const r = size / 2 - 42;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(",")).join(" ");
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[340px]"
      role="img"
      aria-label={`Radar : ${series.map((s) => `${s.label} ${s.values.join(", ")}`).join(" ; ")}`}
    >
      {[25, 50, 75, 100].map((lv) => (
        <polygon
          key={lv}
          points={poly(Array(n).fill(lv))}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 100);
        const [lx, ly] = pt(i, 122);
        return (
          <g key={a}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--border)" />
            <text
              x={lx}
              y={ly + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--muted)"
            >
              {a}
            </text>
          </g>
        );
      })}
      {series.map((s) => (
        <g key={s.label}>
          <polygon
            points={poly(s.values)}
            fill={s.color}
            fillOpacity={0.18}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {s.values.map((v, i) => {
            const [x, y] = pt(i, v);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3.5}
                fill={s.color}
                stroke="var(--bg)"
                strokeWidth={1.5}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
