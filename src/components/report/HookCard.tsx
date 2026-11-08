import { Copy, Ear, Eye, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import type { HookFrame, HookProposal } from "@/types";

export function HookCard({
  frames,
  proposals,
}: {
  frames: HookFrame[];
  proposals: HookProposal[];
}) {
  const toast = useToast();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-[15px] font-semibold text-fg">
          Ce que voit et entend le spectateur
        </h3>
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[27px] before:w-px before:bg-line">
          {frames.map((f, i) => (
            <li key={`${f.t}-${i}`} className="relative flex gap-4">
              <span className="tabular z-10 grid h-7 w-14 shrink-0 place-items-center rounded-full border border-line bg-solid text-xs font-bold text-fg">
                {f.t}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5 text-sm">
                <p className="flex gap-2 text-fg">
                  <Eye className="mt-0.5 size-4 shrink-0 text-info" aria-label="Voit" /> {f.sees}
                </p>
                <p className="flex gap-2 text-muted">
                  <Ear className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Entend" />{" "}
                  {f.hears}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
          <Sparkles className="size-4 text-accent" /> {proposals.length} accroche
          {proposals.length > 1 ? "s" : ""} réécrite{proposals.length > 1 ? "s" : ""}
        </h3>
        {proposals.map((p, i) => (
          <div
            key={`${p.type}-${i}`}
            className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4"
          >
            {i === 0 && (
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 to-accent-2/5"
                aria-hidden
              />
            )}
            <div className="relative flex items-start justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-accent uppercase">
                {p.type}
                {i === 0 && (
                  <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 normal-case">
                    Recommandée
                  </span>
                )}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(p.text);
                  toast({ tone: "success", title: "Accroche copiée" });
                }}
                className="-mt-2 -mr-2 grid size-10 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
                aria-label="Copier l’accroche"
              >
                <Copy className="size-4" />
              </button>
            </div>
            <p className="relative mt-1 text-[17px] leading-snug font-semibold text-fg">
              « {p.text} »
            </p>
            <p className="relative mt-2 text-sm text-muted">
              <span className="font-medium text-fg">Visuel :</span> {p.visual}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
