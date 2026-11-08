import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ClipboardPaste,
  FileVideo,
  FlaskConical,
  Info,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  ShoppingBag,
  Wand2,
  X,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { InsufficientDataBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dropzone } from "@/components/ui/Dropzone";
import { Field, LabeledInput, Select, Textarea } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { useToast } from "@/components/ui/Toast";
import { ErrorDetails } from "@/components/errors/ErrorDetails";
import { NeedsApiKey } from "@/components/NeedsApiKey";
import { STATS_IMPORT } from "@/config";
import { captureVideoThumbnail } from "@/lib/media";
import { videoSession } from "@/services/videoSession";
import { computeDerived, hasInsufficientData } from "@/lib/metrics";
import { DerivedTiles } from "@/components/real/DerivedTiles";
import { db } from "@/services/db";
import { toGeminiError, type GeminiError } from "@/services/errors";
import { countFound, extractStudioStats } from "@/services/parsingService";
import { IMAGES, SAMPLE_STUDIO_PASTE, USER } from "@/data/mockData";
import { parseStudioStats } from "@/services/api";
import { cn, formatBytes, formatTime } from "@/lib/utils";
import type { AnalysisContext, Goal, SavedAnalysis, StudioStats, TrafficSources } from "@/types";

const STEPS = ["Ta vidéo", "Tes stats", "Contexte"];

interface VideoDraft {
  file: File | null;
  url: string;
  name: string;
  size: number;
  duration: number;
  demo?: boolean;
  /** undefined = not captured yet, null = capture failed */
  thumbnail?: string | null;
}

