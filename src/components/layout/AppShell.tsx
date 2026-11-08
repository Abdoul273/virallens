import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Aperture,
  Columns2,
  Eye,
  Home,
  LayoutGrid,
  Moon,
  Palette,
  Plus,
  Settings,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { cn } from "@/lib/utils";
import type { Screen, ViewState } from "@/types";

const NAV: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Accueil", icon: Home },
  { id: "library", label: "Bibliothèque", icon: LayoutGrid },
  { id: "new", label: "Analyser", icon: Plus },
  { id: "compare", label: "Comparer", icon: Columns2 },
  { id: "patterns", label: "Tendances", icon: Sparkles },
];

const TITLES: Partial<Record<Screen, string>> = {
  dashboard: "Accueil",
  library: "Bibliothèque",
  new: "Nouvelle analyse",
  report: "Rapport vidéo",
  compare: "Comparer",
  patterns: "Tendances",
  settings: "Réglages",
  design: "Design system",
};

const STATEFUL: Screen[] = ["dashboard", "library", "patterns", "report", "compare"];

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-[0_6px_20px_-6px_rgba(217,15,112,0.7)]">
        <Aperture className="size-5" aria-hidden />
      </span>
      {!compact && <span className="text-[17px] font-bold tracking-tight text-fg">ViralLens</span>}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
      aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

const STATES: { v: ViewState; label: string }[] = [
  { v: "success", label: "Succès" },
  { v: "loading", label: "Chargement" },
  { v: "empty", label: "Vide" },
  { v: "error", label: "Erreur" },
];

/** Prototype helper: preview loading / empty / error states of the current screen. */
function StatePreview() {
  const { viewState, setViewState } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-line-strong px-3 text-sm font-medium text-muted transition hover:text-fg"
      >
        <Eye className="size-4" aria-hidden />
        <span className="hidden sm:inline">État :</span>{" "}
        {STATES.find((s) => s.v === viewState)?.label}
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-line-strong bg-solid p-1.5 shadow-2xl animate-fade-up"
          role="menu"
        >
          <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-semibold tracking-wider text-subtle uppercase">
            Aperçu d’état
          </p>
          {STATES.map((s) => (
            <button
              key={s.v}
              role="menuitemradio"
              aria-checked={viewState === s.v}
              onClick={() => {
                setViewState(s.v);
                setOpen(false);
              }}
              className={cn(
                "flex h-10 w-full items-center rounded-lg px-2.5 text-sm",
                viewState === s.v
                  ? "bg-surface-2 font-semibold text-fg"
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Sidebar footer: the user's own account from Réglages, or a prompt to set it up. */
function ProfileChip() {
  const { profile, navigate } = useApp();
  const name = profile.name.trim();
  const handle = profile.handle.trim();
  if (!name && !handle)
    return (
      <button
        onClick={() => navigate("settings")}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong px-2 py-2 text-left transition hover:bg-surface"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-subtle">
          <UserRound className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-semibold text-accent">Configurer mon profil</span>
      </button>
    );
  return (
    <button
      onClick={() => navigate("settings")}
      className="mt-3 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface"
      aria-label={`Profil : ${name || handle}. Modifier dans Réglages`}
    >
      <ProfileAvatar name={name} handle={handle} src={profile.avatar} className="size-9 text-sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">{name || handle}</p>
        {name && handle && <p className="truncate text-xs text-subtle">{handle}</p>}
      </div>
    </button>
  );
}

function Sidebar() {
  const { screen, navigate } = useApp();
  const item = (id: Screen, label: string, Icon: typeof Home) => {
    const active = screen === id || (id === "library" && screen === "report");
    return (
      <button
        key={id}
        onClick={() => navigate(id)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition",
          active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface hover:text-fg",
        )}
      >
        <Icon className={cn("size-5", active && "text-accent")} aria-hidden />
        {label}
      </button>
    );
  };
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg-soft/60 p-4 backdrop-blur-xl lg:flex">
      <div className="px-2 py-2">
        <Logo />
      </div>
      <button
        onClick={() => navigate("new")}
        className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white shadow-[0_8px_24px_-8px_rgba(217,15,112,0.6)] transition hover:brightness-110"
      >
        <Plus className="size-5" aria-hidden /> Analyser une vidéo
      </button>
      <nav className="mt-6 space-y-1" aria-label="Navigation principale">
        {NAV.filter((n) => n.id !== "new").map((n) => item(n.id, n.label, n.icon))}
      </nav>
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        {item("design", "Design system", Palette)}
        {item("settings", "Réglages", Settings)}
        <ProfileChip />
      </div>
    </aside>
  );
}

function BottomTabs() {
  const { screen, navigate } = useApp();
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = screen === id || (id === "library" && screen === "report");
          if (id === "new")
            return (
              <li key={id} className="grid place-items-center">
                <button
                  onClick={() => navigate("new")}
                  aria-label="Analyser une vidéo"
                  className="-mt-5 grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_30px_-8px_rgba(217,15,112,0.8)] ring-4 ring-bg transition active:scale-95"
                >
                  <Plus className="size-6" />
                </button>
              </li>
            );
          return (
            <li key={id}>
              <button
                onClick={() => navigate(id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  active ? "text-fg" : "text-subtle",
                )}
              >
                <Icon className={cn("size-5", active && "text-accent")} aria-hidden />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { screen, navigate, profile } = useApp();
  const hasProfile = !!(profile.name.trim() || profile.handle.trim());
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 right-[-10%] h-[420px] w-[520px] rounded-full bg-[var(--glow)] blur-[120px]" />
        <div className="absolute top-[40%] left-[-15%] h-[360px] w-[420px] rounded-full bg-accent-2/10 blur-[120px]" />
      </div>
      <Sidebar />
      <div className="relative lg:pl-64">
        <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/75 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <h1 className="hidden text-lg font-semibold text-fg lg:block">{TITLES[screen]}</h1>
            <div className="flex items-center gap-1">
              {STATEFUL.includes(screen) && <StatePreview />}
              <ThemeToggle />
              <button
                onClick={() => navigate("settings")}
                className="grid size-11 place-items-center rounded-xl lg:hidden"
                aria-label="Réglages"
              >
                {hasProfile ? (
                  <ProfileAvatar
                    name={profile.name}
                    handle={profile.handle}
                    src={profile.avatar}
                    className="size-8 text-xs ring-2 ring-line"
                  />
                ) : (
                  <Settings className="size-5 text-muted" aria-hidden />
                )}
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-32 md:px-8 lg:pb-16">{children}</main>
      </div>
      <BottomTabs />
    </div>
  );
}
