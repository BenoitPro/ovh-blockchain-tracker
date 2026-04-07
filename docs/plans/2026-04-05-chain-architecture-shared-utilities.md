# Chain Architecture — Shared Utilities Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create shared `lib/shared/filterOVH.ts` utilities to eliminate ~300 lines of duplicated OVH filtering/provider categorization logic across Solana, Avalanche, and Sui — without breaking any existing API or behavior.

**Architecture:** Additive-only approach — new generic functions in `lib/shared/`, existing chain functions delegate internally. Zero changes to exported signatures. Ethereum left unchanged (Migalabs pattern incompatible).

**Tech Stack:** TypeScript generics, existing MaxMind (`lib/asn/maxmind.ts`), existing `lib/config/constants.ts`, Vitest.

---

## Context

Three `filterOVH.ts` files have near-identical implementations:
- `src/lib/solana/filterOVH.ts` — `filterOVHNodes()` + `categorizeNodesByProvider()`
- `src/lib/avalanche/filterOVH.ts` — `filterOVHAvalancheNodes()` + `categorizeAvalancheNodesByProvider()`
- `src/lib/sui/filterOVH.ts` — `filterOVHSuiNodes()` + `categorizeSuiNodesByProvider()`

The only differences: input type, IP extraction function, output type construction.

`lib/shared/` already exists with `providers.ts` and `providerBreakdown.ts`.

---

## Task 1: Create `lib/shared/filterOVH.ts`

**Files:**
- Create: `src/lib/shared/filterOVH.ts`

The shared module exposes two generic functions and the canonical `ProviderCategorizationResult` type.

**Step 1: Create the file**

```typescript
// src/lib/shared/filterOVH.ts
import { logger } from '@/lib/utils';
import {
    initMaxMind,
    getASNFromMaxMind,
    getCountryFromMaxMind,
    isOVHIP,
    batchGetASN,
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';

export interface OVHNodeEnrichment {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
}

export interface ProviderCategorizationResult {
    distribution: Record<string, number>;
    othersBreakdown: Record<string, number>;
    globalGeoDistribution: Record<string, number>;
}

/**
 * Generic OVH filter — returns enrichment data for each node on OVH infrastructure.
 * Chain-specific functions wrap this to build their own typed output.
 *
 * @param nodes       Array of raw nodes (any type)
 * @param extractIP   Chain-specific IP extractor
 * @param chainLabel  Label for log messages (e.g. "Avalanche")
 */
export async function filterOVHNodesByASN<T>(
    nodes: T[],
    extractIP: (node: T) => string | null,
    chainLabel: string = 'Chain',
): Promise<Array<{ node: T; enrichment: OVHNodeEnrichment }>> {
    await initMaxMind();

    const results: Array<{ node: T; enrichment: OVHNodeEnrichment }> = [];
    logger.info(`[${chainLabel}/MaxMind] Filtering ${nodes.length} nodes for OVH ASNs...`);

    for (const node of nodes) {
        const ip = extractIP(node);
        if (!ip) continue;
        if (!isOVHIP(ip, OVH_ASN_LIST)) continue;

        const asnInfo = getASNFromMaxMind(ip);
        if (!asnInfo) continue;

        const countryInfo = getCountryFromMaxMind(ip);

        results.push({
            node,
            enrichment: {
                ip,
                asn: asnInfo.asn,
                org: asnInfo.org,
                country: countryInfo?.countryCode ?? 'Unknown',
                country_name: countryInfo?.country ?? 'Unknown',
            },
        });
    }

    logger.info(`[${chainLabel}/MaxMind] Found ${results.length} OVH nodes`);
    return results;
}

/**
 * Generic provider categorization — fully identical logic across all RPC chains.
 *
 * @param nodes      Array of raw nodes (any type)
 * @param extractIP  Chain-specific IP extractor
 * @param chainLabel Label for log messages
 */
export async function categorizeByProvider<T>(
    nodes: T[],
    extractIP: (node: T) => string | null,
    chainLabel: string = 'Chain',
): Promise<ProviderCategorizationResult> {
    await initMaxMind();

    const distribution: Record<string, number> = {};
    const othersBreakdown: Record<string, number> = {};
    const globalGeoDistribution: Record<string, number> = {};

    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    logger.info(`[${chainLabel}/MaxMind] Categorising ${nodes.length} nodes by provider...`);

    const ips: string[] = [];
    for (const node of nodes) {
        const ip = extractIP(node);
        if (ip) {
            ips.push(ip);
        } else {
            distribution.others++;
        }
    }

    const asnResults = batchGetASN(ips);

    for (const ip of ips) {
        const countryInfo = getCountryFromMaxMind(ip);
        if (countryInfo?.countryCode) {
            globalGeoDistribution[countryInfo.countryCode] =
                (globalGeoDistribution[countryInfo.countryCode] ?? 0) + 1;
        }
    }

    for (const asnInfo of asnResults.values()) {
        let matched = false;
        for (const [provider, providerInfo] of Object.entries(PROVIDER_ASN_MAP)) {
            if (providerInfo.asns.includes(asnInfo.asn)) {
                distribution[provider]++;
                matched = true;
                break;
            }
        }
        if (!matched) {
            distribution.others++;
            const org = asnInfo.org ?? 'Unknown Provider';
            othersBreakdown[org] = (othersBreakdown[org] ?? 0) + 1;
        }
    }

    logger.debug(`[${chainLabel}/MaxMind] Provider distribution:`, distribution);
    return { distribution, othersBreakdown, globalGeoDistribution };
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit
```

