import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Copy, Eye, FileDown, RotateCcw, Clock, Calendar, Columns2 } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { SavedReport } from "@/screens/real/SavedReport";
import { RetentionChart } from "@/components/charts/RetentionChart";
import { ActionPlan } from "@/components/report/ActionPlan";
import { CaptionOptimizer } from "@/components/report/CaptionOptimizer";
import { CoachChat } from "@/components/report/CoachChat";
import { DiagnosisList } from "@/components/report/DiagnosisList";
import { EditPlan } from "@/components/report/EditPlan";
import { HookCard } from "@/components/report/HookCard";
import { MockPlayer } from "@/components/report/MockPlayer";
import { ScoreGrid } from "@/components/report/ScoreGrid";
import { TimelineTracks } from "@/components/report/TimelineTracks";
import { ConfidenceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useToast } from "@/components/ui/Toast";
import { REPORT, VIDEOS } from "@/data/mockData";
import { cn, formatCompact, formatDate, formatTime } from "@/lib/utils";

const SECTIONS = [
  { id: "diagnostic", label: "Diagnostic" },
  { id: "retention", label: "Rétention" },
  { id: "scores", label: "Scores" },
  { id: "hook", label: "Accroche" },
  { id: "actions", label: "Plan d’action" },
  { id: "caption", label: "Légende" },
  { id: "edit", label: "Remontage" },
];

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-36" aria-labelledby={`${id}-t`}>
      <div className="mb-4">
        <h2 id={`${id}-t`} className="text-xl font-bold tracking-tight text-fg md:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement du rapport">
      <div className="glass flex gap-4 rounded-2xl p-5">
        <Skeleton className="aspect-[9/16] w-24" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="size-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-11 w-full" />
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </div>
  );
}

function buildReportText(title: string) {
  const r = REPORT;
  return [
    `ViralLens — Rapport : ${title}`,
    `Score global : ${r.globalScore}/100`,
    `Verdict : ${r.verdict}`,
    "",
    "Pourquoi ça ne marche pas :",
    ...r.diagnoses.map((d, i) => `${i + 1}. ${d.title} (${d.probability} %)`),
    "",
    "Plan d’action :",
    ...r.actions.map((a) => `- ${a.title} [impact ${a.impact}, effort ${a.effort}]`),
    "",
    `Légende suggérée : ${r.caption.suggested} ${r.caption.hashtags.join(" ")}`,
  ].join("\n");
}

