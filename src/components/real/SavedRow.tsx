import { ChevronRight, Eye, FileVideo, Trash2 } from "lucide-react";
import { formatCompact } from "@/lib/utils";
import { formatPct } from "@/lib/metrics";
import type { SavedAnalysis } from "@/types";

export function SavedThumb({
  item,
  className = "w-14",
}: {
  item: SavedAnalysis;
  className?: string;
}) {
  const src = item.video?.thumbnail;
  return (
    <div
      className={`relative grid aspect-[9/16] shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <FileVideo className="size-5 text-subtle" aria-hidden />
      )}
    </div>
  );
}

export const savedDate = (item: SavedAnalysis) =>
  new Date(item.stats.publishDate ?? item.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

/** Row for an analysis stored in IndexedDB (real mode). */
export function SavedRow({
  item,
  onOpen,
  onDelete,
}: {
  item: SavedAnalysis;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const views = item.stats.views;
  return (
    <div className="group flex items-center gap-1 rounded-2xl transition hover:bg-surface-2">
      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl p-2 text-left"
      >
        <SavedThumb item={item} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] leading-snug font-medium text-fg">{item.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" aria-hidden /> {views === null ? "—" : formatCompact(views)}
            </span>
            <span aria-hidden>·</span>
            <span>{savedDate(item)}</span>
            <span aria-hidden>·</span>
            <span>Rétention {formatPct(item.derived.retentionPct, 0)}</span>
          </p>
        </div>
        {item.report ? (
          <span className="hidden rounded-lg border border-accent/25 bg-accent/12 px-2 py-1 text-xs font-semibold text-accent sm:inline">
            Analysée · {item.report.globalScore}
          </span>
        ) : (
          <span className="hidden rounded-lg border border-info/25 bg-info/12 px-2 py-1 text-xs font-semibold text-info sm:inline">
            Stats importées
          </span>
        )}
        <ChevronRight
          className="size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-fg"
          aria-hidden
        />
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-subtle hover:bg-danger/10 hover:text-danger"
          aria-label={`Supprimer ${item.title}`}
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
