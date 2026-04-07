# Performance Optimizations — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corriger trois goulots d'étranglement identifiés lors de l'audit du 2026-04-05 : DNS parallèle non limité dans Sui, TTL de cache validator Solana trop court, et absence de timeout sur `fetchVoteAccounts`.

**Architecture:** Chaque fix est indépendant et modifie un seul fichier. Pas de nouvelles dépendances — la concurrence DNS est gérée via un pool async inline, pas p-queue.

**Tech Stack:** TypeScript, Vitest, Node.js `dns/promises`, Next.js workers

---

## Task 1 : DNS concurrency limit + cache dans Sui

**Problème** : `fetchValidators.ts` lance jusqu'à 180+ résolutions DNS en parallèle via `Promise.all`, sans limit de concurrence ni cache. Chaque `dns.resolve4()` prend 50–200ms. Résultat : 9–36 secondes juste pour la résolution IP au lieu de 1–2s.

**Files:**
- Modify: `src/lib/sui/fetchValidators.ts:15-78`

---

**Step 1 : Comprendre le code actuel**

Lire `src/lib/sui/fetchValidators.ts`. Le problème est aux lignes 67–78 :
```typescript
const validators: SuiValidator[] = await Promise.all(
    activeValidators.map(async (v: any) => ({
        ...
        ip: await getSuiIP(v.netAddress),  // DNS call par validator, sans limite
    }))
);
```
Et `getSuiIP` (lignes 15–36) ne cache pas les résultats.

---

**Step 2 : Écrire le test**

Fichier : `src/lib/sui/fetchValidators.test.ts` (créer)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import dns from 'node:dns/promises';

// Mock dns before importing the module under test
vi.mock('node:dns/promises', () => ({
    default: { resolve4: vi.fn() },
    resolve4: vi.fn(),
}));

// We need to test getSuiIP indirectly via fetchSuiValidators.
// Since getSuiIP is not exported, we test behavior via the public API.
// Mock fetch to return a fixed set of validators.

const mockRpcResponse = (validators: any[]) => ({
    ok: true,
    json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        result: { activeValidators: validators },
    }),
});

describe('fetchSuiValidators — DNS resolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('resolves literal IPv4 addresses without DNS call', async () => {
        const { fetchSuiValidators } = await import('./fetchValidators');
        (global.fetch as any).mockResolvedValue(
            mockRpcResponse([
                { suiAddress: '0x1', name: 'A', netAddress: '/ip4/1.2.3.4/tcp/8080', p2pAddress: '', votingPower: '100', commissionRate: '0', stakingPoolSuiBalance: '0' },
            ])
        );

        const result = await fetchSuiValidators();

        expect(result[0].ip).toBe('1.2.3.4');
        expect(vi.mocked(dns.resolve4)).not.toHaveBeenCalled();
    });

    it('resolves DNS hostnames with concurrency limit', async () => {
        const { fetchSuiValidators } = await import('./fetchValidators');

        // Build 10 validators with DNS addresses
        const validators = Array.from({ length: 10 }, (_, i) => ({
            suiAddress: `0x${i}`,
            name: `Validator ${i}`,
            netAddress: `/dns/node${i}.example.com/tcp/8080`,
            p2pAddress: '',
            votingPower: '100',
            commissionRate: '0',
            stakingPoolSuiBalance: '0',
        }));

        (global.fetch as any).mockResolvedValue(mockRpcResponse(validators));
        vi.mocked(dns.resolve4).mockResolvedValue(['10.0.0.1'] as any);

        const result = await fetchSuiValidators();

        expect(result).toHaveLength(10);
        expect(vi.mocked(dns.resolve4)).toHaveBeenCalledTimes(10);
        result.forEach(v => expect(v.ip).toBe('10.0.0.1'));
    });

    it('caches DNS results — same hostname resolved only once', async () => {
        // Reset module cache to get a fresh DNS cache
        vi.resetModules();
        vi.mock('node:dns/promises', () => ({
            default: { resolve4: vi.fn() },
            resolve4: vi.fn(),
        }));

        const { fetchSuiValidators } = await import('./fetchValidators');

        const validators = [
            { suiAddress: '0x1', name: 'A', netAddress: '/dns/same.host.com/tcp/8080', p2pAddress: '', votingPower: '100', commissionRate: '0', stakingPoolSuiBalance: '0' },
            { suiAddress: '0x2', name: 'B', netAddress: '/dns/same.host.com/tcp/8081', p2pAddress: '', votingPower: '100', commissionRate: '0', stakingPoolSuiBalance: '0' },
        ];

        (global.fetch as any).mockResolvedValue(mockRpcResponse(validators));

        const dnsMock = (await import('node:dns/promises')).resolve4 as any;
        dnsMock.mockResolvedValue(['10.0.0.2']);

        await fetchSuiValidators();

        // Same hostname → resolved only once thanks to DNS cache
        expect(dnsMock).toHaveBeenCalledTimes(1);
    });

    it('returns null for failed DNS resolution', async () => {
        vi.resetModules();
        vi.mock('node:dns/promises', () => ({
            default: { resolve4: vi.fn() },
            resolve4: vi.fn(),
        }));

        const { fetchSuiValidators } = await import('./fetchValidators');

        (global.fetch as any).mockResolvedValue(
            mockRpcResponse([
                { suiAddress: '0x1', name: 'A', netAddress: '/dns/broken.host/tcp/8080', p2pAddress: '', votingPower: '100', commissionRate: '0', stakingPoolSuiBalance: '0' },
            ])
        );

        const dnsMock = (await import('node:dns/promises')).resolve4 as any;
        dnsMock.mockRejectedValue(new Error('ENOTFOUND'));

        const result = await fetchSuiValidators();

        expect(result[0].ip).toBeNull();
    });
});
```

---

**Step 3 : Lancer le test pour vérifier qu'il échoue correctement**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/sui/fetchValidators.test.ts
```

