import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileVideo,
  KeyRound,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { ErrorDetails } from "@/components/errors/ErrorDetails";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import { VIDEO_ANALYSIS } from "@/config";
import { readVideoDuration } from "@/lib/media";
import { cn, formatBytes } from "@/lib/utils";
import { db } from "@/services/db";
import { toGeminiError, type GeminiError } from "@/services/errors";
import { getModel } from "@/services/modelService";
import {
  analyzeSavedVideo,
  type AnalysisPhase,
  type AnalysisProgress,
} from "@/services/videoAnalysisService";
import { isSupportedVideo, matchesSavedVideo, videoSession } from "@/services/videoSession";
import type { SavedAnalysis } from "@/types";

type Run =
  | { kind: "idle" }
  | { kind: "running"; progress: AnalysisProgress; startedAt: number }
  | { kind: "error"; error: GeminiError };

const PHASES: { id: AnalysisPhase; label: string }[] = [
  { id: "upload", label: "Envoi de la vidéo à Google" },
  { id: "processing", label: "Traitement de la vidéo par Google" },
  { id: "analysis", label: "Analyse image par image par Gemini" },
  { id: "saving", label: "Enregistrement du rapport" },
];

/**
 * Launches the real Gemini video analysis for a saved item.
 * Uses the file imported in step 1 (kept in memory for this session) or asks to re-import it.
 */
