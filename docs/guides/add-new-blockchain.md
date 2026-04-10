# Ajouter une nouvelle blockchain

Ce guide documente le pattern à suivre pour intégrer une nouvelle blockchain dans le tracker. Le modèle de référence est **Avalanche** — toute nouvelle intégration suit exactement les mêmes étapes.

---

## Checklist rapide

- [ ] 1. Enregistrer la chain dans `lib/chains.ts`
- [ ] 2. Ajouter la clé de cache dans `lib/cache/chain-storage.ts`
- [ ] 3. Créer les modules `lib/{chain}/`
- [ ] 4. Ajouter les types dans `src/types/{chain}.ts` + barrel export
- [ ] 5. Créer la route API `/api/{chain}/route.ts`
- [ ] 6. Créer la route cron `/api/cron/{chain}-refresh/route.ts`
- [ ] 7. Créer les pages UI `src/app/{chain}/`
- [ ] 8. Ajouter les specs serveur dans `lib/config/use-cases-config.ts`
- [ ] 9. Créer le worker script `scripts/worker-{chain}.ts`
- [ ] 10. Mettre à jour `vercel.json` (cron schedule)
- [ ] 11. Tester en local

---

## Étape 1 — Enregistrer la chain (`lib/chains.ts`)

```typescript
// src/lib/chains.ts
export type ChainId = 'solana' | 'ethereum' | 'avalanche' | 'sui' | 'NEWCHAIN';

export const CHAINS: Record<ChainId, ChainConfig> = {
  // ... existing chains ...
  NEWCHAIN: {
    id: 'NEWCHAIN',
    name: 'New Chain',
    accent: '#HEXCOLOR',       // chain brand color
    route: '/newchain',
    cssClass: 'newchain-theme',
    bgTint: 'rgba(R,G,B,0.10)',
  },
};
```

---

## Étape 2 — Clé de cache (`lib/cache/chain-storage.ts`)

```typescript
export const CACHE_KEYS = {
    solana: 'solana-metrics',
    avalanche: 'avalanche-metrics',
    sui: 'sui-metrics',
    NEWCHAIN: 'newchain-metrics',  // ← ajouter ici
} as const;

export const CACHE_TTL: Record<ChainId, number> = {
    solana: 60 * 60 * 1000,
    avalanche: 2 * 60 * 60 * 1000,
    sui: 2 * 60 * 60 * 1000,
    NEWCHAIN: 2 * 60 * 60 * 1000,  // ← ajuster selon la fréquence de mise à jour
};
```

> Ce pattern est **additif** : on n'y touche jamais les entrées existantes.

---

## Étape 3 — Modules lib (`src/lib/NEWCHAIN/`)

Créer trois fichiers en s'inspirant de `src/lib/avalanche/` :

### `fetchPeers.ts` (ou `fetchNodes.ts`, `fetchValidators.ts`)

Appel à l'API RPC ou indexeur propre à la chain. Retourne un tableau de nœuds bruts.

```typescript
export interface NewChainNode {
  ip: string;       // champ IP (nom variable selon la chain)
  nodeId: string;
  // ... autres champs spécifiques
}

export async function fetchNewChainNodes(): Promise<NewChainNode[]> {
  // fetch vers l'API RPC/explorer
}

export function extractNewChainIP(rawIp: string): string | null {
  // Extrait l'IP depuis le format spécifique à la chain (e.g. "1.2.3.4:9651")
  const match = rawIp.match(/^(\d+\.\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}
```

### `filterOVH.ts`

> **Important :** Ne jamais copier-coller la logique MaxMind. Importer depuis `@/lib/shared/filterOVH`.  
> Les fonctions `filterOVHNodesByASN` et `categorizeByProvider` gèrent tout — tu fournis seulement `extractIP`.

```typescript
import { NewChainNode, NewChainOVHNode, NewChainIPInfo } from '@/types/newchain';
import { identifyProvider } from '@/lib/shared/providers';
import {
    filterOVHNodesByASN,
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';
import { extractNewChainIP } from './fetchNodes';

export async function filterOVHNewChainNodes(nodes: NewChainNode[]): Promise<NewChainOVHNode[]> {
    const results = await filterOVHNodesByASN(nodes, extractNewChainIP, 'NewChain');

    return results.map(({ node, enrichment }) => ({
        ...node,
        ipInfo: {
            ip: enrichment.ip,
            asn: enrichment.asn,
            org: enrichment.org,
            country: enrichment.country,
            country_name: enrichment.country_name,
            city: 'Unknown',       // GeoLite2-ASN does not provide city/coordinates
            latitude: 0,
            longitude: 0,
        } satisfies NewChainIPInfo,
        provider: identifyProvider(enrichment.asn, enrichment.org),
    }));
}

export type { ProviderCategorizationResult as NewChainProviderCategorizationResult };

export async function categorizeNewChainNodesByProvider(
    nodes: NewChainNode[],
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(nodes, extractNewChainIP, 'NewChain');
}
```

