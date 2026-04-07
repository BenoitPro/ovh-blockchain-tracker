# Avalanche Entity Identification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display the organization name behind each Avalanche validator (like Solana does via Marinade), show stake as the primary metric, and remove the "Fee" column from the Avalanche node explorer.

**Architecture:** Add a multi-source `fetchAvalancheValidatorInfo()` that queries P-Chain getCurrentValidators (stake data) and Avascan (names) in parallel, merge results into a `Map<nodeID, meta>`, then attach to each enriched node in `getAllNodes.ts`. UI config gets `showFeeColumn: false` for Avalanche. The `GenericNodeExplorer` gains an optional `showFeeColumn` flag.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Avalanche P-Chain RPC, Glacier API (AvaLabs), Avascan public API.

---

### Task 1: Extend `AvalancheOVHNode` type

**Files:**
- Modify: `src/types/avalanche.ts`

**Step 1: Add new fields to `AvalancheOVHNode`**

In `src/types/avalanche.ts`, replace the `AvalancheOVHNode` interface:

```typescript
export interface AvalancheOVHNode extends AvalancheNode {
    ipInfo: AvalancheIPInfo;
    provider?: string;
    name?: string;           // Organization name (from Avascan or formatted nodeID)
    stakeAmount?: string;    // AVAX staked in nAVAX (e.g. "2000000000000")
    delegationFee?: number;  // Delegation fee 0–100 (%)
    rewardAddress?: string;  // Primary reward wallet address (P-avax1...)
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep -E "avalanche.ts|AvalancheOVHNode"
```
Expected: no output (no errors).

**Step 3: Commit**

```bash
git add src/types/avalanche.ts
git commit -m "feat(avalanche): add name/stake/fee/rewardAddress fields to AvalancheOVHNode"
```

---

### Task 2: Create `fetchValidatorInfo.ts` — multi-source validator metadata

**Files:**
- Create: `src/lib/avalanche/fetchValidatorInfo.ts`

This mirrors `fetchValidatorList` in `src/lib/solana/getAllNodes.ts`. It queries three sources in parallel and merges results into a single map keyed by `nodeID`.

**Step 1: Create the file**

