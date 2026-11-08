/**
 * ALL mock data for ViralLens lives in this file.
 * Replace each export with a real API call later (see `src/services/api.ts`).
 */
import type {
  ChatMessage,
  CompareResult,
  Kpi,
  OnboardingSlide,
  StudioStats,
  PatternsData,
  VideoReport,
  VideoSummary,
} from "@/types";

const img = (id: string, w = 480, h = 854) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

export const IMAGES = {
  tripodWoman: img("1759393852314-59dc00faeed3"),
  phoneWoman: img("1621184078811-1120e2f1fc9e"),
  tripod: img("1697649272441-be6e4a563e9b"),
  manPhone: img("1545081576-5b7e640c083a"),
  handPhone: img("1669255034447-92a04063c6b8"),
  bed1: img("1665327469792-cf91f5b8d74c"),
  bed2: img("1665327473229-b794f0085d6c"),
  bed3: img("1665327469486-c1d47eed44ae"),
  camera: img("1630797160666-38e8c5ba44c1"),
  tool: img("1630797160668-2164d9518103"),
  baking: img("1781635550867-d09bbd88a32a"),
  bread: img("1670842587871-326b95acbc8c"),
};

export const USER = {
  name: "Léa",
  handle: "@lea.cuisine",
  avatar: img("1621184078811-1120e2f1fc9e", 96, 96),
  niche: "Recettes rapides & lifestyle",
  channelHealth: 64,
  channelHealthDelta: 5,
};

export const VIDEOS: VideoSummary[] = [
  {
    id: "v2",
    title: "Je teste le pain viral de TikTok",
    thumbnail: IMAGES.bread,
    score: 38,
    views: 1842,
    retention: 22,
    durationSec: 34,
    publishedAt: "2025-05-14",
    niche: "Cuisine",
    hookType: "Présentation « Salut… »",
  },
  {
    id: "v1",
    title: "Pâtes crémeuses en 5 min (sans crème)",
    thumbnail: IMAGES.baking,
    score: 82,
    views: 248300,
    retention: 61,
    durationSec: 19,
    publishedAt: "2025-05-10",
    niche: "Cuisine",
    hookType: "Résultat d’abord",
  },
  {
    id: "v3",
    title: "3 erreurs que tout le monde fait avec le riz",
    thumbnail: IMAGES.handPhone,
    score: 76,
    views: 96400,
    retention: 54,
    durationSec: 23,
    publishedAt: "2025-05-06",
    niche: "Cuisine",
    hookType: "Liste / erreurs",
  },
  {
    id: "v4",
    title: "Mon setup pour filmer seule chez moi",
    thumbnail: IMAGES.tripodWoman,
    score: 58,
    views: 12100,
    retention: 41,
    durationSec: 41,
    publishedAt: "2025-05-02",
    niche: "Lifestyle",
    hookType: "Question",
  },
  {
    id: "v5",
    title: "Gâteau chocolat framboise sans four",
    thumbnail: IMAGES.tripod,
    score: 69,
    views: 41200,
    retention: 48,
    durationSec: 27,
    publishedAt: "2025-04-27",
    niche: "Cuisine",
    hookType: "Résultat d’abord",
  },
  {
    id: "v6",
    title: "Ce que je mange en une journée (budget 5 €)",
    thumbnail: IMAGES.bed1,
    score: 47,
    views: 6400,
    retention: 33,
    durationSec: 52,
    publishedAt: "2025-04-21",
    niche: "Lifestyle",
    hookType: "Présentation « Salut… »",
  },
  {
    id: "v7",
    title: "Storytime : mon pire date au resto",
    thumbnail: IMAGES.bed2,
    score: 63,
    views: 22800,
    retention: 45,
    durationSec: 38,
    publishedAt: "2025-04-15",
    niche: "Storytime",
    hookType: "Storytime",
  },
  {
    id: "v8",
    title: "Vlog : 24 h à Lyon entre copines",
    thumbnail: IMAGES.camera,
    score: 34,
    views: 2100,
    retention: 19,
    durationSec: 58,
    publishedAt: "2025-04-08",
    niche: "Lifestyle",
    hookType: "Présentation « Salut… »",
  },
];

