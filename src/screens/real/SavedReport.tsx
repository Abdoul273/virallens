import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Eye,
  FileDown,
  FileQuestion,
  FileVideo,
  Hash,
  Info,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { BarList } from "@/components/charts/BarList";
import {
  AiReportSections,
  LocalPlayer,
  ReportSection,
  SectionTabs,
  reportToText,
} from "@/components/real/AiReportView";
import { DerivedTiles } from "@/components/real/DerivedTiles";
import { SavedThumb } from "@/components/real/SavedRow";
import { VideoAnalysisCard } from "@/components/real/VideoAnalysisCard";
import { Badge, ConfidenceBadge, InsufficientDataBadge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useToast } from "@/components/ui/Toast";
import { formatPct, hasInsufficientData } from "@/lib/metrics";
import { formatNumber, formatTime } from "@/lib/utils";
import { db } from "@/services/db";
import { isSupportedVideo, matchesSavedVideo, videoSession } from "@/services/videoSession";
import type { SavedAnalysis, TrafficSources } from "@/types";

const TRAFFIC_LABELS: Record<keyof TrafficSources, string> = {
  forYou: "Pour toi",
  profile: "Profil",
  search: "Recherche",
  following: "Abonnements",
  sound: "Son",
};
const GOAL_LABELS = { followers: "Abonnés", views: "Vues", sales: "Ventes" };

const n = (v: number | null) => (v === null ? "—" : formatNumber(v));
const sec = (v: number | null) => (v === null ? "—" : `${String(v).replace(".", ",")} s`);

function summaryText(a: SavedAnalysis) {
  const s = a.stats;
  return [
    `ViralLens — ${a.title}`,
    `Vues : ${n(s.views)} · J’aime : ${n(s.likes)} · Commentaires : ${n(s.comments)} · Partages : ${n(s.shares)} · Enregistrements : ${n(s.saves)}`,
    `Visionnage moyen : ${sec(s.avgWatchTimeSec)} · Durée : ${sec(s.durationSec)} · Vidéo complète : ${formatPct(s.completionRatePct)}`,
    `Rétention : ${formatPct(a.derived.retentionPct)} · Engagement : ${formatPct(a.derived.engagementRatePct)} · Partage : ${formatPct(a.derived.shareRatePct)} · Enregistrement : ${formatPct(a.derived.saveRatePct)}`,
  ].join("\n");
}