Expected: no errors on the new file.

**Step 3: Commit**

```bash
git add src/lib/shared/filterOVH.ts
git commit -m "feat: add generic filterOVHNodesByASN and categorizeByProvider shared utilities"
```

---

## Task 2: Refactor Avalanche `filterOVH.ts` to delegate to shared

**Files:**
- Modify: `src/lib/avalanche/filterOVH.ts`

Avalanche is the simplest case — no special enrichment logic.

**Step 1: Rewrite `filterOVHAvalancheNodes` to delegate**

Replace the body of `filterOVHAvalancheNodes` — same exported signature, internals delegate to shared:

```typescript
// src/lib/avalanche/filterOVH.ts
import { AvalancheNode, AvalancheIPInfo, AvalancheOVHNode } from '@/types';
import { extractAvalancheIP } from './fetchPeers';
import { logger } from '@/lib/utils';
import { identifyProvider } from '@/lib/shared/providers';
import {
    filterOVHNodesByASN,
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';

export async function filterOVHAvalancheNodes(nodes: AvalancheNode[]): Promise<AvalancheOVHNode[]> {
    const results = await filterOVHNodesByASN(
        nodes,
        (node) => extractAvalancheIP(node.ip),
        'Avalanche',
    );

    return results.map(({ node, enrichment }) => ({
        ...node,
        ipInfo: {
            ip: enrichment.ip,
            asn: enrichment.asn,
            org: enrichment.org,
            country: enrichment.country,
            country_name: enrichment.country_name,
            city: 'Unknown',
            latitude: 0,
            longitude: 0,
        } satisfies AvalancheIPInfo,
        provider: identifyProvider(enrichment.asn, enrichment.org),
    }));
}

export type { ProviderCategorizationResult as AvalancheProviderCategorizationResult };

export async function categorizeAvalancheNodesByProvider(
    nodes: AvalancheNode[],
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(nodes, (node) => extractAvalancheIP(node.ip), 'Avalanche');
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Run existing tests**

```bash
npm run test
```

Expected: all pass.

**Step 4: Commit**

```bash
git add src/lib/avalanche/filterOVH.ts
git commit -m "refactor(avalanche): delegate filterOVH to lib/shared/filterOVH"
```

---

## Task 3: Refactor Sui `filterOVH.ts` to delegate to shared

**Files:**
- Modify: `src/lib/sui/filterOVH.ts`

Note: Sui uses `lat/lon` instead of `latitude/longitude` in its `SuiIPInfo` — handle in the map.

**Step 1: Rewrite to delegate**

```typescript
// src/lib/sui/filterOVH.ts
import { SuiValidator, SuiOVHNode, SuiIPInfo } from '@/types/sui';
import { identifyProvider } from '@/lib/shared/providers';
import {
    filterOVHNodesByASN,
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';

export async function filterOVHSuiNodes(validators: SuiValidator[]): Promise<SuiOVHNode[]> {
    const results = await filterOVHNodesByASN(
        validators,
        (v) => v.ip ?? null,
        'Sui',
    );

    return results.map(({ node, enrichment }) => ({
        ...node,
        ipInfo: {
            ip: enrichment.ip,
            asn: enrichment.asn,
            org: enrichment.org,
            country: enrichment.country,
            country_name: enrichment.country_name,
            city: 'Unknown',
            lat: 0,
            lon: 0,
        } satisfies SuiIPInfo,
        provider: identifyProvider(enrichment.asn, enrichment.org),
    }));
}

export type { ProviderCategorizationResult as SuiProviderCategorizationResult };

export async function categorizeSuiNodesByProvider(
    validators: SuiValidator[],
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(validators, (v) => v.ip ?? null, 'Sui');
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Run tests**

```bash
npm run test
```

**Step 4: Commit**

```bash
git add src/lib/sui/filterOVH.ts
git commit -m "refactor(sui): delegate filterOVH to lib/shared/filterOVH"
```

---

## Task 4: Refactor Solana `filterOVH.ts` to delegate `categorizeNodesByProvider`

**Files:**
- Modify: `src/lib/solana/filterOVH.ts`

Solana's `filterOVHNodes` has extra logic (enriched node detection, geolocation via ip-api.com). **Leave `filterOVHNodes` untouched.** Only delegate `categorizeNodesByProvider` which IS identical.

**Step 1: Add import and replace only `categorizeNodesByProvider`**

At the top of `src/lib/solana/filterOVH.ts`, add:

```typescript
import {
    categorizeByProvider,
    ProviderCategorizationResult,
} from '@/lib/shared/filterOVH';
```

Then replace the `categorizeNodesByProvider` function body:

```typescript
export async function categorizeNodesByProvider(
    nodes: SolanaNode[]
): Promise<ProviderCategorizationResult> {
    return categorizeByProvider(
        nodes,
        (node) => extractIP(node.gossip),
        'Solana',
    );
}
```

Remove the now-unused imports from `@/lib/asn/maxmind` that were only used in `categorizeNodesByProvider` if they're no longer needed elsewhere in the file — be careful only to remove what's truly unused.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Run tests**

```bash
npm run test
```

**Step 4: Commit**

```bash
git add src/lib/solana/filterOVH.ts
git commit -m "refactor(solana): delegate categorizeNodesByProvider to lib/shared/filterOVH"
```

---

## Task 5: Update `docs/guides/add-new-blockchain.md`

**Files:**
- Modify: `docs/guides/add-new-blockchain.md`

Update the `filterOVH.ts` template in Étape 3 to use the shared utilities instead of copy-pasting the full implementation.

**Step 1: Replace the filterOVH.ts code example**

Find the block under `### filterOVH.ts` and replace the template with:

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
            city: 'Unknown',
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

Also add a note at the top of Étape 3:

```markdown
> **Important:** Ne jamais copier-coller la logique MaxMind. Importer depuis `lib/shared/filterOVH.ts`.
> Les fonctions `filterOVHNodesByASN` et `categorizeByProvider` gèrent tout automatiquement.
> Tu n'as qu'à fournir une fonction `extractIP` spécifique à ta chain.
```

**Step 2: Commit**

```bash
git add docs/guides/add-new-blockchain.md
git commit -m "docs: update add-new-blockchain guide to use lib/shared/filterOVH"
```

---

## Task 6: Update `CLAUDE.md` with architecture rules

**Files:**
- Modify: `CLAUDE.md` (at project root, not in `ovh-blockchain-tracker/`)

Add a new section "Règles d'architecture — nouvelles chains" after "Ajouter une nouvelle blockchain".

**Step 1: Add the section**

```markdown
## Règles d'architecture — Nouvelles chains

### Pattern standard obligatoire (chains RPC-direct)

Pour toute chain avec un RPC direct (comme Solana, Avalanche, Sui), **utiliser obligatoirement** les utilitaires partagés :

```typescript
// TOUJOURS importer depuis lib/shared/filterOVH — ne JAMAIS réimplémenter
import { filterOVHNodesByASN, categorizeByProvider } from '@/lib/shared/filterOVH';
import { identifyProvider } from '@/lib/shared/providers';
```

Le fichier `lib/{chain}/filterOVH.ts` ne doit contenir **que** :
1. L'appel à `filterOVHNodesByASN()` ou `categorizeByProvider()`
2. Le mapping vers le type OVHNode spécifique à la chain
3. La fonction `extractIP` propre à la chain

**Ne jamais** dupliquer la boucle MaxMind, la logique de catégorisation, ou `PROVIDER_ASN_MAP` — tout ça vit dans `lib/shared/filterOVH.ts`.

### Exception Ethereum

Ethereum utilise l'API Migalabs — incompatible avec le pattern RPC. Laisser tel quel. Ne pas l'inclure dans les utilitaires partagés.

### Checklist avant d'ajouter une chain

- [ ] `lib/shared/filterOVH.ts` est importé (pas copié)
- [ ] `identifyProvider` vient de `lib/shared/providers.ts`
- [ ] La chain est enregistrée dans `lib/chains.ts`
- [ ] La clé de cache est dans `lib/cache/chain-storage.ts`
- [ ] Voir `docs/guides/add-new-blockchain.md` pour le guide complet
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add architecture rules for adding new chains"
```

---

## Task 7: Final verification

**Step 1: Full build**

```bash
cd ovh-blockchain-tracker && npm run build
```

Expected: build succeeds with no TypeScript errors.

**Step 2: Full test suite**

```bash
npm run test
```

Expected: all tests pass.

**Step 3: Lint**

```bash
npm run lint
```

Expected: no new lint errors.
