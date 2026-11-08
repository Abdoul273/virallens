import type { ReactNode } from "react";
import { AudioLines, Scissors, Type, Film } from "lucide-react";
import { CHART_PAD } from "@/components/charts/RetentionChart";
import { formatTime } from "@/lib/utils";
import type { VideoTimeline } from "@/types";

/** Multi-track video timeline aligned with the retention chart's x-axis. */
export function TimelineTracks({
  timeline,
  duration,
  time,
  dropOffAt,
  onSeek,
}: {
  timeline: VideoTimeline;
  duration: number;
  time: number;
  dropOffAt: number;
  onSeek: (t: number) => void;
}) {
  const pos = (t: number) => `${(t / duration) * 100}%`;
  const width = (a: number, b: number) => `${((b - a) / duration) * 100}%`;
  const Row = ({
    icon,
    label,
    children,
    h = "h-10",
  }: {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    h?: string;
  }) => (
    <div className="flex items-center">
      <div
        className="grid shrink-0 place-items-center text-subtle"
        style={{ width: CHART_PAD.l }}
        title={label}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </div>
      <div className={`relative flex-1 ${h}`} style={{ marginRight: CHART_PAD.r }}>
        {children}
      </div>
    </div>
  );
  return (
    <div className="relative mt-2 space-y-1.5">
      <Row icon={<Film className="size-4" />} label="Scènes" h="h-16">
        {timeline.scenes.map((s) => (
          <button
            key={s.start}
            onClick={() => onSeek(s.start)}
            className="group absolute inset-y-0 overflow-hidden rounded-md border border-bg"
            style={{ left: pos(s.start), width: width(s.start, s.end) }}
            aria-label={`Scène ${s.label} à ${formatTime(s.start)}`}
            title={s.label}
          >
            <img
              src={s.thumbnail}
              alt=""
              className="size-full object-cover opacity-80 transition group-hover:opacity-100"
            />
            {s.start <= dropOffAt && dropOffAt < s.end && (
              <span className="absolute inset-0 ring-2 ring-danger ring-inset" />
            )}
          </button>
        ))}
      </Row>
      <Row icon={<Type className="size-4" />} label="Texte à l’écran">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        {timeline.overlays.map((o) => (
          <button
            key={o.start}
            onClick={() => onSeek(o.start)}
            className="absolute top-1.5 bottom-1.5 truncate rounded-md bg-info/20 px-1.5 text-left text-[10px] font-semibold text-info ring-1 ring-info/30"
            style={{ left: pos(o.start), width: width(o.start, o.end) }}
            title={o.text}
          >
            {o.text}
          </button>
        ))}
      </Row>
      <Row icon={<AudioLines className="size-4" />} label="Audio">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        {timeline.audio.map((a) => (
          <button
            key={a.t}
            onClick={() => onSeek(a.t)}
            className="absolute top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-warning/15 py-0.5 pr-2 pl-1 text-[10px] font-semibold whitespace-nowrap text-warning ring-1 ring-warning/30"
            style={{ left: pos(a.t) }}
            title={a.label}
          >
            <span className="size-1.5 rounded-full bg-warning" />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </Row>
      <Row icon={<Scissors className="size-4" />} label="Coupes" h="h-6">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        {timeline.cuts.map((c) => (
          <span
            key={c}
            className="absolute top-1 bottom-1 w-0.5 rounded bg-fg/60"
            style={{ left: pos(c) }}
            title={`Coupe ${formatTime(c)}`}
          />
        ))}
      </Row>
      {/* playhead across tracks */}
      <div
        className="pointer-events-none absolute inset-y-0 flex"
        style={{ left: CHART_PAD.l, right: CHART_PAD.r }}
      >
        <div className="absolute inset-y-0 w-0.5 bg-fg" style={{ left: pos(time) }} />
      </div>
    </div>
  );
}