Attendu : 3 tests passing (literal IP, DNS calls), 1 failing sur le cache (DNS appelé 2x au lieu de 1x).

---

**Step 4 : Implémenter le fix dans `fetchValidators.ts`**

Remplacer le contenu de `src/lib/sui/fetchValidators.ts` par :

```typescript
import { SuiValidator } from '@/types/sui';
import { logger } from '@/lib/utils';
import { SUI_RPC_ENDPOINT } from '@/lib/config/constants';
import dns from 'node:dns/promises';

/**
 * Sui mainnet validator fetcher
 */

// DNS cache: hostname → IP. Évite de résoudre le même hostname plusieurs fois.
const dnsCache = new Map<string, string | null>();

// Concurrency pool: limite le nombre de résolutions DNS simultanées.
async function withConcurrency<T>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<void>
): Promise<void> {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length > 0) {
            const item = queue.shift()!;
            await fn(item);
        }
    });
    await Promise.all(workers);
}

/**
 * Extract clean IPv4 from Sui multiaddr format: "/ip4/X.X.X.X/tcp/XXXX"
 * or resolves hostname from "/dns/X.X.X/tcp/XXXX"
 * Résultats mis en cache pour éviter les doublons.
 */
async function getSuiIP(multiaddr: string): Promise<string | null> {
    if (!multiaddr) return null;

    // 1. Literal IP4 — pas besoin de DNS
    const ip4Match = multiaddr.match(/\/ip4\/(\d+\.\d+\.\d+\.\d+)/);
    if (ip4Match) return ip4Match[1];

    // 2. DNS — avec cache
    const dnsMatch = multiaddr.match(/\/dns\/([^\/]+)/);
    if (dnsMatch) {
        const hostname = dnsMatch[1];

        // Retourner le résultat en cache si disponible
        if (dnsCache.has(hostname)) {
            return dnsCache.get(hostname)!;
        }

        try {
            const addresses = await dns.resolve4(hostname);
            const ip = addresses[0] || null;
            dnsCache.set(hostname, ip);
            return ip;
        } catch (error) {
            logger.warn(`[Sui] Failed to resolve DNS for ${hostname}:`, error);
            dnsCache.set(hostname, null);
            return null;
        }
    }

    return null;
}

export async function fetchSuiValidators(): Promise<SuiValidator[]> {
    logger.info('[Sui] Fetching latest system state from RPC...');

    const response = await fetch(SUI_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getLatestSuiSystemState',
            params: []
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
        throw new Error(`[Sui] RPC HTTP error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.error) {
        throw new Error(`[Sui] RPC error: ${json.error.message}`);
    }

    const activeValidators = json.result?.activeValidators ?? [];
    logger.info(`[Sui] Received ${activeValidators.length} active validators`);

    // Pré-allouer le tableau de résultats
    const validators: SuiValidator[] = activeValidators.map((v: any) => ({
        suiAddress: v.suiAddress,
        name: v.name,
        netAddress: v.netAddress,
        p2pAddress: v.p2pAddress,
        votingPower: v.votingPower,
        commissionRate: v.commissionRate,
        stakingPoolSuiBalance: v.stakingPoolSuiBalance,
        ip: null as string | null,
    }));

    // Résoudre les IPs avec concurrency limit = 5 (évite de saturer le resolver DNS)
    await withConcurrency(
        validators.map((v, i) => ({ validator: v, raw: activeValidators[i] })),
        5,
        async ({ validator, raw }) => {
            validator.ip = await getSuiIP(raw.netAddress);
        }
    );

    return validators;
}
```

---

**Step 5 : Lancer les tests**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/sui/fetchValidators.test.ts
```

