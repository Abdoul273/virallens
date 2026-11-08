import { useRef, useState, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  compact?: boolean;
  error?: string;
}

export function Dropzone({
  accept,
  multiple,
  onFiles,
  title,
  subtitle,
  icon,
  compact,
  error,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const handle = (list: FileList | null) => {
    if (list && list.length) onFiles(Array.from(list));
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition",
          compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12",
          over
            ? "border-accent bg-accent/10"
            : error
              ? "border-danger/50 bg-danger/5"
              : "border-line-strong bg-surface hover:border-accent/60 hover:bg-accent/5",
        )}
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl opacity-0 transition group-hover:opacity-100" />
        <span
          className={cn(
            "relative grid place-items-center rounded-2xl bg-brand text-white shadow-lg",
            compact ? "size-10" : "size-14",
          )}
        >
          {icon ?? <UploadCloud className={compact ? "size-5" : "size-7"} aria-hidden />}
        </span>
        <span className="relative text-[15px] font-semibold text-fg">{title}</span>
        <span className="relative text-sm text-muted">{subtitle}</span>
      </button>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
