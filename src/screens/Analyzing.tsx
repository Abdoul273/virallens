import { useEffect, useState } from "react";
import { Aperture, Check, Loader2, X } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Stepper";
import { ANALYSIS_STEPS } from "@/data/mockData";
import { analyzeVideo } from "@/services/api";
import { cn } from "@/lib/utils";

const STEP_MS = 1500;
const TIPS = [
  "Les 3 premières secondes décident de 70 % de la rétention.",
  "Un texte à l’écran toutes les 3–4 s garde l’attention sans le son.",
  "Les vidéos qui bouclent sont revues : TikTok adore ça.",
];

export function Analyzing() {
  const { navigate } = useApp();
  const [elapsed, setElapsed] = useState(0);
  const total = STEP_MS * ANALYSIS_STEPS.length;
  const active = Math.min(ANALYSIS_STEPS.length - 1, Math.floor(elapsed / STEP_MS));

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setElapsed(performance.now() - start), 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (elapsed < total) return;
    let alive = true;
    analyzeVideo({} as never).then(() => alive && navigate("report", { videoId: "v2" }));
    return () => {
      alive = false;
    };
  }, [elapsed >= total]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.min(100, Math.round((elapsed / total) * 100));

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-[var(--glow)] blur-[120px]"
        aria-hidden
      />
      <button
        onClick={() => navigate("new")}
        className="absolute top-4 right-4 grid size-11 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg"
        aria-label="Annuler l’analyse"
      >
        <X className="size-5" />
      </button>
      <div className="relative w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 grid size-32 place-items-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/40 animate-spin-slow" />
          <div className="absolute inset-3 rounded-full bg-brand opacity-25 blur-xl" />
          <div className="relative grid size-20 place-items-center rounded-3xl bg-brand text-white shadow-[0_12px_40px_-8px_rgba(217,15,112,0.8)]">
            <Aperture className="size-10 animate-spin-slow" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Analyse en cours…</h1>
        <p className="mt-1.5 text-sm text-muted">« Je teste le pain viral de TikTok »</p>
        <ProgressBar value={pct} className="mt-6" label="Progression de l’analyse" />
        <p className="tabular mt-2 text-right text-xs font-medium text-subtle">{pct} %</p>

        <ol className="mt-6 space-y-2 text-left" aria-live="polite">
          {ANALYSIS_STEPS.map((s, i) => {
            const done = i < active || pct === 100;
            const current = i === active && !done;
            return (
              <li
                key={s.label}
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl border p-3.5 transition-all duration-500",
                  current ? "glass border-accent/40" : "border-transparent",
                  !done && !current && "opacity-45",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    done
                      ? "bg-success text-bg"
                      : current
                        ? "bg-brand text-white"
                        : "bg-surface-2 text-subtle",
                  )}
                >
                  {done ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : current ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-fg">{s.label}</p>
                  <p className="text-xs text-muted">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-4 text-left">
          <p className="text-xs font-semibold tracking-wider text-accent uppercase">
            Le savais-tu ?
          </p>
          <p className="mt-1 text-sm text-fg">{TIPS[active % TIPS.length]}</p>
        </div>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("new")}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
