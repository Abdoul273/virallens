export function Sparkline({
  data,
  positive = true,
  width = 72,
  height = 28,
}: {
  data: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * width,
    height - 2 - ((d - min) / (max - min || 1)) * (height - 4),
  ]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const color = positive ? "var(--success)" : "var(--danger)";
  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={color} opacity={0.12} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} />
    </svg>
  );
}
