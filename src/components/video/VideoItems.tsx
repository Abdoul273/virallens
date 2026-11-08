import { ChevronRight, Eye } from "lucide-react";
import { ScoreBadge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Thumb } from "@/components/ui/Thumb";
import { cn, formatCompact, formatDate } from "@/lib/utils";
import type { VideoSummary } from "@/types";

interface ItemProps {
  video: VideoSummary;
  onOpen: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (v: boolean) => void;
}

export function VideoRow({ video, onOpen, selectable, selected, onSelect }: ItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-2xl transition hover:bg-surface-2",
        selected && "bg-accent/8 ring-1 ring-accent/40",
      )}
    >
      {selectable && (
        <Checkbox
          checked={!!selected}
          onChange={(v) => onSelect?.(v)}
          label={`Sélectionner ${video.title}`}
        />
      )}
      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl p-2 text-left"
      >
        <Thumb
          src={video.thumbnail}
          alt=""
          duration={video.durationSec}
          className="w-14 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] leading-snug font-medium text-fg">{video.title}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" aria-hidden /> {formatCompact(video.views)}
            </span>
            <span aria-hidden>·</span>
            <span>{formatDate(video.publishedAt)}</span>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">{video.niche}</span>
          </p>
        </div>
        <ScoreBadge score={video.score} />
        <ChevronRight
          className="size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-fg"
          aria-hidden
        />
      </button>
    </div>
  );
}

export function VideoCard({ video, onOpen, selectable, selected, onSelect }: ItemProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl transition",
        selected && "ring-2 ring-accent",
      )}
    >
      <button
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`Ouvrir le rapport : ${video.title}`}
      >
        <div className="relative">
          <Thumb
            src={video.thumbnail}
            alt=""
            className="rounded-2xl transition duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <ScoreBadge
            score={video.score}
            className="absolute top-2 right-2 border-white/10 bg-black/60 backdrop-blur"
          />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="line-clamp-2 text-sm leading-snug font-semibold text-white">
              {video.title}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
              <Eye className="size-3.5" aria-hidden /> {formatCompact(video.views)} ·{" "}
              {formatDate(video.publishedAt)}
            </p>
          </div>
        </div>
      </button>
      {selectable && (
        <div className="absolute top-0 left-0">
          <Checkbox
            checked={!!selected}
            onChange={(v) => onSelect?.(v)}
            label={`Sélectionner ${video.title}`}
          />
        </div>
      )}
    </div>
  );
}