### `calculateMetrics.ts`

Calcul du market share et des métriques agrégées.

```typescript
export function calculateNewChainMetrics(
  allNodes: NewChainNode[],
  ovhNodes: NewChainOVHNode[],
  providerCategorization: NewChainProviderCategorizationResult,
): NewChainDashboardMetrics {
  return {
    totalNodes: allNodes.length,
    ovhNodes: ovhNodes.length,
    marketShare: allNodes.length > 0 ? (ovhNodes.length / allNodes.length) * 100 : 0,
    // ...
  };
}
```

---

## Étape 4 — Types (`src/types/newchain.ts`)

```typescript
export interface NewChainNode { /* ... */ }
export interface NewChainOVHNode { /* ... */ }
export interface NewChainDashboardMetrics { /* ... */ }
export interface NewChainAPIResponse {
  success: boolean;
  data?: NewChainDashboardMetrics;
  cached?: boolean;
  stale?: boolean;
  timestamp?: number;
  error?: string;
}
```

Puis dans `src/types/index.ts` :

```typescript
export * from './newchain';
```

---

## Étape 5 — Route API (`src/app/api/newchain/route.ts`)

```typescript
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { NewChainDashboardMetrics } from '@/types';

export async function GET() {
  const cache = await readChainCache<NewChainDashboardMetrics>('NEWCHAIN');

  if (cache && isChainCacheFresh(cache, 'NEWCHAIN')) {
    return NextResponse.json({ success: true, data: cache.data, cached: true, timestamp: cache.timestamp });
  }
  if (cache) {
    return NextResponse.json({ success: true, data: cache.data, cached: true, stale: true, timestamp: cache.timestamp });
  }
  return NextResponse.json({ success: false, error: 'No data yet. Run the cron job first.' }, { status: 503 });
}
```

---

## Étape 6 — Route cron (`src/app/api/cron/newchain-refresh/route.ts`)

```typescript
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startTime = Date.now();
  const env = getEnvConfig();

  const authHeader = request.headers.get('authorization');
  if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initMaxMind();
    const allNodes = await fetchNewChainNodes();
    const [ovhNodes, providerCategorization] = await Promise.all([
      filterOVHNewChainNodes(allNodes),
      categorizeNewChainNodesByProvider(allNodes),
    ]);
    const metrics = calculateNewChainMetrics(allNodes, ovhNodes, providerCategorization);
    await writeChainCache('NEWCHAIN', metrics, allNodes.length);

    return NextResponse.json({ success: true, stats: { totalNodes: allNodes.length, ovhNodes: ovhNodes.length } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

---

## Étape 7 — Pages UI (`src/app/newchain/`)

Copier la structure de `src/app/avalanche/` ou `src/app/sui/` :

```
src/app/newchain/
├── layout.tsx          # NetworkThemeProvider avec chain='NEWCHAIN'
├── page.tsx            # Dashboard principal
├── nodes/page.tsx      # Explorer de nœuds (optionnel)
└── analytics/page.tsx  # Graphiques/tendances (optionnel)
```

Dans `layout.tsx` :
```typescript
<NetworkThemeProvider chain="NEWCHAIN">
  {children}
</NetworkThemeProvider>
```

Ajouter le lien dans `src/components/dashboard/Sidebar.tsx` ou `OthersDropdown.tsx`.

---

## Étape 8 — Specs serveur OVH (`lib/config/use-cases-config.ts`)

Ajouter les spécifications matérielles et les équivalences serveur OVH pour la nouvelle chain dans `USE_CASES_CONFIG`. Ces données s'affichent dans la section "Infrastructure OVH recommandée" de la page use-cases.

### Interface à étendre

```typescript
export interface ServerSpec {
  nodeType: string;      // "Validator", "RPC node", "Archive node", "Full node"
  cpu: string;           // ex: "32 cores"
  ram: string;           // ex: "64 GB"
  storage: string;       // ex: "2× 960 GB NVMe"
  network: string;       // ex: "3 Gbps unmetered"
  ovhServer: string;     // ex: "ADVANCE-2"
  priceEur: number;      // prix mensuel OVH en EUR (pricelist avril 2026)
  ovhServerUrl: string;  // lien direct vers la page produit OVH /en/
}

