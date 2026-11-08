import { useState } from "react";
import { Check, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { technicalRows, technicalText, type GeminiError } from "@/services/errors";

/** Expandable "Détails techniques" for any failed Gemini call. */
export function ErrorDetails({ error, className }: { error: GeminiError; className?: string }) {
  const [copied, setCopied] = useState(false);
  const rows = technicalRows(error);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(technicalText(error));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <details className={cn("group text-xs", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md py-1 font-semibold text-muted select-none hover:text-fg [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 transition group-open:rotate-90" aria-hidden />
        Détails techniques
      </summary>
      <div className="mt-1.5 rounded-lg border border-line bg-surface-2/70 p-2.5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-subtle">{k}</dt>
              <dd className="min-w-0 font-mono break-words text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={copy}
          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-semibold text-accent hover:bg-accent/10"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copié" : "Copier les détails"}
        </button>
      </div>
    </details>
  );
}
