# Prod Reliability + Hyperliquid Live Data — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix silent prod failures (stale data on 3 chains, AS14061 false positive, optional cron auth) and replace Hyperliquid hardcoded data with live API data.

**Architecture:** Three sequential sprints — Sprint 1 fixes what's broken in prod (no new features), Sprint 2 adds Hyperliquid live data following the standard chain pattern, Sprint 3 cleans up architecture debt. Each sprint is independently deployable.

**Tech Stack:** Next.js 16 App Router, TypeScript, LibSQL/Turso, MaxMind GeoLite2, Vercel Crons, Hyperliquid public API (`api.hyperliquid.xyz`)

---

## SPRINT 1 — Prod Reliability Fixes

### Task 1.1: Add missing crons to vercel.json

**Files:**
- Modify: `vercel.json`

**Context:**
Only Solana and Ethereum have declared Vercel crons. Avalanche, Sui, and Tron have cron handler routes (`/api/cron/avax-refresh`, `/api/cron/sui-refresh`, `/api/cron/tron-refresh`) but are never triggered automatically in prod.

**Step 1: Add the 3 missing cron entries**

Edit `vercel.json`, replace the `"crons"` array:

```json
"crons": [
    { "path": "/api/cron/refresh",         "schedule": "0 0 * * *" },
    { "path": "/api/cron/eth-refresh",     "schedule": "0 1 * * *" },
    { "path": "/api/cron/avax-refresh",    "schedule": "0 2 * * *" },
    { "path": "/api/cron/sui-refresh",     "schedule": "0 3 * * *" },
    { "path": "/api/cron/tron-refresh",    "schedule": "0 4 * * *" }
]
```

Stagger by 1h to avoid concurrent DB pressure.

**Step 2: Verify routes exist**

```bash
ls src/app/api/cron/
# Expected: avax-refresh/  eth-refresh/  refresh/  sui-refresh/  tron-refresh/
```

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "fix(cron): add missing avax/sui/tron crons to vercel.json"
```

---

### Task 1.2: Fix AS14061 — remove from OVH ASN list

**Files:**
- Modify: `src/lib/config/constants.ts`
- Create: `docs/data-methodology.md`

**Context:**
AS14061 appears in BOTH `OVH_ASN_LIST` and `digitalocean.asns` in `PROVIDER_ASN_MAP`. AS14061 is registered to **DigitalOcean** (verifiable via RIPE NCC). Its presence in the OVH list was likely added assuming "OVH Canada" but this is incorrect — OVH Canada primarily uses AS16276 and AS32790. Keeping it artificially inflates OVH market share.

**Step 1: Remove AS14061 from OVH_ASN_LIST**

In `src/lib/config/constants.ts`, change:

```typescript
// BEFORE
export const OVH_ASN_LIST = [
    'AS16276', // OVH SAS (Main)
    'AS35540', // OVH Managed
    'AS21351', // OVH Public Cloud
    'AS198203', // OVH Singapore
    'AS50082',  // OVH Australia
    'AS32790',  // OVH USA
    'AS14061',  // OVH Canada (sometimes DO shares this but mostly OVH CA)
];
```

```typescript
// AFTER
export const OVH_ASN_LIST = [
    'AS16276', // OVH SAS (Main)
    'AS35540', // OVH Managed
    'AS21351', // OVH Public Cloud
    'AS198203', // OVH Singapore
    'AS50082',  // OVH Australia
    'AS32790',  // OVH USA
    // NOTE: AS14061 intentionally excluded — belongs to DigitalOcean (RIPE-confirmed).
    // OVH Canada operates under AS16276 and AS32790. See docs/data-methodology.md.
];
```

**Step 2: Create data methodology doc**

Create `docs/data-methodology.md`:

```markdown
# Data Methodology

## ASN Detection

We use MaxMind GeoLite2-ASN (offline database, <1ms/IP) to map IP addresses to Autonomous System Numbers (ASNs), then classify each node by cloud provider.

### OVH ASN List

| ASN | Description | Source |
|-----|-------------|--------|
| AS16276 | OVH SAS (Main — EU/CA) | RIPE NCC |
| AS35540 | OVH Managed Services | RIPE NCC |
| AS21351 | OVH Public Cloud | RIPE NCC |
| AS198203 | OVH Singapore | RIPE NCC |
| AS50082 | OVH Australia | RIPE NCC |
| AS32790 | OVH USA / Canada | RIPE NCC |

