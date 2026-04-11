# Monad Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Monad as a fully-integrated chain with Dashboard, Nodes, Analytics, Use Cases, and Guide pages — using country/city data scraped from gmonads.com, with "Coming Soon" banners for OVH/ASN detection.

**Architecture:** gmonads.com is scraped via HTTP (no auth needed). Validator data (name, country, city, stake, success rate, status) is stored in Turso via the standard `chain-storage.ts` cache under key `monad-metrics`. No MaxMind/ASN lookup is used — OVH detection is deferred until a MonadBFT crawler is built.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, LibSQL/Turso, Vitest, tsx worker, Vercel Cron

**Project root for all file paths:** `ovh-blockchain-tracker/` (one level below the repo root `App track OVH footprint blockchain/`)

---

## ⚠️ Prerequisites — Read before coding

### gmonads.com API discovery (do this FIRST, before Task 3)

Before implementing `fetchValidators.ts`, open browser DevTools on https://www.gmonads.com/validators and inspect network requests to find how the validator data is loaded:

**Case A — Direct JSON endpoint** (most likely for modern dashboards):
Look for a request like `api.gmonads.com/validators` or `/api/validators`. If found, use `fetch(url)` directly.

**Case B — Next.js `__NEXT_DATA__`**:
If the site is Next.js with SSR, the page HTML contains `<script id="__NEXT_DATA__">` with embedded JSON. Extract with:
```typescript
const html = await fetch('https://www.gmonads.com/validators').then(r => r.text());
const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const data = JSON.parse(match![1]);
```

**Case C — Client-side only**:
Data only appears after JS execution → use a headless approach or find the underlying API from the JS bundle.

Write the discovered endpoint/approach in a comment at the top of `fetchValidators.ts`.

---

## Task 1: Scaffold types

**Files:**
- Create: `src/types/monad.ts`
- Modify: `src/types/index.ts`

**Step 1: Create the types file**

```typescript
// src/types/monad.ts

/**
 * Monad-specific types
 *
 * Data source: gmonads.com (community validator dashboard)
 * OVH/ASN detection: NOT AVAILABLE — requires MonadBFT crawler (roadmap)
 */

export interface MonadValidator {
  /** Validator display name */
  name: string;
  /** Country name (e.g. "United States") */
  country: string;
  /** City name (e.g. "Ashburn") */
  city: string;
  /** Total stake in MON */
  stake: number;
  /** Success rate 0–100 */
  successRate: number;
  /** Whether the validator is in the active set */
  active: boolean;
}

export interface MonadDashboardMetrics {
  /** Total validators scraped */
  totalValidators: number;
  /** Validators with active status */
  activeValidators: number;
  /** Number of distinct countries */
  countryCount: number;
  /** Total MON staked across all validators */
  totalStakeMON: number;
  /** Average success rate (0–100) */
  avgSuccessRate: number;
  /**
   * Geo distribution for WorldMap component.
   * Key = country name, value = validator count.
   * Note: OVH-specific geoDistribution is not available.
   */
  geoDistribution: Record<string, number>;
  /** Top 10 countries with count + total stake */
  countryBreakdown: MonadCountryEntry[];
  /** Top cities with validator count */
  cityBreakdown: MonadCityEntry[];
}

export interface MonadCountryEntry {
  country: string;
  count: number;
  totalStake: number;
  percentage: number;
}

export interface MonadCityEntry {
  city: string;
  country: string;
  count: number;
}

export interface MonadAPIResponse {
  success: boolean;
  data?: MonadDashboardMetrics;
  error?: string;
  cached?: boolean;
  stale?: boolean;
  timestamp?: number;
}
```

**Step 2: Export from index**

In `src/types/index.ts`, add at the end:
```typescript
export * from './monad';
```

**Step 3: Commit**

```bash
git add ovh-blockchain-tracker/src/types/monad.ts ovh-blockchain-tracker/src/types/index.ts
git commit -m "feat(monad): add TypeScript types for Monad integration"
```

---

## Task 2: Register chain in chains.ts and chain-storage.ts

**Files:**
- Modify: `src/lib/chains.ts`
- Modify: `src/lib/cache/chain-storage.ts`

**Step 1: Add Monad to chains.ts**

In `src/lib/chains.ts`, update the `ChainId` type and `CHAINS` record:

```typescript
// Change line 1:
export type ChainId = 'solana' | 'ethereum' | 'avalanche' | 'hyperliquid' | 'sui' | 'tron' | 'bnbchain' | 'monad';

// Add to the CHAINS record before the closing brace:
  monad: {
    id: 'monad',
    name: 'Monad',
    accent: '#836EF9',
    route: '/monad',
    cssClass: 'monad-theme',
    bgTint: 'rgba(131,110,249,0.10)',
  },
```

**Step 2: Add Monad to chain-storage.ts**

In `src/lib/cache/chain-storage.ts`, add `monad` to `CACHE_KEYS` and `CACHE_TTL`:

```typescript
// In CACHE_KEYS, add:
    monad: 'monad-metrics',

// In CACHE_TTL, add:
    monad: 2 * 60 * 60 * 1000, // 2 hours
```

Also update the header comment to include:
```
 *   'monad-metrics'          → Monad dashboard (gmonads.com scrape, no ASN)
```

