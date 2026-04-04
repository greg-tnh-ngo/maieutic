# Maieutic v2 — Espace de Pensée Dialectique

## Ce que c'est
Un outil de cartographie de pensée non-linéaire. L'IA n'assiste pas — elle perturbe.
Elle intervient sporadiquement dans un espace graphique pour révéler des absences,
des tensions non résolues, des connexions inattendues. Elle ne génère jamais de contenu.

## Architecture en trois actes
1. INTAKE — lecture silencieuse de sources externes (texte collé ou MCP), extraction des absences
2. EXPLORATION — terrain graphique interactif, interventions IA sporadiques, modes inférés
3. SYNTHÈSE — lecture du terrain, export préservant l'incomplétude productive

## Stack technique
- Next.js App Router, TypeScript, Tailwind
- ReactFlow pour le terrain (objet principal, pas visualisation secondaire)
- Claude API claude-sonnet-4-6 (désactivé en mode démo)
- Supabase pour persistance (optionnel, ne pas bloquer sur ça)

## MODE DÉMO — CRITIQUE
Si ANTHROPIC_API_KEY est absent ou vide dans .env.local :
- Activer automatiquement le mode démo
- Aucun appel API Claude
- Toutes les interventions IA sont scriptées et pré-écrites
- Un bandeau très discret indique "mode démo" en bas à droite
- L'expérience complète doit fonctionner sans aucune clé API

## Structure de fichiers cible
app/
  page.tsx              — shell principal, détection mode démo
  layout.tsx            — layout global
  globals.css           — design system
  components/
    IntakeZone.tsx      — zone de collage texte existant (acte 1)
    TerrainCanvas.tsx   — terrain ReactFlow principal (acte 2)
    NodeTypes.tsx       — types de nœuds custom (concept/tension/ghost/absence)
    SynthesisPanel.tsx  — panel de synthèse et export (acte 3)
    DemoController.tsx  — orchestrateur du mode démo
  api/
    intake/route.ts     — analyse texte entrant, extrait absences
    intervention/route.ts — génère intervention IA dans le terrain
    synthesis/route.ts  — lecture finale du terrain, suggestions export
  lib/
    demo-script.ts      — script complet du mode démo
    terrain-utils.ts    — utilitaires ReactFlow
    mode-detector.ts    — détecte si mode démo ou live

## Design system (identique à v1)
- Background: #0d0d0f
- Text primaire: #e8e8f0
- Nœuds utilisateur: blanc, opaque
- Nœuds IA (absence/suggestion): #3a3a6a, pointillés, légèrement transparents
- Tension non résolue: #8b2020
- Font questions: Georgia serif
- Font interface: system-ui
- Aucun gradient, aucun glassmorphisme

## Types de nœuds
- concept: idée posée par l'utilisateur, blanc plein
- tension: contradiction identifiée, bordure #8b2020
- ghost: nœud suggéré par l'IA, pointillés #3a3a6a
- absence: zone vide nommée par l'IA, très transparent

## Types d'arêtes
- solid: connexion établie par l'utilisateur
- dotted: connexion suggérée par l'IA
- contradiction: arête rouge #8b2020 entre deux nœuds en tension

## Comportement du terrain
- Double niveau: macro (vue d'ensemble) / micro (zoom sur cluster)
- Au zoom micro: le reste du terrain s'estompe à 20% d'opacité
- Nœuds déplaçables, connectables manuellement par drag
- L'IA ne parle pas dans une boîte de texte — elle écrit dans le terrain
- Les interventions IA apparaissent comme nouveaux nœuds ghost ou nouvelles arêtes
- Une petite note flotte au survol des nœuds ghost (pas d'affichage permanent)

## Modes inférés (jamais affichés à l'utilisateur)
- focus: utilisateur reste longtemps sur un cluster → réduire interventions périphériques
- exploration: déplacements larges → augmenter suggestions en périphérie
- consolidation: peu de nouveaux nœuds, beaucoup de déplacements → pointer redondances

## Script du mode démo — Lucas le scénariste
Le mode démo rejoue une session pré-écrite avec timing précis.
Voir lib/demo-script.ts pour le script complet.
Étapes:
  T+0s    Affichage zone intake avec placeholder
  T+3s    Lucas colle son texte (texte pré-écrit simulé)
  T+5s    Analyse silencieuse, spinner discret
  T+8s    Premier prompt apparaît: "Qu'est-ce qu'il a laissé là-bas qu'il ne pouvait pas emporter ?"
  T+15s   Réponse simulée de Lucas apparaît progressivement (typing effect)
  T+20s   3 nœuds apparaissent: "retour" "culpabilité" "maison"
  T+30s   Deuxième question de l'IA
  T+40s   Réponse simulée
  T+50s   Nouveaux nœuds + première arête
  T+70s   Nœud ghost apparaît: "dette" en pointillés entre culpabilité et maison
  T+90s   Lucas déplace le nœud (simulé par animation)
  T+110s  Zone macro visible, deux clusters distincts
  T+130s  Zone vide entre clusters pulsée doucement
  T+150s  Nœud ghost "transit" apparaît dans la zone vide
  T+180s  Bouton synthèse devient actif
  T+190s  Panel synthèse s'ouvre avec lecture du terrain
  T+210s  Suggestions d'export apparaissent

## Ce qu'il ne faut PAS construire
- Boîte de chat conversationnelle
- Dashboard multi-projets
- Onboarding tutoriel
- Toute génération de contenu créatif
- Notifications push ou alertes intrusives
- Modes visibles ou sélectionnables par l'utilisateur
