import { Eye, KeyRound, Plus, Share2, Timer, Zap } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { GlobalEmpty } from "@/components/GlobalEmpty";
import { NeedsApiKey } from "@/components/NeedsApiKey";
import { SavedRow } from "@/components/real/SavedRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { useSavedAnalyses } from "@/hooks/useSavedAnalyses";
import { median } from "@/lib/metrics";
import { formatCompact } from "@/lib/utils";

const pctValue = (n: number | null) => (n === null ? "—" : n.toFixed(1).replace(".", ","));

export function RealDashboard() {
  const { navigate, apiKey, viewState, setViewState } = useApp();
  const { items, loading, error, reload } = useSavedAnalyses();

  if (viewState === "loading" || loading)
    return (
      <div className="space-y-6" role="status" aria-label="Chargement">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  if (viewState === "error" || error)
    return (
      <ErrorState
        body={error ?? undefined}
        onRetry={() => {
          setViewState("success");
          reload();
        }}
      />
    );
  if (viewState === "empty" || items.length === 0)
    return apiKey ? <GlobalEmpty /> : <NeedsApiKey />;

  const views = median(items.map((i) => i.stats.views));
  const retention = median(items.map((i) => i.derived.retentionPct));
  const share = median(items.map((i) => i.derived.shareRatePct));
  const n = items.length;

  return (
    <div className="space-y-6 animate-fade-up md:space-y-8">
      {!apiKey && (
        <button
          onClick={() => navigate("settings")}
          className="flex w-full items-center gap-3 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-left text-sm text-fg"
        >
          <KeyRound className="size-5 shrink-0 text-warning" aria-hidden />
          Aucune clé Gemini : tu peux consulter tes analyses, mais pas en importer de nouvelles.
          <span className="ml-auto font-semibold text-accent">Ajouter</span>
        </button>
      )}
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Tes vraies données</p>
          <h2 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-fg md:text-4xl">
            {n} vidéo{n > 1 ? "s" : ""} importée{n > 1 ? "s" : ""}
          </h2>
        </div>
        <Button
          size="lg"
          icon={<Plus className="size-5" />}
          onClick={() => navigate("new")}
          className="w-full md:w-auto"
        >
          Analyser une vidéo
        </Button>
      </section>

      <section
        className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4"
        aria-label="Indicateurs clés"
      >
        <MetricCard
          label="Vues médianes"
          value={views === null ? "—" : formatCompact(Math.round(views))}
          hint={`Sur ${n} vidéo${n > 1 ? "s" : ""}`}
          icon={<Eye className="size-4" />}
        />
        <MetricCard
          label="Rétention médiane"
          value={pctValue(retention)}
          unit={retention === null ? undefined : "%"}
          hint="Visionnage moyen / durée"
          icon={<Timer className="size-4" />}
        />
        <MetricCard
          label="Taux de partage"
          value={pctValue(share)}
          unit={share === null ? undefined : "%"}
          hint="Médiane partages / vues"
          icon={<Share2 className="size-4" />}
        />
        <MetricCard
          label="Score d’accroche"
          value="—"
          hint="Disponible avec l’analyse vidéo IA"
          icon={<Zap className="size-4" />}
        />
      </section>
      {n < 2 && (
        <p className="-mt-3 text-xs text-subtle">
          Les tendances (flèches) apparaîtront après plusieurs imports.
        </p>
      )}

      <Card className="p-3 md:p-4">
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <h3 className="text-[15px] font-semibold text-fg">Analyses récentes</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("library")}>
            Tout voir
          </Button>
        </div>
        <div className="space-y-0.5">
          {items.slice(0, 5).map((it) => (
            <SavedRow key={it.id} item={it} onOpen={() => navigate("report", { videoId: it.id })} />
          ))}
        </div>
      </Card>
    </div>
  );
}