**Step 3: Verify TypeScript compiles**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit
```
Expected: no errors related to ChainId.

**Step 4: Commit**

```bash
git add ovh-blockchain-tracker/src/lib/chains.ts ovh-blockchain-tracker/src/lib/cache/chain-storage.ts
git commit -m "feat(monad): register Monad chain (chains.ts + cache-storage)"
```

---

## Task 3: Implement data fetcher

**Files:**
- Create: `src/lib/monad/fetchValidators.ts`

⚠️ **Complete the API discovery prerequisite before this task.**

**Step 1: Create the fetcher**

```typescript
// src/lib/monad/fetchValidators.ts

/**
 * Fetches Monad validator data from gmonads.com
 *
 * Data source: https://www.gmonads.com/validators
 * API endpoint: <INSERT DISCOVERED ENDPOINT HERE>
 * Auth: none required
 *
 * Returns raw validator list with country, city, stake, success rate, status.
 * No IP or ASN data is available — OVH detection requires a MonadBFT crawler.
 */

import { MonadValidator } from '@/types';
import { logger } from '@/lib/utils';

const GMONADS_URL = 'https://www.gmonads.com/validators'; // Update to actual API URL after discovery

/**
 * Parses raw gmonads.com response into MonadValidator array.
 * Update this function based on the actual response shape.
 */
function parseValidators(raw: unknown): MonadValidator[] {
  // TODO: replace with actual field mapping after API discovery
  // Example if API returns array of objects:
  const rows = Array.isArray(raw) ? raw : (raw as { validators?: unknown[] }).validators ?? [];
  
  return rows.map((r: Record<string, unknown>) => ({
    name: String(r.name ?? r.moniker ?? r.validator_name ?? ''),
    country: String(r.country ?? r.location ?? ''),
    city: String(r.city ?? ''),
    stake: Number(r.stake ?? r.voting_power ?? 0),
    successRate: Number(r.success_rate ?? r.uptime ?? 0),
    active: Boolean(r.active ?? r.status === 'active'),
  }));
}

export async function fetchMonadValidators(): Promise<MonadValidator[]> {
  logger.info('[Monad] Fetching validators from gmonads.com...');

  const response = await fetch(GMONADS_URL, {
    headers: {
      'User-Agent': 'OVHcloud-Node-Tracker/1.0',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`gmonads.com returned HTTP ${response.status}`);
  }

  // Try JSON first; fall back to __NEXT_DATA__ extraction if needed
  const contentType = response.headers.get('content-type') ?? '';
  let raw: unknown;

  if (contentType.includes('application/json')) {
    raw = await response.json();
  } else {
    // HTML response — extract __NEXT_DATA__
    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) {
      throw new Error('gmonads.com: could not find JSON data in HTML response');
    }
    const nextData = JSON.parse(match[1]);
    // Adjust path to actual data location in __NEXT_DATA__
    raw = nextData?.props?.pageProps?.validators ?? nextData?.props?.pageProps?.data ?? [];
  }

  const validators = parseValidators(raw);
  logger.info(`[Monad] Fetched ${validators.length} validators`);
  return validators;
}
```

**Step 2: Commit**

```bash
git add ovh-blockchain-tracker/src/lib/monad/fetchValidators.ts
git commit -m "feat(monad): add gmonads.com validator fetcher"
```

---

## Task 4: Implement metrics calculator + tests

**Files:**
- Create: `src/lib/monad/calculateMetrics.ts`
- Create: `src/lib/monad/calculateMetrics.test.ts`

**Step 1: Write the failing test first**

```typescript
// src/lib/monad/calculateMetrics.test.ts

import { describe, it, expect } from 'vitest';
import { calculateMonadMetrics } from './calculateMetrics';
import type { MonadValidator } from '@/types';

const mockValidators: MonadValidator[] = [
  { name: 'Alpha', country: 'United States', city: 'Ashburn', stake: 200_000, successRate: 99, active: true },
  { name: 'Beta', country: 'United States', city: 'Dallas', stake: 150_000, successRate: 95, active: true },
  { name: 'Gamma', country: 'Germany', city: 'Frankfurt', stake: 100_000, successRate: 87, active: true },
  { name: 'Delta', country: 'Germany', city: 'Frankfurt', stake: 80_000, successRate: 70, active: false },
  { name: 'Epsilon', country: 'France', city: 'Paris', stake: 110_000, successRate: 92, active: true },
];

describe('calculateMonadMetrics', () => {
  it('counts total and active validators correctly', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.totalValidators).toBe(5);
    expect(metrics.activeValidators).toBe(4);
  });

  it('builds geoDistribution correctly', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.geoDistribution['United States']).toBe(2);
    expect(metrics.geoDistribution['Germany']).toBe(2);
    expect(metrics.geoDistribution['France']).toBe(1);
  });

  it('calculates countryCount correctly', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.countryCount).toBe(3);
  });

  it('calculates totalStakeMON correctly', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.totalStakeMON).toBe(640_000);
  });

  it('calculates avgSuccessRate correctly', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.avgSuccessRate).toBeCloseTo(88.6, 0);
  });

  it('returns countryBreakdown sorted by count desc', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.countryBreakdown[0].country).toBe('United States');
    expect(metrics.countryBreakdown[0].count).toBe(2);
  });

  it('returns top 10 cities max', () => {
    const metrics = calculateMonadMetrics(mockValidators);
    expect(metrics.cityBreakdown.length).toBeLessThanOrEqual(10);
  });

  it('handles empty input without throwing', () => {
    const metrics = calculateMonadMetrics([]);
    expect(metrics.totalValidators).toBe(0);
    expect(metrics.avgSuccessRate).toBe(0);
  });
});
```

**Step 2: Run test — verify it fails**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/monad/calculateMetrics.test.ts
```
Expected: FAIL — `calculateMetrics` module not found.

