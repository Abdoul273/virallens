import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn("grid size-11 shrink-0 place-items-center rounded-xl", className)}
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-lg border-2 transition",
          checked ? "border-transparent bg-brand text-white" : "border-line-strong bg-surface",
        )}
      >
        {checked && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}