export function SavedReport() {
  const { activeVideoId, navigate, bumpData, viewState, setViewState } = useApp();
  const toast = useToast();
  const [item, setItem] = useState<SavedAnalysis | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [file, setFile] = useState<File | null>(() => videoSession.get(activeVideoId));
  const [rerun, setRerun] = useState(false);
  const playerRef = useRef<HTMLVideoElement>(null);
  const reimportRef = useRef<HTMLInputElement>(null);

  const seek = useCallback(
    (t: number) => {
      const v = playerRef.current;
      if (!v) {
        toast({
          tone: "info",
          title: "Vidéo non chargée",
          body: "Réimporte la vidéo à côté du diagnostic pour lire ce moment.",
        });
        return;
      }
      v.currentTime = t;
      void v.play().catch(() => undefined);
      const rect = v.getBoundingClientRect();
      if (rect.top < 120 || rect.bottom > window.innerHeight)
        v.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [toast],
  );

  useEffect(() => {
    let alive = true;
    setItem(undefined);
    setFile(videoSession.get(activeVideoId));
    setRerun(false);
    db.get(activeVideoId)
      .then((r) => alive && setItem(r ?? null))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [activeVideoId]);

  if (viewState === "error" || error)
    return (
      <ErrorState
        body={error ?? undefined}
        onRetry={() => {
          setViewState("success");
          setError(null);
        }}
      />
    );
  if (viewState === "loading" || item === undefined)
    return (
      <div className="space-y-6" role="status" aria-label="Chargement du rapport">
        <Skeleton className="h-40 rounded-2xl" />
        <SkeletonCard lines={4} />
      </div>
    );
  if (viewState === "empty" || item === null)
    return (
      <EmptyState
        icon={<FileQuestion className="size-7" />}
        title="Rapport introuvable"
        body="Cette analyse n’existe pas dans ce navigateur (supprimée, ou créée en mode démo)."
        action={<Button onClick={() => navigate("library")}>Voir la bibliothèque</Button>}
      />
    );

  const s = item.stats;
  const traffic = (Object.keys(TRAFFIC_LABELS) as (keyof TrafficSources)[])
    .filter((k) => s.trafficSources[k] !== null)
    .map((k) => ({ label: TRAFFIC_LABELS[k], value: s.trafficSources[k] as number }));

  const report = item.report;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        report ? `${reportToText(item.title, report)}\n\n${summaryText(item)}` : summaryText(item),
      );
      toast({ tone: "success", title: "Résumé copié" });
    } catch {
      toast({
        tone: "error",
        title: "Copie impossible",
        body: "Ton navigateur bloque le presse-papier.",
      });
    }
  };
  const remove = async () => {
    try {
      await db.remove(item.id);
      videoSession.remove(item.id);
      bumpData();
      toast({ tone: "success", title: "Analyse supprimée" });
      navigate("library");
    } catch (e) {
      toast({
        tone: "error",
        title: "Suppression impossible",
        body: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const reimport = (f?: File) => {
    if (!f) return;
    if (!isSupportedVideo(f)) {
      toast({ tone: "error", title: "Format non pris en charge", body: "MP4 ou MOV uniquement." });
      return;
    }
    if (!matchesSavedVideo(f, item.video))
      toast({
        tone: "info",
        title: "Fichier différent",
        body: "Ce n’est pas le fichier importé à l’étape 1 : les horodatages peuvent ne pas correspondre.",
      });
    videoSession.set(item.id, f);
    setFile(f);
  };
  const player = file ? (
    <LocalPlayer ref={playerRef} file={file} />
  ) : (
    <div className="relative">
      <SavedThumb item={item} className="w-full rounded-xl opacity-60" />
      <div className="absolute inset-0 grid place-items-center p-3">
        <input
          ref={reimportRef}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          className="sr-only"
          onChange={(e) => {
            reimport(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<FileVideo className="size-4" />}
          onClick={() => reimportRef.current?.click()}
        >
          Réimporter pour lire
        </Button>
      </div>
    </div>
  );

  const metrics: [string, string][] = [
    ["Vues", n(s.views)],
    ["J’aime", n(s.likes)],
    ["Commentaires", n(s.comments)],
    ["Partages", n(s.shares)],
    ["Enregistrements", n(s.saves)],
    ["Nouveaux abonnés", n(s.newFollowers)],
    ["Visionnage moyen", sec(s.avgWatchTimeSec)],
    ["Vidéo complète", formatPct(s.completionRatePct)],
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <button
        onClick={() => navigate("library")}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Bibliothèque
      </button>

      <Card className="relative overflow-hidden p-4 md:p-6">
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex gap-4 md:gap-6">
          <SavedThumb item={item} className="w-24 rounded-xl md:w-32" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {report ? (
                <>
                  <Badge tone="accent" icon={<Sparkles className="size-3.5" />}>
                    Analysée par l’IA
                  </Badge>
                  <ConfidenceBadge level={report.confidence} />
                </>
              ) : (
                <Badge tone="info">Stats importées</Badge>
              )}
              {hasInsufficientData(s) && <InsufficientDataBadge />}
              {s.dataStatus === "processing" && <Badge tone="warning">Données en traitement</Badge>}
            </div>
            <h1 className="mt-2 text-lg leading-snug font-bold tracking-tight text-fg md:text-2xl">
              {item.title}
            </h1>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle md:text-sm">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" /> {n(s.views)} vues
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />{" "}
                {s.durationSec === null ? "—" : formatTime(s.durationSec)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                {s.publishDate
                  ? `Publiée le ${new Date(s.publishDate).toLocaleDateString("fr-FR")}`
                  : `Importée le ${new Date(item.createdAt).toLocaleDateString("fr-FR")}`}
              </span>
            </p>
            {report && (
              <p className="mt-3 hidden text-[15px] leading-relaxed text-fg md:block">
                {report.verdict}
              </p>
            )}
          </div>
          {report && (
            <div className="hidden shrink-0 flex-col items-center sm:flex">
              <ScoreRing value={report.globalScore} size={120} label="Score global" />
            </div>
          )}
        </div>
        {report && (
          <div className="relative mt-4 flex items-center gap-4 border-t border-line pt-4 sm:hidden">
            <ScoreRing value={report.globalScore} size={72} label="Score global" />
            <p className="text-[15px] leading-snug font-medium text-fg">{report.verdict}</p>
          </div>
        )}
        {report && (
          <p className="relative mt-3 text-xs text-subtle">
            Analysé le {new Date(report.analyzedAt).toLocaleString("fr-FR")} · {report.model}
          </p>
        )}
        <div className="no-print relative mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" size="sm" icon={<Copy className="size-4" />} onClick={copy}>
            {report ? "Copier le rapport" : "Copier le résumé"}
          </Button>
          {report && (
            <>
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
                onClick={() => setRerun(true)}
                disabled={rerun}
              >
                Relancer l’analyse
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="size-4" />}
            onClick={() => setConfirm(true)}
          >
            Supprimer
          </Button>
        </div>
      </Card>

      {(!report || rerun) && (
        <VideoAnalysisCard
          item={item}
          file={file}
          onFile={setFile}
          rerun={!!report}
          onCancel={report ? () => setRerun(false) : undefined}
          onDone={(updated) => {
            setItem(updated);
            setRerun(false);
            setTimeout(
              () => document.getElementById("diagnostic")?.scrollIntoView({ behavior: "smooth" }),
              100,
            );
          }}
        />
      )}

      {report && (
        <>
          <SectionTabs />
          <AiReportSections
            report={report}
            currentCaption={item.caption || s.caption || ""}
            player={player}
            onSeek={seek}
          />
        </>
      )}

      <ReportSection
        id="stats"
        title="Tes stats TikTok Studio"
        subtitle="Extraites de ton import et calculées dans ce navigateur."
      >
        <div className="space-y-6">
          <section className="space-y-3" aria-labelledby="derived-t">
            <h3 id="derived-t" className="text-lg font-semibold tracking-tight text-fg">
              Indicateurs calculés
            </h3>
            <DerivedTiles stats={s} />
          </section>

          <section aria-labelledby="raw-t">
            <h3 id="raw-t" className="mb-3 text-lg font-semibold tracking-tight text-fg">
              Statistiques
            </h3>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {metrics.map(([k, v]) => (
                <div key={k} className="glass rounded-2xl p-4">
                  <dt className="text-[13px] font-medium text-muted">{k}</dt>
                  <dd
                    className={`tabular mt-2 text-2xl font-bold tracking-tight ${v === "—" ? "text-subtle" : "text-fg"}`}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Sources de trafic" subtitle="Part des vues par origine" />
              {traffic.length ? (
                <BarList items={traffic} format={(v) => formatPct(v)} />
              ) : (
                <p className="text-sm text-muted">Non trouvées dans tes données.</p>
              )}
            </Card>
            <Card className="space-y-5">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
                  <Search className="size-4 text-accent" /> Requêtes de recherche
                </p>
                {s.searchQueries.length ? (
                  <div className="flex flex-wrap gap-2">
                    {s.searchQueries.map((q) => (
                      <Tag key={q}>{q}</Tag>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Aucune trouvée.</p>
                )}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
                  <Hash className="size-4 text-accent" /> Hashtags
                </p>
                {s.hashtags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {s.hashtags.map((h) => (
                      <Tag key={h}>{h}</Tag>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Aucun trouvé.</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-fg">Légende</p>
                <p className="text-sm text-muted">{item.caption || s.caption || "Non trouvée."}</p>
              </div>
              {s.retentionDropSec !== null && (
                <p className="flex gap-2 text-sm text-fg">
                  <Info className="mt-0.5 size-4 shrink-0 text-info" /> Décrochage principal vers{" "}
                  {formatTime(s.retentionDropSec)}.
                </p>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Contexte" />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Niche", item.context.niche || "—"],
                ["Audience", item.context.audience || "—"],
                ["Langue", item.context.language],
                ["Objectif", GOAL_LABELS[item.context.goal]],
                ["Accroche", item.hook || "—"],
                ["Fichier", item.video ? item.video.name : "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-subtle">{k}</dt>
                  <dd className="mt-0.5 text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </ReportSection>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Supprimer cette analyse ?">
        <p className="text-sm text-muted">Elle sera effacée de ce navigateur.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={remove}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
