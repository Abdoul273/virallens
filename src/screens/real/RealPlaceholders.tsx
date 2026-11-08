import type { ReactElement } from "react";
import { Columns2, Sparkles } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { NeedsApiKey } from "@/components/NeedsApiKey";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateViews";
import { useSavedAnalyses } from "@/hooks/useSavedAnalyses";

/** Real-mode Compare: not implemented with real data (demo mode only). */
export function RealCompare() {
  const { apiKey, navigate, setDemoMode } = useApp();
  if (!apiKey) return <NeedsApiKey />;
  return (
    <EmptyState
      icon={<Columns2 className="size-7" />}
      title="Comparaison non disponible avec tes données réelles"
      body="La comparaison avec la vidéo d’un autre créateur n’est pas implémentée en mode réel. Tu peux voir son fonctionnement en mode démo, ou ouvrir tes rapports d’analyse vidéo."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate("library")}>Voir mes analyses</Button>
          <Button variant="secondary" onClick={() => setDemoMode(true)}>
            Voir en mode démo
          </Button>
        </div>
      }
    />
  );
}

/** Real-mode Patterns: shows progress toward the 5-video threshold. */
export function RealPatterns({ Locked }: { Locked: (p: { count: number }) => ReactElement }) {
  const { apiKey, navigate, setDemoMode } = useApp();
  const { items, loading } = useSavedAnalyses();
  if (!apiKey && !items.length) return <NeedsApiKey />;
  if (loading) return null;
  if (items.length < 5) return <Locked count={items.length} />;
  return (
    <EmptyState
      icon={<Sparkles className="size-7" />}
      title="Tendances non disponibles avec tes données réelles"
      body={`Tu as ${items.length} analyses enregistrées, mais le calcul des tendances (durée idéale, meilleurs horaires, types d’accroche) n’est pas implémenté en mode réel. Tu peux voir son fonctionnement en mode démo.`}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate("library")}>Voir mes analyses</Button>
          <Button variant="secondary" onClick={() => setDemoMode(true)}>
            Voir en mode démo
          </Button>
        </div>
      }
    />
  );
}
