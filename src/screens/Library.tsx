import { useMemo, useState } from "react";
import { Columns2, LayoutGrid, List, Search, SearchX, X } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { RealLibrary } from "@/screens/real/RealLibrary";
import { GlobalEmpty } from "@/components/GlobalEmpty";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/Chip";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { VideoCard, VideoRow } from "@/components/video/VideoItems";
import { NICHES, VIDEOS } from "@/data/mockData";

type ScoreFilter = "all" | "high" | "mid" | "low";
type DateFilter = "all" | "7" | "30";
const REF_DATE = new Date("2025-05-16"); // mock "today"

function DemoLibrary() {
  const { navigate, viewState, setViewState, hasData } = useApp();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [score, setScore] = useState<ScoreFilter>("all");
  const [date, setDate] = useState<DateFilter>("all");
  const [niche, setNiche] = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const list = useMemo(
    () =>
      VIDEOS.filter((v) => {
        if (q && !v.title.toLowerCase().includes(q.toLowerCase())) return false;
        if (score === "high" && v.score < 70) return false;
        if (score === "mid" && (v.score < 45 || v.score >= 70)) return false;
        if (score === "low" && v.score >= 45) return false;
        if (niche !== "all" && v.niche !== niche) return false;
        if (
          date !== "all" &&
          (REF_DATE.getTime() - new Date(v.publishedAt).getTime()) / 864e5 > Number(date)
        )
          return false;
        return true;
      }),
    [q, score, date, niche],
  );

  if (viewState === "error") return <ErrorState onRetry={() => setViewState("success")} />;
  if (viewState === "empty" || !hasData) return <GlobalEmpty />;

  const toggle = (id: string, on: boolean) =>
    setSelected((s) =>
      on ? (s.length >= 2 ? [s[1], id] : [...s, id]) : s.filter((x) => x !== id),
    );
  const reset = () => {
    setQ("");
    setScore("all");
    setDate("all");
    setNiche("all");
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">Bibliothèque</h2>
          <p className="mt-1 text-sm text-muted">{VIDEOS.length} analyses</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectMode ? "primary" : "secondary"}
            size="sm"
            icon={<Columns2 className="size-4" />}
            onClick={() => {
              setSelectMode(!selectMode);
              setSelected([]);
            }}
            aria-pressed={selectMode}
          >
            {selectMode ? "Annuler" : "Sélectionner"}
          </Button>
          <Segmented
            label="Affichage"
            value={view}
            onChange={setView}
            options={[
              {
                value: "grid",
                label: <span className="sr-only">Grille</span>,
                icon: <LayoutGrid className="size-4" />,
              },
              {
                value: "list",
                label: <span className="sr-only">Liste</span>,
                icon: <List className="size-4" />,
              },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une vidéo…"
            aria-label="Rechercher"
            className="h-11 w-full rounded-xl border border-line bg-surface pr-10 pl-10 text-[15px] text-fg outline-none placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-fg"
              aria-label="Effacer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex">
          <Select
            aria-label="Période"
            value={date}
            onChange={(e) => setDate(e.target.value as DateFilter)}
            className="md:w-40"
          >
            <option value="all">Toutes dates</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
          </Select>
          <Select
            aria-label="Niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="md:w-40"
          >
            <option value="all">Toutes niches</option>
            {NICHES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </Select>
        </div>
      </div>
      <div
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
        role="group"
        aria-label="Filtrer par score"
      >
        {(
          [
            ["all", "Tous les scores"],
            ["high", "70 et +"],
            ["mid", "45 – 69"],
            ["low", "Moins de 45"],
          ] as const
        ).map(([v, l]) => (
          <FilterChip key={v} active={score === v} onClick={() => setScore(v)}>
            {l}
          </FilterChip>
        ))}
      </div>

      {viewState === "loading" ? (
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          role="status"
          aria-label="Chargement"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-7" />}
          title="Aucun résultat"
          body="Aucune analyse ne correspond à ces filtres."
          action={
            <Button variant="secondary" onClick={reset}>
              Réinitialiser les filtres
            </Button>
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {list.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              onOpen={() =>
                selectMode
                  ? toggle(v.id, !selected.includes(v.id))
                  : navigate("report", { videoId: v.id })
              }
              selectable={selectMode}
              selected={selected.includes(v.id)}
              onSelect={(on) => toggle(v.id, on)}
            />
          ))}
        </div>
      ) : (
        <div className="glass space-y-0.5 rounded-2xl p-2">
          {list.map((v) => (
            <VideoRow
              key={v.id}
              video={v}
              onOpen={() =>
                selectMode
                  ? toggle(v.id, !selected.includes(v.id))
                  : navigate("report", { videoId: v.id })
              }
              selectable={selectMode}
              selected={selected.includes(v.id)}
              onSelect={(on) => toggle(v.id, on)}
            />
          ))}
        </div>
      )}

      {selectMode && (
        <div className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-line-strong bg-solid/95 p-3 pl-5 shadow-2xl backdrop-blur-xl animate-fade-up lg:bottom-8 lg:left-64">
          <span className="text-sm font-medium text-fg">{selected.length}/2 sélectionnées</span>
          <Button
            size="sm"
            disabled={selected.length !== 2}
            icon={<Columns2 className="size-4" />}
            onClick={() => navigate("compare", { compareIds: selected })}
          >
            Comparer
          </Button>
        </div>
      )}
    </div>
  );
}

/** Demo mode → mock screen; real mode → data from IndexedDB / Gemini. */
export function Library() {
  const { demoMode } = useApp();
  return demoMode ? <DemoLibrary /> : <RealLibrary />;
}