export const NICHES = ["Cuisine", "Lifestyle", "Storytime"];

export const KPIS: Kpi[] = [
  {
    id: "views",
    label: "Vues médianes",
    value: "12,4",
    unit: "k",
    delta: 18,
    deltaLabel: "+18 %",
    hint: "vs 30 jours précédents",
    spark: [6, 7, 5, 9, 8, 11, 12],
  },
  {
    id: "retention",
    label: "Rétention médiane",
    value: "38",
    unit: "%",
    delta: -4,
    deltaLabel: "−4 pts",
    hint: "Durée vue / durée totale",
    spark: [44, 42, 43, 40, 41, 39, 38],
  },
  {
    id: "share",
    label: "Taux de partage",
    value: "1,9",
    unit: "%",
    delta: 0.3,
    deltaLabel: "+0,3 pt",
    hint: "Partages / vues",
    spark: [1.2, 1.4, 1.3, 1.6, 1.5, 1.8, 1.9],
  },
  {
    id: "hook",
    label: "Score d’accroche",
    value: "57",
    unit: "/100",
    delta: 6,
    deltaLabel: "+6",
    hint: "Moyenne des 3 premières s",
    spark: [44, 48, 47, 50, 52, 55, 57],
  },
];

const retentionCurve = [
  100, 81, 68, 58, 55, 52, 50, 48, 47, 46, 45, 41, 36, 33, 31, 30, 29, 29, 28, 28, 27, 27, 26, 26,
  25, 25, 25, 24, 24, 23, 23, 22, 22, 21, 21,
];

