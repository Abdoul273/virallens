import { Clock, Lock, Sparkles, Zap, CalendarClock } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { RealPatterns } from "@/screens/real/RealPlaceholders";
import { BarList } from "@/components/charts/BarList";
import { Heatmap } from "@/components/charts/Heatmap";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Stepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { PATTERNS, VIDEOS } from "@/data/mockData";
import { formatCompact } from "@/lib/utils";

function Locked({ count }: { count: number }) {
  const { navigate } = useApp();
  const min = PATTERNS.minVideos;
  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <div className="glass relative overflow-hidden rounded-3xl p-8 text-center">
        <div
          className="pointer-events-none absolute inset-0 grid grid-cols-6 gap-1 p-4 opacity-30 blur-[2px]"
          aria-hidden
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="rounded"
              style={{
                background: `color-mix(in oklab, var(--accent) ${(i * 37) % 80}%, transparent)`,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-solid text-accent shadow-lg ring-1 ring-line">
            <Lock className="size-6" />
          </span>
          <h2 className="mt-5 text-xl font-bold text-fg">
            Encore {min - count} vidéo{min - count > 1 ? "s" : ""} à analyser
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Les tendances comparent tes meilleures et tes pires vidéos. Il faut au moins {min}{" "}
            analyses pour des résultats fiables.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <ProgressBar value={(count / min) * 100} label="Vidéos analysées" />
            <p className="tabular mt-2 text-sm font-semibold text-fg">
              {count}/{min} vidéos
            </p>
          </div>
          <Button className="mt-6" onClick={() => navigate("new")}>
            Analyser une vidéo
          </Button>
        </div>
      </div>
    </div>
  );
}

function DemoPatterns() {
  const { viewState, setViewState, hasData } = useApp();
  if (viewState === "error") return <ErrorState onRetry={() => setViewState("success")} />;
  if (viewState === "empty" || !hasData) return <Locked count={viewState === "empty" ? 3 : 0} />;
  if (viewState === "loading")
    return (
      <div className="space-y-4" role="status" aria-label="Chargement">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-semibold tracking-wider text-accent uppercase">
          Basé sur {PATTERNS.scatter.length} vidéos
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-fg md:text-3xl">
          Ce qui distingue tes meilleures vidéos de tes pires
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PATTERNS.insights.map((i, idx) => (
          <Card key={i.title} className="relative overflow-hidden">
            {idx === 2 && (
              <div
                className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-accent/20 blur-2xl"
                aria-hidden
              />
            )}
            <p className="tabular text-brand text-4xl font-extrabold tracking-tight">{i.stat}</p>
            <p className="mt-2 font-semibold text-fg">{i.title}</p>
            <p className="mt-1 text-sm text-muted">{i.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Durée vs vues"
            subtitle="Échelle logarithmique"
            icon={<Clock className="size-5" />}
          />
          <ScatterChart data={PATTERNS.scatter} />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {[
              ["bg-success", "Top (score 70+)"],
              ["bg-warning", "Moyenne"],
              ["bg-danger", "Flop (< 50)"],
            ].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={`size-2.5 rounded-full ${c}`} />
                {l}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Heure de publication"
            subtitle="Vues moyennes (k) par créneau"
            icon={<CalendarClock className="size-5" />}
          />
          <Heatmap
            rows={PATTERNS.heatmapDays}
            cols={PATTERNS.heatmapSlots}
            data={PATTERNS.heatmap}
          />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Performance par type d’accroche"
          subtitle="Vues moyennes · nombre de vidéos"
          icon={<Zap className="size-5" />}
        />
        <BarList
          items={PATTERNS.hookTypes.map((h) => ({
            label: h.type,
            value: h.avgViews,
            meta: `${h.count} vidéos`,
            highlight: h.avgViews < 10000 ? "bad" : "good",
          }))}
          format={formatCompact}
        />
        <p className="mt-5 flex gap-2 rounded-xl bg-accent/8 p-3.5 text-sm text-fg">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
          {VIDEOS.filter((v) => v.hookType.startsWith("Présentation")).length} de tes vidéos
          commencent par « Salut… ». Remplace ce début par le résultat final.
        </p>
      </Card>
    </div>
  );
}

/** Demo mode → mock screen; real mode → data from IndexedDB / Gemini. */
export function Patterns() {
  const { demoMode } = useApp();
  return demoMode ? <DemoPatterns /> : <RealPatterns Locked={Locked} />;
}