### Known Exclusions & Tradeoffs

**AS14061 — DigitalOcean, NOT OVH**
- AS14061 is registered to DigitalOcean LLC (RIPE NCC, verified 2026-04).
- It was previously included in the OVH list under the assumption it was "OVH Canada" — this was incorrect.
- Removing it reduces false-positive OVH detections. OVH Canada infrastructure is covered by AS16276 and AS32790.

### Planned Improvements (Phase 2)

- Cross-reference with RIPE IRR (Internet Routing Registry) API for real-time ASN ownership validation.
- OVH publishes its ASN routes on RIPE — this would make the list self-updating rather than manually maintained.

## Ethereum Data Source

Ethereum validator data comes from **MigaLabs** (`migalabs.io/api`), not from direct RPC crawling.

**Why not direct RPC?**
- Ethereum peer discovery requires querying a node, which returns ~50 neighbors only. To get a statistically meaningful global picture would require thousands of recursive queries.
- MigaLabs runs dedicated crawlers that maintain a continuously updated view of the full validator set.

**Dependency risk:** If MigaLabs API changes format or access policy, Ethereum data collection breaks. Mitigation: monitor response schema version in `fetchMigalabs.ts`.

## Data Freshness

| Chain | Source | Refresh Frequency | TTL |
|-------|--------|-------------------|-----|
| Solana | Mainnet RPC | Every 24h (Vercel cron) | 1h |
| Ethereum | MigaLabs API | Every 24h (Vercel cron) | N/A (snapshots) |
| Avalanche | api.avax.network | Every 24h (Vercel cron) | 2h |
| Sui | Sui RPC fullnode | Every 24h (Vercel cron) | 2h |
| Tron | TronGrid API | Every 24h (Vercel cron) | 2h |
| Hyperliquid | api.hyperliquid.xyz | Every 24h (Vercel cron) | 2h |
```

**Step 3: Commit**

```bash
git add src/lib/config/constants.ts docs/data-methodology.md
git commit -m "fix(data): remove AS14061 from OVH list (belongs to DigitalOcean), add data methodology doc"
```

---

### Task 1.3: Make CRON_SECRET mandatory (fail-secure)

**Files:**
- Modify: `src/lib/utils/cronHandler.ts`

**Context:**
`createCronHandler` currently uses `if (env.cronSecret && authHeader !== ...)` — meaning if `CRON_SECRET` is not set in the environment, the auth check is **skipped entirely**. This is fail-open. The fix is fail-secure: if no secret is configured, deny all access.

**Step 1: Update the auth check in cronHandler.ts**

Change:

```typescript
// BEFORE
if (env.cronSecret && authHeader !== `Bearer ${env.cronSecret}`) {
    logger.warn(`[Cron/${prefix}] Unauthorized access attempt`);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

To:

```typescript
// AFTER
if (!env.cronSecret || authHeader !== `Bearer ${env.cronSecret}`) {
    logger.warn(`[Cron/${prefix}] Unauthorized access attempt`);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

This ensures: no `CRON_SECRET` set = all cron access denied (fail-secure).

**Step 2: Verify CRON_SECRET is set in Vercel**

In Vercel dashboard → Project Settings → Environment Variables, confirm `CRON_SECRET` exists. If not: generate a random 32-char hex value and add it.

For local dev, add to `.env.local`:
```
CRON_SECRET=your-local-dev-secret
```

**Step 3: Verify Vercel sends the secret in cron requests**

Vercel automatically adds `Authorization: Bearer $CRON_SECRET` to cron requests when `CRON_SECRET` is in the project env vars. No additional config needed.

**Step 4: Commit**

```bash
git add src/lib/utils/cronHandler.ts
git commit -m "fix(security): make CRON_SECRET mandatory in cron handler (fail-secure)"
```

---

### Task 1.4: Reduce session duration from 1 year to 14 days

**Files:**
- Modify: `src/app/api/auth/login/route.ts`

**Step 1: Update maxAge on both cookies**

In `src/app/api/auth/login/route.ts`, change both `maxAge` values:

```typescript
// BEFORE
maxAge: 60 * 60 * 24 * 365, // 1 year

// AFTER
maxAge: 60 * 60 * 24 * 14, // 14 days
```

Apply to both the `COOKIE_NAME` and `UI_COOKIE_NAME` cookies.

**Step 2: Commit**

```bash
git add src/app/api/auth/login/route.ts
git commit -m "fix(auth): reduce session cookie lifetime from 1 year to 14 days"
```

---

### Task 1.5: Document Tron in CLAUDE.md + create worker-tron.ts

**Files:**
- Modify: `CLAUDE.md`
- Create: `scripts/worker-tron.ts`
- Modify: `package.json`

**Context:**
Tron is fully integrated (lib/tron/, src/app/tron/, /api/cron/tron-refresh) but absent from CLAUDE.md and has no standalone worker script for manual runs.

**Step 1: Add Tron to CLAUDE.md**

In `CLAUDE.md`, update the "Blockchains intégrées" line:

```markdown
**Blockchains intégrées** : Solana, Ethereum, Avalanche, Sui, Tron, Hyperliquid (WIP)
```

Also add in the project structure under `api/cron/`:
```
│           └── tron-refresh/   # Tron data refresh
```

**Step 2: Create scripts/worker-tron.ts**

Model it on `scripts/worker-avax.ts`. Inspect `src/lib/tron/` to understand the function names, then create:

```typescript
import 'dotenv/config';
import { fetchTronNodes } from '../src/lib/tron/fetchNodes';
import { filterOVHNodes } from '../src/lib/tron/filterOVH';
import { calculateTronMetrics } from '../src/lib/tron/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { logger } from '../src/lib/utils';

async function run() {
    logger.info('[Worker/Tron] Starting...');
    const allNodes = await fetchTronNodes();
    logger.info(`[Worker/Tron] Fetched ${allNodes.length} nodes`);
    const ovhNodes = await filterOVHNodes(allNodes);
    logger.info(`[Worker/Tron] OVH nodes: ${ovhNodes.length}`);
    const metrics = calculateTronMetrics(allNodes, ovhNodes);
    await writeChainCache('tron', metrics, allNodes.length);
    logger.info('[Worker/Tron] Cache written. Done.');
}

run().catch((err) => {
    logger.error('[Worker/Tron] Fatal error:', err);
    process.exit(1);
});
```

> Adjust import paths and function names to match the actual exports in `src/lib/tron/`.

**Step 3: Add npm script**

In `package.json`, add to `"scripts"`:

```json
"worker:tron": "tsx scripts/worker-tron.ts"
```

**Step 4: Test the worker locally**

```bash
npm run worker:tron
# Expected: logs showing node count, OVH count, "Cache written. Done."
```

**Step 5: Commit**

```bash
git add CLAUDE.md scripts/worker-tron.ts package.json
git commit -m "feat(tron): add worker-tron.ts, document Tron in CLAUDE.md"
```

---

### Task 1.6: Add "Last updated" indicator to chain dashboards

**Files:**
- Check: each chain dashboard page (avalanche/page.tsx, sui/page.tsx, tron/page.tsx, hyperliquid/page.tsx, ethereum/page.tsx)
- The cache API responses already include a `timestamp` field — use it.

**Step 1: Check what the API returns**

Each chain API route returns JSON. Verify the response includes a timestamp:

```bash
curl http://localhost:3000/api/avalanche | jq '.timestamp // .cachedAt // .lastUpdated'
```

If the field exists, proceed. If not, it needs to be added to the route response.

**Step 2: Add timestamp to API response (if missing)**

In each `/api/{chain}/route.ts`, ensure the JSON response includes:

```typescript
return NextResponse.json({
    ...metrics,
    cachedAt: cache.timestamp,  // ISO string from chain-storage
});
```

**Step 3: Display in dashboard UI**

In each chain's main dashboard page component, add a small indicator near the header. Pattern to follow (add after the `<Header>` component):

```tsx
{data?.cachedAt && (
    <p className="text-xs text-gray-500 text-right -mt-2 mb-6">
        Last updated: {new Date(data.cachedAt).toLocaleString()}
    </p>
)}
```

**Step 4: Commit**

```bash
git add src/app/*/page.tsx src/app/api/*/route.ts
git commit -m "feat(ui): add last-updated timestamp to chain dashboards"
```

---

## SPRINT 2 — Hyperliquid Live Data

### Task 2.1: Validate Hyperliquid API access

**Files:** None (research step)

**Context:**
The Hyperliquid dashboard currently displays hardcoded data (24 validators, 66.6% AWS, etc.). The Hyperliquid public API at `https://api.hyperliquid.xyz/info` provides validator summaries.

**Step 1: Test the API manually**

```bash
curl -X POST https://api.hyperliquid.xyz/info \
  -H "Content-Type: application/json" \
  -d '{"type": "validatorSummaries"}'
```

Expected: JSON array of validator objects. Note the shape — specifically whether IP addresses are included or only public keys/names.

**Step 2: If IPs are NOT in the response**

Hyperliquid validators announce their IP via gossip. Alternative: use the `"/info"` endpoint with `type: "leaderboard"` or check if peer endpoints are available. If no IP is accessible via public API, document the limitation and use `sentry` or `signerAddress` to at minimum show which validators exist and their stake weight (even without geo-classification).

**Step 3: Document findings before proceeding**

Write a comment at the top of the new `src/lib/hyperliquid/fetchValidators.ts` explaining exactly what the API returns and what our strategy is.

---

### Task 2.2: Create lib/hyperliquid/ layer

**Files:**
- Create: `src/lib/hyperliquid/fetchValidators.ts`
- Create: `src/lib/hyperliquid/filterOVH.ts`
- Create: `src/lib/hyperliquid/calculateMetrics.ts`
- Create: `src/types/hyperliquid.ts`

**Follow the standard pattern** from `src/lib/avalanche/` or `src/lib/sui/` — these are the cleanest examples.

**Step 1: Create types**

In `src/types/hyperliquid.ts`:

```typescript
export interface HyperliquidValidator {
    address: string;      // Signer address
    name: string;         // Validator name/alias
    ip?: string;          // May not be available from public API
    stake: number;        // Staked amount
    isJailed: boolean;
}

export interface HyperliquidMetrics {
    totalValidators: number;
    ovhValidators: number;
    ovhMarketShare: number;
    providerBreakdown: Array<{
        provider: string;
        count: number;
        share: number;
    }>;
}
```

**Step 2: Create fetchValidators.ts**

```typescript
// src/lib/hyperliquid/fetchValidators.ts
//
// Hyperliquid API: https://api.hyperliquid.xyz/info
// POST { "type": "validatorSummaries" }
// Returns array of validator summaries.
// Note: IP addresses [are/are not] exposed in the public API as of 2026-04.
// If IPs are unavailable, we classify by validator name/org patterns only.

import { logger } from '@/lib/utils';
import { HyperliquidValidator } from '@/types/hyperliquid';

const API_URL = 'https://api.hyperliquid.xyz/info';

export async function fetchHyperliquidValidators(): Promise<HyperliquidValidator[]> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'validatorSummaries' }),
        next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`Hyperliquid API error: ${res.status}`);

    const data = await res.json();
    logger.info(`[Hyperliquid] Fetched ${data.length} validators`);

    // Map to our type — adjust field names based on actual API response
    return data.map((v: Record<string, unknown>) => ({
        address: v.validator as string,
        name: (v.name as string) ?? '',
        ip: (v.ip as string) ?? undefined,
        stake: Number(v.stake ?? 0),
        isJailed: Boolean(v.isJailed ?? false),
    }));
}
```

**Step 3: Create filterOVH.ts**

```typescript
// src/lib/hyperliquid/filterOVH.ts
import { lookupASN } from '@/lib/asn/maxmind';
import { identifyProvider } from '@/lib/shared/providers';
import { HyperliquidValidator } from '@/types/hyperliquid';

export async function filterOVHValidators(
    validators: HyperliquidValidator[]
): Promise<HyperliquidValidator[]> {
    const results: HyperliquidValidator[] = [];
    for (const v of validators) {
        if (!v.ip) continue; // Skip if no IP available
        const asn = await lookupASN(v.ip);
        const provider = identifyProvider(asn?.autonomousSystemNumber?.toString() ?? '', asn?.autonomousSystemOrganization ?? '');
        if (provider === 'OVHcloud') results.push(v);
    }
    return results;
}
```

**Step 4: Create calculateMetrics.ts**

Model on `src/lib/avalanche/calculateMetrics.ts`.

**Step 5: Write test for fetchValidators**

In `src/lib/hyperliquid/fetchValidators.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchHyperliquidValidators } from './fetchValidators';

describe('fetchHyperliquidValidators', () => {
    it('returns an array of validators', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                { validator: '0xabc', name: 'Test Validator', stake: '1000000', isJailed: false }
            ]
        }) as unknown as typeof fetch;

        const validators = await fetchHyperliquidValidators();
        expect(validators).toHaveLength(1);
        expect(validators[0].address).toBe('0xabc');
    });

    it('throws on non-200 response', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
        await expect(fetchHyperliquidValidators()).rejects.toThrow('503');
    });
});
```

**Step 6: Run tests**

```bash
npm run test src/lib/hyperliquid/
```

**Step 7: Commit**

```bash
git add src/lib/hyperliquid/ src/types/hyperliquid.ts
git commit -m "feat(hyperliquid): add fetchValidators, filterOVH, calculateMetrics lib layer"
```

---

### Task 2.3: Create /api/hyperliquid/route.ts

**Files:**
- Create: `src/app/api/hyperliquid/route.ts`

Model on `src/app/api/avalanche/route.ts` exactly.

```typescript
import { NextResponse } from 'next/server';
import { readChainCache } from '@/lib/cache/chain-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cache = await readChainCache('hyperliquid');
    if (!cache) {
        return NextResponse.json({ error: 'Data not available yet' }, { status: 503 });
    }
    return NextResponse.json({
        ...cache.data,
        cachedAt: cache.timestamp,
    });
}
```

**Commit:**
```bash
git add src/app/api/hyperliquid/route.ts
git commit -m "feat(hyperliquid): add /api/hyperliquid route"
```

---

### Task 2.4: Create /api/cron/hyperliquid-refresh/route.ts

**Files:**
- Create: `src/app/api/cron/hyperliquid-refresh/route.ts`

```typescript
import { createCronHandler } from '@/lib/utils/cronHandler';
import { fetchHyperliquidValidators } from '@/lib/hyperliquid/fetchValidators';
import { filterOVHValidators } from '@/lib/hyperliquid/filterOVH';
import { calculateHyperliquidMetrics } from '@/lib/hyperliquid/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('Hyperliquid', async () => {
    const allValidators = await fetchHyperliquidValidators();
    const ovhValidators = await filterOVHValidators(allValidators);
    const metrics = calculateHyperliquidMetrics(allValidators, ovhValidators);
    await writeChainCache('hyperliquid', metrics, allValidators.length);
    return {
        totalValidators: allValidators.length,
        ovhValidators: ovhValidators.length,
        marketShare: metrics.ovhMarketShare,
    };
});
```

Add to `vercel.json` crons:
```json
{ "path": "/api/cron/hyperliquid-refresh", "schedule": "0 5 * * *" }
```

**Commit:**
```bash
git add src/app/api/cron/hyperliquid-refresh/route.ts vercel.json
git commit -m "feat(hyperliquid): add cron refresh handler + vercel.json entry"
```

---

### Task 2.5: Replace hardcoded data in hyperliquid/page.tsx

**Files:**
- Modify: `src/app/hyperliquid/page.tsx`

**Step 1: Convert to async server component**

Replace the static `HYPERLIQUID_DATA` const with a fetch from `/api/hyperliquid`. The page should become a server component (remove `'use client'`, add `async`).

Move any client-only components (animations, etc.) to a separate client component `src/components/dashboard/HyperliquidDashboard.tsx`.

**Step 2: Add a "Coming Soon" fallback**

If the API returns 503 (cache not yet populated), show a placeholder instead of crashing:

```tsx
export default async function HyperliquidPage() {
    let data = null;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/hyperliquid`, { cache: 'no-store' });
        if (res.ok) data = await res.json();
    } catch {}

    if (!data) {
        return <ComingSoonPlaceholder chain="Hyperliquid" />;
    }

    return <HyperliquidDashboard data={data} />;
}
```

**Step 3: Update the animated tagline to use live data**

Replace:
```tsx
<AnimatedTagline text="TRACKING 24 VALIDATORS ACROSS THE GLOBE • HYPERLIQUID NETWORK CENTRALIZATION" />
```

With:
```tsx
<AnimatedTagline text={`TRACKING ${data.totalValidators} VALIDATORS ACROSS THE GLOBE • HYPERLIQUID NETWORK CENTRALIZATION`} />
```

**Step 4: Seed the cache for first run**

Before deploying, trigger the cron manually:

```bash
curl -X GET https://your-vercel-url/api/cron/hyperliquid-refresh \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Step 5: Commit**

