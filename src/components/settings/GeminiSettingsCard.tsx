import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  KeyRound,
  Loader2,
  MinusCircle,
  PlugZap,
  RefreshCw,
  Shuffle,
  X,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { ErrorDetails } from "@/components/errors/ErrorDetails";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { GEMINI_FALLBACK_MAX, GEMINI_KEY_URL, STORAGE_KEYS } from "@/config";
import { cn, formatNumber } from "@/lib/utils";
import { GeminiError, toGeminiError } from "@/services/errors";
import { pingModel } from "@/services/geminiService";
import {
  SAME_AS_MAIN,
  autoEligible,
  fallbackCandidates,
  fallbackModels,
  getStoredModel,
  isFallbackEnabled,
  isPreview,
  listModels,
  loadModelsCache,
  pickAdvancedModel,
  pickDefaultModel,
  rankCandidates,
  saveModelsCache,
  setFallbackEnabled,
  setStoredModel,
  videoSupport,
  type GeminiModel,
} from "@/services/modelService";

type ListState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; source: "api" | "cache" }
  | { kind: "fallback"; message: string; error: GeminiError };

type StepStatus = "pending" | "running" | "ok" | "error" | "skipped";
interface Step {
  id: string;
  label: string;
  status: StepStatus;
  message?: string;
  error?: GeminiError;
}
type TestResult =
  | { kind: "ok"; message: string; warning?: string; warningError?: GeminiError }
  | { kind: "error"; message: string; error?: GeminiError }
  | null;

/** One line of the "main + alternatives" test table. */
interface ProbeRow {
  model: string;
  role: "main" | "alt";
  status: "running" | "ok" | "error";
  latencyMs?: number;
  error?: GeminiError;
}

/** Marker: model choice made with the stable-first rules (migrates old auto-picked previews). */
const CHOICE_V2 = `${STORAGE_KEYS.model}.v2`;

const KEY_MIN_LENGTH = 20;

/** French reason for a failed test call on a specific model. */
function reasonFor(err: GeminiError, modelId: string): string {
  if (err.code === "model_not_found")
    return `Le modèle « ${modelId} » n’est pas disponible pour cette clé. Choisis-en un autre dans la liste.`;
  if (err.code === "timeout")
    return `« ${modelId} » n’a pas répondu en 45 s, même pour un simple « OK ». Ce modèle est peut-être en préversion ou surchargé : réessaie plus tard ou choisis un modèle Flash stable (par ex. gemini-2.5-flash).`;
  return err.message;
}

function VideoSupportLine({ id }: { id: string }) {
  const s = videoSupport(id);
  const cfg = {
    likely: { icon: CheckCircle2, cls: "text-success", text: "Accepte probablement la vidéo" },
    unlikely: { icon: MinusCircle, cls: "text-danger", text: "Ne semble pas accepter la vidéo" },
    unknown: {
      icon: AlertTriangle,
      cls: "text-warning",
      text: "Prise en charge de la vidéo inconnue",
    },
  }[s];
  const Icon = cfg.icon;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
      <Film className="size-3.5 text-subtle" aria-hidden />
      <Icon className={cn("size-3.5", cfg.cls)} aria-hidden />
      <span className={cfg.cls}>{cfg.text}</span>
    </p>
  );
}

const optionLabel = (m: GeminiModel, recommended?: string) => {
  const base = m.displayName && m.displayName !== m.id ? `${m.displayName} — ${m.id}` : m.id;
  const tags = [
    m.id === recommended ? "recommandé" : "",
    isPreview(m.id) ? "préversion" : "",
  ].filter(Boolean);
  return tags.length ? `${base} · ${tags.join(" · ")}` : base;
};

