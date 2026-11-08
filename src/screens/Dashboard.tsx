import { ArrowRight, ArrowUpRight, Eye, Gauge, Plus, Share2, Timer, Zap } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { RealDashboard } from "@/screens/real/RealDashboard";
import { GlobalEmpty } from "@/components/GlobalEmpty";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import { Thumb } from "@/components/ui/Thumb";
import { VideoRow } from "@/components/video/VideoItems";
import { KPIS, USER, VIDEOS } from "@/data/mockData";
import { formatCompact, formatTime } from "@/lib/utils";

const kpiIcons = {
  views: <Eye className="size-4" />,
  retention: <Timer className="size-4" />,
  share: <Share2 className="size-4" />,
  hook: <Zap className="size-4" />,
};

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement du tableau de bord">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
      <SkeletonCard lines={5} />
    </div>
  );
}

function DemoDashboard() {
  const { navigate, viewState, setViewState, hasData } = useApp();
  if (viewState === "loading") return <DashboardSkeleton />;
  if (viewState === "error") return <ErrorState onRetry={() => setViewState("success")} />;
  if (viewState === "empty" || !hasData) return <GlobalEmpty />;

  const top = VIDEOS.find((v) => v.id === "v1")!;
  const flop = VIDEOS.find((v) => v.id === "v2")!;

  return (
    <div className="space-y-6 animate-fade-up md:space-y-8">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">
            {greeting()}, {USER.name}
          </p>
          <h2 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-fg md:text-4xl">
            Ta chaîne gagne <span className="text-brand">en accroche</span>,
            <br className="hidden sm:block" /> pas encore en rétention.
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

      <section className="grid gap-4 lg:grid-cols-[minmax(300px,340px)_1fr]">
        <Card className="relative flex flex-col items-center overflow-hidden text-center sm:flex-row sm:text-left lg:flex-col lg:text-center">
          <div
            className="pointer-events-none absolute -top-20 left-1/2 size-56 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <ScoreRing
            value={USER.channelHealth}
            size={148}
            color="brand"
            label="sur 100"
            className="relative"
          />
          <div className="relative mt-4 sm:mt-0 sm:ml-6 lg:mt-5 lg:ml-0">
            <p className="text-sm font-medium text-muted">Santé de la chaîne</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-success">
              <ArrowUpRight className="size-4" aria-hidden /> +{USER.channelHealthDelta} cette
              semaine
            </p>
            <p className="mt-3 text-sm text-muted">
              Basé sur tes 8 dernières vidéos analysées : régularité, rétention, partages et
              recherche.
            </p>
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {KPIS.map((k) => (
            <MetricCard
              key={k.id}
              label={k.label}
              value={k.value}
              unit={k.unit}
              delta={k.delta}
              deltaLabel={k.deltaLabel}
              hint={k.hint}
              spark={k.spark}
              icon={kpiIcons[k.id as keyof typeof kpiIcons]}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader
            title="Top vs Flop"
            subtitle="Ta meilleure et ta pire vidéo du mois"
            icon={<Gauge className="size-5" />}
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              { v: top, tag: "Top", cls: "text-success bg-success/12" },
              { v: flop, tag: "Flop", cls: "text-danger bg-danger/12" },
            ].map(({ v, tag, cls }) => (
              <button
                key={v.id}
                onClick={() => navigate("report", { videoId: v.id })}
                className="group rounded-xl text-left"
              >
                <div className="relative">
                  <Thumb src={v.thumbnail} alt="" className="aspect-[4/5]" />
                  <span
                    className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-xs font-bold backdrop-blur ${cls}`}
                  >
                    {tag}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-fg group-hover:underline">
                  {v.title}
                </p>
              </button>
            ))}
          </div>
          <dl className="mt-4 divide-y divide-line rounded-xl border border-line text-sm">
            {[
              ["Vues", formatCompact(top.views), formatCompact(flop.views)],
              ["Rétention", `${top.retention} %`, `${flop.retention} %`],
              ["Durée", formatTime(top.durationSec), formatTime(flop.durationSec)],
              ["Accroche", top.hookType, flop.hookType],
            ].map(([k, a, b]) => (
              <div key={k} className="grid grid-cols-[88px_1fr_1fr] items-center gap-2 px-3 py-2.5">
                <dt className="text-subtle">{k}</dt>
                <dd className="tabular font-semibold text-success">{a}</dd>
                <dd className="tabular font-semibold text-danger">{b}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-xl bg-accent/8 p-3.5 text-sm text-fg">
            <span className="font-semibold text-accent">Différence clé :</span> ton top montre le
            résultat dès la 1ʳᵉ seconde.
          </div>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            icon={<ArrowRight className="size-4" />}
            onClick={() => navigate("compare", { compareIds: [top.id, flop.id] })}
          >
            Comparer en détail
          </Button>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <h3 className="text-[15px] font-semibold text-fg">Analyses récentes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("library")}>
              Tout voir
            </Button>
          </div>
          <div className="space-y-0.5">
            {VIDEOS.slice(0, 5).map((v) => (
              <VideoRow key={v.id} video={v} onOpen={() => navigate("report", { videoId: v.id })} />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

/** Demo mode → mock screen; real mode → data from IndexedDB / Gemini. */
export function Dashboard() {
  const { demoMode } = useApp();
  return demoMode ? <DemoDashboard /> : <RealDashboard />;
}