**Step 3: Implement the calculator**

```typescript
// src/lib/monad/calculateMetrics.ts

import { MonadValidator, MonadDashboardMetrics, MonadCountryEntry, MonadCityEntry } from '@/types';

export function calculateMonadMetrics(validators: MonadValidator[]): MonadDashboardMetrics {
  const total = validators.length;
  const active = validators.filter(v => v.active).length;

  // Geo distribution (all validators, not just active — matches WorldMap behavior)
  const geoDistribution: Record<string, number> = {};
  const countryStake: Record<string, number> = {};
  const cityCount: Record<string, { city: string; country: string; count: number }> = {};

  for (const v of validators) {
    const country = v.country || 'Unknown';
    const city = v.city || 'Unknown';

    geoDistribution[country] = (geoDistribution[country] ?? 0) + 1;
    countryStake[country] = (countryStake[country] ?? 0) + v.stake;

    const cityKey = `${city}|${country}`;
    if (!cityCount[cityKey]) cityCount[cityKey] = { city, country, count: 0 };
    cityCount[cityKey].count += 1;
  }

  const countryCount = Object.keys(geoDistribution).length;
  const totalStakeMON = validators.reduce((s, v) => s + v.stake, 0);
  const avgSuccessRate = total > 0
    ? validators.reduce((s, v) => s + v.successRate, 0) / total
    : 0;

  const countryBreakdown: MonadCountryEntry[] = Object.entries(geoDistribution)
    .map(([country, count]) => ({
      country,
      count,
      totalStake: countryStake[country] ?? 0,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const cityBreakdown: MonadCityEntry[] = Object.values(cityCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalValidators: total,
    activeValidators: active,
    countryCount,
    totalStakeMON,
    avgSuccessRate,
    geoDistribution,
    countryBreakdown,
    cityBreakdown,
  };
}
```

**Step 4: Run tests — verify they pass**

```bash
cd ovh-blockchain-tracker && npm test -- src/lib/monad/calculateMetrics.test.ts
```
Expected: all 8 tests PASS.

**Step 5: Commit**

```bash
git add ovh-blockchain-tracker/src/lib/monad/calculateMetrics.ts ovh-blockchain-tracker/src/lib/monad/calculateMetrics.test.ts
git commit -m "feat(monad): add metrics calculator with tests"
```

---

## Task 5: Background worker

**Files:**
- Create: `scripts/worker-monad.ts`
- Modify: `package.json`

**Step 1: Create the worker**

```typescript
// scripts/worker-monad.ts

#!/usr/bin/env tsx

/**
 * Background Worker — Monad Validator Collection
 *
 * Scrapes gmonads.com for Monad validator data (country, city, stake, success rate).
 * No MaxMind/ASN lookup — OVH detection not available for Monad (see design doc).
 *
 * Usage  : npx tsx scripts/worker-monad.ts
 * PM2    : ovh-monad-worker in ecosystem.config.js (every 2h)
 */

require('dotenv').config({ path: '.env.local' });
import { fetchMonadValidators } from '../src/lib/monad/fetchValidators';
import { calculateMonadMetrics } from '../src/lib/monad/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';

async function runMonadWorker() {
  console.log('🟣 [Monad Worker] Starting Monad data collection...');
  console.log(`⏰ [Monad Worker] Timestamp: ${new Date().toISOString()}`);

  const startTime = Date.now();

  try {
    console.log('📡 [Monad Worker] Fetching validators from gmonads.com...');
    const validators = await fetchMonadValidators();
    console.log(`✅ [Monad Worker] Fetched ${validators.length} validators`);

    if (!validators.length) {
      throw new Error('No validators returned from gmonads.com — aborting cache write');
    }

    console.log('📊 [Monad Worker] Calculating metrics...');
    const metrics = calculateMonadMetrics(validators);

    console.log('💾 [Monad Worker] Writing to cache...');
    await writeChainCache('monad', metrics, validators.length);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [Monad Worker] Done in ${elapsed}s`);
    console.log(`📊 [Monad Worker] ${metrics.activeValidators}/${metrics.totalValidators} active | ${metrics.countryCount} countries`);

    process.exit(0);
  } catch (err) {
    console.error('❌ [Monad Worker] Fatal error:', err);
    process.exit(1);
  }
}

