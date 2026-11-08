import { useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Columns2,
  FileVideo,
  Info,
  Lightbulb,
  Play,
  RotateCcw,
  ThumbsUp,
  Trophy,
  X,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { RealCompare } from "@/screens/real/RealPlaceholders";
import { RadarChart } from "@/components/charts/RadarChart";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Dropzone } from "@/components/ui/Dropzone";
import { Field, LabeledInput, Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { Thumb } from "@/components/ui/Thumb";
import { PARSED_STATS, VIDEOS } from "@/data/mockData";
import { compareVideos } from "@/services/api";
import { cn, formatBytes, formatCompact, formatNumber } from "@/lib/utils";
import type { CompareResult, PublicStats } from "@/types";

const MINE_COLOR = "#ff4d94";
const THEIRS_COLOR = "#60a5fa";

function CopyNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-info/25 bg-info/[0.06] p-4 text-sm">
      <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
      <p className="text-fg">
        <span className="font-semibold">Inspire-toi, ne copie pas.</span>{" "}
        <span className="text-muted">
          Reprendre la vidéo, le son original, le texte ou le concept exact d’un autre créateur peut
          entraîner un signalement. ViralLens extrait des principes que tu adaptes à ton style.
        </span>
      </p>
    </div>
  );
}

function StatGrid({ stats }: { stats: PublicStats }) {
  const eng = ((stats.likes + stats.comments + stats.shares) / Math.max(1, stats.views)) * 100;
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
      {[
        ["Vues", formatCompact(stats.views)],
        ["J’aime", formatCompact(stats.likes)],
        ["Partages", formatCompact(stats.shares)],
        ["Engagement", `${eng.toFixed(1).replace(".", ",")} %`],
      ].map(([k, v]) => (
        <div key={k} className="rounded-lg bg-surface-2 px-2.5 py-2">
          <dt className="text-[11px] text-subtle">{k}</dt>
          <dd className="tabular font-semibold text-fg">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function PlayerTile({
  label,
  title,
  thumb,
  color,
  stats,
}: {
  label: string;
  title: string;
  thumb: string;
  color: string;
  stats: PublicStats;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="min-w-0">
      <p
        className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
        style={{ color }}
      >
        <span className="size-2 rounded-full" style={{ background: color }} /> {label}
      </p>
      <button
        onClick={() => setPlaying(!playing)}
        className="relative block w-full overflow-hidden rounded-2xl"
        aria-label={`${playing ? "Pause" : "Lire"} : ${title}`}
      >
        <Thumb
          src={thumb}
          alt=""
          className={cn("rounded-2xl transition", playing && "scale-[1.03]")}
        />
        <span className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/60 to-transparent">
          {!playing && (
            <span className="grid size-12 place-items-center rounded-full bg-white/25 text-white backdrop-blur">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          )}
        </span>
        {playing && (
          <span className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-white/30">
            <span className="block h-full w-1/3 bg-white" />
          </span>
        )}
      </button>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-fg">{title}</p>
      <StatGrid stats={stats} />
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Comparaison en cours">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-[9/16]" />
        <Skeleton className="aspect-[9/16]" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-72" />
    </div>
  );
}

function DemoCompare() {
  const { compareIds, viewState, setViewState, navigate } = useApp();
  const [mineId, setMineId] = useState(compareIds[0] ?? "v2");
  const ownOther = compareIds[1] ? VIDEOS.find((v) => v.id === compareIds[1]) : undefined;
  const [file, setFile] = useState<File | null>(null);
  const [creator, setCreator] = useState("");
  const [pub, setPub] = useState({ views: "", likes: "", comments: "", shares: "" });
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>();

  const mine = VIDEOS.find((v) => v.id === mineId) ?? VIDEOS[0];
  const myStats: PublicStats =
    mine.id === "v2"
      ? {
          views: PARSED_STATS.views ?? 0,
          likes: PARSED_STATS.likes ?? 0,
          comments: PARSED_STATS.comments ?? 0,
          shares: PARSED_STATS.shares ?? 0,
        }
      : {
          views: mine.views,
          likes: Math.round(mine.views * 0.07),
          comments: Math.round(mine.views * 0.004),
          shares: Math.round(mine.views * 0.015),
        };

  const run = async () => {
    if (!file && !ownOther) {
      setErr("Ajoute la vidéo de comparaison (mp4 ou mov).");
      return;
    }
    setErr(undefined);
    setLoading(true);
    const toNum = (s: string) => (s ? Number(s) : undefined);
    const res = await compareVideos({
      myVideoId: mineId,
      otherVideo: file,
      otherStats: {
        views: toNum(pub.views),
        likes: toNum(pub.likes),
        comments: toNum(pub.comments),
        shares: toNum(pub.shares),
      },
    });
    if (ownOther)
      res.other = {
        ...res.other,
        title: ownOther.title,
        creator: "Vidéo B",
        thumbnail: ownOther.thumbnail,
        stats: {
          views: ownOther.views,
          likes: Math.round(ownOther.views * 0.08),
          comments: Math.round(ownOther.views * 0.003),
          shares: Math.round(ownOther.views * 0.012),
        },
      };
    else {
      if (creator) res.other.creator = creator;
      const s = res.other.stats;
      res.other.stats = {
        views: toNum(pub.views) ?? s.views,
        likes: toNum(pub.likes) ?? s.likes,
        comments: toNum(pub.comments) ?? s.comments,
        shares: toNum(pub.shares) ?? s.shares,
      };
    }
    setResult(res);
    setLoading(false);
  };

  if (viewState === "loading" || loading) return <CompareSkeleton />;
  if (viewState === "error")
    return (
      <ErrorState
        title="Comparaison impossible"
        body="La vidéo de comparaison n’a pas pu être lue. Vérifie le format (mp4/mov) et réessaie."
        onRetry={() => setViewState("success")}
      />
    );
  if (viewState === "empty")
    return (
      <EmptyState
        icon={<Columns2 className="size-7" />}
        title="Rien à comparer pour l’instant"
        body="Analyse au moins une vidéo pour pouvoir la comparer à celle d’un autre créateur."
        action={<Button onClick={() => navigate("new")}>Analyser une vidéo</Button>}
      />
    );

  if (!result)
    return (
      <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
            Compare ta vidéo
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            Avec une vidéo qui marche dans ta niche, pour comprendre ce qui fait la différence.
          </p>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Card>
            <CardHeader title="Ma vidéo" subtitle="Choisis parmi tes analyses" />
            <Field label="Vidéo" htmlFor="mine">
              <Select id="mine" value={mineId} onChange={(e) => setMineId(e.target.value)}>
                {VIDEOS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-4 flex gap-3">
              <Thumb src={mine.thumbnail} alt="" duration={mine.durationSec} className="w-20" />
              <div className="text-sm">
                <p className="font-medium text-fg">{mine.title}</p>
                <p className="mt-1 text-subtle">
                  {formatCompact(mine.views)} vues · score {mine.score}
                </p>
              </div>
            </div>
          </Card>
          <div className="hidden h-full place-items-center md:grid">
            <span className="grid size-11 place-items-center rounded-full border border-line bg-surface text-muted">
              <ArrowLeftRight className="size-5" />
            </span>
          </div>
          <Card>
            <CardHeader
              title="Vidéo de comparaison"
              subtitle={
                ownOther ? "Une autre de tes vidéos" : "Importe la vidéo d’un autre créateur"
              }
            />
            {ownOther ? (
              <div className="flex gap-3">
                <Thumb
                  src={ownOther.thumbnail}
                  alt=""
                  duration={ownOther.durationSec}
                  className="w-20"
                />
                <div className="text-sm">
                  <p className="font-medium text-fg">{ownOther.title}</p>
                  <p className="mt-1 text-subtle">
                    {formatCompact(ownOther.views)} vues · score {ownOther.score}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {file ? (
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                    <FileVideo className="size-5 text-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{file.name}</p>
                      <p className="text-xs text-subtle">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface hover:text-fg"
                      aria-label="Retirer la vidéo"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Dropzone
                      compact
                      accept="video/mp4,video/quicktime,.mp4,.mov"
                      onFiles={(f) => {
                        setFile(f[0]);
                        setErr(undefined);
                      }}
                      title="Importer la vidéo"
                      subtitle="MP4 ou MOV"
                      error={err}
                    />
                    <button
                      type="button"
                      className="text-sm font-medium text-accent hover:underline"
                      onClick={() =>
                        setFile(
                          new File([new Uint8Array(1)], "boulange-maison-pain.mp4", {
                            type: "video/mp4",
                          }),
                        )
                      }
                    >
                      Utiliser une vidéo de démo
                    </button>
                  </>
                )}
                <LabeledInput
                  label="Créateur"
                  optional
                  placeholder="@pseudo"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                />
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-fg">
                    Stats publiques{" "}
                    <span className="text-xs font-normal text-subtle">optionnel</span>
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(["views", "likes", "comments", "shares"] as const).map((k) => (
                      <LabeledInput
                        key={k}
                        type="number"
                        min={0}
                        inputMode="numeric"
                        label={
                          {
                            views: "Vues",
                            likes: "J’aime",
                            comments: "Commentaires",
                            shares: "Partages",
                          }[k]
                        }
                        value={pub[k]}
                        onChange={(e) => setPub({ ...pub, [k]: e.target.value })}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
          </Card>
        </div>
        <CopyNotice />
        <Button
          size="lg"
          className="w-full md:w-auto"
          icon={<Columns2 className="size-5" />}
          onClick={run}
        >
          Lancer la comparaison
        </Button>
      </div>
    );

  const o = result.other;
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">
            Ta vidéo vs {o.creator}
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            {formatNumber(o.stats.views)} vues contre {formatNumber(myStats.views)} : voici ce qui
            change.
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RotateCcw className="size-4" />}
          onClick={() => setResult(null)}
        >
          Nouvelle comparaison
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <PlayerTile
              label="Ma vidéo"
              title={mine.title}
              thumb={mine.thumbnail}
              color={MINE_COLOR}
              stats={myStats}
            />
            <PlayerTile
              label={o.creator}
              title={o.title}
              thumb={o.thumbnail}
              color={THEIRS_COLOR}
              stats={o.stats}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Profil de score" subtitle="Superposition des 6 critères" />
          <RadarChart
            axes={result.axes}
            series={[
              { label: "Ma vidéo", values: result.mineScores, color: MINE_COLOR },
              { label: o.creator, values: result.theirScores, color: THEIRS_COLOR },
            ]}
          />
          <div className="mt-2 flex justify-center gap-5 text-sm">
            <span className="inline-flex items-center gap-2 text-fg">
              <span className="size-3 rounded-full" style={{ background: MINE_COLOR }} /> Ma vidéo
            </span>
            <span className="inline-flex items-center gap-2 text-fg">
              <span className="size-3 rounded-full" style={{ background: THEIRS_COLOR }} />{" "}
              {o.creator}
            </span>
          </div>
        </Card>
      </div>

      <section aria-labelledby="diff-t">
        <h3 id="diff-t" className="mb-4 text-xl font-bold tracking-tight text-fg">
          Les différences
        </h3>
        {/* mobile cards */}
        <div className="space-y-2 md:hidden">
          {result.rows.map((row) => (
            <div key={row.aspect} className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold tracking-wider text-subtle uppercase">
                {row.aspect}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <p
                  className={cn(
                    "rounded-lg p-2",
                    row.winner === "mine"
                      ? "bg-success/10 text-fg ring-1 ring-success/30"
                      : "text-muted",
                  )}
                >
                  <span
                    className="mb-0.5 block text-[11px] font-semibold"
                    style={{ color: MINE_COLOR }}
                  >
                    Toi
                  </span>
                  {row.mine}
                </p>
                <p
                  className={cn(
                    "rounded-lg p-2",
                    row.winner === "theirs"
                      ? "bg-success/10 text-fg ring-1 ring-success/30"
                      : "text-muted",
                  )}
                >
                  <span
                    className="mb-0.5 block text-[11px] font-semibold"
                    style={{ color: THEIRS_COLOR }}
                  >
                    {o.creator}
                  </span>
                  {row.theirs}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* desktop table */}
        <div className="glass hidden overflow-hidden rounded-2xl md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-2 text-left text-xs tracking-wider text-subtle uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Critère
                </th>
                <th scope="col" className="px-5 py-3 font-semibold" style={{ color: MINE_COLOR }}>
                  Ma vidéo
                </th>
                <th scope="col" className="px-5 py-3 font-semibold" style={{ color: THEIRS_COLOR }}>
                  {o.creator}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {result.rows.map((row) => (
                <tr key={row.aspect}>
                  <th scope="row" className="px-5 py-3.5 text-left font-medium text-fg">
                    {row.aspect}
                  </th>
                  {(["mine", "theirs"] as const).map((k) => (
                    <td
                      key={k}
                      className={cn(
                        "px-5 py-3.5",
                        row.winner === k ? "font-medium text-fg" : "text-muted",
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {row.winner === k && (
                          <Check className="size-4 shrink-0 text-success" aria-label="Meilleur" />
                        )}
                        {row[k]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            t: "Ce qu’il fait mieux",
            items: result.theyDoBetter,
            icon: Trophy,
            cls: "text-info bg-info/12",
          },
          {
            t: "Ce que tu fais mieux",
            items: result.youDoBetter,
            icon: ThumbsUp,
            cls: "text-success bg-success/12",
          },
          {
            t: "À t’inspirer (sans copier)",
            items: result.inspiration,
            icon: Lightbulb,
            cls: "text-accent bg-accent/12",
          },
        ].map(({ t, items, icon: Icon, cls }) => (
          <Card key={t}>
            <span className={`grid size-10 place-items-center rounded-xl ${cls}`}>
              <Icon className="size-5" />
            </span>
            <h3 className="mt-3 font-semibold text-fg">{t}</h3>
            <ul className="mt-3 space-y-2.5">
              {items.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-line-strong" />
                  {i}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <CopyNotice />
    </div>
  );
}

/** Demo mode → mock screen; real mode → data from IndexedDB / Gemini. */
export function Compare() {
  const { demoMode } = useApp();
  return demoMode ? <DemoCompare /> : <RealCompare />;
}
