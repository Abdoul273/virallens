import { cn } from "@/lib/utils";

export function BarList({
  items,
  format = (v) => String(v),
}: {
  items: { label: string; value: number; meta?: string; highlight?: "good" | "bad" }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-fg">{it.label}</span>
            <span className="tabular shrink-0 font-semibold text-fg">
              {format(it.value)}{" "}
              {it.meta && <span className="font-normal text-subtle">· {it.meta}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                "h-full rounded-full",
                it.highlight === "bad" ? "bg-danger" : "bg-brand",
              )}
              style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
