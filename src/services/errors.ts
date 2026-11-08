export type GeminiErrorCode =
  | "missing_key"
  | "invalid_key"
  | "permission_denied"
  | "quota_exceeded"
  | "free_tier_limit"
  | "rate_limited"
  | "overloaded"
  | "network"
  | "timeout"
  | "aborted"
  | "model_not_found"
  | "bad_request"
  | "safety_blocked"
  | "invalid_json"
  | "server"
  | "empty_input"
  | "unknown";

const MESSAGES: Record<GeminiErrorCode, string> = {
  missing_key: "Aucune clé API Gemini. Ajoute-la dans Réglages.",
  invalid_key: "Clé API invalide ou désactivée. Vérifie-la sur Google AI Studio.",
  permission_denied:
    "Accès refusé (403) : cette clé n’a pas la permission d’utiliser l’API Gemini, ou ta région n’est pas prise en charge.",
  quota_exceeded:
    "Quota Gemini dépassé (429). Attends la réinitialisation ou active la facturation sur Google AI Studio.",
  rate_limited:
    "Limite de débit atteinte (429) : trop de requêtes en peu de temps. Patiente quelques secondes puis réessaie.",
  overloaded:
    "Le modèle est surchargé chez Google (503). Ce n’est pas un problème de clé : réessaie dans un instant ou choisis un autre modèle.",
  network:
    "Impossible de joindre Google (hors ligne, pare-feu, VPN ou bloqueur de pub). Vérifie ta connexion.",
  timeout: "Gemini met trop de temps à répondre. Réessaie dans un instant.",
  aborted: "Requête annulée.",
  model_not_found:
    "Ce modèle n’est pas disponible pour cette clé (404). Choisis-en un autre dans Réglages.",
  free_tier_limit:
    "Limite de l’offre gratuite atteinte pour ce modèle (429). Attends la réinitialisation, choisis un autre modèle ou active la facturation.",
  bad_request:
    "Requête invalide (400) : Gemini a refusé les données envoyées (paramètre non pris en charge, contenu trop volumineux ou format invalide).",
  safety_blocked: "Contenu bloqué par les filtres de sécurité de Gemini.",
  invalid_json: "La réponse de Gemini était illisible, même après une seconde tentative. Réessaie.",
  server: "Erreur interne chez Google (5xx). Réessaie dans quelques minutes.",
  empty_input: "Colle le texte de TikTok Studio ou ajoute au moins une capture d’écran.",
  unknown: "Erreur inattendue avec Gemini.",
};

export type QuotaScope = "day" | "minute" | "unknown";

export interface GeminiErrorOpts {
  status?: number;
  detail?: string;
  retryable?: boolean;
  model?: string;
  message?: string;
  /** Google's error.status, e.g. RESOURCE_EXHAUSTED, UNAVAILABLE. */
  apiStatus?: string;
  /** Google's raw error.message. */
  apiMessage?: string;
  /** Server-suggested wait (Retry-After header or RetryInfo.retryDelay). */
  retryAfterMs?: number;
  quotaScope?: QuotaScope;
  quotaIds?: string[];
}

/** Typed error thrown by every Gemini-backed service. `message` is user-facing French text. */
export class GeminiError extends Error {
  readonly code: GeminiErrorCode;
  readonly status?: number;
  readonly retryable: boolean;
  readonly detail?: string;
  /** Model id involved, when relevant. */
  model?: string;
  readonly apiStatus?: string;
  readonly apiMessage?: string;
  readonly retryAfterMs?: number;
  readonly quotaScope?: QuotaScope;
  readonly quotaIds?: string[];
  /** Number of attempts made on this model before giving up. */
  attempts?: number;
  /** Models tried (in order) when automatic fallback was used. */
  triedModels?: { model: string; status?: number; apiStatus?: string }[];

  constructor(code: GeminiErrorCode, opts: GeminiErrorOpts = {}) {
    super(opts.message ?? MESSAGES[code]);
    this.name = "GeminiError";
    this.code = code;
    this.status = opts.status;
    this.detail = opts.detail;
    this.retryable = opts.retryable ?? false;
    this.model = opts.model;
    this.apiStatus = opts.apiStatus;
    this.apiMessage = opts.apiMessage;
    this.retryAfterMs = opts.retryAfterMs;
    this.quotaScope = opts.quotaScope;
    this.quotaIds = opts.quotaIds;
  }
}

export function toGeminiError(e: unknown): GeminiError {
  if (e instanceof GeminiError) return e;
  return new GeminiError("unknown", { detail: e instanceof Error ? e.message : String(e) });
}

/** User-facing message for any thrown value. */
export function errorMessage(e: unknown): string {
  return toGeminiError(e).message;
}

/** Key/value rows for the "Détails techniques" disclosure. */
export function technicalRows(e: GeminiError): [string, string][] {
  const rows: [string, string][] = [];
  rows.push(["Code HTTP", e.status ? String(e.status) : "aucun (pas de réponse HTTP)"]);
  if (e.apiStatus) rows.push(["Statut API", e.apiStatus]);
  if (e.model) rows.push(["Modèle", e.model]);
  if (e.attempts && e.attempts > 1) rows.push(["Tentatives", String(e.attempts)]);
  if (e.quotaScope && e.quotaScope !== "unknown")
    rows.push(["Type de limite", e.quotaScope === "day" ? "quota journalier" : "par minute"]);
  if (e.quotaIds?.length) rows.push(["Quota", e.quotaIds.join(", ")]);
  if (e.retryAfterMs) rows.push(["Délai suggéré", `${Math.round(e.retryAfterMs / 1000)} s`]);
  if (e.triedModels?.length)
    rows.push([
      "Modèles essayés",
      e.triedModels
        .map((t) => `${t.model} (${[t.status, t.apiStatus].filter(Boolean).join(" ") || "?"})`)
        .join(" → "),
    ]);
  rows.push(["Code interne", e.code]);
  if (e.apiMessage) rows.push(["Message Google", e.apiMessage]);
  else if (e.detail) rows.push(["Détail", e.detail]);
  return rows;
}

/** Plain-text version of technicalRows (for copy to clipboard). */
export function technicalText(e: GeminiError): string {
  return technicalRows(e)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}
