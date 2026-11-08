import { useEffect, useRef } from "react";
import { useApp } from "@/app/AppContext";
import { ErrorDetails } from "@/components/errors/ErrorDetails";
import { useToast } from "@/components/ui/Toast";
import type { GeminiError } from "@/services/errors";
import {
  MODEL_FALLBACK_EVENT,
  MODEL_UNAVAILABLE_EVENT,
  type ModelFallbackDetail,
} from "@/services/geminiService";

const SHORT_REASON: Record<string, string> = {
  overloaded: "surchargé (503)",
  rate_limited: "limité en débit (429)",
  quota_exceeded: "à court de quota (429)",
  free_tier_limit: "hors quota gratuit (429)",
  model_not_found: "indisponible pour ta clé (404)",
};

/** Global toasts: model unavailable, and "model X used because Y was unavailable". */
export function ModelErrorToaster() {
  const { navigate, screen } = useApp();
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const toast = useToast();
  const last = useRef(0);
  useEffect(() => {
    const onUnavailable = (e: Event) => {
      // Settings already shows the reason inline (connection test).
      if (screenRef.current === "settings") return;
      if (Date.now() - last.current < 3000) return;
      last.current = Date.now();
      const { model, error } = (e as CustomEvent<{ model?: string; error?: GeminiError }>).detail;
      toast({
        tone: "error",
        title: "Ce modèle n’est pas disponible, choisis-en un autre dans Réglages",
        body: model ? `Modèle refusé : ${model}` : undefined,
        details: error ? <ErrorDetails error={error} /> : undefined,
        action: { label: "Ouvrir les Réglages", onClick: () => navigate("settings") },
      });
    };
    const onFallback = (e: Event) => {
      const { used, failed, error } = (e as CustomEvent<ModelFallbackDetail>).detail;
      toast({
        tone: "info",
        title: `Modèle ${used} utilisé car ${failed} était indisponible`,
        body: `${failed} : ${SHORT_REASON[error.code] ?? error.code}. Tu peux désactiver le repli automatique dans Réglages.`,
        details: <ErrorDetails error={error} />,
      });
    };
    window.addEventListener(MODEL_UNAVAILABLE_EVENT, onUnavailable);
    window.addEventListener(MODEL_FALLBACK_EVENT, onFallback);
    return () => {
      window.removeEventListener(MODEL_UNAVAILABLE_EVENT, onUnavailable);
      window.removeEventListener(MODEL_FALLBACK_EVENT, onFallback);
    };
  }, [navigate, toast]);
  return null;
}
