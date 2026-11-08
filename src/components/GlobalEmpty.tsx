import { Plus, Sparkles } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { Button } from "@/components/ui/Button";

export function GlobalEmpty() {
  const { navigate } = useApp();
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line px-6 py-16 text-center animate-fade-up md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--glow),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto mb-8 flex w-fit items-end gap-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-16 rounded-xl border border-dashed border-line-strong bg-surface md:w-20 ${i === 1 ? "aspect-[9/16] -translate-y-3 border-accent/50 bg-accent/5" : "aspect-[9/14] opacity-60"}`}
          >
            {i === 1 && (
              <div className="grid h-full place-items-center text-accent">
                <Sparkles className="size-6" />
              </div>
            )}
          </div>
        ))}
      </div>
      <h2 className="relative text-2xl font-bold tracking-tight text-fg md:text-3xl">
        Aucune vidéo analysée
      </h2>
      <p className="relative mx-auto mt-2 max-w-md text-[15px] text-muted">
        Importe ta première vidéo et tes stats TikTok Studio. En 30 secondes, tu sauras pourquoi
        elle ne décolle pas.
      </p>
      <Button
        size="lg"
        className="relative mt-8"
        icon={<Plus className="size-5" />}
        onClick={() => navigate("new")}
      >
        Analyser ma première vidéo
      </Button>
    </div>
  );
}