function DemoReport() {
  const { navigate, activeVideoId, viewState, setViewState } = useApp();
  const toast = useToast();
  const video = VIDEOS.find((v) => v.id === activeVideoId) ?? VIDEOS[0];
  const r = REPORT;
  const score = video.id === r.videoId ? r.globalScore : video.score;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(SECTIONS[0].id);
  const playerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // simulated playback
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime((t) => Math.min(t + 1, r.durationSec)), 1000);
    return () => clearInterval(id);
  }, [playing, r.durationSec]);
  useEffect(() => {
    if (time >= r.durationSec) setPlaying(false);
  }, [time, r.durationSec]);

  // active tab tracking
  useEffect(() => {
    const onScroll = () => {
      let cur = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 160) cur = s.id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [viewState]);

  useEffect(() => {
    tabsRef.current
      ?.querySelector(`[data-tab="${active}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const seek = useCallback((t: number) => {
    setTime(t);
    setPlaying(false);
    const el = playerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 120 || rect.bottom > window.innerHeight)
        el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  if (viewState === "loading") return <ReportSkeleton />;
  if (viewState === "error")
    return (
      <ErrorState
        title="L’analyse a échoué"
        body="Gemini n’a pas pu lire la vidéo (quota dépassé ou clé API invalide). Vérifie ta clé dans les réglages puis relance."
        onRetry={() => setViewState("success")}
      />
    );
  if (viewState === "empty")
    return (
      <EmptyState
        icon={<Eye className="size-7" />}
        title="Rapport introuvable"
        body="Ce rapport a été supprimé ou n’a jamais été généré."
        action={<Button onClick={() => navigate("library")}>Voir la bibliothèque</Button>}
      />
    );

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportText(video.title));
      toast({
        tone: "success",
        title: "Rapport copié",
        body: "Colle-le dans tes notes ou envoie-le à ton monteur.",
      });
    } catch {
      toast({
        tone: "error",
        title: "Copie impossible",
        body: "Ton navigateur bloque le presse-papier.",
      });
    }
  };

  return (
    <div className="animate-fade-up">
      <button
        onClick={() => navigate("library")}
        className="no-print mb-4 inline-flex h-10 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Bibliothèque
      </button>

      {/* Header */}
      <Card className="relative overflow-hidden p-4 md:p-6">
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex gap-4 md:gap-6">
          <img
            src={video.thumbnail}
            alt=""
            className="aspect-[9/16] w-24 shrink-0 rounded-xl object-cover md:w-32"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ConfidenceBadge level={r.confidence} />
            </div>
            <h1 className="mt-2 text-lg leading-snug font-bold tracking-tight text-fg md:text-2xl">
              {video.title}
            </h1>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle md:text-sm">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" /> {formatCompact(video.views)} vues
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> {formatTime(video.durationSec)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" /> {formatDate(video.publishedAt)}
              </span>
            </p>
            <p className="mt-3 hidden text-[15px] leading-relaxed text-fg md:block">{r.verdict}</p>
          </div>
          <div className="hidden shrink-0 flex-col items-center sm:flex">
            <ScoreRing value={score} size={120} label="Score global" />
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-4 border-t border-line pt-4 sm:hidden">
          <ScoreRing value={score} size={72} label="Score global" />
          <p className="text-[15px] leading-snug font-medium text-fg">{r.verdict}</p>
        </div>
        <div className="no-print relative mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button
            variant="secondary"
            size="sm"
            icon={<Copy className="size-4" />}
            onClick={copyReport}
          >
            Copier le rapport
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileDown className="size-4" />}
            onClick={() => {
              toast({
                tone: "info",
                title: "Export PDF",
                body: "Choisis « Enregistrer en PDF » dans la fenêtre d’impression.",
              });
              setTimeout(() => window.print(), 300);
            }}
          >
            Exporter en PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="size-4" />}
            onClick={() => navigate("analyzing")}
          >
            Relancer l’analyse
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Columns2 className="size-4" />}
            onClick={() => navigate("compare", { compareIds: [video.id] })}
          >
            Comparer
          </Button>
        </div>
      </Card>

      {/* Sticky tabs */}
      <div className="no-print sticky top-16 z-20 -mx-4 mt-6 border-b border-line bg-bg/85 px-4 backdrop-blur-xl md:-mx-8 md:px-8">
        <div
          ref={tabsRef}
          className="no-scrollbar flex gap-1 overflow-x-auto"
          role="tablist"
          aria-label="Sections du rapport"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              data-tab={s.id}
              href={`#${s.id}`}
              role="tab"
              aria-selected={active === s.id}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "relative flex h-12 shrink-0 items-center px-3 text-sm font-medium whitespace-nowrap transition",
                active === s.id ? "text-fg" : "text-subtle hover:text-fg",
              )}
            >
              {s.label}
              {active === s.id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />
              )}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-12">
        <Section
          id="diagnostic"
          title="Pourquoi ça ne marche pas"
          subtitle="Classé par probabilité. Touche un horodatage pour aller au moment précis."
        >
          <DiagnosisList items={r.diagnoses} onSeek={seek} />
        </Section>

        <Section
          id="retention"
          title="Rétention seconde par seconde"
          subtitle="Touche la courbe ou la timeline pour te déplacer dans la vidéo."
        >
          <Card className="p-4 md:p-5">
            <div className="grid gap-5 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
              <div ref={playerRef} className="mx-auto w-44 md:w-full">
                <MockPlayer
                  timeline={r.timeline}
                  duration={r.durationSec}
                  time={time}
                  playing={playing}
                  onToggle={() => {
                    if (time >= r.durationSec) setTime(0);
                    setPlaying((p) => !p);
                  }}
                  onSeek={seek}
                />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded bg-brand" /> Spectateurs restants
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-danger/40" /> Zone de décrochage
                  </span>
                </div>
                <RetentionChart
                  data={r.retention}
                  duration={r.durationSec}
                  dropOffAt={r.dropOffAt}
                  currentTime={time}
                  onSeek={seek}
                />
                <TimelineTracks
                  timeline={r.timeline}
                  duration={r.durationSec}
                  time={time}
                  dropOffAt={r.dropOffAt}
                  onSeek={seek}
                />
              </div>
            </div>
          </Card>
        </Section>

        <Section id="scores" title="Grille de scores" subtitle="Chaque critère sur 100.">
          <ScoreGrid items={r.subScores} />
        </Section>

        <Section
          id="hook"
          title="Les 3 premières secondes"
          subtitle="Image par image, puis 3 nouvelles propositions."
        >
          <HookCard frames={r.hookFrames} proposals={r.hookProposals} />
        </Section>

        <Section
          id="actions"
          title="Plan d’action"
          subtitle="Par ordre de priorité. Coche au fur et à mesure."
        >
          <ActionPlan items={r.actions} />
        </Section>

        <Section
          id="caption"
          title="Légende et hashtags"
          subtitle="Optimisée pour la recherche TikTok."
        >
          <CaptionOptimizer data={r.caption} />
        </Section>

        <Section
          id="edit"
          title="Plan de remontage"
          subtitle="Les modifications à faire dans CapCut, dans l’ordre de la timeline."
        >
          <EditPlan steps={r.editPlan} duration={r.durationSec} onSeek={seek} />
        </Section>
      </div>

      <CoachChat videoId={video.id} />
    </div>
  );
}

/** Demo mode → mock screen; real mode → data from IndexedDB / Gemini. */
export function Report() {
  const { demoMode } = useApp();
  return demoMode ? <DemoReport /> : <SavedReport />;
}