export interface UseCasesChainConfig {
  apiRoute: string;
  techHighlights: [TechHighlight, TechHighlight];
  serverSpecs: ServerSpec[];  // ← nouveau champ
}
```

### Exemple (Avalanche)

```typescript
avalanche: {
  apiRoute: '/api/avalanche',
  techHighlights: [...],
  serverSpecs: [
    {
      nodeType: 'Validator',
      cpu: '8 cores / 16 threads',
      ram: '32 GB',
      storage: '1 TB NVMe (local)',
      network: '3 Gbps unmetered',
      ovhServer: 'ADVANCE-2',
      priceEur: 125,
      ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
    },
    {
      nodeType: 'Archive node',
      cpu: '8 cores / 16 threads',
      ram: '32 GB',
      storage: '4× 1.92 TB NVMe',
      network: '3 Gbps unmetered',
      ovhServer: 'ADVANCE-2 + stockage',
      priceEur: 167,
      ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
    },
  ],
},
```

### Sources

Les specs matérielles se trouvent dans `docs/research/blockchain-hardware-specs.md` (tableau maître). Les prix OVH sont dans `docs/research/ovh-server-pricing.md` (données au 9 avril 2026).

Les URLs OVH suivent ce pattern :
- ADVANCE : `https://www.ovhcloud.com/en/bare-metal/advance/adv-{n}/`
- SCALE : `https://www.ovhcloud.com/en/bare-metal/scale/scale-{n}/`

> **Règle :** si la spec est une estimation (ex: Hyperliquid), mettre `ovhServerUrl: ''` — le bouton ne s'affiche pas.

---

## Étape 9 — Worker script (`scripts/worker-newchain.ts`)

```typescript
#!/usr/bin/env tsx
require('dotenv').config({ path: '.env.local' });
import { fetchNewChainNodes } from '../src/lib/newchain/fetchNodes';
import { filterOVHNewChainNodes, categorizeNewChainNodesByProvider } from '../src/lib/newchain/filterOVH';
import { calculateNewChainMetrics } from '../src/lib/newchain/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { initMaxMind } from '../src/lib/asn/maxmind';

async function run() {
  await initMaxMind();
  const allNodes = await fetchNewChainNodes();
  const [ovhNodes, providerCategorization] = await Promise.all([
    filterOVHNewChainNodes(allNodes),
    categorizeNewChainNodesByProvider(allNodes),
  ]);
  const metrics = calculateNewChainMetrics(allNodes, ovhNodes, providerCategorization);
  await writeChainCache('NEWCHAIN', metrics, allNodes.length);
  console.log(`Done: ${ovhNodes.length}/${allNodes.length} OVH nodes`);
}
run().catch(console.error);
```

Ajouter dans `package.json` :
```json
"worker:newchain": "tsx scripts/worker-newchain.ts"
```

---

## Étape 10 — Vercel cron (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/newchain-refresh", "schedule": "0 */2 * * *" }
  ]
}
```

---

## Points d'attention

| Sujet | Détail |
|---|---|
| **IP extraction** | Chaque chain a un format d'IP différent (ex: `"1.2.3.4:9651"` pour Avalanche). Écrire `extractXxxIP()` adapté. |
| **initMaxMind()** | Toujours appeler en premier dans les fonctions de filtre — la DB MaxMind doit être initialisée avant tout lookup. |
| **Cache clé** | La clé doit être unique et cohérente entre `chain-storage.ts`, la route API et le cron. |
| **Ethereum exception** | Ethereum est différent : ses données viennent de l'API Migalabs (pas de RPC direct), et les snapshots sont stockés dans `ethereum_snapshots` (pas dans `cache`). Ne pas utiliser comme modèle. |
| **identifyProvider()** | Ne pas copier-coller — importer depuis `lib/shared/providers.ts`. |

---

## Blockchains déjà intégrées

| Chain | Statut | Source de données | Cache TTL |
|---|---|---|---|
| Solana | Production | RPC mainnet-beta | 1h |
| Ethereum | Production | Migalabs API | N/A (snapshots) |
| Avalanche | Production | api.avax.network | 2h |
| Sui | Production | Sui RPC fullnode | 2h |
| Hyperliquid | Présent dans chains.ts | — | — |
