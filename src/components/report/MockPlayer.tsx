import { Pause, Play, Volume2 } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import type { VideoTimeline } from "@/types";

interface Props {
  timeline: VideoTimeline;
  duration: number;
  time: number;
  playing: boolean;
  onToggle: () => void;
  onSeek: (t: number) => void;
  className?: string;
}

/** Simulated vertical player driven by the scene timeline. Swap for a real <video> later. */
export function MockPlayer({
  timeline,
  duration,
  time,
  playing,
  onToggle,
  onSeek,
  className,
}: Props) {
  const scene =
    timeline.scenes.find((s) => time >= s.start && time < s.end) ??
    timeline.scenes[timeline.scenes.length - 1];
  const overlay = timeline.overlays.find((o) => time >= o.start && time < o.end);
  return (
    <div
      className={cn(
        "relative aspect-[9/16] overflow-hidden rounded-2xl bg-black ring-1 ring-line",
        className,
      )}
    >
      {timeline.scenes.map((s) => (
        <img
          key={s.start}
          src={s.thumbnail}
          alt={s === scene ? `Scène : ${s.label}` : ""}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-300",
            s === scene ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      {overlay && (
        <div className="absolute inset-x-3 top-[18%] text-center">
          <span className="inline rounded-md bg-white px-2 py-1 text-sm leading-relaxed font-bold text-black [box-decoration-break:clone]">
            {overlay.text}
          </span>
        </div>
      )}
      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
        <Volume2 className="size-3" aria-hidden /> {scene.label}
      </span>
      <button
        onClick={onToggle}
        className="absolute inset-0 grid place-items-center"
        aria-label={playing ? "Pause" : "Lecture"}
      >
        {!playing && (
          <span className="grid size-14 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:scale-105">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        )}
      </button>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-white">
          <button
            onClick={onToggle}
            className="-m-2 grid size-9 place-items-center"
            aria-label={playing ? "Pause" : "Lecture"}
          >
            {playing ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </button>
          <span className="tabular">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Position dans la vidéo"
          className="h-1.5 w-full cursor-pointer accent-[#ff4d94]"
        />
      </div>
    </div>
  );
}
