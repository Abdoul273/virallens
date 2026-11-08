import { ArrowUpToLine, Music2, Repeat, Scissors, Type, ZoomIn } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { EditStep } from "@/types";

const icons = {
  move: ArrowUpToLine,
  text: Type,
  cut: Scissors,
  zoom: ZoomIn,
  audio: Music2,
  loop: Repeat,
};
const labels = {
  move: "Déplacer",
  text: "Texte",
  cut: "Couper",
  zoom: "Zoom",
  audio: "Audio",
  loop: "Boucle",
};

export function EditPlan({
  steps,
  duration,
  onSeek,
}: {
  steps: EditStep[];
  duration: number;
  onSeek: (t: number) => void;
}) {
  const span = Math.max(duration, ...steps.map((s) => s.t), 1);
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      {/* mini ruler */}
      <div className="relative mb-6 h-10 rounded-xl bg-surface-2" aria-hidden>
        {steps.map((s, i) => {
          const Icon = icons[s.type];
          return (
            <span
              key={`${s.t}-${i}`}
              className="absolute top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow"
              style={{ left: `${3 + (s.t / span) * 94}%` }}
            >
              <Icon className="size-3.5" />
            </span>
          );
        })}
      </div>
      <ol className="relative space-y-1 before:absolute before:top-4 before:bottom-4 before:left-[21px] before:w-px before:bg-line">
        {steps.map((s, i) => {
          const Icon = icons[s.type];
          return (
            <li key={`${s.t}-${i}`}>
              <button
                onClick={() => onSeek(s.t)}
                className="relative flex w-full items-start gap-3.5 rounded-xl p-1.5 text-left transition hover:bg-surface-2"
              >
                <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-line-strong bg-solid text-accent">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="tabular rounded-md bg-accent/12 px-1.5 py-0.5 text-xs font-bold text-accent">
                      {formatTime(s.t)}
                    </span>
                    <span className="text-xs font-semibold tracking-wider text-subtle uppercase">
                      {labels[s.type]}
                    </span>
                  </span>
                  <span className="mt-1 block text-[15px] font-medium text-fg">{s.title}</span>
                  <span className="block text-sm text-muted">{s.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