```typescript
import { logger } from '@/lib/utils';

export interface AvalancheValidatorMeta {
    name?: string;
    stakeAmount?: string;  // nAVAX as string
    delegationFee?: number;
    rewardAddress?: string;
}

const PCHAIN_ENDPOINT = 'https://api.avax.network/ext/bc/P';
const GLACIER_ENDPOINT = 'https://glacier-api.avax.network/v1/primaryNetwork/validators';
const AVASCAN_ENDPOINT = 'https://avascan.info/api/v2/staking/validators';

/**
 * Source 1: P-Chain platform.getCurrentValidators
 * Returns stake amounts, delegation fees, and reward addresses.
 * No human names, but authoritative on-chain data.
 */
async function fetchPChainValidators(): Promise<Map<string, AvalancheValidatorMeta>> {
    const map = new Map<string, AvalancheValidatorMeta>();
    try {
        const response = await fetch(PCHAIN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1,
                method: 'platform.getCurrentValidators',
                params: {},
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) throw new Error(`P-Chain HTTP ${response.status}`);
        const json = await response.json();
        if (json.error) throw new Error(json.error.message);

        const validators: any[] = json.result?.validators ?? [];
        for (const v of validators) {
            if (!v.nodeID) continue;
            const addresses: string[] = v.rewardOwner?.addresses ?? [];
            map.set(v.nodeID, {
                stakeAmount: v.stakeAmount ?? undefined,
                delegationFee: v.delegationFee !== undefined
                    ? parseFloat(v.delegationFee)
                    : undefined,
                rewardAddress: addresses[0] ?? undefined,
            });
        }
        logger.info(`[Avalanche/PChain] ${map.size} validators fetched`);
    } catch (e) {
        logger.warn('[Avalanche/PChain] Failed to fetch validators:', e);
    }
    return map;
}

/**
 * Source 2: Glacier API (AvaLabs official, paginated)
 * Provides structured stake + fee data as a cross-check. No names.
 */
async function fetchGlacierValidators(): Promise<Map<string, AvalancheValidatorMeta>> {
    const map = new Map<string, AvalancheValidatorMeta>();
    try {
        let pageToken: string | undefined;
        let page = 0;
        do {
            const url = new URL(GLACIER_ENDPOINT);
            url.searchParams.set('pageSize', '100');
            if (pageToken) url.searchParams.set('pageToken', pageToken);

            const response = await fetch(url.toString(), {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok) throw new Error(`Glacier HTTP ${response.status}`);
            const json = await response.json();

            const validators: any[] = json.validators ?? [];
            for (const v of validators) {
                const nodeId: string = v.nodeId ?? v.nodeID;
                if (!nodeId) continue;
                if (!map.has(nodeId)) {
                    const rewards: string[] = v.rewardAddresses ?? [];
                    map.set(nodeId, {
                        stakeAmount: v.amountStaked?.toString() ?? undefined,
                        delegationFee: v.delegationFee !== undefined
                            ? parseFloat(v.delegationFee)
                            : undefined,
                        rewardAddress: rewards[0] ?? undefined,
                    });
                }
            }

            pageToken = json.nextPageToken;
            page++;
            if (page > 50) break; // Safety: max 5000 validators
        } while (pageToken);

        logger.info(`[Avalanche/Glacier] ${map.size} validators fetched`);
    } catch (e) {
        logger.warn('[Avalanche/Glacier] Failed to fetch validators:', e);
    }
    return map;
}

/**
 * Source 3: Avascan API (community explorer — best name coverage)
 * Similar role to Marinade Finance for Solana.
 * If endpoint unavailable, returns empty map (graceful degradation).
 */
async function fetchAvascanValidatorNames(): Promise<Map<string, string>> {
    const map = new Map<string, string>(); // nodeID → name
    try {
        // Try paginated list
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const url = `${AVASCAN_ENDPOINT}?limit=${limit}&offset=${offset}&type=validator`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                cache: 'no-store',
                signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) throw new Error(`Avascan HTTP ${response.status}`);
            const json = await response.json();

            // Handle both { validators: [...] } and { results: [...] } shapes
            const items: any[] = json.validators ?? json.results ?? json.data ?? [];
            if (items.length === 0) { hasMore = false; break; }

            for (const v of items) {
                // Avascan may use different field names — try common patterns
                const nodeId: string = v.nodeID ?? v.nodeId ?? v.id ?? '';
                const name: string = (v.name ?? v.validatorName ?? v.moniker ?? '').trim();
                if (nodeId && name) map.set(nodeId, name);
            }

            hasMore = items.length === limit;
            offset += limit;
            if (offset > 5000) break; // Safety cap
        }

        logger.info(`[Avalanche/Avascan] ${map.size} named validators fetched`);
    } catch (e) {
        logger.warn('[Avalanche/Avascan] Name fetch failed (non-blocking):', e);
    }
    return map;
}

/**
 * Fetch and merge validator metadata from all sources.
 * Priority: P-Chain/Glacier for stake data, Avascan for names.
 *
 * @returns Map<nodeID, AvalancheValidatorMeta>
 */
export async function fetchAvalancheValidatorInfo(): Promise<Map<string, AvalancheValidatorMeta>> {
    const [pchainMap, glacierMap, avascanNames] = await Promise.all([
        fetchPChainValidators(),
        fetchGlacierValidators(),
        fetchAvascanValidatorNames(),
    ]);

    // Merge: start with P-Chain data (canonical), layer Glacier, then add names from Avascan
    const merged = new Map<string, AvalancheValidatorMeta>();

    // P-Chain is authoritative for on-chain data
    pchainMap.forEach((meta, nodeId) => merged.set(nodeId, { ...meta }));

    // Glacier may fill gaps or provide the same data differently
    glacierMap.forEach((meta, nodeId) => {
        const existing = merged.get(nodeId);
        if (!existing) {
            merged.set(nodeId, { ...meta });
        } else {
            // Prefer P-Chain stakeAmount if we already have it, else use Glacier's
            if (!existing.stakeAmount && meta.stakeAmount) existing.stakeAmount = meta.stakeAmount;
            if (existing.delegationFee === undefined && meta.delegationFee !== undefined) {
                existing.delegationFee = meta.delegationFee;
            }
            if (!existing.rewardAddress && meta.rewardAddress) existing.rewardAddress = meta.rewardAddress;
        }
    });

    // Overlay names from Avascan
    avascanNames.forEach((name, nodeId) => {
        const existing = merged.get(nodeId);
        if (existing) {
            existing.name = name;
        } else {
            merged.set(nodeId, { name });
        }
    });

    const namedCount = Array.from(merged.values()).filter(m => m.name).length;
    const withStake = Array.from(merged.values()).filter(m => m.stakeAmount).length;
    logger.info(`[Avalanche/ValidatorInfo] ${merged.size} total | ${namedCount} named | ${withStake} with stake`);

    return merged;
}
```

