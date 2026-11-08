import { KeyRound, Sparkles } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateViews";

/** Friendly blocker shown in real mode (demo OFF) when no Gemini key is configured. */
export function NeedsApiKey({ body }: { body?: string }) {
  const { navigate, setDemoMode } = useApp();
  return (
    <EmptyState
      icon={<KeyRound className="size-7" />}
      title="Ajoute ta clé Gemini pour commencer"
      body={
        body ??
        "Le mode démo est désactivé : ViralLens utilise maintenant tes vraies données. Il lui faut une clé API Gemini (gratuite), stockée uniquement dans ce navigateur."
      }
      action={
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <Button icon={<KeyRound className="size-4" />} onClick={() => navigate("settings")}>
            Ajouter ma clé
          </Button>
          <Button
            variant="ghost"
            icon={<Sparkles className="size-4" />}
            onClick={() => setDemoMode(true)}
          >
            Réactiver le mode démo
          </Button>
        </div>
      }
    />
  );
}