export function VideoAnalysisCard({
  item,
  file,
  onFile,
  onDone,
  onCancel,
  rerun,
}: {
  item: SavedAnalysis;
  file: File | null;
  onFile: (f: File) => void;
  onDone: (updated: SavedAnalysis) => void;
  /** Shown when re-running over an existing report. */
  onCancel?: () => void;
  rerun?: boolean;
}) {
  const { apiKey, navigate, bumpData } = useApp();
  const toast = useToast();
  const [run, setRun] = useState<Run>({ kind: "idle" });
  const [pending, setPending] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [now, setNow] = useState(Date.now());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (run.kind !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [run.kind]);

  const accept = (f: File) => {
    setFileError(undefined);
    if (!isSupportedVideo(f)) {
      setFileError("Format non pris en charge : choisis un fichier MP4 ou MOV.");
      return;
    }
    if (f.size > VIDEO_ANALYSIS.maxBytes) {
      setFileError("Vidéo trop lourde (2 Go maximum).");
      return;
    }
    if (!matchesSavedVideo(f, item.video)) {
      setPending(f);
      return;
    }
    confirmFile(f);
  };
  const confirmFile = (f: File) => {
    setPending(null);
    videoSession.set(item.id, f);
    onFile(f);
  };

  const start = async () => {
    if (!file) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRun({ kind: "running", progress: { phase: "upload", progress: 0 }, startedAt: Date.now() });
    try {
      const durationSec =
        item.video?.durationSec ?? item.stats.durationSec ?? (await readVideoDuration(file));
      const target = { ...item, video: item.video && { ...item.video, durationSec } };
      const report = await analyzeSavedVideo({
        apiKey,
        analysis: target,
        file,
        signal: ctrl.signal,
        onProgress: (progress) => setRun((r) => (r.kind === "running" ? { ...r, progress } : r)),
      });
      setRun((r) => (r.kind === "running" ? { ...r, progress: { phase: "saving" } } : r));
      const updated: SavedAnalysis = { ...target, status: "analyzed", report };
      try {
        await db.save(updated);
        bumpData();
        toast({
          tone: "success",
          title: "Analyse vidéo terminée",
          body: `Rapport enregistré dans ce navigateur · ${report.model}`,
        });
      } catch (e) {
        toast({
          tone: "error",
          title: "Rapport affiché mais non enregistré",
          body: e instanceof Error ? e.message : "Stockage local indisponible.",
        });
      }
      setRun({ kind: "idle" });
      onDone(updated);
    } catch (e) {
      const err = toGeminiError(e);
      if (err.code === "aborted") {
        setRun({ kind: "idle" });
        return;
      }
      setRun({ kind: "error", error: err });
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setRun({ kind: "idle" });
  };

  /* ---------- running ---------- */
  if (run.kind === "running") {
    const inline = (file?.size ?? 0) <= VIDEO_ANALYSIS.maxInlineBytes;
    const order = PHASES.map((p) => p.id);
    const cur = order.indexOf(run.progress.phase);
    const elapsed = Math.max(0, Math.round((now - run.startedAt) / 1000));
    return (
      <Card className="relative overflow-hidden" role="status" aria-live="polite">
        <div
          className="pointer-events-none absolute -top-20 -left-16 size-60 rounded-full bg-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-fg">
              <Sparkles className="size-5 animate-pulse text-accent" aria-hidden />
              Analyse vidéo en cours
            </p>
            <p className="mt-1 text-sm text-muted">
              {getModel("advanced")} · {elapsed} s écoulées · reste sur cette page jusqu’à la fin.
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={<X className="size-4" />} onClick={cancel}>
            Annuler
          </Button>
        </div>
        <ol className="relative mt-5 space-y-3">
          {PHASES.map((p, i) => {
            const skipped = inline && p.id === "processing";
            const state = skipped
              ? "skipped"
              : i < cur
                ? "done"
                : i === cur
                  ? "running"
                  : "pending";
            const label =
              p.id === "upload" && inline ? "Préparation de la vidéo (envoi direct)" : p.label;
            return (
              <li key={p.id} className="flex items-start gap-3 text-sm">
                {state === "done" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                ) : state === "running" ? (
                  <Loader2
                    className="mt-0.5 size-4 shrink-0 animate-spin text-accent"
                    aria-hidden
                  />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn(state === "pending" || skipped ? "text-subtle" : "text-fg")}>
                    {label}
                    {skipped && " · inutile pour une vidéo légère"}
                    {state === "running" && p.id === "analysis" && (
                      <span className="text-muted"> · 30 s à 3 min selon le modèle</span>
                    )}
                  </p>
                  {state === "running" && p.id === "upload" && !inline && (
                    <div className="mt-2 flex items-center gap-3">
                      <ProgressBar
                        value={(run.progress.progress ?? 0) * 100}
                        className="flex-1"
                        label="Envoi"
                      />
                      <span className="tabular w-10 text-right text-xs font-semibold text-fg">
                        {Math.round((run.progress.progress ?? 0) * 100)} %
                      </span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    );
  }

  /* ---------- idle / error ---------- */
  const title = rerun ? "Relancer l’analyse vidéo" : "Diagnostic vidéo par l’IA";
  return (
    <Card className="relative overflow-hidden border-accent/25">
      <div
        className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-accent/12 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold tracking-tight text-fg">{title}</h2>
            <p className="mt-1 text-sm text-muted">
              Gemini regarde ta vidéo image par image avec tes stats, puis génère le verdict, les
              causes classées avec horodatages, l’analyse de l’accroche, les scores, le plan
              d’action et le plan de remontage.
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {run.kind === "error" && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-danger/30 bg-danger/8 p-3 text-sm text-fg"
          >
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <span>
                <span className="font-semibold">L’analyse a échoué.</span> {run.error.message}
              </span>
            </p>
            <ErrorDetails error={run.error} className="mt-1 pl-6" />
          </div>
        )}

        <div className="mt-5">
          {!apiKey ? (
            <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/8 p-3 text-sm text-fg sm:flex-row sm:items-center">
              <KeyRound className="size-5 shrink-0 text-warning" aria-hidden />
              <p className="flex-1">Ajoute ta clé API Gemini pour lancer l’analyse vidéo.</p>
              <Button size="sm" onClick={() => navigate("settings")}>
                Ouvrir les Réglages
              </Button>
            </div>
          ) : pending ? (
            <div className="rounded-xl border border-warning/30 bg-warning/8 p-3 text-sm text-fg">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <span>
                  « {pending.name} » ({formatBytes(pending.size)}) ne correspond pas à la vidéo
                  importée à l’étape 1
                  {item.video ? ` (« ${item.video.name} », ${formatBytes(item.video.size)})` : ""}.
                  Le rapport serait basé sur une autre vidéo que tes stats.
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2 pl-6">
                <Button size="sm" variant="secondary" onClick={() => confirmFile(pending)}>
                  Utiliser quand même
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                  Choisir un autre fichier
                </Button>
              </div>
            </div>
          ) : !file ? (
            <div className="space-y-3">
              <p className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm text-fg">
                <FileVideo className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                <span>
                  {item.video ? (
                    <>
                      Le fichier vidéo n’est plus disponible dans cette session (page rechargée ou
                      ouverte dans un autre onglet) : ViralLens ne garde pas tes vidéos. Réimporte{" "}
                      <span className="font-semibold">« {item.video.name} »</span> (
                      {formatBytes(item.video.size)}) pour lancer l’analyse.
                    </>
                  ) : (
                    <>Aucune vidéo n’a été importée à l’étape 1. Ajoute-la pour lancer l’analyse.</>
                  )}
                </span>
              </p>
              <Dropzone
                accept="video/mp4,video/quicktime,.mp4,.mov"
                compact
                onFiles={(fs) => fs[0] && accept(fs[0])}
                title={item.video ? "Réimporter la vidéo" : "Importer la vidéo"}
                subtitle="MP4 ou MOV · le fichier reste dans ton navigateur jusqu’à l’envoi à Gemini"
                icon={<FileVideo className="size-5" />}
                error={fileError}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                icon={
                  run.kind === "error" ? (
                    <RotateCcw className="size-5" />
                  ) : (
                    <Sparkles className="size-5" />
                  )
                }
                onClick={start}
                className="sm:flex-none"
              >
                {run.kind === "error" ? "Réessayer l’analyse" : "Lancer l’analyse vidéo"}
              </Button>
              <p className="min-w-0 text-xs text-subtle">
                <span className="block truncate">
                  {file.name} · {formatBytes(file.size)} · modèle {getModel("advanced")}
                </span>
                La vidéo est envoyée à Google Gemini avec ta clé. Si elle passe par l’API Files,
                ViralLens la supprime des serveurs de Google juste après l’analyse.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
