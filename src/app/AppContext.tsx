import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/config";
import type { Screen, ViewState } from "@/types";

type Theme = "dark" | "light";

/** The user's own TikTok account, set in Réglages. Stored only in localStorage. */
export interface Profile {
  name: string;
  handle: string;
  /** Small JPEG data URL (downscaled), or "" for an initials avatar. */
  avatar: string;
}
export const EMPTY_PROFILE: Profile = { name: "", handle: "", avatar: "" };

interface AppCtx {
  screen: Screen;
  navigate: (s: Screen, opts?: { videoId?: string; compareIds?: string[] }) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  hasData: boolean;
  setHasData: (v: boolean) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  viewState: ViewState;
  setViewState: (v: ViewState) => void;
  activeVideoId: string;
  compareIds: string[];
  /** ON = mock data everywhere, OFF = real data only. */
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  /** Gemini key, stored ONLY in this browser's localStorage. */
  apiKey: string;
  setApiKey: (k: string) => void;
  /** Bumped whenever IndexedDB content changes so lists reload. */
  dataVersion: number;
  bumpData: () => void;
  profile: Profile;
  setProfile: (p: Profile) => void;
}

const Ctx = createContext<AppCtx | null>(null);
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside <AppProvider>");
  return c;
}

function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* storage disabled */
    }
  }, [key, v]);
  return [v, setV] as const;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersisted<Theme>("vl.theme", "dark");
  const [onboarded, setOnboarded] = usePersisted("vl.onboarded", false);
  const [hasData, setHasData] = usePersisted("vl.hasData", true);
  const [screen, setScreen] = useState<Screen>(onboarded ? "dashboard" : "onboarding");
  const [viewState, setViewState] = useState<ViewState>("success");
  const [activeVideoId, setActiveVideoId] = useState("v2");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [demoMode, setDemoMode] = usePersisted(STORAGE_KEYS.demoMode, true);
  const [apiKey, setApiKeyState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.apiKey) ?? "";
    } catch {
      return "";
    }
  });
  const setApiKey = useCallback((k: string) => {
    const v = k.trim();
    setApiKeyState(v);
    try {
      if (v) localStorage.setItem(STORAGE_KEYS.apiKey, v);
      else localStorage.removeItem(STORAGE_KEYS.apiKey);
    } catch {
      /* storage disabled */
    }
  }, []);
  const [profile, setProfile] = usePersisted<Profile>(STORAGE_KEYS.profile, EMPTY_PROFILE);
  const [dataVersion, setDataVersion] = useState(0);
  const bumpData = useCallback(() => setDataVersion((n) => n + 1), []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.lang = "fr";
    document.title = "ViralLens — Coach IA TikTok";
  }, [theme]);

  const navigate = useCallback<AppCtx["navigate"]>((s, opts) => {
    if (opts?.videoId) setActiveVideoId(opts.videoId);
    setCompareIds(opts?.compareIds ?? []);
    setViewState("success");
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <Ctx.Provider
      value={{
        screen,
        navigate,
        theme,
        setTheme,
        hasData,
        setHasData,
        onboarded,
        setOnboarded,
        viewState,
        setViewState,
        activeVideoId,
        compareIds,
        demoMode,
        setDemoMode,
        apiKey,
        setApiKey,
        dataVersion,
        bumpData,
        profile,
        setProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
