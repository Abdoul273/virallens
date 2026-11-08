import { useMemo, useState } from "react";
import { Search, SearchX, Trash2, X } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { GlobalEmpty } from "@/components/GlobalEmpty";
import { NeedsApiKey } from "@/components/NeedsApiKey";
import { SavedRow } from "@/components/real/SavedRow";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { useToast } from "@/components/ui/Toast";
import { useSavedAnalyses } from "@/hooks/useSavedAnalyses";
import { db } from "@/services/db";
import type { SavedAnalysis } from "@/types";

export function RealLibrary() {
  const { navigate, apiKey, viewState, setViewState, bumpData } = useApp();
  const toast = useToast();
  const { items, loading, error, reload } = useSavedAnalyses();
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<SavedAnalysis | null>(null);

  const list = useMemo(
    () =>
      items.filter((i) => !q || `${i.title} ${i.caption}`.toLowerCase().includes(q.toLowerCase())),
    [items, q],
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
  if (!loading && (viewState === "empty" || items.length === 0))
    return apiKey ? <GlobalEmpty /> : <NeedsApiKey />;

  const remove = async () => {
    if (!toDelete) return;
    try {
      await db.remove(toDelete.id);
      bumpData();
      toast({ tone: "success", title: "Analyse supprimée" });
    } catch (e) {
      toast({
        tone: "error",
        title: "Suppression impossible",
        body: e instanceof Error ? e.message : undefined,
      });
    }
    setToDelete(null);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-fg md:text-3xl">Bibliothèque</h2>
        <p className="mt-1 text-sm text-muted">
          {items.length} analyse{items.length > 1 ? "s" : ""} enregistrée
          {items.length > 1 ? "s" : ""} dans ce navigateur
        </p>
      </div>
      <div className="relative">
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
      {viewState === "loading" || loading ? (
        <div className="space-y-2" role="status" aria-label="Chargement">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-7" />}
          title="Aucun résultat"
          body="Aucune analyse ne correspond à ta recherche."
          action={
            <Button variant="secondary" onClick={() => setQ("")}>
              Effacer la recherche
            </Button>
          }
        />
      ) : (
        <div className="glass space-y-0.5 rounded-2xl p-2">
          {list.map((it) => (
            <SavedRow
              key={it.id}
              item={it}
              onOpen={() => navigate("report", { videoId: it.id })}
              onDelete={() => setToDelete(it)}
            />
          ))}
        </div>
      )}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Supprimer cette analyse ?">
        <p className="text-sm text-muted">« {toDelete?.title} » sera effacée de ce navigateur.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
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