runMonadWorker();
```

**Step 2: Add script to package.json**

In `package.json`, add to the `scripts` section:
```json
"worker:monad": "tsx scripts/worker-monad.ts",
```

**Step 3: Test the worker manually** (requires internet + `.env.local` with Turso credentials)

```bash
cd ovh-blockchain-tracker && npm run worker:monad
```
Expected: `✅ [Monad Worker] Done in Xs` with validator count > 0.

**Step 4: Commit**

```bash
git add ovh-blockchain-tracker/scripts/worker-monad.ts ovh-blockchain-tracker/package.json
git commit -m "feat(monad): add background worker + npm script"
```

---

## Task 6: API route

**Files:**
- Create: `src/app/api/monad/route.ts`

**Step 1: Create the route**

```typescript
// src/app/api/monad/route.ts

import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { MonadDashboardMetrics, MonadAPIResponse } from '@/types';
import { logger } from '@/lib/utils';

/**
 * GET /api/monad
 *
 * Returns Monad dashboard metrics (cached from gmonads.com scrape).
 * Falls back to stale cache if older than 2h.
 * Returns 503 only when no cache exists at all.
 *
 * Cache populated by:
 *   - PM2 worker (ovh-monad-worker) [production]
 *   - POST /api/cron/monad-refresh   [dev/staging]
 */