```bash
git add src/app/hyperliquid/ src/components/dashboard/
git commit -m "feat(hyperliquid): replace hardcoded data with live API, add server-side fetch"
```

---

## SPRINT 3 — Architecture Cleanup

### Task 3.1: Create worker-sui.ts

**Files:**
- Create: `scripts/worker-sui.ts`
- Modify: `package.json`

Model exactly on `scripts/worker-avax.ts`. Inspect `src/lib/sui/` for function names. Add `"worker:sui": "tsx scripts/worker-sui.ts"` to `package.json` scripts.

**Commit:**
```bash
git add scripts/worker-sui.ts package.json
git commit -m "feat(sui): add worker-sui.ts for manual data refresh"
```

---

### Task 3.2: Unify provider matching — remove duplicate regex from fetchMigalabs

**Files:**
- Modify: `src/lib/ethereum/fetchMigalabs.ts`
- Read first: `src/lib/shared/providers.ts`

**Context:**
`fetchMigalabs.ts` has its own `PROVIDER_NAME_PATTERNS` regex array that duplicates the logic in `identifyProvider()`. When a provider is added or an ASN updated, it must be changed in two places.

**Step 1: Read both files**

Verify that `identifyProvider(asn, orgName)` in `providers.ts` handles all the cases in `PROVIDER_NAME_PATTERNS` from `fetchMigalabs.ts`.