**Step 2: Verify TypeScript**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep fetchValidatorInfo
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/lib/avalanche/fetchValidatorInfo.ts
git commit -m "feat(avalanche): add multi-source validator info fetcher (P-Chain + Glacier + Avascan)"
```

---

### Task 3: Enrich nodes in `getAllNodes.ts`

**Files:**
- Modify: `src/lib/avalanche/getAllNodes.ts`

**Step 1: Import and call `fetchAvalancheValidatorInfo` in parallel**

Replace the current content of `fetchEnrichedAvalancheNodes` with:

```typescript
import { AvalancheNode, AvalancheOVHNode, AvalancheIPInfo } from '@/types';
import { fetchAvalanchePeers, extractAvalancheIP } from './fetchPeers';
import { fetchAvalancheValidatorInfo } from './fetchValidatorInfo';
import {
    initMaxMind,
    batchGetASN,
    batchGetCountry,
} from '@/lib/asn/maxmind';
import { identifyProvider } from '@/lib/shared/providers';
import { logger } from '@/lib/utils';

export async function fetchEnrichedAvalancheNodes(): Promise<AvalancheOVHNode[]> {
    try {
        await initMaxMind();

        // Run peer fetch + validator info fetch in parallel
        const [peers, validatorInfo] = await Promise.all([
            fetchAvalanchePeers(),
            fetchAvalancheValidatorInfo(),
        ]);

        // Extract clean IPs for batch lookup
        const ips: string[] = [];
        for (const peer of peers) {
            const ip = extractAvalancheIP(peer.ip);
            if (ip) ips.push(ip);
        }

        const asnResults = batchGetASN(ips);
        const countryResults = batchGetCountry(ips);

        const enriched: AvalancheOVHNode[] = peers.map(peer => {
            const cleanIP = extractAvalancheIP(peer.ip) ?? '';
            const asnInfo = cleanIP ? asnResults.get(cleanIP) : null;
            const countryInfo = cleanIP ? countryResults.get(cleanIP) : null;
            const meta = validatorInfo.get(peer.nodeID);

            const ipInfo: AvalancheIPInfo = {
                ip: cleanIP || peer.ip,
                asn: asnInfo?.asn || 'AS Unknown',
                org: asnInfo?.org || 'Unknown Provider',
                country: countryInfo?.countryCode || 'Unknown',
                country_name: countryInfo?.country || 'Unknown',
                city: 'Unknown',
                latitude: 0,
                longitude: 0,
            };

            return {
                ...peer,
                ipInfo,
                provider: identifyProvider(ipInfo.asn, ipInfo.org),
                name: meta?.name,
                stakeAmount: meta?.stakeAmount,
                delegationFee: meta?.delegationFee,
                rewardAddress: meta?.rewardAddress,
            };
        });

        // Sort by stake descending (biggest validators first), fallback to uptime
        enriched.sort((a, b) => {
            const stakeA = parseInt(a.stakeAmount || '0');
            const stakeB = parseInt(b.stakeAmount || '0');
            if (stakeB !== stakeA) return stakeB - stakeA;
            return (b.observedUptime ?? 0) - (a.observedUptime ?? 0);
        });

        const named = enriched.filter(n => n.name).length;
        logger.info(`[Avalanche/Explorer] Enriched ${enriched.length} peers | ${named} identified`);
        return enriched;
    } catch (error) {
        logger.error('[Avalanche/Explorer] Enrichment failed:', error);
        throw error;
    }
}
```

**Step 2: Verify TypeScript**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep -E "getAllNodes|AvalancheOVHNode"
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/lib/avalanche/getAllNodes.ts
git commit -m "feat(avalanche): enrich nodes with validator name/stake/fee/address from multi-source fetch"
```