export const REPORT: VideoReport = {
  videoId: "v2",
  durationSec: 34,
  globalScore: 38,
  verdict: "Le résultat arrive trop tard : 42 % des gens partent avant de voir le pain.",
  confidence: "medium",
  dropOffAt: 11,
  retention: retentionCurve.map((pct, t) => ({ t, pct })),
  diagnoses: [
    {
      id: "d1",
      title: "Accroche trop lente : le pain n’apparaît qu’à 0:09",
      description:
        "Les 3 premières secondes montrent un plan large statique avec « Salut tout le monde ». Rien ne promet un résultat.",
      probability: 86,
      severity: "high",
      evidence: [
        { kind: "metric", label: "42 % partent avant 3 s" },
        { kind: "timestamp", label: "0:00 Plan large", time: 0 },
        { kind: "timestamp", label: "0:09 Pain visible", time: 9 },
      ],
    },
    {
      id: "d2",
      title: "Pétrissage de 7 s sans texte ni coupe",
      description: "Plan unique de 0:11 à 0:18. C’est là que la courbe chute le plus fort.",
      probability: 72,
      severity: "high",
      evidence: [
        { kind: "timestamp", label: "0:11 Chute −19 pts", time: 11 },
        { kind: "metric", label: "0 coupe sur 7 s" },
      ],
    },
    {
      id: "d3",
      title: "Musique trop forte, voix difficile à suivre",
      description: "La musique couvre la voix off dès 0:05 : on perd l’explication.",
      probability: 54,
      severity: "medium",
      evidence: [
        { kind: "timestamp", label: "0:05 Musique +12 dB", time: 5 },
        { kind: "metric", label: "Son : 0,4 % du trafic" },
      ],
    },
    {
      id: "d4",
      title: "Légende sans mot-clé recherchable",
      description:
        "« Pain viral » n’est pas une requête fréquente. « Pain sans pétrissage » l’est 14 fois plus.",
      probability: 47,
      severity: "medium",
      evidence: [
        { kind: "metric", label: "Recherche : 1,1 %" },
        { kind: "metric", label: "0 mot-clé dans la légende" },
      ],
    },
    {
      id: "d5",
      title: "Fin nette, pas d’effet boucle",
      description: "La vidéo s’arrête sur un plan neutre : aucune raison de revoir.",
      probability: 31,
      severity: "low",
      evidence: [
        { kind: "timestamp", label: "0:32 Dernier plan", time: 32 },
        { kind: "metric", label: "Complétion 9 %" },
      ],
    },
  ],
  timeline: {
    scenes: [
      { start: 0, end: 3, label: "Plan large, face caméra", thumbnail: IMAGES.tripodWoman },
      { start: 3, end: 9, label: "Ingrédients", thumbnail: IMAGES.baking },
      { start: 9, end: 11, label: "Aperçu pain fini", thumbnail: IMAGES.bread },
      { start: 11, end: 18, label: "Pétrissage", thumbnail: IMAGES.handPhone },
      { start: 18, end: 25, label: "Cuisson", thumbnail: IMAGES.tripod },
      { start: 25, end: 34, label: "Dégustation", thumbnail: IMAGES.phoneWoman },
    ],
    overlays: [
      { start: 0, end: 3, text: "Je teste le pain viral" },
      { start: 18, end: 21, text: "45 min plus tard…" },
      { start: 25, end: 30, text: "Verdict ?" },
    ],
    audio: [
      { t: 0, label: "Voix off" },
      { t: 5, label: "Musique forte" },
      { t: 18, label: "Four" },
      { t: 25, label: "ASMR croûte" },
    ],
    cuts: [3, 9, 11, 18, 21, 25, 29],
  },
  subScores: [
    { key: "hook", label: "Hook", score: 31, explanation: "Aucune promesse visuelle avant 0:09." },
    {
      key: "pacing",
      label: "Rythme",
      score: 44,
      explanation: "2,1 coupes / 10 s, un temps mort de 7 s.",
    },
    {
      key: "clarity",
      label: "Clarté",
      score: 68,
      explanation: "Étapes compréhensibles, ordre logique.",
    },
    {
      key: "emotion",
      label: "Émotion",
      score: 52,
      explanation: "Belle réaction à la dégustation, mais tardive.",
    },
    {
      key: "shareability",
      label: "Partageabilité",
      score: 39,
      explanation: "Pas d’astuce à envoyer à un ami.",
    },
    {
      key: "seo",
      label: "Légende/SEO",
      score: 28,
      explanation: "Hashtags génériques, aucun mot-clé.",
    },
  ],
  hookFrames: [
    {
      t: "0,0 s",
      sees: "Plan large de la cuisine, Léa face caméra",
      hears: "« Salut tout le monde, aujourd’hui… »",
    },
    { t: "1,0 s", sees: "Même plan, aucun mouvement", hears: "« …on va tester une recette que… »" },
    {
      t: "2,0 s",
      sees: "Petit texte « Je teste le pain viral »",
      hears: "La musique démarre et couvre la voix",
    },
    { t: "3,0 s", sees: "Coupe vers les ingrédients", hears: "« …j’ai vue partout. »" },
  ],
  hookProposals: [
    {
      type: "Résultat d’abord",
      text: "Le pain le plus croustillant que j’ai jamais fait… avec 4 ingrédients.",
      visual: "Gros plan sur la croûte qui craque, son ASMR fort.",
    },
    {
      type: "Curiosité",
      text: "TikTok m’a menti sur ce pain ? Je vérifie.",
      visual: "Ton visage sceptique + le pain en main.",
    },
    {
      type: "Problème / promesse",
      text: "Si tu rates toujours ton pain, c’est à cause de cette étape.",
      visual: "Pâte qui colle aux doigts, texte rouge.",
    },
  ],
  actions: [
    {
      id: "a1",
      title: "Ouvrir sur le plan de la croûte qui craque",
      detail: "Déplace 0:09–0:11 au tout début.",
      impact: "fort",
      effort: "faible",
    },
    {
      id: "a2",
      title: "Accélérer le pétrissage (x4, 2 s max)",
      detail: "Supprime le temps mort de 0:11 à 0:18.",
      impact: "fort",
      effort: "faible",
    },
    {
      id: "a3",
      title: "Un texte à l’écran toutes les 3–4 s",
      detail: "Gros, centré, dans la zone sûre.",
      impact: "fort",
      effort: "moyen",
    },
    {
      id: "a4",
      title: "Baisser la musique de −12 dB sous la voix",
      detail: "La voix doit rester au premier plan.",
      impact: "moyen",
      effort: "faible",
    },
    {
      id: "a5",
      title: "Réécrire la légende avec « pain sans pétrissage »",
      detail: "Voir l’optimiseur plus bas.",
      impact: "moyen",
      effort: "faible",
    },
    {
      id: "a6",
      title: "Ajouter un son tendance à 10 % du volume",
      detail: "Débloque le trafic « Son ».",
      impact: "moyen",
      effort: "moyen",
    },
    {
      id: "a7",
      title: "Finir sur le premier croquant pour boucler",
      detail: "Le dernier plan rappelle le premier.",
      impact: "faible",
      effort: "moyen",
    },
  ],
  caption: {
    current: "Je teste le pain viral #pain #recette #fyp #pourtoi",
    suggested:
      "Pain croustillant sans pétrissage : 4 ingrédients, 0 machine. Tu le testerais ? Recette complète en commentaire.",
    hashtags: ["#painmaison", "#recettefacile", "#sanspetrissage", "#boulangeriemaison"],
    keywords: ["pain sans pétrissage", "pain maison facile", "pain croustillant", "pain cocotte"],
  },
  editPlan: [
    {
      t: 0,
      type: "move",
      title: "Déplacer l’aperçu du pain au début",
      detail: "Plan 0:09–0:11 → 0:00. Son de croûte en avant.",
    },
    {
      t: 2,
      type: "text",
      title: "Ajouter « 4 ingrédients, 0 pétrissage »",
      detail: "Texte gros, haut-centre, 2 s.",
    },
    { t: 11, type: "cut", title: "Couper 0:11–0:16", detail: "Garder 1 s en accéléré x4." },
    {
      t: 18,
      type: "zoom",
      title: "Zoom sur la pâte levée",
      detail: "Punch-in 120 % pour relancer l’attention.",
    },
    {
      t: 25,
      type: "audio",
      title: "Monter le son ASMR",
      detail: "Le croustillant doit s’entendre.",
    },
    {
      t: 32,
      type: "loop",
      title: "Finir sur le premier croquant",
      detail: "Crée une boucle avec l’ouverture.",
    },
  ],
};