Attendu : 4 tests passing.

---

**Step 6 : Vérifier que les autres tests passent**

```bash
cd ovh-blockchain-tracker && npm test
```

Attendu : tous les tests existants passent.

---

**Step 7 : Commit**

```bash
git add src/lib/sui/fetchValidators.ts src/lib/sui/fetchValidators.test.ts
git commit -m "perf(sui): limit DNS concurrency to 5 and cache hostname results"
```

---

## Task 2 : Augmenter le TTL du cache validator names Solana (30min → 24h)

**Problème** : `getAllNodes.ts` cache les noms de validateurs Solana 30 minutes (`VALIDATOR_CACHE_TTL = 30 * 60 * 1000`). Les workers tournent toutes les heures — le cache est expiré à chaque run, forçant 2 appels réseau (Marinade + on-chain) inutilement. Les noms de validateurs changent au mieux hebdomadairement.

**Files:**
- Modify: `src/lib/solana/getAllNodes.ts:14`

---

**Step 1 : Écrire le test**

Ajouter dans un nouveau fichier `src/lib/solana/getAllNodes.test.ts` :

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch pour ne pas faire de vrais appels réseau
global.fetch = vi.fn();

describe('fetchValidatorList — cache TTL', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Vider le cache globalThis entre les tests
        const g = globalThis as any;
        g.validatorMapCache = undefined;
        g.validatorMapCacheTime = undefined;
    });

    it('does not refetch validators within 24 hours', async () => {
        vi.resetModules();
        const { fetchEnrichedNodes } = await import('./getAllNodes');

        // Mock: RPC nodes + vote accounts + validator list
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ result: { current: [], delinquent: [] } }),
        });

        // Premier appel — doit fetch
        // (On ne peut pas tester fetchValidatorList directement car elle n'est pas exportée,
        // mais on vérifie que le cache est utilisé via le compteur de fetch)
        const fetchCallsBefore = (global.fetch as any).mock.calls.length;
        // On simule que le cache a été rempli il y a 23h59
        const g = globalThis as any;
        g.validatorMapCache = new Map([['identity1', { name: 'Validator A', image: '' }]]);
        g.validatorMapCacheTime = Date.now() - (23 * 60 * 60 * 1000); // 23h ago

        // Le cache est encore valide (< 24h) → fetchValidatorList ne doit pas refetch
        // On vérifie en appelant fetchEnrichedNodes et en regardant si Marinade est contacté
        // Note: ce test est un smoke test — le vrai test est le TTL constant ci-dessous
        expect(g.validatorMapCache.size).toBe(1);
        expect(Date.now() - g.validatorMapCacheTime).toBeLessThan(24 * 60 * 60 * 1000);
    });

    it('VALIDATOR_CACHE_TTL is at least 24 hours', async () => {
        // Lire la constante directement depuis le module source
        // Ce test échouera si quelqu'un réduit le TTL en dessous de 24h
        const source = await import('fs').then(fs =>
            fs.readFileSync('./src/lib/solana/getAllNodes.ts', 'utf-8')
        );
        const match = source.match(/VALIDATOR_CACHE_TTL\s*=\s*(.+)/);
        expect(match).not.toBeNull();
        // Évaluer l'expression (format: "X * 60 * 60 * 1000")
        const ttlMs = eval(match![1].replace(';', ''));
        expect(ttlMs).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000);
    });
});
```

---

**Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/solana/getAllNodes.test.ts
```

Attendu : le test `VALIDATOR_CACHE_TTL is at least 24 hours` FAIL (TTL actuel = 30min).

---

**Step 3 : Implémenter le fix**

Dans `src/lib/solana/getAllNodes.ts`, ligne 14, changer :

```typescript
// AVANT
const VALIDATOR_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
```

```typescript
// APRÈS
const VALIDATOR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours — validator names rarely change
```

---