---

### Task 4: Update API route to search by name

**Files:**
- Modify: `src/app/api/avalanche/nodes/route.ts`

**Step 1: Add `name` to search filter**

Replace the search filter block:

```typescript
// BEFORE
if (search) {
    filtered = allNodes.filter(n =>
        n.nodeID.toLowerCase().includes(search) ||
        (n.ipInfo?.ip || '').toLowerCase().includes(search) ||
        (n.provider || '').toLowerCase().includes(search) ||
        (n.ipInfo?.country_name || '').toLowerCase().includes(search) ||
        (n.version || '').toLowerCase().includes(search)
    );
}

// AFTER
if (search) {
    filtered = allNodes.filter(n =>
        n.nodeID.toLowerCase().includes(search) ||
        (n.name || '').toLowerCase().includes(search) ||
        (n.ipInfo?.ip || '').toLowerCase().includes(search) ||
        (n.provider || '').toLowerCase().includes(search) ||
        (n.ipInfo?.country_name || '').toLowerCase().includes(search) ||
        (n.version || '').toLowerCase().includes(search)
    );
}
```

**Step 2: Verify TypeScript**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep "avalanche/nodes"
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/app/api/avalanche/nodes/route.ts
git commit -m "feat(avalanche): add name to node search filter"
```

---

### Task 5: Add `showFeeColumn` flag to `GenericNodeExplorer`

**Files:**
- Modify: `src/components/nodes/GenericNodeExplorer.tsx`

The "Fee" column header is hardcoded at line 250 and the cell renders at lines 311–319. We need to hide both when `showFeeColumn === false`.

**Step 1: Add `showFeeColumn` to the config interface**

In the `NodeExplorerConfig<T>` interface (around line 18), add the optional field after `accentColor`:

```typescript
// Theme
accentColor: string;
showFeeColumn?: boolean;  // default true — set false to hide Fee/Version column
```

**Step 2: Hide the column header when `showFeeColumn` is false**

Find the table header div (around line 246):
```tsx
// BEFORE
<div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border-y border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 sticky top-0 z-10 backdrop-blur-xl">
    <div className="col-span-1">#</div>
    <div className="col-span-4">Identity</div>
    <div className="col-span-2 text-right">Metric</div>
    <div className="col-span-1 text-center">Fee</div>
    <div className="col-span-2">Provider</div>
    <div className="col-span-2 text-right">Location</div>
</div>
```

Replace with:
```tsx
// AFTER
<div className={`hidden md:grid gap-4 px-6 py-3 bg-white/5 border-y border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 sticky top-0 z-10 backdrop-blur-xl ${config.showFeeColumn === false ? 'grid-cols-11' : 'grid-cols-12'}`}>
    <div className="col-span-1">#</div>
    <div className={config.showFeeColumn === false ? 'col-span-5' : 'col-span-4'}>Identity</div>
    <div className="col-span-2 text-right">Metric</div>
    {config.showFeeColumn !== false && <div className="col-span-1 text-center">Fee</div>}
    <div className="col-span-2">Provider</div>
    <div className="col-span-2 text-right">Location</div>
</div>
```

**Step 3: Hide the fee cell in each row**

Find the row grid div (around line 277):
```tsx
// BEFORE
<div
    key={config.getKey(node)}
    className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center rounded-xl transition-all border"
    ...
>
```

Replace the className:
```tsx
// AFTER
<div
    key={config.getKey(node)}
    className={`group relative grid grid-cols-1 gap-4 px-6 py-4 items-center rounded-xl transition-all border ${config.showFeeColumn === false ? 'md:grid-cols-11' : 'md:grid-cols-12'}`}
    ...
