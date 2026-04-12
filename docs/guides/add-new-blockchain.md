# Guide — Ajouter une nouvelle blockchain

Ce guide documente le pattern standard pour intégrer une nouvelle blockchain dans l'OVH Node Tracker.

## Règle fondamentale — Structure de pages

Quand on ajoute une blockchain, **toutes les pages suivantes doivent exister** avec la même sidebar :

| Page | Route | Contenu si données manquantes |
|------|-------|-------------------------------|
| Dashboard | `/[chain]` | KPIs avec "–" et badge "Coming Soon" |
| Node Explorer | `/[chain]/nodes` | Bannière explicative Coming Soon |
| Analytics | `/[chain]/analytics` | Sections disponibles remplies, sections OVH en Coming Soon |
| Use Cases | `/[chain]/use-cases` | Contenu éditorial adapté à la chain |
| Guide | `/[chain]/guide` | Guide d'installation (hardware, deploy, partners) |

**Ne jamais supprimer une page parce que certaines données sont manquantes.** Le contenu manquant s'affiche en "Coming Soon" avec l'explication technique.

---

## Checklist — Fichiers à créer/modifier

### Nouveaux fichiers
- [ ] `src/types/[chain].ts` — types TypeScript
- [ ] `src/lib/[chain]/fetchValidators.ts` (ou `fetchPeers.ts`) — data fetcher
- [ ] `src/lib/[chain]/filterOVH.ts` — import de `lib/shared/filterOVH` (si ASN disponible)
- [ ] `src/lib/[chain]/calculateMetrics.ts` — calcul métriques
- [ ] `src/lib/[chain]/calculateMetrics.test.ts` — tests Vitest
- [ ] `scripts/worker-[chain].ts` — worker background
- [ ] `src/app/api/[chain]/route.ts` — route API
- [ ] `src/app/api/cron/[chain]-refresh/route.ts` — cron handler
- [ ] `src/app/[chain]/layout.tsx`
- [ ] `src/app/[chain]/page.tsx` — Dashboard
- [ ] `src/app/[chain]/nodes/page.tsx` — Node Explorer
- [ ] `src/app/[chain]/analytics/page.tsx` — Analytics
- [ ] `src/app/[chain]/use-cases/page.tsx` — Use Cases
- [ ] `src/app/[chain]/guide/page.tsx` — Guide

### Fichiers à modifier
- [ ] `src/lib/chains.ts` — ajouter `ChainId` et entrée `CHAINS`
- [ ] `src/lib/cache/chain-storage.ts` — ajouter `CACHE_KEYS` et `CACHE_TTL`
- [ ] `src/types/index.ts` — `export * from './[chain]'`
- [ ] `src/components/OthersDropdown.tsx` — ajouter entrée dans `OTHER_CHAINS`
- [ ] `vercel.json` — ajouter cron
- [ ] `package.json` — ajouter `worker:[chain]` script
- [ ] CSS global — ajouter `.[chain]-theme { --chain-accent: #COLOR; }` si applicable

---

## Pattern standard (chains avec RPC direct)

```
scripts/worker-[chain].ts
  → lib/[chain]/fetchValidators.ts    # Appel RPC/API
  → lib/shared/filterOVH.ts          # TOUJOURS importer, jamais dupliquer
  → lib/[chain]/calculateMetrics.ts
  → lib/cache/chain-storage.ts        # writeChainCache('[chain]', metrics, count)

src/app/api/[chain]/route.ts          # readChainCache('[chain]')
```

## Exception — chains sans accès IPs (ex: Monad)

Si les IPs des validators ne sont pas accessibles via RPC ou API publique :
- Pas de `filterOVH.ts` ni de `providerBreakdown.ts`
- Dashboard et Analytics affichent des banners "Coming Soon" pour les sections OVH
- Nodes page affiche une bannière explicative avec la raison technique
- Toutes les autres pages sont créées normalement

Exemple de référence : intégration Monad (`docs/plans/2026-04-11-monad-integration-plan.md`)
