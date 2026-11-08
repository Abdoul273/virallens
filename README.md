# 🎬 ViralLens — Coach IA pour Créateurs Vidéo

[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-API-8e75ff.svg)](https://aistudio.google.com/)

**ViralLens** est un assistant et coach IA pour créateurs de formats courts (**TikTok, Instagram Reels, YouTube Shorts**). Il analyse vos performances réelles, identifie les points de rupture dans la courbe de rétention et formule des conseils de montage chirurgicaux pour maximiser l'engagement et la viralité.

L'application est **100% côté client (SPA)** : aucune donnée personnelle ni clé API ne transite par un serveur intermédiaire.

---

## ✨ Fonctionnalités clés

- 📊 **Analyse de Rétention & Drop-off** : Visualisation précise de la courbe de maintien de l'audience, détection automatique des secondes critiques de décrochage.
- 🪝 **Audit du Hook** : Évaluation du pouvoir d'arrêt des 3 premières secondes (visuel, sonore, texte à l'écran).
- 💬 **Coach IA Multimodal** : Chat interactif basé sur Google Gemini pour générer des hooks alternatifs, réécrire les scripts ou ajuster le rythme de cut.
- 📸 **Import TikTok Studio** : Analyse automatique de vos captures d'écran de statistiques ou saisie directe des métriques.
- ⚖️ **Comparateur Vidéo A/B** : Analyse comparative entre deux contenus pour comprendre ce qui fonctionne le mieux sur votre audience.
- 🧪 **Mode Démo Immédiat** : Testez l'intégralité de l'interface et des graphiques sans configuration préalable grâce à des jeux de données d'exemple réalistes.
- 🔒 **Confidentialité Totale** : Vos analyses restent dans votre navigateur via **IndexedDB** ; votre clé Gemini est conservée uniquement dans votre `localStorage`.
- 🌓 **Interface Moderne** : Thèmes sombre et clair, graphiques SVG dynamiques conçus sur-mesure, navigation fluide.

---

## 🚀 Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v20 ou v22+)
- [pnpm](https://pnpm.io/) ou `npm`

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/Abdoul273/virallens.git
cd virallens

# 2. Installer les dépendances
npm install
# ou avec pnpm :
# pnpm install

# 3. Lancer le serveur de développement
npm run dev
# ou avec pnpm :
# pnpm dev
```

Ouvrez ensuite votre navigateur sur `http://localhost:8443` (ou l'URL affichée par Vite).

---

## 🔑 Activer l'analyse IA avec Gemini

1. Récupérez une clé gratuite sur [Google AI Studio](https://aistudio.google.com/).
2. Dans **ViralLens**, cliquez sur l'onglet **Réglages** (icône d'engrenage).
3. Renseignez votre clé dans la section **Clé API Gemini**.
4. Désactivez le **Mode Démo** pour analyser vos propres vidéos et statistiques réelles.

L'application sélectionne automatiquement le meilleur modèle disponible (ex. *Gemini 2.5 Flash*) et gère la tolérance aux pannes.

---

## 🛠️ Stack technique

- **Frontend** : React 19, TypeScript
- **Styling** : Tailwind CSS v4 (`@tailwindcss/vite`)
- **Build tool** : Vite 8
- **Composants d'icônes** : `lucide-react`
- **Stockage local** : IndexedDB (`viralLens`) + `localStorage`
- **IA** : Client REST Google Gemini natif avec gestion automatique du fallback

---

## 📦 Scripts disponibles

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Compile l'application pour la production dans `/dist` |
| `npm run preview` | Prévisualise localement le build de production |
| `npm run format` | Vérifie et formate le code avec `oxfmt` |

---

## 📄 Licence

Ce projet est distribué sous licence MIT. Libre d'utilisation et d'adaptation.