>
```

Then find the fee cell (around line 311) and conditionally render it:
```tsx
// BEFORE
<div className="col-span-1 text-center">
    <span className={`text-xs px-2 py-1 rounded-md ${
        commissionVal >= 100 ? 'bg-red-500/20 text-red-400'
        : commissionVal === 0 ? 'bg-green-500/20 text-green-400'
        : 'bg-white/10 text-white/60'
    }`}>
        {commission}
    </span>
</div>
```

Replace with:
```tsx
// AFTER
{config.showFeeColumn !== false && (
    <div className="col-span-1 text-center">
        <span className={`text-xs px-2 py-1 rounded-md ${
            commissionVal >= 100 ? 'bg-red-500/20 text-red-400'
            : commissionVal === 0 ? 'bg-green-500/20 text-green-400'
            : 'bg-white/10 text-white/60'
        }`}>
            {commission}
        </span>
    </div>
)}
```

Also update the Identity column span to compensate:
```tsx
// BEFORE
<div className="col-span-4 flex items-center space-x-3 overflow-hidden">
// AFTER
<div className={`${config.showFeeColumn === false ? 'col-span-5' : 'col-span-4'} flex items-center space-x-3 overflow-hidden`}>
```

**Step 4: Verify TypeScript**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep GenericNodeExplorer
```
Expected: no output.

**Step 5: Commit**

```bash
git add src/components/nodes/GenericNodeExplorer.tsx
git commit -m "feat(explorer): add optional showFeeColumn config flag to GenericNodeExplorer"
```

---

### Task 6: Update `AvalancheNodeExplorer.tsx` — show name, stake, hide fee

**Files:**
- Modify: `src/components/nodes/AvalancheNodeExplorer.tsx`

Replace the entire `AVAX_CONFIG` object:

```typescript
const AVAX_CONFIG: NodeExplorerConfig<AvalancheOVHNode> = {
    apiEndpoint: '/api/avalanche/nodes',
    accentColor: '#E84142',
    showFeeColumn: false,

    getKey: (n) => n.nodeID,
    getIdentifier: (n) => n.nodeID,
    getName: (n) => {
        if (n.name) return n.name;
        // Fallback: short nodeID (last 10 chars)
        const id = n.nodeID.replace('NodeID-', '');
        return id.length > 12 ? `…${id.slice(-10)}` : id;
    },
    getImage: undefined,

    // Primary metric: stake in AVAX (nAVAX ÷ 1e9)
    getPrimaryMetric: (n) => parseInt(n.stakeAmount || '0'),
    formatPrimaryMetric: (n) => {
        const nAvax = parseInt(n.stakeAmount || '0');
        if (nAvax === 0) {
            // Fallback to uptime when no stake data available
            return { main: `${(n.observedUptime ?? 0).toFixed(1)}%`, sub: 'uptime' };
        }
        const avax = nAvax / 1e9;
        const formatted = avax >= 1_000_000
            ? `${(avax / 1_000_000).toFixed(2)}M`
            : avax >= 1_000
            ? `${(avax / 1_000).toFixed(1)}K`
            : avax.toFixed(0);
        return { main: `${formatted} AVAX`, sub: 'staked' };
    },

    // Fee column hidden — these values won't render but must be provided
    formatCommission: () => '—',
    getCommissionValue: () => 50,

    getProvider: (n) => n.provider || 'Unknown',
    getASN: (n) => n.ipInfo?.asn || 'AS Unknown',
    getCountryCode: (n) => n.ipInfo?.country || '',
    getCountryName: (n) => n.ipInfo?.country_name || '',
    getFilterProvider: (n) => n.provider || '',
    getFilterCountry: (n) => n.ipInfo?.country_name || '',

    isOVH: (n) => (n.provider || '').toLowerCase().includes('ovh'),

    sortOptions: [
        { value: 'stake_desc', label: 'Stake (Highest First)' },
        { value: 'stake_asc', label: 'Stake (Lowest First)' },
        { value: 'uptime_desc', label: 'Uptime (Highest First)' },
        { value: 'provider_asc', label: 'Provider (A → Z)' },
    ],
    sortNodes: (nodes, sortBy) => {
        const n = [...nodes];
        if (sortBy === 'stake_desc') n.sort((a, b) => parseInt(b.stakeAmount || '0') - parseInt(a.stakeAmount || '0'));
        else if (sortBy === 'stake_asc') n.sort((a, b) => parseInt(a.stakeAmount || '0') - parseInt(b.stakeAmount || '0'));
        else if (sortBy === 'uptime_desc') n.sort((a, b) => (b.observedUptime ?? 0) - (a.observedUptime ?? 0));
        else if (sortBy === 'provider_asc') n.sort((a, b) => (a.provider || '').localeCompare(b.provider || ''));
        return n;
    },
    getOVHNodes: (nodes) => nodes.filter(n => (n.provider || '').toLowerCase().includes('ovh')),

    viewModeLabels: { all: 'All Providers', ovh: 'OVH Only' },
    searchPlaceholder: 'Search by Name, NodeID, IP, Provider, or Country…',
    csvFilename: 'avalanche_nodes_export',
    csvHeaders: ['Name', 'NodeID', 'IP', 'Stake (AVAX)', 'Delegation Fee (%)', 'Reward Address', 'Uptime (%)', 'Provider', 'ASN', 'Country'],
    getCSVRow: (n) => [
        `"${n.name || ''}"`,
        `"${n.nodeID}"`,
        extractAvalancheIP(n.ip) || n.ip,
        n.stakeAmount ? (parseInt(n.stakeAmount) / 1e9).toFixed(2) : '',
        n.delegationFee !== undefined ? n.delegationFee.toFixed(2) : '',
        n.rewardAddress || '',
        (n.observedUptime ?? 0).toFixed(2),
        `"${n.provider || 'Unknown'}"`,
        n.ipInfo?.asn || '',
        `"${n.ipInfo?.country_name || ''}"`,
    ],
};
```