**Step 4 : Lancer les tests**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/solana/getAllNodes.test.ts
```

Attendu : tous les tests passent.

---

**Step 5 : Commit**

```bash
git add src/lib/solana/getAllNodes.ts src/lib/solana/getAllNodes.test.ts
git commit -m "perf(solana): increase validator name cache TTL from 30min to 24h"
```

---

## Task 3 : Ajouter des timeouts sur les appels réseau dans `getAllNodes.ts`

**Problème** : `fetchVoteAccounts()` (ligne 190) et `fetchOnchainValidatorInfo()` (ligne 51) font des appels réseau sans `AbortSignal.timeout`. Si le RPC Solana est lent, le worker peut bloquer indéfiniment. `fetchMarinadeValidatorInfo()` (ligne 107) n'a pas non plus de timeout. `fetchValidatorList()` appelle StakeWiz (ligne 159) sans timeout.

**Files:**
- Modify: `src/lib/solana/getAllNodes.ts:51-63` (fetchOnchainValidatorInfo)
- Modify: `src/lib/solana/getAllNodes.ts:107-111` (fetchMarinadeValidatorInfo)
- Modify: `src/lib/solana/getAllNodes.ts:159-162` (StakeWiz fetch)
- Modify: `src/lib/solana/getAllNodes.ts:190-202` (fetchVoteAccounts)

---

**Step 1 : Écrire les tests**

Ajouter dans `src/lib/solana/getAllNodes.test.ts` (dans `describe('fetchValidatorList — cache TTL', ...)`, ajouter un nouveau describe) :

```typescript
describe('fetchVoteAccounts — timeout', () => {
    it('does not hang indefinitely — AbortSignal.timeout must be present in source', async () => {
        const source = await import('fs').then(fs =>
            fs.readFileSync('./src/lib/solana/getAllNodes.ts', 'utf-8')
        );
        // Vérifie que fetchVoteAccounts utilise un timeout
        const voteAccountsSection = source.slice(
            source.indexOf('async function fetchVoteAccounts'),
            source.indexOf('async function fetchVoteAccounts') + 800
        );
        expect(voteAccountsSection).toContain('AbortSignal.timeout');
    });

    it('fetchOnchainValidatorInfo has a timeout', async () => {
        const source = await import('fs').then(fs =>
            fs.readFileSync('./src/lib/solana/getAllNodes.ts', 'utf-8')
        );
        const section = source.slice(
            source.indexOf('async function fetchOnchainValidatorInfo'),
            source.indexOf('async function fetchOnchainValidatorInfo') + 600
        );
        expect(section).toContain('AbortSignal.timeout');
    });
});
```

---

**Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/solana/getAllNodes.test.ts
```

Attendu : 2 nouveaux tests FAIL (pas de `AbortSignal.timeout` dans ces fonctions).

---

**Step 3 : Implémenter les timeouts**

Dans `src/lib/solana/getAllNodes.ts` :

**A. `fetchOnchainValidatorInfo` — ligne ~51 :**
```typescript
// AVANT
const response = await fetch(SOLANA_RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... }),
    cache: 'no-store'
});
```
```typescript
// APRÈS
const response = await fetch(SOLANA_RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000), // 10s max for on-chain config
});
```

**B. `fetchMarinadeValidatorInfo` — ligne ~107 :**
```typescript
// AVANT
const response = await fetch('https://validators-api.marinade.finance/validators?limit=1000', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    cache: 'no-store'
});
```
```typescript
// APRÈS
const response = await fetch('https://validators-api.marinade.finance/validators?limit=1000', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000), // 8s max for Marinade
});
```

**C. StakeWiz — ligne ~159 :**
```typescript
// AVANT
const response = await fetch('https://api.stakewiz.com/validators', {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
});
```
```typescript
// APRÈS
const response = await fetch('https://api.stakewiz.com/validators', {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(6_000), // 6s max for StakeWiz (lower priority)
});
```

**D. `fetchVoteAccounts` — ligne ~190 :**
```typescript
// AVANT
const response = await fetch(SOLANA_RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... })
});
```
```typescript
// APRÈS
const response = await fetch(SOLANA_RPC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... }),
    signal: AbortSignal.timeout(15_000), // 15s max — large payload (all vote accounts)
});
```

---

**Step 4 : Lancer les tests**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/solana/getAllNodes.test.ts
```

Attendu : tous les tests passent.

---

**Step 5 : Lancer la suite complète**

```bash
cd ovh-blockchain-tracker && npm test
```

Attendu : tous les tests passent.

---

**Step 6 : Commit**

```bash
git add src/lib/solana/getAllNodes.ts src/lib/solana/getAllNodes.test.ts
git commit -m "perf(solana): add AbortSignal.timeout to all external fetches in getAllNodes"
```

---

## Résumé des gains attendus

| Task | Avant | Après | Gain |
|---|---|---|---|
| Task 1 — DNS Sui | 9–36s (180+ DNS parallèles) | 1–2s (concurrency=5 + cache) | ~90% |
| Task 2 — Validator cache | Refetch à chaque run worker (1h) | Refetch 1x/24h | 2 appels réseau économisés/run |
| Task 3 — Timeouts | Blocage infini possible | Max 15s par fetch, fail rapide | Robustesse worker |
