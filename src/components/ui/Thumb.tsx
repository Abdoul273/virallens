import { cn, formatTime } from "@/lib/utils";

export function Thumb({
  src,
  alt,
  duration,
  className,
}: {
  src: string;
  alt: string;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("relative aspect-[9/16] overflow-hidden rounded-xl bg-surface-2", className)}
    >
      <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
      {duration !== undefined && (
        <span className="tabular absolute right-1.5 bottom-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {formatTime(duration)}
        </span>
      )}
    </div>
  );
}