**Step 2: Verify TypeScript**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep AvalancheNodeExplorer
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/components/nodes/AvalancheNodeExplorer.tsx
git commit -m "feat(avalanche): show org name + stake as primary metric, hide Fee column, expand CSV"
```

---

### Task 7: Smoke test in dev

**Step 1: Start dev server**

```bash
cd ovh-blockchain-tracker && npm run dev
```

**Step 2: Navigate to Avalanche nodes**

Open `http://localhost:3000/avalanche/nodes`

**Check:**
- [ ] No "Fee" column in the header
- [ ] Identity column is slightly wider (col-span-5)
- [ ] Primary metric shows "AVAX staked" (e.g. "2.5K AVAX") when stake data is available, falls back to "% uptime" for nodes not in validator set
- [ ] Validators with known names (e.g. "Figment", "Everstake") show their org name instead of `…XXXXXXXXXX`
- [ ] Sort by "Stake (Highest First)" works
- [ ] Search by org name returns matching rows
- [ ] CSV export includes Name and Reward Address columns

**Step 3: Check coverage log**

In the terminal running `npm run dev`, look for:
```
[Avalanche/ValidatorInfo] N total | M named | K with stake
```
`M named` should be > 0 if Avascan API is reachable. If it's 0, Avascan endpoint may need adjustment (see Troubleshooting below).

---

### Troubleshooting: Avascan API endpoint

If `M named = 0` after the smoke test, the Avascan endpoint shape may differ. Check the raw response:

```bash
curl -s "https://avascan.info/api/v2/staking/validators?limit=5&offset=0&type=validator" | jq '.'
```

Adjust the field names in `fetchAvascanValidatorNames` in `src/lib/avalanche/fetchValidatorInfo.ts`:
- Look at the top-level key (may be `validators`, `data`, `results`, `items`)
- Look at the nodeID field (`nodeID`, `nodeId`, `id`)  
- Look at the name field (`name`, `validatorName`, `moniker`, `label`)

If Avascan is unavailable, consider as alternative:
```
GET https://api.avascan.info/v2/network/mainnet/staking/validations/active
```

**Re-commit after fix:**
```bash
git add src/lib/avalanche/fetchValidatorInfo.ts
git commit -m "fix(avalanche): adjust Avascan API field names for validator name resolution"
```