**Step 2: Replace local regex with identifyProvider**

In `fetchMigalabs.ts`, remove `PROVIDER_NAME_PATTERNS` and replace the matching logic with a call to `identifyProvider()`.

**Step 3: Run existing tests**

```bash
npm run test
# All tests must pass — specifically the shared provider tests
```

**Step 4: Commit**

```bash
git add src/lib/ethereum/fetchMigalabs.ts
git commit -m "refactor(ethereum): unify provider matching — use identifyProvider() from shared/providers"
```

---

### Task 3.3: Consider Solana route restructure (/solana vs /)

**Files:**
- This is a discussion task — do NOT implement without explicit approval

**Context:**
Solana is served at `/` (root) while all other chains have explicit paths (`/avalanche`, `/sui`, etc.). This creates an implicit hierarchy that becomes misleading as the app expands.

**Option A — Keep as-is:**
Add a `/solana` alias that redirects to `/`. Low effort, minimal disruption.

```typescript
// src/app/solana/page.tsx
import { redirect } from 'next/navigation';
export default function SolanaAlias() { redirect('/'); }
```

**Option B — Full migration:**
Move the entire Solana dashboard to `/solana`, add a new home page (`/`) that is a "select a chain" landing page or redirects to `/solana` by default.

**Recommendation:** Option A first (alias), then Option B when there's time for a proper home page redesign. Ask the user before implementing Option B.

