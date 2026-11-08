import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="grid h-11 w-14 shrink-0 place-items-center rounded-full"
    >
      <span
        className={cn(
          "relative block h-7 w-12 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-surface-2 ring-1 ring-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
