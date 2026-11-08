import type { ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon,
  title,
  body,
  action,
  illustration,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-6 py-12 text-center animate-fade-up">
      {illustration ?? (
        <div className="relative mb-5 grid size-16 place-items-center rounded-2xl bg-surface-2 text-accent">
          <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" />
          <span className="relative">{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Une erreur est survenue",
  body = "Impossible de charger ces données. Vérifie ta connexion ou ta clé API, puis réessaie.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-danger/25 bg-danger/[0.06] px-6 py-12 text-center animate-fade-up"
    >
      <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-danger/15 text-danger">
        <AlertOctagon className="size-7" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      {onRetry && (
        <Button
          variant="secondary"
          className="mt-6"
          icon={<RefreshCw className="size-4" />}
          onClick={onRetry}
        >
          Réessayer
        </Button>
      )}
    </div>
  );
}
