# PROJECT_RULES.md – Règles du projet OVH Solana Tracker

**Dernière mise à jour** : 2026-02-06  
**Prochaine revue humaine** : 2026-02-13

---

## 1. Style & Conventions (TypeScript + Next.js 16 + React 19)

- **Variables** : toujours `const` sauf si `let` est obligatoire
- **Types** : jamais `any` → utiliser `unknown` ou type précis
- **Nommage** :
  - `camelCase` pour variables/fonctions
  - `PascalCase` pour composants/classes/interfaces
  - `UPPER_SNAKE_CASE` pour constantes globales
- **Imports** : toujours triés et groupés
  ```typescript
  // 1. React/Next
  import { useState } from 'react';
  // 2. Third-party
  import { Recharts } from 'recharts';
  // 3. Internal
  import { fetchNodes } from '@/lib/solana';
  ```
- **Pas de `console.log` en production** → utiliser un logger si nécessaire
- **Fichiers** : un seul export par fichier (default export pour composants)

---

## 2. Architecture & Patterns Préférés

### Structure des dossiers
```
src/
├── app/              # Next.js App Router (pages)
├── components/       # Composants React réutilisables
├── lib/              # Logique métier + utilitaires
│   ├── solana/       # Logique Solana (fetch, filter, calculate)
│   └── asn/          # Logique ASN/MaxMind
├── types/            # Types TypeScript partagés
└── styles/           # CSS globaux
```

### Règles d'architecture
- **Composants** : logique métier → hooks ou services dédiés (jamais dans les composants)
- **API calls** : toujours via `lib/` + gestion d'erreur systématique
- **Server Components** : privilégier les Server Components Next.js par défaut
- **Client Components** : ajouter `'use client'` uniquement si nécessaire (hooks, événements)
- **Feature folders** : si le projet grandit, migrer vers `src/features/xxx/`

---

## 3. Tests

- **Nouveaux fichiers** : test unitaire obligatoire pour toute nouvelle fonction métier
- **Nom des tests** : `should do X when Y`
- **Coverage minimum** : 70 % sur les nouvelles features
- **Priorité** :
  1. Logique métier (`lib/solana/*`, `lib/asn/*`)
  2. Composants critiques (KPICards, WorldMap)
  3. API routes

---

## 4. Erreurs Fréquentes Déjà Corrigées (NE PLUS JAMAIS FAIRE)

> **Instructions pour l'agent** : Ajoute automatiquement une nouvelle ligne ici après chaque correction importante.

- **[2026-02-06]** Ne pas oublier de gérer les erreurs réseau dans `fetchNodes` → toujours `try/catch` + fallback
- **[2026-02-06]** Ne pas utiliser `any` pour les types Solana → toujours typer avec `SolanaNode`, `OVHNode`, etc.
- **[2026-02-06]** Ne pas laisser de `TODO` dans le code livré → soit supprimé, soit ticket créé
- **[2026-02-06]** **REFACTORING LOGGER** : Remplacé 18 `console.log` par `logger` (`@/lib/utils/logger`) → en production, seuls les `warn` et `error` sont affichés
- **[2026-02-06]** **PHASE 2 - HISTORIQUE** : Base de données SQLite (`data/metrics.db`) pour stocker les métriques quotidiennes → ne jamais commit la DB, toujours utiliser `.gitignore`
- **[2026-02-06]** **TESTS UNITAIRES** : Installé Vitest + créé 14 tests (calculateMetrics.ts 100%, filterOVH.ts 76%) → toujours mocker les dépendances externes (MaxMind, fetch)

---

## 5. Bonnes Pratiques Spécifiques au Projet

### Solana
- **RPC Endpoint** : toujours utiliser `https://api.mainnet-beta.solana.com` (ou variable d'env)
- **Timeout** : 10s max pour `getClusterNodes`
- **Cache** : données Solana → cache de 5 min minimum

### MaxMind / Géolocalisation
- **Base de données** : MaxMind GeoLite2 ASN → toujours vérifier la présence du fichier
- **ASNs OVHcloud** : `AS16276`, `AS35540` (ne jamais hardcoder ailleurs que dans `lib/asn/constants.ts`)

### Performance
- **Images** : toujours utiliser `next/image` avec `priority` pour les images above-the-fold
- **Lazy loading** : composants lourds (WorldMap, Charts) → `dynamic()` avec `ssr: false` si nécessaire
- **Fonts** : Google Fonts via `next/font` (déjà configuré avec Inter)

### Sécurité
- **Secrets** : jamais de clés API dans le code → utiliser `.env.local` + Vercel secrets
- **Variables d'env** : toujours préfixer avec `NEXT_PUBLIC_` si utilisé côté client

---

## 6. Instructions pour l'Agent

- **Tu DOIS relire ce fichier avant chaque tâche importante**
- **Après chaque correction** : ajoute une nouvelle règle dans la section 4 avec la date
- **Si tu hésites sur une règle** : propose une amélioration et demande confirmation
- **Langue** : réponds en français, code et commentaires en anglais
- **Commits** : messages clairs en anglais (format : `feat:`, `fix:`, `refactor:`, etc.)

---

## 7. Checklist Avant Chaque Commit (l'agent doit la cocher)

- [ ] Tests passent (ou N/A si pas de tests)
- [ ] Pas de `any`, `console.log`, `TODO` non documenté
- [ ] Règles de ce fichier respectées
- [ ] Types TypeScript corrects
- [ ] Message de commit clair (format conventionnel)
- [ ] `.env.example` mis à jour si nouvelles variables

---

## 8. Workflows & Automatisations

### Commandes fréquentes
```bash
# Dev
npm run dev

# Build + test local
npm run build && npm start

# Worker (mise à jour des données)
npm run worker

# Déploiement Vercel
vercel --prod
```

### Agents recommandés (à créer)
- **Agent Analytics** : analyse les logs Vercel + métriques
- **Agent Refactor** : refactorisation du code legacy
- **Agent Tests** : génération de tests unitaires

---

**Note** : Ce fichier évolue avec le projet. Toute amélioration est bienvenue !
