export function Heatmap({
  rows,
  cols,
  data,
  unit = "k vues",
}: {
  rows: string[];
  cols: string[];
  data: number[][];
  unit?: string;
}) {
  const max = Math.max(...data.flat());
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table
        className="w-full border-separate border-spacing-1 text-xs"
        aria-label="Vues moyennes par jour et heure de publication"
      >
        <thead>
          <tr>
            <th />
            {cols.map((c) => (
              <th key={c} scope="col" className="pb-1 font-medium text-subtle">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th scope="row" className="pr-1 text-left font-medium text-subtle">
                {r}
              </th>
              {data[ri].map((v, ci) => {
                const o = v / max;
                return (
                  <td
                    key={ci}
                    title={`${r} ${cols[ci]} : ${v} ${unit}`}
                    className="h-9 min-w-9 rounded-md text-center font-semibold tabular"
                    style={{
                      background: `color-mix(in oklab, var(--accent) ${Math.round(8 + o * 80)}%, transparent)`,
                      color: o > 0.55 ? "#fff" : "var(--muted)",
                    }}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