export const SAMPLE_STUDIO_PASTE = `Vue d'ensemble
Vues de la vidéo 1 842
Nombre de J'aime 96
Commentaires 7
Partages 3
Enregistrements 21
Durée de visionnage moyenne 6,1 s
A regardé la vidéo en entier 9 %
Nouveaux followers 2
Sources de trafic
Pour toi 71,2 %
Profil personnel 14,6 %
Recherche 1,1 %
Abonnements 12,7 %
Son 0,4 %
Requêtes de recherche : pain viral tiktok, pain facile
Publiée le 14 mai 2025 18:42 · Durée 0:34`;

export const PARSED_STATS: StudioStats = {
  caption: "Je teste le pain viral",
  hashtags: ["#pain", "#recette", "#fyp", "#pourtoi"],
  publishDate: "2025-05-14T18:42",
  durationSec: 34,
  views: 1842,
  likes: 96,
  comments: 7,
  shares: 3,
  saves: 21,
  avgWatchTimeSec: 6.1,
  completionRatePct: 9,
  newFollowers: 2,
  trafficSources: { forYou: 71.2, profile: 14.6, search: 1.1, following: 12.7, sound: 0.4 },
  searchQueries: ["pain viral tiktok", "pain facile"],
  retentionDropSec: 11,
  dataStatus: "ok",
};