/** Dropdown groups: stable (auto-eligible) / preview / other variants. */
function groupModels(models: GeminiModel[]) {
  const ranked = rankCandidates(models).map((m) => m.id);
  const byRank = (a: GeminiModel, b: GeminiModel) => ranked.indexOf(a.id) - ranked.indexOf(b.id);
  const stable = models.filter((m) => ranked.includes(m.id) && !isPreview(m.id)).sort(byRank);
  const preview = models
    .filter((m) => !stable.includes(m) && isPreview(m.id) && autoEligible(m.id))
    .sort(byRank);
  const other = models.filter((m) => !stable.includes(m) && !preview.includes(m));
  return [
    { label: "Stables (recommandés)", items: stable },
    { label: "Préversions et expérimentaux", items: preview },
    { label: "Autres variantes (non choisies automatiquement)", items: other },
  ].filter((g) => g.items.length);
}

function ModelOptions({ models, recommended }: { models: GeminiModel[]; recommended?: string }) {
  return (
    <>
      {groupModels(models).map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.items.map((m) => (
            <option key={m.id} value={m.id}>
              {optionLabel(m, recommended)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

function PreviewBadge({ id }: { id: string }) {
  if (!isPreview(id)) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
      <Badge tone="warning" className="h-5 px-2 text-[11px]">
        préversion
      </Badge>
      Peut être instable, surchargé ou retiré sans préavis.
    </p>
  );
}

export function GeminiSettingsCard() {
  const { apiKey, setApiKey } = useApp();
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<GeminiModel[]>(() =>
    apiKey ? (loadModelsCache(apiKey) ?? []) : [],
  );
  const [listState, setListState] = useState<ListState>(() =>
    apiKey && loadModelsCache(apiKey) ? { kind: "ok", source: "cache" } : { kind: "idle" },
  );
  const [main, setMain] = useState(() => getStoredModel("main"));
  const [advanced, setAdvanced] = useState(() => getStoredModel("advanced"));
  const [steps, setSteps] = useState<Step[]>([]);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult>(null);
  const [probes, setProbes] = useState<ProbeRow[]>([]);
  const [fallbackOn, setFallbackOn] = useState(isFallbackEnabled);
  const listAbort = useRef<AbortController | null>(null);
  const testAbort = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      listAbort.current?.abort();
      testAbort.current?.abort();
    },
    [],
  );

  const chooseMain = (id: string) => {
    setMain(id);
    setStoredModel("main", id);
    try {
      localStorage.setItem(CHOICE_V2, "1");
    } catch {
      /* ignore */
    }
    setResult(null);
    setProbes([]);
  };
  const chooseAdvanced = (id: string) => {
    setAdvanced(id);
    setStoredModel("advanced", id);
    setResult(null);
  };

  /** Keep valid choices, auto-pick defaults for missing / unavailable ones. Returns the effective ids. */
  const applyModels = useCallback((list: GeminiModel[]) => {
    setModels(list);
    const ids = new Set(list.map((m) => m.id));
    let m = getStoredModel("main");
    let v2 = false;
    try {
      v2 = localStorage.getItem(CHOICE_V2) === "1";
    } catch {
      /* ignore */
    }
    // Older versions auto-selected the newest model, often a preview: re-pick a stable Flash once.
    const legacyAuto = !v2 && m && (isPreview(m) || !autoEligible(m));
    if (!m || !ids.has(m) || legacyAuto) {
      m = pickDefaultModel(list) ?? "";
      setStoredModel("main", m);
    }
    try {
      localStorage.setItem(CHOICE_V2, "1");
    } catch {
      /* ignore */
    }
    let a = getStoredModel("advanced");
    if (a !== SAME_AS_MAIN && (!a || !ids.has(a))) {
      a = pickAdvancedModel(list, m) ?? m;
      setStoredModel("advanced", a);
    }
    setMain(m);
    setAdvanced(a);
    return { main: m, advanced: a === SAME_AS_MAIN ? m : a };
  }, []);

  const refreshModels = useCallback(
    async (key: string) => {
      listAbort.current?.abort();
      const ctrl = new AbortController();
      listAbort.current = ctrl;
      setListState({ kind: "loading" });
      try {
        const list = await listModels(key, ctrl.signal);
        if (!list.length)
          throw new Error("Aucun modèle compatible generateContent pour cette clé.");
        saveModelsCache(key, list);
        const picked = applyModels(list);
        setListState({ kind: "ok", source: "api" });
        return { list, ...picked };
      } catch (e) {
        const err = toGeminiError(e);
        if (err.code === "aborted") throw err;
        const fb = fallbackModels();
        setModels(fb);
        const stored = getStoredModel("main");
        if (!stored) setMain(fb[0].id);
        setListState({
          kind: "fallback",
          message: err.code === "unknown" && err.detail ? err.detail : err.message,
          error: err,
        });
        throw err;
      }
    },
    [applyModels],
  );

  // Discover models automatically once a plausible key is entered (debounced).
  useEffect(() => {
    if (apiKey.length < KEY_MIN_LENGTH) {
      listAbort.current?.abort();
      setModels([]);
      setListState({ kind: "idle" });
      return;
    }
    const cached = loadModelsCache(apiKey);
    if (cached) {
      applyModels(cached);
      setListState({ kind: "ok", source: "cache" });
    }
    const t = setTimeout(() => {
      refreshModels(apiKey).catch(() => {
        /* state already updated */
      });
    }, 600);
    return () => clearTimeout(t);
  }, [apiKey, applyModels, refreshModels]);

  const runTest = async () => {
    testAbort.current?.abort();
    const ctrl = new AbortController();
    testAbort.current = ctrl;
    setTesting(true);
    setResult(null);
    setProbes([]);
    const advId = advanced === SAME_AS_MAIN || !advanced ? main : advanced;
    const initial: Step[] = [
      { id: "list", label: "Lister les modèles de ta clé", status: "running" },
      { id: "main", label: "Appel test du modèle principal", status: "pending" },
      ...(advId && advId !== main
        ? [{ id: "adv", label: "Appel test du modèle avancé", status: "pending" as StepStatus }]
        : []),
    ];
    setSteps(initial);
    const update = (id: string, patch: Partial<Step>) =>
      setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const skipRest = () =>
      setSteps((s) => s.map((x) => (x.status === "pending" ? { ...x, status: "skipped" } : x)));
    const setProbe = (model: string, patch: Partial<ProbeRow>) =>
      setProbes((rows) => rows.map((r) => (r.model === model ? { ...r, ...patch } : r)));

    /** Ping one model and record latency even on failure. */
    const probe = async (model: string, maxAttempts: number) => {
      const t0 = performance.now();
      try {
        const r = await pingModel(apiKey, model, { signal: ctrl.signal, maxAttempts });
        setProbe(model, { status: "ok", latencyMs: r.latencyMs });
        return { ok: true as const, latencyMs: r.latencyMs };
      } catch (e) {
        const err = toGeminiError(e);
        setProbe(model, {
          status: "error",
          latencyMs: Math.round(performance.now() - t0),
          error: err,
        });
        return { ok: false as const, error: err };
      }
    };

    try {
      // 1) ListModels
      let effective: { list: GeminiModel[]; main: string; advanced: string };
      try {
        effective = await refreshModels(apiKey);
        update("list", { status: "ok", message: `${effective.list.length} modèles compatibles` });
      } catch (e) {
        const err = toGeminiError(e);
        if (err.code === "aborted") return;
        update("list", { status: "error", message: err.message, error: err });
        skipRest();
        setResult({ kind: "error", message: err.message, error: err });
        toast({
          tone: "error",
          title: "Échec de la connexion",
          body: err.message,
          details: <ErrorDetails error={err} />,
        });
        return;
      }

      // 2) main model (full retry policy: 3 attempts on 503 / 429)
      const mainId = effective.main;
      const mainInfo = effective.list.find((m) => m.id === mainId);
      update("main", { status: "running", label: `Appel test : ${mainId}` });
      setProbes([{ model: mainId, role: "main", status: "running" }]);
      const mainRes = mainInfo
        ? await probe(mainId, 3)
        : {
            ok: false as const,
            error: new GeminiError("model_not_found", {
              model: mainId,
              message: `Le modèle « ${mainId} » n’est pas dans la liste ListModels de cette clé.`,
            }),
          };
      if (ctrl.signal.aborted) return;

      if (!mainRes.ok) {
        const err = mainRes.error;
        const message = reasonFor(err, mainId);
        if (!mainInfo) setProbe(mainId, { status: "error", error: err });
        update("main", { status: "error", message, error: err });
        skipRest();

        // 3) automatically test up to 3 alternatives, in parallel (1 attempt each, to stay fast)
        const alts = fallbackCandidates(effective.list, [mainId], GEMINI_FALLBACK_MAX);
        setProbes((rows) => [
          ...rows,
          ...alts.map((model) => ({ model, role: "alt" as const, status: "running" as const })),
        ]);
        const altRes = await Promise.all(alts.map((m) => probe(m, 1)));
        if (ctrl.signal.aborted) return;
        const firstOk = alts.find((_, i) => altRes[i].ok);
        setResult({
          kind: "error",
          message: firstOk
            ? `${message} Alternative fonctionnelle trouvée : « ${firstOk} ».`
            : alts.length
              ? `${message} Aucune des ${alts.length} alternatives testées n’a répondu.`
              : message,
          error: err,
        });
        toast({
          tone: "error",
          title: "Échec de l’appel test",
          body: firstOk ? `${mainId} a échoué. ${firstOk} fonctionne.` : message,
          details: <ErrorDetails error={err} />,
        });
        return;
      }
      const latency = mainRes.latencyMs;
      update("main", { status: "ok", message: `${latency} ms` });

      // 4) optional advanced model (non-blocking)
      let warning: string | undefined;
      let warningError: GeminiError | undefined;
      const advTarget = effective.advanced;
      if (advTarget && advTarget !== mainId) {
        update("adv", { status: "running", label: `Appel test : ${advTarget}` });
        try {
          const r = await pingModel(apiKey, advTarget, { signal: ctrl.signal });
          update("adv", { status: "ok", message: `${r.latencyMs} ms` });
        } catch (e) {
          const err = toGeminiError(e);
          if (err.code === "aborted") return;
          warning = `Modèle avancé : ${reasonFor(err, advTarget)}`;
          warningError = err;
          update("adv", { status: "error", message: reasonFor(err, advTarget), error: err });
        }
      }

      const message = `Connexion réussie avec « ${mainInfo?.displayName ?? mainId} » (${mainId}) · ${latency} ms.`;
      setResult({ kind: "ok", message, warning, warningError });
      toast({
        tone: "success",
        title: "Connexion à Gemini réussie",
        body: `${mainInfo?.displayName ?? mainId} · ${latency} ms`,
      });
    } finally {
      if (testAbort.current === ctrl) setTesting(false);
    }
  };

  const firstWorkingAlt = probes.find((p) => p.role === "alt" && p.status === "ok")?.model;

  // Make sure the current choices are visible even if absent from the list.
  const withCurrent = (id: string) =>
    id && id !== SAME_AS_MAIN && !models.some((m) => m.id === id)
      ? [{ ...fallbackModels()[0], id, displayName: `${id} (non listé)` }, ...models]
      : models;
  const mainInfo = models.find((m) => m.id === main);
  const recommended = pickDefaultModel(models) ?? undefined;
  const advEffective = advanced === SAME_AS_MAIN || !advanced ? main : advanced;
  const hasKey = apiKey.length >= KEY_MIN_LENGTH;

  return (
    <Card>
      <CardHeader
        title="Clé API Gemini"
        subtitle="Utilisée pour lire tes stats et analyser tes vidéos avec Google Gemini."
        icon={<KeyRound className="size-5" />}
        action={
          <a
            href={GEMINI_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-accent hover:bg-accent/10"
          >
            Obtenir une clé <ExternalLink className="size-3.5" aria-hidden />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        }
      />
      <Field
        label="Clé API Gemini"
        htmlFor="key"
        hint="Stockée uniquement dans le localStorage de ce navigateur. Jamais envoyée ailleurs que chez Google."
      >
        <div className="relative">
          <Input
            id="key"
            type={show ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            placeholder="AIza…"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setResult(null);
              setSteps([]);
            }}
            className="pr-24 font-mono"
          />
          <div className="absolute top-0 right-0 flex">
            {apiKey && (
              <button
                type="button"
                onClick={() => {
                  setApiKey("");
                  setResult(null);
                  setSteps([]);
                }}
                className="grid size-11 place-items-center text-subtle hover:text-fg"
                aria-label="Effacer la clé"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="grid size-11 place-items-center text-subtle hover:text-fg"
              aria-label={show ? "Masquer la clé" : "Afficher la clé"}
              aria-pressed={show}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </Field>

      {/* Models */}
      <div className="mt-5 space-y-4 border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-fg">Modèles Gemini</p>
          {hasKey && (
            <Button
              variant="ghost"
              size="sm"
              icon={
                <RefreshCw
                  className={cn("size-4", listState.kind === "loading" && "animate-spin")}
                />
              }
              disabled={listState.kind === "loading"}
              onClick={() => refreshModels(apiKey).catch(() => undefined)}
            >
              Actualiser la liste
            </Button>
          )}
        </div>

        {!hasKey ? (
          <p className="text-sm text-muted">Saisis ta clé pour voir les modèles disponibles.</p>
        ) : (
          <>
            <div role="status" aria-live="polite">
              {listState.kind === "loading" && (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Recherche des
                  modèles disponibles…
                </p>
              )}
              {listState.kind === "ok" && (
                <p className="text-sm text-muted">
                  {models.length} modèle{models.length > 1 ? "s" : ""} compatible
                  {models.length > 1 ? "s" : ""} avec ta clé
                  {listState.source === "cache" ? " (liste mémorisée)" : ""}.
                </p>
              )}
              {listState.kind === "fallback" && (
                <p className="flex gap-2 rounded-xl border border-warning/30 bg-warning/8 p-3 text-sm text-fg">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <span>
                    Impossible de récupérer la liste des modèles : {listState.message} Liste par
                    défaut affichée, certains modèles peuvent ne pas être disponibles pour ta clé.
                    <ErrorDetails error={listState.error} className="mt-1" />
                  </span>
                </p>
              )}
            </div>

            {models.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Modèle"
                  htmlFor="model-main"
                  hint={
                    mainInfo?.inputTokenLimit
                      ? `Contexte : ${formatNumber(mainInfo.inputTokenLimit)} jetons`
                      : "Utilisé pour l’import des stats et les analyses."
                  }
                >
                  <Select id="model-main" value={main} onChange={(e) => chooseMain(e.target.value)}>
                    <ModelOptions models={withCurrent(main)} recommended={recommended} />
                  </Select>
                  {main && <PreviewBadge id={main} />}
                  {main && <VideoSupportLine id={main} />}
                </Field>
                <Field label="Modèle avancé (analyse approfondie)" optional htmlFor="model-adv">
                  <Select
                    id="model-adv"
                    value={advanced || SAME_AS_MAIN}
                    onChange={(e) => chooseAdvanced(e.target.value)}
                  >
                    <option value={SAME_AS_MAIN}>Identique au modèle principal</option>
                    <ModelOptions models={withCurrent(advanced)} />
                  </Select>
                  {advEffective && <PreviewBadge id={advEffective} />}
                  {advEffective && <VideoSupportLine id={advEffective} />}
                </Field>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 rounded-xl border border-line p-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <Shuffle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <div>
                  <label htmlFor="model-fallback" className="text-sm font-semibold text-fg">
                    Repli automatique sur un autre modèle
                  </label>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    Si le modèle choisi reste surchargé (503), limité (429) ou indisponible (404)
                    après 3 tentatives, ViralLens essaie jusqu’à {GEMINI_FALLBACK_MAX} autres
                    modèles de ta clé (Flash stables, puis préversions Flash, puis Pro) et t’indique
                    lequel a répondu.
                  </p>
                </div>
              </div>
              <Switch
                id="model-fallback"
                label="Repli automatique sur un autre modèle"
                checked={fallbackOn}
                onChange={(v) => {
                  setFallbackOn(v);
                  setFallbackEnabled(v);
                }}
              />
            </div>
            <p className="flex gap-2 rounded-xl border border-line bg-surface-2 p-3 text-xs leading-relaxed text-muted">
              <Film className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
              L’analyse vidéo nécessite un modèle Gemini multimodal. Indication approximative :
              Google ne publie pas les formats acceptés par modèle. Certains modèles, ou certaines
              clés de l’offre gratuite, peuvent refuser la vidéo (taille, durée ou quota).
            </p>
          </>
        )}
      </div>

      {/* Test */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button
          onClick={runTest}
          loading={testing}
          disabled={!hasKey}
          icon={<PlugZap className="size-4" />}
        >
          Tester la connexion
        </Button>
        {main && (
          <span className="text-xs text-subtle">
            Modèle testé : <code className="font-mono">{main}</code>
          </span>
        )}
      </div>
      {steps.length > 0 && (
        <ol className="mt-4 space-y-2" aria-label="Étapes du test">
          {steps.map((s) => (
            <li key={s.id} className="flex items-start gap-2.5 text-sm">
              {s.status === "running" ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-accent" aria-hidden />
              ) : s.status === "ok" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : s.status === "error" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden />
              )}
              <span
                className={cn(
                  s.status === "skipped" || s.status === "pending" ? "text-subtle" : "text-fg",
                )}
              >
                {s.label}
                {s.message && <span className="text-muted"> · {s.message}</span>}
                {s.status === "skipped" && <span className="text-subtle"> · non exécuté</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {probes.length > 1 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Résultats du test par modèle</caption>
            <thead className="bg-surface-2 text-xs text-subtle">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Modèle
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Résultat
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  Latence
                </th>
              </tr>
            </thead>
            <tbody>
              {probes.map((p) => {
                const best = p.model === firstWorkingAlt;
                return (
                  <tr
                    key={p.model}
                    className={cn(
                      "border-t border-line align-top",
                      best && "bg-success/8 ring-1 ring-success/30 ring-inset",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <code className="font-mono text-[13px] break-all text-fg">{p.model}</code>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.role === "main" && (
                          <Badge className="h-5 px-2 text-[11px]">actuel</Badge>
                        )}
                        {isPreview(p.model) && (
                          <Badge tone="warning" className="h-5 px-2 text-[11px]">
                            préversion
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {p.status === "running" ? (
                        <span className="inline-flex items-center gap-1.5 text-muted">
                          <Loader2 className="size-4 animate-spin text-accent" aria-hidden /> Test…
                        </span>
                      ) : p.status === "ok" ? (
                        <div className="space-y-2">
                          <span className="inline-flex items-center gap-1.5 font-medium text-success">
                            <CheckCircle2 className="size-4" aria-hidden /> Fonctionne
                          </span>
                          {best && (
                            <Button
                              size="sm"
                              onClick={() => {
                                chooseMain(p.model);
                                toast({
                                  tone: "success",
                                  title: "Modèle principal mis à jour",
                                  body: p.model,
                                });
                              }}
                            >
                              Utiliser ce modèle
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1.5 font-medium text-danger">
                            <AlertCircle className="size-4" aria-hidden />
                            Échec{p.error?.status ? ` · ${p.error.status}` : ""}
                            {p.error?.apiStatus ? ` ${p.error.apiStatus}` : ""}
                          </span>
                          {p.error && <ErrorDetails error={p.error} />}
                        </div>
                      )}
                    </td>
                    <td className="tabular px-3 py-2.5 text-right whitespace-nowrap text-muted">
                      {p.latencyMs !== undefined ? `${formatNumber(p.latencyMs)} ms` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {result?.kind === "ok" && (
        <div
          role="status"
          className="mt-4 space-y-2 rounded-xl border border-success/30 bg-success/8 p-3 text-sm text-fg"
        >
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {result.message}
          </p>
          {result.warning && (
            <p className="flex items-start gap-2 text-muted">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                {result.warning}
                {result.warningError && <ErrorDetails error={result.warningError} />}
              </span>
            </p>
          )}
        </div>
      )}
      {result?.kind === "error" && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/8 p-3 text-sm text-fg"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0">
            <p>{result.message}</p>
            {result.error && <ErrorDetails error={result.error} className="mt-1" />}
          </div>
        </div>
      )}
    </Card>
  );
}
