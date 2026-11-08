# ViralLens — notes de passation

Prototype React 19 + TypeScript + Tailwind v4 (Vite). Toute l'interface est en français.

## Structure

- `src/types.ts` : types du domaine (forme attendue des réponses backend).
- `src/data/mockData.ts` : **toutes** les données mock (un seul fichier).
- `src/services/api.ts` : couche service asynchrone mockée. Remplacer le corps de chaque fonction par un vrai appel (Gemini avec la clé enregistrée dans `localStorage['vl.geminiKey']`) en gardant les mêmes signatures :
  `parseStudioStats`, `analyzeVideo`, `compareVideos`, `askCoach`, `testApiKey`.
- `src/app/AppContext.tsx` : navigation par état (`screen`), thème, flags persistés, état d'aperçu.
- `src/components/ui/*` : primitives (Button, Card, ScoreRing, MetricCard, Chip, Badge, Stepper, Dropzone, Field, Skeleton, Toast, Modal, Segmented, Checkbox, Thumb, StateViews).
- `src/components/charts/*` : graphiques SVG faits main (rétention, radar, nuage de points, heatmap, barres, sparkline).
- `src/components/report/*` : sections du rapport vidéo + chat coach.
- `src/screens/*` : un fichier par écran.

## Prototype

- Le bouton « État » de l'en-tête affiche chaque écran en Succès / Chargement / Vide / Erreur.
- Réglages → « Supprimer toutes les données » affiche l'état vide global ; « Restaurer les données de démo » le remplit à nouveau.
- Les tokens de thème sont des variables CSS dans `src/index.css` (`:root` = sombre, `.light` = clair).

## Phase 1 — Gemini réel + import des stats

- `src/config.ts` : délais, nombre de nouvelles tentatives, limites d'import, clés de stockage, et `GEMINI_FALLBACK_MODELS` (utilisée uniquement si ListModels échoue).
- `src/services/geminiService.ts` : client REST (sans SDK). Délai d'expiration par requête, nouvelles tentatives avec délai croissant sur 429/5xx (respecte `RetryInfo`), sortie JSON structurée + une tentative de réparation du JSON, `testConnection()`.
- `src/services/errors.ts` : `GeminiError` typée (`code`, message en français).
- `src/services/parsingService.ts` : `extractStudioStats()` (texte et/ou 4 captures → `StudioStats`), schéma JSON, normalisation défensive (champ inconnu = `null`).
- `src/services/db.ts` : IndexedDB `viralLens` / store `analyses` (`SavedAnalysis`).
- `src/lib/metrics.ts` : taux calculés localement (rétention, engagement, partage, enregistrement).
- Mode démo (Réglages) : ON = données mock (comportement d'origine), OFF = données réelles uniquement.
- La clé API est stockée uniquement dans `localStorage['vl.geminiKey']`. Elle n'est jamais écrite dans le code source.

## Choix du modèle (aucun modèle codé en dur)

- `src/services/modelService.ts` : `listModels()` (ListModels avec pagination, uniquement les modèles `generateContent`), `pickDefaultModel()` (Flash le plus récent hors lite/image/tts/live/embedding/thinking-exp), `pickAdvancedModel()` (Pro le plus récent, sinon le modèle principal), `videoSupport()` (estimation approximative).
- **`getModel("main" | "advanced")`** : la seule fonction à utiliser pour tout appel Gemini (stats, analyse vidéo, comparaison, chat). Choix stockés dans `localStorage` (`vl.model`, `vl.modelAdvanced`).
- `src/services/http.ts` : `fetch` commun (délai d'expiration, erreurs typées, détection « modèle indisponible » et « limite de l'offre gratuite »).
- Tout échec « modèle introuvable » émet l'événement `vl:model-unavailable`. `ModelErrorToaster` affiche alors une notification avec un bouton « Ouvrir les Réglages ».
- `thinkingConfig` n'est envoyé qu'aux modèles `gemini-2.5-flash*`. Si un modèle le refuse, l'appel est relancé sans.
