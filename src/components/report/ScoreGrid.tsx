import { ScoreRing } from "@/components/ui/ScoreRing";
import type { SubScore } from "@/types";

export function ScoreGrid({ items }: { items: SubScore[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map((s) => (
        <div
          key={s.key}
          className="glass flex flex-col items-center rounded-2xl p-4 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left"
        >
          <ScoreRing value={s.score} size={64} label={s.label} />
          <div className="mt-3 sm:mt-1">
            <p className="font-semibold text-fg">{s.label}</p>
            <p className="mt-1 text-[13px] leading-snug text-muted">{s.explanation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