/* ---------------- Step 1 ---------------- */
function StepVideo({
  video,
  setVideo,
  meta,
  setMeta,
  error,
  allowDemo,
}: {
  video: VideoDraft | null;
  setVideo: Dispatch<SetStateAction<VideoDraft | null>>;
  allowDemo: boolean;
  meta: { title: string; caption: string; hook: string };
  setMeta: (m: { title: string; caption: string; hook: string }) => void;
  error?: string;
}) {
  const [fileError, setFileError] = useState<string>();
  const onFiles = (files: File[]) => {
    const f = files[0];
    if (!/video\/(mp4|quicktime)/.test(f.type) && !/\.(mp4|mov)$/i.test(f.name)) {
      setFileError("Format non pris en charge. Utilise un fichier .mp4 ou .mov.");
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setFileError("Fichier trop lourd (500 Mo max).");
      return;
    }
    setFileError(undefined);
    setVideo({ file: f, url: URL.createObjectURL(f), name: f.name, size: f.size, duration: 0 });
  };
  return (
    <div className="space-y-6">
      {!video ? (
        <div className="space-y-3">
          <Dropzone
            accept="video/mp4,video/quicktime,.mp4,.mov"
            onFiles={onFiles}
            title="Glisse ta vidéo ici ou touche pour importer"
            subtitle="MP4 ou MOV · 500 Mo max · reste sur ton appareil"
            icon={<FileVideo className="size-7" />}
            error={fileError ?? error}
          />
          {allowDemo && (
            <button
              type="button"
              onClick={() =>
                setVideo({
                  file: null,
                  url: "",
                  name: "pain-viral-final.mp4",
                  size: 38_400_000,
                  duration: 34,
                  demo: true,
                })
              }
              className="mx-auto flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-accent hover:bg-accent/10"
            >
              <Sparkles className="size-4" /> Utiliser la vidéo de démo
            </button>
          )}
        </div>
      ) : (
        <div className="glass flex gap-4 rounded-2xl p-3 animate-fade-up sm:p-4">
          <div className="relative w-28 shrink-0 overflow-hidden rounded-xl bg-black sm:w-36">
            {video.demo ? (
              <img
                src={IMAGES.bread}
                alt="Aperçu de la vidéo de démo"
                className="aspect-[9/16] size-full object-cover"
              />
            ) : (
              <video
                src={video.url}
                controls
                playsInline
                className="aspect-[9/16] size-full object-cover"
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  setVideo((v) => (v ? { ...v, duration: Number.isFinite(d) ? d : 0 } : v));
                }}
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs font-semibold tracking-wider text-success uppercase">
              Vidéo prête
            </p>
            <p className="mt-1 truncate text-[15px] font-semibold text-fg" title={video.name}>
              {video.name}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-xs text-subtle">Taille</dt>
                <dd className="tabular font-semibold text-fg">{formatBytes(video.size)}</dd>
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <dt className="text-xs text-subtle">Durée</dt>
                <dd className="tabular font-semibold text-fg">
                  {video.duration ? formatTime(video.duration) : "…"}
                </dd>
              </div>
            </dl>
            <div className="mt-auto flex gap-2 pt-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<Trash2 className="size-4" />}
                onClick={() => setVideo(null)}
              >
                Retirer
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <LabeledInput
          label="Titre"
          optional
          placeholder="Ex. Je teste le pain viral"
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
        />
        <LabeledInput
          label="Accroche (3 premières secondes)"
          placeholder="Ce que tu dis ou montres au début"
          value={meta.hook}
          onChange={(e) => setMeta({ ...meta, hook: e.target.value })}
          hint="Aide l’IA à analyser ton ouverture."
        />
      </div>
      <Field label="Légende" optional htmlFor="caption">
        <Textarea
          id="caption"
          placeholder="Colle ta légende et tes hashtags"
          value={meta.caption}
          onChange={(e) => setMeta({ ...meta, caption: e.target.value })}
          className="min-h-24"
        />
      </Field>
    </div>
  );
}

/* ---------------- Step 2 ---------------- */
function NumberField({
  label,
  value,
  onChange,
  suffix,
  step,
  int,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
  suffix?: string;
  step?: number;
  int?: boolean;
}) {
  return (
    <LabeledInput
      label={label}
      type="number"
      inputMode={int ? "numeric" : "decimal"}
      min={0}
      step={step ?? 1}
      suffix={suffix}
      placeholder="Non trouvé"
      value={value === null || !Number.isFinite(value) ? "" : value}
      className={cn(value === null && "border-dashed")}
      onChange={(e) => {
        const n = e.target.value === "" ? null : Number(e.target.value);
        onChange(n === null || !Number.isFinite(n) || n < 0 ? null : int ? Math.round(n) : n);
      }}
    />
  );
}

const TRAFFIC: { key: keyof TrafficSources; label: string }[] = [
  { key: "forYou", label: "Pour toi" },
  { key: "profile", label: "Profil" },
  { key: "search", label: "Recherche" },
  { key: "following", label: "Abonnements" },
  { key: "sound", label: "Son" },
];
const TOTAL_FIELDS = 19;

function StatsForm({
  stats,
  setStats,
  onReset,
  durationFromVideo,
}: {
  stats: StudioStats;
  setStats: (s: StudioStats) => void;
  onReset: () => void;
  durationFromVideo: boolean;
}) {
  const set = <K extends keyof StudioStats>(k: K, v: StudioStats[K]) =>
    setStats({ ...stats, [k]: v });
  const setTraffic = (k: keyof TrafficSources, v: number | null) =>
    set("trafficSources", { ...stats.trafficSources, [k]: v });
  const trafficValues = TRAFFIC.map((t) => stats.trafficSources[t.key]);
  const trafficKnown = trafficValues.some((v) => v !== null);
  const trafficSum = trafficValues.reduce<number>((a, v) => a + (v ?? 0), 0);
  const found = countFound(stats);
  const insufficient = hasInsufficientData(stats);
  const dateIsDay = !!stats.publishDate && stats.publishDate.length === 10;

  return (
    <div className="space-y-6 animate-fade-up">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
          found >= 8 ? "border-success/25 bg-success/8" : "border-warning/30 bg-warning/8",
        )}
      >
        <p className="text-sm font-medium text-fg">
          <span className={cn("font-semibold", found >= 8 ? "text-success" : "text-warning")}>
            {found}/{TOTAL_FIELDS} champs trouvés.
          </span>{" "}
          Les champs vides n’étaient pas dans tes données : complète-les si tu les connais.
        </p>
        <div className="flex items-center gap-2">
          {insufficient && <InsufficientDataBadge />}
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="size-4" />}
            onClick={onReset}
          >
            Recommencer
          </Button>
        </div>
      </div>
      {stats.dataStatus === "processing" && (
        <p
          className="flex gap-2 rounded-xl border border-info/30 bg-info/8 p-3 text-sm text-fg"
          role="status"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          TikTok indique que les données sont encore en cours de traitement. Réimporte-les dans
          quelques heures pour un diagnostic plus fiable.
        </p>
      )}
      {insufficient && (
        <p
          className="rounded-xl border border-warning/30 bg-warning/8 p-3 text-sm text-fg"
          role="status"
        >
          Moins de 100 vues : TikTok n’a pas encore assez testé ta vidéo. Le diagnostic sera
          indicatif (confiance faible).
        </p>
      )}
      {stats.views === null && (
        <p
          className="rounded-xl border border-line bg-surface-2 p-3 text-sm text-muted"
          role="status"
        >
          Nombre de vues introuvable. Ajoute-le à la main pour calculer les taux.
        </p>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-fg">Indicateurs calculés</legend>
        <DerivedTiles stats={stats} />
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-fg">Engagement</legend>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NumberField int label="Vues" value={stats.views} onChange={(n) => set("views", n)} />
          <NumberField int label="J’aime" value={stats.likes} onChange={(n) => set("likes", n)} />
          <NumberField
            int
            label="Commentaires"
            value={stats.comments}
            onChange={(n) => set("comments", n)}
          />
          <NumberField
            int
            label="Partages"
            value={stats.shares}
            onChange={(n) => set("shares", n)}
          />
          <NumberField
            int
            label="Enregistrements"
            value={stats.saves}
            onChange={(n) => set("saves", n)}
          />
          <NumberField
            int
            label="Nouveaux abonnés"
            value={stats.newFollowers}
            onChange={(n) => set("newFollowers", n)}
          />
          <NumberField
            label="Visionnage moyen"
            value={stats.avgWatchTimeSec}
            step={0.1}
            suffix="s"
            onChange={(n) => set("avgWatchTimeSec", n)}
          />
          <NumberField
            label="Vidéo complète"
            value={stats.completionRatePct}
            step={0.1}
            suffix="%"
            onChange={(n) => set("completionRatePct", n === null ? null : Math.min(100, n))}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-fg">
          Sources de trafic
          {trafficKnown && (
            <span
              className={cn(
                "tabular text-xs font-medium",
                Math.abs(trafficSum - 100) < 1 ? "text-success" : "text-warning",
              )}
            >
              Total {trafficSum.toFixed(1).replace(".", ",")} %
            </span>
          )}
        </legend>
        {trafficKnown && (
          <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            {TRAFFIC.map((t, i) => (
              <div
                key={t.key}
                style={{
                  width: `${Math.min(100, stats.trafficSources[t.key] ?? 0)}%`,
                  background: `color-mix(in oklab, var(--accent) ${100 - i * 18}%, var(--accent-2))`,
                }}
              />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {TRAFFIC.map((t) => (
            <NumberField
              key={t.key}
              label={t.label}
              value={stats.trafficSources[t.key]}
              step={0.1}
              suffix="%"
              onChange={(n) => setTraffic(t.key, n === null ? null : Math.min(100, n))}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-fg">Détails</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <LabeledInput
            label="Date de publication"
            type={dateIsDay ? "date" : "datetime-local"}
            value={stats.publishDate ?? ""}
            onChange={(e) => set("publishDate", e.target.value || null)}
          />
          <NumberField
            label="Durée"
            value={stats.durationSec}
            suffix="s"
            step={0.1}
            onChange={(n) => set("durationSec", n)}
          />
          <NumberField
            label="Décrochage principal"
            value={stats.retentionDropSec}
            suffix="s"
            step={0.1}
            onChange={(n) => set("retentionDropSec", n)}
          />
        </div>
        {durationFromVideo && (
          <p className="mt-2 text-xs text-subtle">
            Durée reprise depuis ton fichier vidéo (absente des stats).
          </p>
        )}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <LabeledInput
            label="Requêtes de recherche"
            placeholder="Aucune trouvée"
            value={stats.searchQueries.join(", ")}
            onChange={(e) =>
              set(
                "searchQueries",
                e.target.value
                  .split(",")
                  .map((s) => s.trimStart())
                  .filter((s, i, a) => s || i === a.length - 1),
              )
            }
            hint="Séparées par des virgules"
          />
          <LabeledInput
            label="Hashtags"
            placeholder="Aucun trouvé"
            value={stats.hashtags.join(" ")}
            onChange={(e) =>
              set(
                "hashtags",
                e.target.value.split(/\s+/).filter((s, i, a) => s || i === a.length - 1),
              )
            }
            hint="Séparés par des espaces"
          />
        </div>
        <div className="mt-3">
          <Field label="Légende détectée" htmlFor="stats-caption">
            <Textarea
              id="stats-caption"
              placeholder="Non trouvée"
              value={stats.caption ?? ""}
              onChange={(e) => set("caption", e.target.value || null)}
              className="min-h-20"
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}

export interface Shot {
  file: File;
  url: string;
}

const IMAGE_TYPES = /^image\/(png|jpe?g|webp)$/;

function StepStats({
  stats,
  setStats,
  error,
  text,
  setText,
  shots,
  setShots,
  videoDuration,
}: {
  stats: StudioStats | null;
  setStats: (s: StudioStats | null) => void;
  error?: string;
  text: string;
  setText: (t: string) => void;
  shots: Shot[];
  setShots: Dispatch<SetStateAction<Shot[]>>;
  videoDuration: number;
}) {
  const { demoMode, apiKey, navigate } = useApp();
  const toast = useToast();
  const [mode, setMode] = useState<"text" | "images">(shots.length && !text ? "images" : "text");
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState<string>();
  const [parseErr, setParseErr] = useState<GeminiError>();
  const [shotError, setShotError] = useState<string>();
  const [helpOpen, setHelpOpen] = useState(false);
  const [durationFromVideo, setDurationFromVideo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const addShots = (fs: File[]) => {
    const ok = fs.filter((f) => IMAGE_TYPES.test(f.type) && f.size <= 15 * 1024 * 1024);
    if (ok.length < fs.length)
      setShotError("Certaines images ont été ignorées (PNG, JPG ou WebP, 15 Mo max).");
    else setShotError(undefined);
    setShots((s) => {
      const next = [...s, ...ok.map((file) => ({ file, url: URL.createObjectURL(file) }))];
      next.slice(STATS_IMPORT.maxScreenshots).forEach((x) => URL.revokeObjectURL(x.url));
      if (next.length > STATS_IMPORT.maxScreenshots)
        setShotError(`${STATS_IMPORT.maxScreenshots} captures maximum.`);
      return next.slice(0, STATS_IMPORT.maxScreenshots);
    });
  };

  const extract = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setParseError(undefined);
    setParseErr(undefined);
    try {
      let result: StudioStats;
      if (demoMode) {
        result = await parseStudioStats({ text, screenshots: shots.map((s) => s.file) });
      } else {
        result = await extractStudioStats({
          apiKey,
          text,
          screenshots: shots.map((s) => s.file),
          signal: ctrl.signal,
        });
      }
      const fillDuration = result.durationSec === null && videoDuration > 0;
      if (fillDuration) result = { ...result, durationSec: Math.round(videoDuration * 10) / 10 };
      setDurationFromVideo(fillDuration);
      const found = countFound(result);
      if (found === 0) {
        setParseError(
          "Aucune statistique reconnue. Vérifie que tu as copié la page « Analyse » d’une vidéo (pas le profil), ou ajoute des captures.",
        );
        toast({ tone: "error", title: "Aucune donnée trouvée" });
        return;
      }
      setStats(result);
      toast({
        tone: "success",
        title: `${found} champs extraits`,
        body: demoMode ? "Mode démo : données d’exemple." : "Vérifie-les avant de continuer.",
      });
    } catch (e) {
      const err = toGeminiError(e);
      if (err.code === "aborted") return;
      setParseError(err.message);
      if (!demoMode) setParseErr(err);
      // model_not_found already triggers the global "open Settings" toast
      if (err.code !== "model_not_found")
        toast({
          tone: "error",
          title: "Extraction impossible",
          body: err.message,
          details: demoMode ? undefined : <ErrorDetails error={err} />,
        });
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  if (loading)
    return (
      <div className="space-y-4" role="status" aria-label="Extraction en cours">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <Wand2 className="size-4 animate-pulse text-accent" />
            {demoMode ? "Extraction des données…" : "Gemini lit tes stats… (10 à 30 s)"}
          </p>
          <Button variant="ghost" size="sm" onClick={cancel}>
            Annuler
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-24" />
      </div>
    );
  if (stats)
    return (
      <StatsForm
        stats={stats}
        setStats={setStats}
        durationFromVideo={durationFromVideo}
        onReset={() => {
          setStats(null);
          setDurationFromVideo(false);
        }}
      />
    );

  const hasInput = text.trim().length > 0 || shots.length > 0;

  return (
    <div className="space-y-5">
      {demoMode && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
          <FlaskConical className="size-4 text-accent" aria-hidden />
          Mode démo : l’extraction renvoie des données d’exemple.
          <button
            type="button"
            onClick={() => navigate("settings")}
            className="font-semibold text-accent hover:underline"
          >
            Passer en mode réel
          </button>
        </p>
      )}
      <Segmented
        label="Source des stats"
        value={mode}
        onChange={setMode}
        className="w-full sm:w-auto"
        options={[
          {
            value: "text",
            label: text.trim() ? "Texte collé" : "Coller le texte",
            icon: <ClipboardPaste className="size-4" />,
          },
          {
            value: "images",
            label: `Captures (${shots.length}/${STATS_IMPORT.maxScreenshots})`,
            icon: <ImageIcon className="size-4" />,
          },
        ]}
      />

      <div className="rounded-xl border border-line bg-surface">
        <button
          type="button"
          onClick={() => setHelpOpen(!helpOpen)}
          aria-expanded={helpOpen}
          className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left text-sm font-medium text-fg"
        >
          Où trouver ces données ?
          <ChevronDown className={cn("size-4 text-muted transition", helpOpen && "rotate-180")} />
        </button>
        {helpOpen && (
          <ol className="list-decimal space-y-1.5 px-4 pb-4 pl-9 text-sm text-muted">
            <li>Ouvre TikTok Studio (appli ou tiktok.com/tiktokstudio).</li>
            <li>Va dans « Analyses » puis touche ta vidéo.</li>
            <li>Sélectionne tout le texte de la page (Ctrl/Cmd + A) et copie-le.</li>
            <li>
              Et/ou fais jusqu’à 4 captures : Vue d’ensemble, Spectateurs, Engagement, Trafic.
            </li>
            <li>Tu peux combiner texte et captures : tout est envoyé ensemble.</li>
          </ol>
        )}
      </div>

      {mode === "text" ? (
        <Field
          label="Colle ici la page d’analyse TikTok Studio"
          htmlFor="paste"
          error={parseError ?? error}
          hint="Français ou anglais, même en désordre."
        >
          <Textarea
            id="paste"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={STATS_IMPORT.maxTextChars}
            placeholder={
              "Vues de la vidéo 1 842\nNombre de J’aime 96\nDurée de visionnage moyenne 6,1 s\n…"
            }
            className="min-h-56 font-mono text-sm"
          />
        </Field>
      ) : (
        <div className="space-y-3">
          {shots.length < STATS_IMPORT.maxScreenshots && (
            <Dropzone
              accept="image/png,image/jpeg,image/webp"
              multiple
              compact
              onFiles={addShots}
              title="Ajoute tes captures"
              subtitle={`${shots.length}/${STATS_IMPORT.maxScreenshots} images · PNG, JPG ou WebP`}
              icon={<ImageIcon className="size-5" />}
              error={shotError ?? parseError ?? error}
            />
          )}
          {shots.length >= STATS_IMPORT.maxScreenshots && (parseError ?? error) && (
            <p className="text-xs font-medium text-danger">{parseError ?? error}</p>
          )}
          {shots.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {shots.map((s, i) => (
                <li key={s.url} className="relative">
                  <img
                    src={s.url}
                    alt={`Capture ${i + 1}`}
                    className="aspect-[9/16] w-full rounded-xl border border-line object-cover"
                  />
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(s.url);
                      setShots((all) => all.filter((x) => x !== s));
                    }}
                    className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full border border-line-strong bg-solid text-fg shadow"
                    aria-label={`Retirer la capture ${i + 1}`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {parseErr && parseError && <ErrorDetails error={parseErr} className="-mt-2" />}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          icon={<Wand2 className="size-4" />}
          onClick={extract}
          className="sm:flex-1"
          disabled={!hasInput}
        >
          Extraire les données
          {text.trim() && shots.length > 0 ? " (texte + captures)" : ""}
        </Button>
        {mode === "text" && (
          <Button
            variant="secondary"
            icon={<ClipboardPaste className="size-4" />}
            onClick={() => setText(SAMPLE_STUDIO_PASTE)}
          >
            Coller un exemple
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Step 3 ---------------- */
const GOALS: { value: Goal; label: string; desc: string; icon: typeof Users }[] = [
  { value: "followers", label: "Abonnés", desc: "Convertir les vues en communauté", icon: Users },
  { value: "views", label: "Vues", desc: "Maximiser la portée Pour toi", icon: TrendingUp },
  { value: "sales", label: "Ventes", desc: "Envoyer vers un produit ou lien", icon: ShoppingBag },
];

function StepContext({
  ctx,
  setCtx,
}: {
  ctx: AnalysisContext;
  setCtx: (c: AnalysisContext) => void;
}) {
  return (
    <div className="space-y-5">
      <Field
        label="Ta niche / profil de chaîne"
        htmlFor="niche"
        hint="Plus c’est précis, plus les conseils sont adaptés."
      >
        <Textarea
          id="niche"
          value={ctx.niche}
          onChange={(e) => setCtx({ ...ctx, niche: e.target.value })}
          placeholder="Ex. recettes rapides et petit budget pour étudiants, ton humoristique"
          className="min-h-24"
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <LabeledInput
          label="Audience cible"
          value={ctx.audience}
          onChange={(e) => setCtx({ ...ctx, audience: e.target.value })}
          placeholder="Ex. 18–25 ans, France, étudiants"
        />
        <Field label="Langue de la vidéo" htmlFor="lang">
          <Select
            id="lang"
            value={ctx.language}
            onChange={(e) => setCtx({ ...ctx, language: e.target.value })}
          >
            <option>Français</option>
            <option>Anglais</option>
            <option>Espagnol</option>
            <option>Sans paroles</option>
          </Select>
        </Field>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Objectif principal</legend>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
          {GOALS.map(({ value, label, desc, icon: Icon }) => {
            const on = ctx.goal === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setCtx({ ...ctx, goal: value })}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  on
                    ? "border-accent bg-accent/8 ring-4 ring-accent/10"
                    : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    on ? "bg-brand text-white" : "bg-surface-2 text-muted",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-fg">{label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/* ---------------- Wizard ---------------- */
export function NewAnalysis() {
  const { navigate, demoMode, apiKey, bumpData } = useApp();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [video, setVideo] = useState<VideoDraft | null>(null);
  const [meta, setMeta] = useState({ title: "", caption: "", hook: "" });
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [saving, setSaving] = useState(false);
  const [ctx, setCtx] = useState<AnalysisContext>({
    niche: demoMode ? USER.niche : "",
    audience: "",
    language: "Français",
    goal: "views",
  });
  const [errors, setErrors] = useState<Record<number, string | undefined>>({});

  useEffect(
    () => () => {
      if (video?.url) URL.revokeObjectURL(video.url);
    },
    [video?.url],
  );
  // Grab a local thumbnail for the saved analysis (real files only).
  useEffect(() => {
    if (!video?.file || video.thumbnail !== undefined) return;
    let alive = true;
    captureVideoThumbnail(video.file).then(
      (thumb) =>
        alive && setVideo((v) => (v && v.file === video.file ? { ...v, thumbnail: thumb } : v)),
    );
    return () => {
      alive = false;
    };
  }, [video?.file, video?.thumbnail]);

  const canNext = useMemo(
    () => (step === 0 ? !!video : step === 1 ? !!stats : ctx.niche.trim().length > 0),
    [step, video, stats, ctx],
  );

  const saveReal = async () => {
    if (!stats) return;
    setSaving(true);
    const record: SavedAnalysis = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "stats_imported",
      title: meta.title.trim() || stats.caption?.slice(0, 80) || video?.name || "Vidéo sans titre",
      caption: meta.caption.trim() || stats.caption || "",
      hook: meta.hook.trim(),
      video: video
        ? {
            name: video.name,
            size: video.size,
            durationSec: video.duration ? Math.round(video.duration * 10) / 10 : null,
            thumbnail: video.thumbnail ?? null,
          }
        : null,
      stats,
      derived: computeDerived(stats),
      context: ctx,
    };
    try {
      await db.save(record);
      // keep the File in memory so the report page can run the video analysis without re-import
      if (video?.file) videoSession.set(record.id, video.file);
      bumpData();
      toast({
        tone: "success",
        title: "Stats enregistrées",
        body: video?.file
          ? "Lance maintenant l’analyse vidéo depuis le rapport."
          : "Ajoute ta vidéo sur le rapport pour lancer l’analyse.",
      });
      navigate("report", { videoId: record.id });
    } catch (e) {
      toast({
        tone: "error",
        title: "Enregistrement impossible",
        body: e instanceof Error ? e.message : "Stockage local indisponible.",
      });
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!canNext) {
      setErrors({
        ...errors,
        [step]:
          step === 0
            ? "Ajoute une vidéo pour continuer."
            : step === 1
              ? "Extrais d’abord tes stats."
              : undefined,
      });
      if (step === 2) toast({ tone: "error", title: "Décris ta niche pour continuer." });
      return;
    }
    setErrors({});
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (demoMode) navigate("analyzing");
    else void saveReal();
  };

  if (!demoMode && !apiKey)
    return (
      <div className="mx-auto max-w-2xl">
        <NeedsApiKey body="Pour lire tes stats TikTok Studio, ViralLens a besoin de ta clé API Gemini (gratuite). Elle reste uniquement dans ce navigateur." />
      </div>
    );

  const titles = [
    { t: "Importe ta vidéo", s: "Le fichier reste dans ton navigateur." },
    {
      t: "Ajoute tes stats TikTok Studio",
      s: "Colle le texte de la page Analyse et/ou ajoute des captures.",
    },
    { t: "Un peu de contexte", s: "Pour des conseils adaptés à ta chaîne." },
  ][step];

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <Stepper steps={STEPS} current={step} />
      <Card className="mt-6 p-5 md:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
            <Target className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-fg md:text-2xl">{titles.t}</h2>
            <p className="mt-0.5 text-sm text-muted">{titles.s}</p>
          </div>
        </div>
        {step === 0 && (
          <StepVideo
            video={video}
            setVideo={setVideo}
            meta={meta}
            setMeta={setMeta}
            error={errors[0]}
            allowDemo={demoMode}
          />
        )}
        {step === 1 && (
          <StepStats
            stats={stats}
            setStats={setStats}
            error={errors[1]}
            text={pasteText}
            setText={setPasteText}
            shots={shots}
            setShots={setShots}
            videoDuration={video?.duration ?? 0}
          />
        )}
        {step === 2 && <StepContext ctx={ctx} setCtx={setCtx} />}
        {step === 2 && !demoMode && (
          <p className="mt-5 flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
            Tes stats et ce contexte seront enregistrés dans ce navigateur. Tu pourras ensuite
            lancer l’analyse vidéo par Gemini depuis la page du rapport.
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="size-4" />}
            onClick={() => (step === 0 ? navigate("dashboard") : setStep(step - 1))}
          >
            {step === 0 ? "Annuler" : "Retour"}
          </Button>
          <Button
            onClick={next}
            loading={saving}
            size={step === 2 ? "lg" : "md"}
            className={cn(!canNext && "opacity-60")}
            icon={step === 2 && !saving ? <Sparkles className="size-5" /> : undefined}
          >
            {step === 2 ? (demoMode ? "Lancer l’analyse" : "Enregistrer l’analyse") : "Continuer"}
            {step < 2 && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </Card>
      <p className="mt-4 text-center text-xs text-subtle">
        Ta vidéo n’est jamais envoyée sur nos serveurs sans ton accord.
      </p>
    </div>
  );
}