export const ANALYSIS_STEPS = [
  { label: "Lecture de la vidéo", detail: "Découpage en scènes, détection des coupes et du texte" },
  { label: "Analyse de l’accroche", detail: "Image et son des 3 premières secondes" },
  { label: "Lecture des stats", detail: "Rétention, trafic, engagement" },
  { label: "Diagnostic", detail: "Croisement vidéo × stats, plan d’action" },
];

export const COMPARE: CompareResult = {
  other: {
    title: "Pain croustillant en 3 étapes",
    creator: "@boulange.maison",
    thumbnail: IMAGES.baking,
    durationSec: 22,
    stats: { views: 412000, likes: 38100, comments: 612, shares: 4300 },
  },
  axes: ["Hook", "Rythme", "Clarté", "Émotion", "Partage", "SEO"],
  mineScores: [31, 44, 68, 52, 39, 28],
  theirScores: [88, 79, 64, 70, 81, 66],
  rows: [
    {
      aspect: "Accroche",
      mine: "Plan large + « Salut tout le monde »",
      theirs: "Gros plan croûte qui craque",
      winner: "theirs",
    },
    {
      aspect: "Première seconde",
      mine: "Visage statique, pas de texte",
      theirs: "Son ASMR + « 3 ingrédients »",
      winner: "theirs",
    },
    { aspect: "Rythme (coupes / 10 s)", mine: "2,1", theirs: "5,8", winner: "theirs" },
    {
      aspect: "Texte à l’écran",
      mine: "3 textes, petits",
      theirs: "9 textes, gros, centrés",
      winner: "theirs",
    },
    {
      aspect: "Audio / musique",
      mine: "Musique couvre la voix",
      theirs: "Son tendance à 10 %, voix claire",
      winner: "theirs",
    },
    {
      aspect: "Structure",
      mine: "Chronologique",
      theirs: "Résultat → méthode → résultat",
      winner: "theirs",
    },
    {
      aspect: "Clarté des étapes",
      mine: "Explications détaillées",
      theirs: "Étapes implicites",
      winner: "mine",
    },
    { aspect: "CTA", mine: "Aucun", theirs: "« Enregistre pour plus tard »", winner: "theirs" },
    {
      aspect: "Fin / boucle",
      mine: "Fin nette",
      theirs: "Dernier plan = premier plan",
      winner: "theirs",
    },
  ],
  theyDoBetter: [
    "Montre le résultat dans la première seconde, avant toute explication.",
    "Coupe presque 3 fois plus souvent : aucun plan ne dépasse 2 s.",
    "Demande d’enregistrer : 4,1 % de saves contre 1,1 % chez toi.",
  ],
  youDoBetter: [
    "Ton visage et ta voix créent un vrai lien (commentaires plus personnels).",
    "Tes étapes sont plus claires : Clarté 68 vs 64.",
    "Lumière naturelle chaleureuse, image plus authentique.",
  ],
  inspiration: [
    "Teste une structure « résultat → méthode → résultat » avec ta propre recette.",
    "Garde ton visage, mais ouvre sur ton plat avant de parler.",
    "Ajoute ton propre CTA, par ex. « Enregistre pour ton prochain brunch ».",
  ],
};

