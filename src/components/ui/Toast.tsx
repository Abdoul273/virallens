import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
  /** Optional call-to-action button inside the toast. */
  action?: { label: string; onClick: () => void };
  durationMs?: number;
  /** Extra content under the body (e.g. technical details). */
  details?: ReactNode;
}

const Ctx = createContext<(t: Omit<ToastItem, "id">) => void>(() => {});
export const useToast = () => useContext(Ctx);

const icons = {
  success: <CheckCircle2 className="size-5 text-success" aria-hidden />,
  error: <AlertCircle className="size-5 text-danger" aria-hidden />,
  info: <Info className="size-5 text-info" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(
      () => setItems((s) => s.filter((x) => x.id !== id)),
      t.durationMs ?? (t.details ? 12000 : t.action ? 8000 : 3600),
    );
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        className="no-print pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4 lg:top-auto lg:right-6 lg:bottom-6 lg:left-auto lg:items-end"
        aria-live="polite"
      >
        {items.map((t) => (
          <ToastView
            key={t.id}
            t={t}
            onClose={() => setItems((s) => s.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function ToastView({
  t,
  onClose,
  className,
}: {
  t: Omit<ToastItem, "id">;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line-strong bg-solid/95 p-4 shadow-2xl backdrop-blur-xl animate-fade-up",
        className,
      )}
    >
      {icons[t.tone]}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{t.title}</p>
        {t.body && <p className="mt-0.5 text-sm text-muted">{t.body}</p>}
        {t.details && <div className="mt-1">{t.details}</div>}
        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action!.onClick();
              onClose?.();
            }}
            className="mt-2 inline-flex h-10 items-center rounded-xl bg-surface-2 px-3 text-sm font-semibold text-accent ring-1 ring-line hover:bg-accent/10"
          >
            {t.action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="-m-1 grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