---

### Task 3.4: Add Hyperliquid to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

Update:
```markdown
**Blockchains intégrées** : Solana, Ethereum, Avalanche, Sui, Tron, Hyperliquid
```

Remove "(WIP)" once Sprint 2 is complete.

**Commit:**
```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — Tron + Hyperliquid as full integrations"
```

---

## Deployment Checklist

Before deploying Sprint 1:
- [ ] `CRON_SECRET` set in Vercel env vars
- [ ] `AUTH_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD` confirmed set
- [ ] Local `.env.local` updated with `CRON_SECRET` for dev testing

Before deploying Sprint 2:
- [ ] Manually trigger `/api/cron/hyperliquid-refresh` once to seed cache
- [ ] Verify `/api/hyperliquid` returns live data
- [ ] Verify hyperliquid/page.tsx shows live validator count (not "24")

## VPS / Docker migration notes

When migrating from Vercel to OVH VPS:
- Workers (`worker.ts`, `worker-avax.ts`, `worker-sui.ts`, `worker-tron.ts`) become PM2 or systemd services with `--watch` disabled and a cron expression
- Vercel cron routes (`/api/cron/*`) still work — they become cron jobs that `curl` the route with `Authorization: Bearer $CRON_SECRET`
- Or: bypass the HTTP layer entirely and call the refresh logic directly from workers
- The `ecosystem.config.js` (PM2) should be committed and documented
