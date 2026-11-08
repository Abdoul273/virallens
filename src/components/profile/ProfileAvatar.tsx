import { cn } from "@/lib/utils";

/** "Léa Martin" → "LM", "@lea.cuisine" → "LE". */
export function initialsOf(name: string, handle = ""): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const src = words[0] ?? handle.replace(/^@/, "");
  return src.slice(0, 2).toUpperCase();
}

/** Round avatar: image when provided, otherwise initials on a brand gradient. */
export function ProfileAvatar({
  name,
  handle,
  src,
  className,
}: {
  name: string;
  handle?: string;
  src?: string;
  className?: string;
}) {
  if (src) return <img src={src} alt="" className={cn("rounded-full object-cover", className)} />;
  const initials = initialsOf(name, handle);
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white",
        className,
      )}
    >
      <span className="text-[0.8em] leading-none">{initials || "?"}</span>
    </span>
  );
}