export async function GET() {
  try {
    const cache = await readChainCache<MonadDashboardMetrics>('monad');

    if (cache && isChainCacheFresh(cache, 'monad')) {
      logger.info('[API/monad] Returning fresh cache');
      const response: MonadAPIResponse = {
        success: true,
        data: cache.data,
        cached: true,
        timestamp: cache.timestamp,
      };
      return NextResponse.json(response);
    }

    if (cache) {
      logger.info('[API/monad] Cache is stale — returning with warning');
      const response: MonadAPIResponse = {
        success: true,
        data: cache.data,
        cached: true,
        stale: true,
        timestamp: cache.timestamp,
      };
      return NextResponse.json(response);
    }

    logger.warn('[API/monad] No cache available. Run the worker first.');
    return NextResponse.json(
      {
        success: false,
        error: 'Monad data is not yet available. The background worker has not run yet. Please try again in a few minutes.',
      },
      { status: 503 },
    );
  } catch (error) {
    logger.error('[API/monad] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
```

**Step 2: Commit**

```bash
git add ovh-blockchain-tracker/src/app/api/monad/route.ts
git commit -m "feat(monad): add GET /api/monad route"
```

---

## Task 7: Cron handler + vercel.json

**Files:**
- Create: `src/app/api/cron/monad-refresh/route.ts`
- Modify: `vercel.json`

**Step 1: Create the cron handler**

```typescript
// src/app/api/cron/monad-refresh/route.ts

import { fetchMonadValidators } from '@/lib/monad/fetchValidators';
import { calculateMonadMetrics } from '@/lib/monad/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Monad validator data refresh
 * Schedule: every 2 hours (vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('MONAD', async () => {
  const validators = await fetchMonadValidators();
  if (!validators.length) throw new Error('No validators returned from gmonads.com');

  const metrics = calculateMonadMetrics(validators);
  await writeChainCache('monad', metrics, validators.length);

  return {
    totalValidators: validators.length,
    activeValidators: metrics.activeValidators,
    countries: metrics.countryCount,
  };
});
```

**Step 2: Add cron to vercel.json**

In `vercel.json`, add to the `crons` array:
```json
{ "path": "/api/cron/monad-refresh", "schedule": "0 6 * * *" }
```
(Runs at 06:00 UTC daily — one hour after bnb-refresh.)

**Step 3: Commit**

```bash
git add ovh-blockchain-tracker/src/app/api/cron/monad-refresh/route.ts ovh-blockchain-tracker/vercel.json
git commit -m "feat(monad): add Vercel cron handler for Monad data refresh"
```

---

## Task 8: Dashboard page + layout

**Files:**
- Create: `src/app/monad/layout.tsx`
- Create: `src/app/monad/page.tsx`

**Step 1: Create the layout**

```typescript
// src/app/monad/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monad Dashboard — OVHcloud Node Tracker',
  description: 'Distribution of Monad validators across countries. OVH infrastructure detection coming soon.',
};

export default function MonadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 2: Create the dashboard page**

The dashboard follows the Avalanche page pattern exactly. Key differences:
- Accent color `#836EF9`
- No OVH KPIs — replace with "Coming Soon" pill
- `geoDistribution` comes from all validators (not OVH-filtered)
- `ovhNodes` and `marketShare` are passed as `0` to WorldMap

```typescript
// src/app/monad/page.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), { ssr: false });
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';
import { MonadDashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const ACCENT = '#836EF9';

function KPICard({ value, label, comingSoon = false }: { value: string; label: string; comingSoon?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
        {comingSoon && (
          <span
            className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
            style={{ color: ACCENT, borderColor: `${ACCENT}50`, background: `${ACCENT}12` }}
          >
            Soon
          </span>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

export default function MonadPage() {
  const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  useScrollReveal(!loading && !!metrics);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/monad');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch data');
      setMetrics(data.data);
      if (data.timestamp) setCachedAt(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const bgStyle = {
    background: '#08070f',
    backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(131,110,249,0.09) 0%, transparent 60%)`,
  };

  if (loading) return (
    <div className="min-h-screen relative" style={bgStyle}>
      <BlockchainCubes opacity={0.07} count={10} />
      <ParticlesBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <LoadingState />
      </div>
    </div>
  );

  if (error || !metrics) return (
    <>
      <BlockchainCubes opacity={0.07} count={10} />
      <ParticlesBackground />
      <div style={bgStyle} className="min-h-screen relative">
        <ErrorState message={error || 'No data available'} onRetry={fetchData} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={bgStyle}>
      <BlockchainCubes opacity={0.07} count={10} />
      <ParticlesBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">

          <AnimatedTagline
            title={
              <>Monad Validators on <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}80` }}>OVHcloud</span></>
            }
            subtitle="Geographic distribution of Monad validators — infrastructure tracking coming soon"
          />

          {cachedAt && (
            <p className="text-xs text-gray-500 text-right -mt-2 mb-4">
              Last updated: {new Date(cachedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
              })}
            </p>
          )}

          {/* KPI Row */}
          <div className="fade-in-up flex justify-center gap-10 mb-6 pt-2 flex-wrap">
            <KPICard value={metrics.totalValidators.toString()} label="Total Validators" />
            <KPICard value={metrics.activeValidators.toString()} label="Active Validators" />
            <KPICard value={metrics.countryCount.toString()} label="Countries" />
            <KPICard value="–" label="OVH Market Share" comingSoon />
          </div>

          {/* Coming Soon banner */}
          <div
            className="fade-in-up mb-6 px-5 py-4 rounded-2xl border text-sm text-white/60 leading-relaxed"
            style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}
          >
            <span className="font-bold" style={{ color: ACCENT }}>Infrastructure detection coming soon.</span>{' '}
            Monad uses a custom MonadBFT peer discovery protocol (signed name records) with no public RPC endpoint for validator IPs.
            OVH market share and provider breakdown will be available once a dedicated crawler is implemented.
          </div>

          {/* World Map */}
          {Object.keys(metrics.geoDistribution).length > 0 && (
            <section className="flex-1 flex flex-col fade-in-up relative z-10 w-full h-[600px] md:h-[700px]">
              <div className="w-full h-full flex items-center justify-center">
                <WorldMap
                  geoDistribution={metrics.geoDistribution}
                  globalGeoDistribution={metrics.geoDistribution}
                  totalNodes={metrics.totalValidators}
                  ovhNodes={0}
                  marketShare={0}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add ovh-blockchain-tracker/src/app/monad/layout.tsx ovh-blockchain-tracker/src/app/monad/page.tsx
git commit -m "feat(monad): add Dashboard page"
```

---

## Task 9: Nodes page

**Files:**
- Create: `src/app/monad/nodes/page.tsx`

**Step 1: Create the nodes page**

```typescript
// src/app/monad/nodes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import { MonadDashboardMetrics } from '@/types';

const ACCENT = '#836EF9';

export default function MonadNodesPage() {
  const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);

  useEffect(() => {
    fetch('/api/monad')
      .then(r => r.json())
      .then(d => { if (d.success) setMetrics(d.data); })
      .catch(() => null);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: '#08070f' }}
    >
      <ParticlesBackground />
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-[1400px]">

        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, #b8a9fc)` }}>
            Monad Network Explorer
          </h2>
          <p className="text-white/50 mt-2">
            {metrics
              ? `${metrics.activeValidators} active validators across ${metrics.countryCount} countries.`
              : 'Monad Network Explorer'}
          </p>
        </div>

        {/* Coming Soon block */}
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: `${ACCENT}25`, background: `${ACCENT}08` }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}30` }}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-white mb-3">
            Infrastructure Detection <span style={{ color: ACCENT }}>Coming Soon</span>
          </h3>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed mb-6">
            The Monad Network Explorer will show individual validator nodes with their hosting provider,
            ASN, and geographic location. This requires a MonadBFT-native crawler to extract validator
            IP addresses from the peer discovery layer — currently in development.
          </p>
          <div className="text-xs text-white/25 space-y-1">
            <p><span className="font-bold text-white/40">Why it's complex:</span> Monad uses custom signed name records (MonadNameRecord / SECP256k1) instead of a standard P2P protocol.</p>
            <p><span className="font-bold text-white/40">No public endpoint</span> exposes the complete validator IP list — it can only be observed by running a full node.</p>
          </div>
        </div>

        {/* Country summary table — available now */}
        {metrics && metrics.countryBreakdown.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4">Validators by Country</h3>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${ACCENT}20` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-[10px] uppercase tracking-widest border-b" style={{ borderColor: `${ACCENT}15`, background: `${ACCENT}06` }}>
                    <th className="text-left px-5 py-3">Country</th>
                    <th className="text-right px-5 py-3">Validators</th>
                    <th className="text-right px-5 py-3">Share</th>
                    <th className="text-right px-5 py-3">Total Stake (MON)</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.countryBreakdown.slice(0, 20).map((row, i) => (
                    <tr key={row.country} className={`border-b last:border-0 transition-colors hover:bg-white/3`} style={{ borderColor: `${ACCENT}10` }}>
                      <td className="px-5 py-3 text-white/70 font-medium">{row.country}</td>
                      <td className="px-5 py-3 text-right text-white/80 font-mono">{row.count}</td>
                      <td className="px-5 py-3 text-right font-bold" style={{ color: ACCENT }}>{row.percentage.toFixed(1)}%</td>
                      <td className="px-5 py-3 text-right text-white/40 font-mono text-xs">{row.totalStake.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ovh-blockchain-tracker/src/app/monad/nodes/page.tsx
git commit -m "feat(monad): add Nodes Explorer page with coming soon banner"
```

---

## Task 10: Analytics page

**Files:**
- Create: `src/app/monad/analytics/page.tsx`

**Step 1: Create the analytics page**

Follows Avalanche analytics pattern. Provider breakdown section replaced with Coming Soon. Geographic distribution uses all validators.

```typescript
// src/app/monad/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import ParticlesBackground from '@/components/ParticlesBackground';
import { MonadDashboardMetrics } from '@/types';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';

const ACCENT = '#836EF9';

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';
}

function GeoDistribution({ geoDistribution }: { geoDistribution: Record<string, number> }) {
  const total = Object.values(geoDistribution).reduce((s, v) => s + v, 0);
  const top = Object.entries(geoDistribution).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxVal = top[0]?.[1] ?? 1;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e0a1a] to-[#080710] border p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ borderColor: `${ACCENT}20` }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Geographic Distribution</h2>
          <p className="text-sm text-gray-400 mt-1">Top 10 countries hosting Monad validators</p>
        </div>
        <GlobeEuropeAfricaIcon className="w-6 h-6" style={{ color: `${ACCENT}90` }} />
      </div>
      <div className="space-y-3">
        {top.map(([country, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const barWidth = (count / maxVal) * 100;
          return (
            <div key={country}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-200 font-medium">{country}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{count} validators</span>
                  <span className="text-xs font-semibold w-12 text-right" style={{ color: ACCENT }}>{pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${ACCENT}15` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, background: `linear-gradient(to right, ${ACCENT}, #b8a9fc)`, boxShadow: `0 0 10px ${ACCENT}50` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border p-8 text-center" style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}06` }}>
      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border mb-4 inline-block" style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}12` }}>
        Coming Soon
      </span>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

export default function MonadAnalyticsPage() {
  const [metrics, setMetrics] = useState<MonadDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useScrollReveal(!loading && !!metrics);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/monad');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch data');
      setMetrics(data.data);
      setTimestamp(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="min-h-screen relative" style={{ background: '#08070f' }}>
      <ParticlesBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen"><LoadingState /></div>
    </div>
  );

  if (error || !metrics) return (
    <>
      <ParticlesBackground />
      <ErrorState message={error || 'No data available'} onRetry={fetchData} />
    </>
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={{ background: '#08070f', backgroundImage: `radial-gradient(circle at 50% 0%, ${ACCENT}10 0%, transparent 60%)` }}>
      <ParticlesBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 container mx-auto px-6 py-10 md:py-12 max-w-[1400px]">

          <div className="mb-8 fade-in-up">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                  Monad <span style={{ color: ACCENT }}>Analytics</span>
                </h1>
                <p className="text-gray-400 text-sm">Validator distribution across the Monad network.</p>
              </div>
              {timestamp && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-300 self-start mt-1 backdrop-blur-md" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                  Updated: {formatTimestamp(timestamp)}
                </div>
              )}
            </div>
          </div>

          {/* Available stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 fade-in-up">
            {[
              { label: 'Total Validators', value: metrics.totalValidators.toString() },
              { label: 'Active', value: metrics.activeValidators.toString() },
              { label: 'Countries', value: metrics.countryCount.toString() },
              { label: 'Avg Success Rate', value: `${metrics.avgSuccessRate.toFixed(1)}%` },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-2xl border p-5 text-center" style={{ borderColor: `${ACCENT}20`, background: `${ACCENT}06` }}>
                <div className="text-2xl font-black text-white mb-1">{kpi.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Provider breakdown — coming soon */}
          <section className="mb-8 fade-in-up">
            <ComingSoonPanel
              title="Provider Breakdown"
              description="OVH vs AWS vs Hetzner distribution will be available once the MonadBFT crawler is implemented to retrieve validator IP addresses."
            />
          </section>

          {/* Geo distribution — available */}
          {Object.keys(metrics.geoDistribution).length > 0 && (
            <div className="fade-in-up">
              <GeoDistribution geoDistribution={metrics.geoDistribution} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ovh-blockchain-tracker/src/app/monad/analytics/page.tsx
git commit -m "feat(monad): add Analytics page"
```

---

## Task 11: Use Cases page

**Files:**
- Create: `src/app/monad/use-cases/page.tsx`

**Step 1: Create the use cases page**

Follows Avalanche use-cases pattern exactly. Adapt text for Monad. Use existing `GuidePageLayout`-adjacent components (`AnimatedTagline`, `UseCasesHero`, `OVHServerSpecs`).

Note: There may not be published OVH case studies specific to Monad (very new chain). Use generic staking/bare-metal use cases that apply to Monad, and note the bare metal requirement.

```typescript
// src/app/monad/use-cases/page.tsx
'use client';

import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';

const ACCENT = '#836EF9';

const cases = [
  {
    company: 'Validator Operators',
    role: 'Monad Consensus Participant',
    description:
      'Monad explicitly requires bare-metal or dedicated servers — cloud VMs are not officially supported due to sub-second timing requirements in MonadBFT consensus. OVHcloud dedicated servers meet the strict CPU base-clock requirement (4.5 GHz+) with options like the ADVANCE and SCALE lines, making them a natural fit for Monad validators seeking reliable, high-performance infrastructure.',
    highlights: ['Bare Metal Required', '4.5 GHz Base Clock', 'PCIe Gen4 NVMe', '300 Mbps Symmetric'],
  },
  {
    company: 'RPC / Full Node Operators',
    role: 'Monad Full Node & RPC Provider',
    description:
      'Full node operators serving JSON-RPC and WebSocket traffic benefit from OVHcloud\'s predictable bandwidth pricing and European data centers. Monad RPC nodes require the same hardware spec as validators (16 cores, 32 GB RAM, 2.5 TB NVMe PCIe Gen4) with a more relaxed bandwidth requirement (100 Mbps vs 300 Mbps for validators).',
    highlights: ['100 Mbps Minimum', 'JSON-RPC / WebSocket', 'Same hardware as validator', 'EU sovereignty'],
  },
];

interface UseCaseCardProps {
  company: string;
  role: string;
  description: string;
  highlights: string[];
}

function UseCaseCard({ company, role, description, highlights }: UseCaseCardProps) {
  return (
    <div
      className="group rounded-3xl overflow-hidden border border-white/8 bg-black/40 backdrop-blur-xl transition-all duration-500 flex flex-col h-full p-6 md:p-8"
      style={{ boxShadow: `0 4px 40px ${ACCENT}08` }}
    >
      <h2 className="text-xl font-black text-white tracking-tight leading-tight mb-1">{company}</h2>
      <p className="text-[11px] uppercase tracking-[0.18em] font-bold mb-5" style={{ color: ACCENT }}>{role}</p>
      <p className="text-sm text-white/55 leading-relaxed mb-6">{description}</p>
      <div className="flex flex-wrap gap-2 mt-auto">
        {highlights.map(h => (
          <span key={h} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-white/40 border border-white/8">
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MonadUseCasesPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: '#08070f',
        backgroundImage: `radial-gradient(ellipse at 20% 30%, ${ACCENT}09 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, ${ACCENT}06 0%, transparent 50%)`,
        backgroundAttachment: 'fixed',
      }}
    >
      <ParticlesBackground />
      <div className="relative z-10">
        <main className="p-6 w-full max-w-4xl mx-auto">
          <AnimatedTagline
            title={<>Real-World <span style={{ color: ACCENT, textShadow: `0 0 20px ${ACCENT}80` }}>Monad</span> Use Cases</>}
            subtitle="Why bare-metal infrastructure is mandatory for Monad validators and RPC providers"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {cases.map(c => <UseCaseCard key={c.company} {...c} />)}
          </div>

          <div className="mb-24 p-8 rounded-3xl border text-center" style={{ borderColor: `${ACCENT}20`, background: `linear-gradient(to bottom, ${ACCENT}10, transparent)` }}>
            <h3 className="text-xl font-black text-white mb-3">Ready to Run a Monad Node?</h3>
            <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">
              Monad requires bare-metal performance. OVHcloud dedicated servers deliver the high base-clock CPU, NVMe throughput, and symmetric bandwidth that MonadBFT demands.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-[11px] transition-all hover:scale-105 active:scale-95"
                style={{ background: ACCENT, boxShadow: `0 0 30px ${ACCENT}40` }}
              >
                Visit Official Hub
              </a>
              <Link
                href="/about#contact-section"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all hover:bg-white/10 active:scale-95"
                style={{ border: `1px solid ${ACCENT}40`, color: ACCENT }}
              >
                Contact Experts
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add ovh-blockchain-tracker/src/app/monad/use-cases/page.tsx
git commit -m "feat(monad): add Use Cases page"
```

---

## Task 12: Guide page

**Files:**
- Create: `src/app/monad/guide/page.tsx`

**Step 1: Create the guide page**

Uses the existing `GuidePageLayout` component — zero custom layout code needed.

```typescript
// src/app/monad/guide/page.tsx
'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#836EF9';

const items: GuideItem[] = [
  {
    id: 'node-types',
    icon: 'info',
    question: 'Validator vs. Full Node on Monad',
    answer: 'A Monad Validator participates in MonadBFT consensus (the top 200 by delegated stake). It must self-stake ≥ 100,000 MON and accumulate ≥ 10,000,000 MON total delegated stake to enter the active set. A Full Node / RPC Node serves JSON-RPC and WebSocket traffic without staking registration — same binary and hardware, different configuration. Both types require bare-metal dedicated servers; cloud VMs are explicitly not supported due to MonadBFT\'s sub-second timing requirements.',
  },
  {
    id: 'hardware',
    icon: 'server',
    question: 'Recommended hardware for Monad',
    answer: 'Validators and full nodes share the same hardware requirements: 16 CPU cores with 4.5 GHz+ base clock (AMD Ryzen 9 7950X/9950X or EPYC 4584PX class), 32 GB RAM, 2 TB NVMe PCIe Gen4x4 for TrieDB + 500 GB NVMe for MonadBFT/OS. Bandwidth: 300 Mbps symmetric for validators, 100 Mbps for full nodes. Samsung 980/990 Pro and PM9A1 SSDs are preferred; avoid Nextorage SSDs (reported overheating under sustained load). The high base-clock requirement is critical for MonadBFT\'s parallel execution pipeline.',
  },
  {
    id: 'deploy',
    icon: 'deploy',
    question: 'Deployment overview',
    answer: 'Provision a bare-metal server meeting the hardware specs above (OVHcloud ADVANCE or SCALE with high-clock CPU option). Install the Monad node binary and configure node.toml with bootstrap peers (available in official docs and community channels). Run as a full node first to sync — do not start as a validator until fully synced. Once synced, register as a validator candidate via the addValidator staking precompile (0x1000) and accumulate delegated stake to enter the top-200 active set. Open ports 8000 (P2P/MonadBFT) and 8545/8546 (JSON-RPC/WebSocket) as needed.',
  },
  {
    id: 'partners',
    icon: 'partners',
    question: 'Enterprise Solutions: Join our Web3 Partner Network',
    answer: 'Connect with OVHcloud\'s specialized technical partners to scale your Monad infrastructure.',
    link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
    isExternal: true,
  },
];

export default function MonadGuidePage() {
  return (
    <GuidePageLayout
      chainId="monad"
      accent={ACCENT}
      networkName="Monad"
      description="A practical guide to deploying Monad validators and full nodes on OVHcloud bare-metal infrastructure."
      items={items}
    />
  );
}
```

**Step 2: Commit**

```bash
git add ovh-blockchain-tracker/src/app/monad/guide/page.tsx
git commit -m "feat(monad): add Guide page"
```

---

## Task 13: Update navigation (OthersDropdown + ChainToggle check)

**Files:**
- Modify: `src/components/OthersDropdown.tsx`

**Step 1: Add Monad to OTHER_CHAINS in OthersDropdown.tsx**

In `src/components/OthersDropdown.tsx`, add Monad to the `OTHER_CHAINS` array (before the closing bracket, after BNB Chain):

```typescript
{
  id: 'monad',
  label: 'Monad',
  ticker: 'MON',
  href: '/monad',
  color: '#836EF9',
  live: true,
  icon: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      {/* Monad "M" icon — simplified */}
      <path d="M3 20V4l5.5 8L14 4l5.5 8L14 20l-5.5-8L3 20z" />
    </svg>
  ),
},
```

**Step 2: Verify ChainToggle** — The `NetworkThemeProvider` automatically picks up the new chain from `CHAINS` in `lib/chains.ts` since it iterates `Object.values(CHAINS)`. No changes needed there.

**Step 3: Verify the monad-theme CSS class** — Search for where other chain CSS classes are defined (e.g., `avax-theme`). If they're in a global CSS file, add the `monad-theme` equivalent:

```bash
grep -r "avax-theme" ovh-blockchain-tracker/src/ --include="*.css" -l
```

Add the `monad-theme` CSS variables in the same file, following the existing pattern. Example:

```css
.monad-theme {
  --chain-accent: #836EF9;
}
```

**Step 4: Commit**

```bash
git add ovh-blockchain-tracker/src/components/OthersDropdown.tsx
# Also add the CSS file if modified
git commit -m "feat(monad): add Monad to sidebar navigation"
```

---

## Task 14: Update docs — add-new-blockchain.md

**Files:**
- Create (or update): `docs/guides/add-new-blockchain.md`

**Step 1: Create the guide**

```markdown
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
- [ ] CSS global — ajouter `.monad-theme { --chain-accent: #COLOR; }` si applicable

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
```

**Step 2: Commit**

```bash
git add "docs/guides/add-new-blockchain.md"
git commit -m "docs: add add-new-blockchain.md guide with page structure rules"
```

---

## Task 15: Final validation

**Step 1: Run all tests**

```bash
cd ovh-blockchain-tracker && npm test
```
Expected: all tests pass including the new `calculateMetrics.test.ts`.

**Step 2: Run lint**

```bash
cd ovh-blockchain-tracker && npm run lint
```
Expected: 0 errors.

**Step 3: TypeScript check**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit
```
Expected: 0 errors.

**Step 4: Run worker (integration test)**

```bash
cd ovh-blockchain-tracker && npm run worker:monad
```
Expected: `✅ [Monad Worker] Done in Xs` with > 0 validators.

**Step 5: Start dev server and manually verify all pages**

```bash
cd ovh-blockchain-tracker && npm run dev
```

Check each route:
- [ ] `/monad` — Dashboard loads, WorldMap shows, KPIs visible, Coming Soon banner visible
- [ ] `/monad/nodes` — Coming Soon block + country table visible
- [ ] `/monad/analytics` — Geo distribution loads, provider breakdown shows Coming Soon
- [ ] `/monad/use-cases` — Use case cards visible
- [ ] `/monad/guide` — Guide items visible
- [ ] Sidebar shows "Monad" in OthersDropdown, all nav links work
- [ ] Theme switches to violet when navigating to /monad

**Step 6: Final commit**

```bash
git add -p  # review any remaining changes
git commit -m "feat(monad): complete Monad integration with country-level tracking"
```