export const PATTERNS: PatternsData = {
  minVideos: 5,
  scatter: [
    ...VIDEOS.map((v) => ({
      durationSec: v.durationSec,
      views: v.views,
      label: v.title,
      group: (v.score >= 70 ? "top" : v.score < 50 ? "flop" : "mid") as "top" | "flop" | "mid",
    })),
    { durationSec: 16, views: 132000, label: "Omelette soufflée", group: "top" },
    { durationSec: 21, views: 74000, label: "Astuce avocat", group: "top" },
    { durationSec: 45, views: 4100, label: "Haul courses", group: "flop" },
    { durationSec: 62, views: 1500, label: "Q&A abonnés", group: "flop" },
    { durationSec: 30, views: 18000, label: "Batch cooking", group: "mid" },
    { durationSec: 25, views: 33000, label: "Cookies 3 ingrédients", group: "mid" },
  ],
  heatmapDays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  heatmapSlots: ["6h", "9h", "12h", "15h", "18h", "21h"],
  heatmap: [
    [2, 4, 9, 6, 22, 18],
    [1, 3, 8, 5, 26, 21],
    [2, 5, 11, 7, 31, 24],
    [1, 4, 10, 6, 28, 19],
    [2, 3, 7, 8, 19, 14],
    [3, 9, 14, 12, 16, 11],
    [4, 11, 17, 13, 24, 20],
  ],
  hookTypes: [
    { type: "Résultat d’abord", avgViews: 84300, count: 6 },
    { type: "Liste / erreurs", avgViews: 67100, count: 4 },
    { type: "Question", avgViews: 41200, count: 5 },
    { type: "Storytime", avgViews: 22800, count: 3 },
    { type: "Présentation « Salut… »", avgViews: 3100, count: 7 },
  ],
  insights: [
    {
      stat: "18–25 s",
      title: "Tes tops sont courts",
      detail: "Tes 5 meilleures vidéos font 21 s en moyenne. Tes flops dépassent 40 s.",
    },
    {
      stat: "×2,4",
      title: "Publie entre 18 h et 21 h",
      detail: "Mardi–jeudi soir, tes vues médianes sont 2,4 fois plus élevées.",
    },
    {
      stat: "×27",
      title: "Ouvre sur le résultat",
      detail: "« Résultat d’abord » fait 27 fois plus de vues que « Salut tout le monde ».",
    },
  ],
};

export const CHAT_SUGGESTIONS = [
  "Réécris mon accroche en 5 mots",
  "Quelle action faire en premier ?",
  "Pourquoi si peu de partages ?",
];

export const CHAT_INITIAL: ChatMessage[] = [
  {
    id: "m0",
    role: "coach",
    text: "Salut Léa ! J’ai analysé « Je teste le pain viral ». Le problème n°1 est l’accroche : tu montres le pain trop tard. Pose-moi une question sur cette vidéo.",
  },
];

export const CHAT_REPLIES: Record<string, string> = {
  "Réécris mon accroche en 5 mots":
    "« Ce pain craque. 4 ingrédients. » Montre la croûte en gros plan pendant que tu le dis, et commence directement par le son du couteau.",
  "Quelle action faire en premier ?":
    "Déplace le plan du pain fini (0:09) au tout début. C’est 2 minutes de montage et ça cible 42 % de tes départs.",
  "Pourquoi si peu de partages ?":
    "Ta vidéo est un test, pas une astuce. Les gens partagent ce qui aide un ami : ajoute « l’erreur qui rate 90 % des pains » pour donner une raison d’envoyer.",
};
export const CHAT_FALLBACK =
  "Bonne question. D’après tes stats, le plus gros levier reste les 3 premières secondes. Veux-tu que je te propose un nouveau montage seconde par seconde ?";

export const ONBOARDING: OnboardingSlide[] = [
  {
    title: "Comprends pourquoi ta vidéo ne décolle pas",
    body: "Importe ta vidéo et tes stats TikTok Studio. ViralLens repère précisément où et pourquoi les gens décrochent.",
    image: IMAGES.tripodWoman,
  },
  {
    title: "Un plan d’action, pas juste des chiffres",
    body: "Nouvelles accroches, plan de remontage, légende optimisée : tu sais exactement quoi changer.",
    image: IMAGES.handPhone,
  },
  {
    title: "Apprends des meilleurs, sans copier",
    body: "Compare-toi à une autre vidéo pour comprendre ses mécaniques et les adapter à ton style.",
    image: IMAGES.camera,
  },
];
