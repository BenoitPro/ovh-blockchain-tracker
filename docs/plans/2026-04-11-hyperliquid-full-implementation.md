# Hyperliquid Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the Hyperliquid dashboard, analytics, and validator explorer to live API data, with a win-back–focused node explorer for OVH sales prospecting.

**Architecture:** Add a live-fetch fallback to the API route so the dashboard works even before the cron job has run. Extend the cached metrics to include all validators. Build real analytics and nodes pages from that data. Since the Hyperliquid API returns zero IP addresses, OVH detection is name/description–only (likely 0 hits); the nodes page pivots to a prospecting table showing every validator entity, their estimated provider, stake weight, and website.

**Tech Stack:** Next.js App Router, Recharts (charts), existing `fetchHyperliquidValidators` / `filterOVHHyperliquidValidators` / `calculateHyperliquidMetrics` libs, Turso cache via `chain-storage.ts`.

---

## Context & Key Constraints

- **No IP addresses** — the Hyperliquid API (`validatorSummaries`) never exposes node IPs. MaxMind lookups are impossible. OVH detection = keyword matching on `name` / `description`.
- **~30 validators** — tiny dataset, safe to embed in the cache blob.
- **Cron has never run** — the cache is empty → the dashboard returns 503. The primary fix is a live-fetch fallback inside the API route.
- **Accent color** — `#00E5BE` (already used throughout Hyperliquid pages).

---

## Task 1: Extract shared `buildHyperliquidMetrics` helper

Avoids duplicating fetch + filter + calculate in both the cron and the live-fallback API.

**Files:**
- Create: `ovh-blockchain-tracker/src/lib/hyperliquid/buildMetrics.ts`

**Step 1: Create the helper**

```typescript
// src/lib/hyperliquid/buildMetrics.ts
import { fetchHyperliquidValidators } from './fetchValidators';
import { filterOVHHyperliquidValidators } from './filterOVH';
import { calculateHyperliquidMetrics } from './calculateMetrics';
import { HyperliquidDashboardMetrics } from '@/types/hyperliquid';

/**
 * Fetch + filter + calculate — shared by the cron job and the live-fallback
 * API route. Does NOT write to cache; callers decide whether to persist.
 */
export async function buildHyperliquidMetrics(): Promise<{
    metrics: HyperliquidDashboardMetrics;
    totalValidators: number;
}> {
    const allValidators = await fetchHyperliquidValidators();
    if (!allValidators.length) throw new Error('No validators returned from Hyperliquid API');

    const ovhValidators = filterOVHHyperliquidValidators(allValidators);
    const metrics = calculateHyperliquidMetrics(allValidators, ovhValidators);

    return { metrics, totalValidators: allValidators.length };
}
```

**Step 2: Verify the imports resolve**

Run: `cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep hyperliquid`
Expected: no errors on hyperliquid files.

---

## Task 2: Extend `HyperliquidDashboardMetrics` to include all validators

The nodes explorer and analytics page both need the full validator list. Since there are only ~30 validators the added cache size is negligible.

**Files:**
- Modify: `ovh-blockchain-tracker/src/types/hyperliquid.ts`
- Modify: `ovh-blockchain-tracker/src/lib/hyperliquid/calculateMetrics.ts`

**Step 1: Add `allValidators` field to the metrics type**

In `src/types/hyperliquid.ts`, inside `HyperliquidDashboardMetrics`, add after `ovhValidatorList`:

```typescript
    /** Full list of all validators returned by the API (active + jailed). */
    allValidators: HyperliquidValidator[];
```

**Step 2: Return `allValidators` from `calculateHyperliquidMetrics`**

In `src/lib/hyperliquid/calculateMetrics.ts`, inside the return object of `calculateHyperliquidMetrics`, add:

```typescript
        allValidators,
```

The function signature already receives `allValidators` as its first parameter — just include it in the return.

**Step 3: Verify types compile**

Run: `cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep -i "hyperliquid\|error"`
Expected: no TS errors.

---

## Task 3: Update cron handler to use the shared helper

**Files:**
- Modify: `ovh-blockchain-tracker/src/app/api/cron/hyperliquid-refresh/route.ts`

Replace the existing body with:

```typescript
import { buildHyperliquidMetrics } from '@/lib/hyperliquid/buildMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('Hyperliquid', async () => {
    const { metrics, totalValidators } = await buildHyperliquidMetrics();
    await writeChainCache('hyperliquid', metrics, totalValidators);

    return {
        totalValidators,
        activeValidators: metrics.activeValidators,
        ovhValidators: metrics.ovhValidators,
        marketShare: metrics.marketShare.toFixed(2) + '%',
        totalStakeHYPE: (metrics.totalStake / 1e8).toFixed(2),
    };
});
```

**Step 1: Verify no TS errors**

Run: `cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | grep cron`
Expected: no errors.

---

## Task 4: Fix `/api/hyperliquid` route — live-fetch fallback

This is the core fix. When cache is empty (cron hasn't run), fetch live and return without writing to cache.

**Files:**
- Modify: `ovh-blockchain-tracker/src/app/api/hyperliquid/route.ts`

Replace the entire file with:

```typescript
import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { buildHyperliquidMetrics } from '@/lib/hyperliquid/buildMetrics';
import { HyperliquidDashboardMetrics, HyperliquidAPIResponse } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * GET /api/hyperliquid
 *
 * Priority:
 *   1. Fresh cache  → return immediately
 *   2. Stale cache  → return with stale:true warning
 *   3. No cache     → live-fetch from Hyperliquid API (no cache write; cron does that)
 *   4. Live-fetch fails → 503
 */
export async function GET() {
    try {
        const cache = await readChainCache<HyperliquidDashboardMetrics>('hyperliquid');

        if (cache && isChainCacheFresh(cache, 'hyperliquid')) {
            logger.info('[API/hyperliquid] Returning fresh cache');
            const response: HyperliquidAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/hyperliquid] Cache is stale — returning with warning');
            const response: HyperliquidAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // No cache at all — fetch live (first run / cron not yet triggered)
        logger.info('[API/hyperliquid] No cache — falling back to live fetch');
        const { metrics } = await buildHyperliquidMetrics();

        const response: HyperliquidAPIResponse = {
            success: true,
            data: metrics,
            cached: false,
            timestamp: Date.now(),
        };
        return NextResponse.json(response);

    } catch (error) {
        logger.error('[API/hyperliquid] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 },
        );
    }
}
```

**Step 1: Test the route manually**

Start dev server (`npm run dev`), then:
```
curl http://localhost:3000/api/hyperliquid | jq '.success, .data.totalValidators, .data.activeValidators'
```
Expected: `true`, a number (~30), a number (~20-30).

---

## Task 5: Add `/api/hyperliquid/validators` route

Needed by the Nodes Explorer. Returns the full `allValidators` array.

**Files:**
- Create: `ovh-blockchain-tracker/src/app/api/hyperliquid/validators/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { readChainCache } from '@/lib/cache/chain-storage';
import { buildHyperliquidMetrics } from '@/lib/hyperliquid/buildMetrics';
import { HyperliquidDashboardMetrics, HyperliquidValidator } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * GET /api/hyperliquid/validators
 * Returns all validators (active + jailed).
 * Reads from cache if available; fetches live otherwise.
 */
export async function GET() {
    try {
        const cache = await readChainCache<HyperliquidDashboardMetrics>('hyperliquid');

        let validators: HyperliquidValidator[] | undefined = cache?.data?.allValidators;

        if (!validators || validators.length === 0) {
            logger.info('[API/hyperliquid/validators] No cache — live fetch');
            const { metrics } = await buildHyperliquidMetrics();
            validators = metrics.allValidators;
        }

        return NextResponse.json({ success: true, data: validators });
    } catch (error) {
        logger.error('[API/hyperliquid/validators] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 503 },
        );
    }
}
```

**Step 1: Test the route**

```
curl http://localhost:3000/api/hyperliquid/validators | jq '.data | length'
```
Expected: ~30.

---

## Task 6: Enhance the Dashboard component

Add three new KPI pills (jailed count, avg daily uptime, total HYPE staked) to the existing hero section.

**Files:**
- Modify: `ovh-blockchain-tracker/src/components/dashboard/HyperliquidDashboard.tsx`

**Step 1: Compute new KPIs at the top of the component**

After the existing destructuring, add:

```typescript
const { activeValidators, ovhValidators, marketShare, providerBreakdown, totalStake, totalValidators, allValidators } = metrics;

const jailedCount = (allValidators ?? []).filter(v => v.isJailed).length;

const avgUptime = (() => {
    const withUptime = (allValidators ?? []).filter(v => typeof v.dailyUptime === 'number' && v.isActive);
    if (withUptime.length === 0) return null;
    return withUptime.reduce((s, v) => s + (v.dailyUptime ?? 0), 0) / withUptime.length;
})();
```

**Step 2: Add the three new KPI pills alongside the existing ones**

Inside the "KPI pills" div (currently two pills), add after the existing OVH pill:

```tsx
<div
    className="px-6 py-4 rounded-xl border text-center"
    style={{ background: 'rgba(255,200,50,0.05)', borderColor: 'rgba(255,200,50,0.2)' }}
>
    <div className="text-2xl font-black text-yellow-400">{jailedCount}</div>
    <div className="text-xs text-gray-400 mt-1">Jailed Validators</div>
</div>

{avgUptime !== null && (
    <div
        className="px-6 py-4 rounded-xl border text-center"
        style={{ background: 'rgba(0, 229, 190, 0.05)', borderColor: 'rgba(0, 229, 190, 0.2)' }}
    >
        <div className="text-2xl font-black text-[#00E5BE]">
            {(avgUptime * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-400 mt-1">Avg Daily Uptime</div>
    </div>
)}

<div
    className="px-6 py-4 rounded-xl border text-center"
    style={{ background: 'rgba(0, 229, 190, 0.05)', borderColor: 'rgba(0, 229, 190, 0.2)' }}
>
    <div className="text-2xl font-black text-[#00E5BE]">{totalStakeHYPE}</div>
    <div className="text-xs text-gray-400 mt-1">HYPE Staked</div>
</div>
```

**Step 3: Verify in browser**

Navigate to `http://localhost:3000/hyperliquid`. Dashboard should load with live data and show all KPI pills.

---

## Task 7: Build real Analytics page

**Files:**
- Modify: `ovh-blockchain-tracker/src/app/hyperliquid/analytics/page.tsx`

Replace the entire file with:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import Header from '@/components/dashboard/Header';
import ProviderComparison from '@/components/dashboard/ProviderComparison';
import ParticlesBackground from '@/components/ParticlesBackground';
import { HyperliquidDashboardMetrics, HyperliquidAPIResponse } from '@/types/hyperliquid';

const ACCENT = '#00E5BE';

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-2xl border p-6" style={{ background: 'rgba(0,229,190,0.04)', borderColor: 'rgba(0,229,190,0.15)' }}>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">{label}</p>
            <p className="text-3xl font-black text-[#00E5BE]">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    );
}

export default function HyperliquidAnalytics() {
    const [metrics, setMetrics] = useState<HyperliquidDashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/hyperliquid')
            .then(r => r.json())
            .then((d: HyperliquidAPIResponse) => {
                if (d.success && d.data) setMetrics(d.data);
                else setError(d.error ?? 'Unknown error');
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <ParticlesBackground />
                <div className="relative z-10 text-[#00E5BE] animate-pulse text-lg font-bold">Loading…</div>
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <ParticlesBackground />
                <div className="relative z-10 text-red-400">{error ?? 'No data'}</div>
            </div>
        );
    }

    const allValidators = metrics.allValidators ?? [];
    const active = allValidators.filter(v => v.isActive);
    const jailed = allValidators.filter(v => v.isJailed);

    const avgUptime = (() => {
        const ws = active.filter(v => typeof v.dailyUptime === 'number');
        if (!ws.length) return null;
        return ws.reduce((s, v) => s + (v.dailyUptime ?? 0), 0) / ws.length;
    })();

    const totalStakeHYPE = (metrics.totalStake / 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 });

    // Stake distribution chart — top 15 validators by stake
    const stakeChart = [...active]
        .sort((a, b) => b.stake - a.stake)
        .slice(0, 15)
        .map(v => ({
            name: v.name.length > 16 ? v.name.slice(0, 14) + '…' : v.name,
            stake: Math.round(v.stake / 1e8),
            pct: metrics.totalStake > 0 ? ((v.stake / metrics.totalStake) * 100).toFixed(1) : '0',
        }));

    // Commission distribution chart
    const commissionBuckets: Record<string, number> = { '0%': 0, '1-2%': 0, '3-5%': 0, '6-10%': 0, '>10%': 0 };
    for (const v of active) {
        const r = v.commissionRate * 100;
        if (r === 0) commissionBuckets['0%']++;
        else if (r <= 2) commissionBuckets['1-2%']++;
        else if (r <= 5) commissionBuckets['3-5%']++;
        else if (r <= 10) commissionBuckets['6-10%']++;
        else commissionBuckets['>10%']++;
    }
    const commissionChart = Object.entries(commissionBuckets).map(([label, count]) => ({ label, count }));

    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
            <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
                <Header network="Hyperliquid" subtitle="Network Analytics" />

                {/* Disclaimer */}
                <div className="mt-6 mb-8 px-4 py-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 text-xs text-yellow-300/70">
                    Note: The Hyperliquid API does not expose node IP addresses. Provider attribution is based on validator name/description matching only — results are best-effort estimates.
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <KPI label="Total Validators" value={String(metrics.totalValidators)} />
                    <KPI label="Active" value={String(metrics.activeValidators)} />
                    <KPI label="Jailed" value={String(jailed.length)} />
                    <KPI label="HYPE Staked" value={totalStakeHYPE} sub="across active validators" />
                    <KPI label="OVH Detected" value={String(metrics.ovhValidators)} sub="via name matching" />
                    <KPI label="OVH Market Share" value={metrics.ovhValidators > 0 ? `${metrics.marketShare.toFixed(1)}%` : 'N/A'} />
                    {avgUptime !== null && <KPI label="Avg Daily Uptime" value={`${(avgUptime * 100).toFixed(1)}%`} sub="active validators" />}
                </div>

                {/* Stake distribution */}
                <div className="mb-10 rounded-2xl border p-8" style={{ background: 'rgba(0,229,190,0.03)', borderColor: 'rgba(0,229,190,0.15)' }}>
                    <h2 className="text-xl font-bold text-white mb-2">Stake Distribution</h2>
                    <p className="text-xs text-gray-500 mb-6">Top 15 active validators by HYPE staked</p>
                    <div style={{ height: 340 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stakeChart} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                                    tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#D1D5DB', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,229,190,0.05)' }}
                                    contentStyle={{ background: '#050510', border: '1px solid rgba(0,229,190,0.3)', borderRadius: 12 }}
                                    formatter={(v: number) => [`${v.toLocaleString()} HYPE`, 'Stake']}
                                />
                                <Bar dataKey="stake" radius={[0, 6, 6, 0]} maxBarSize={32}
                                    label={{ position: 'right', fill: '#9CA3AF', fontSize: 10,
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter: (_: any, entry: any) => `${entry?.payload?.pct}%` }}
                                >
                                    {stakeChart.map((_, i) => (
                                        <Cell key={i} fill={ACCENT} opacity={1 - i * 0.04} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Commission + Provider breakdown row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                    {/* Commission distribution */}
                    <div className="rounded-2xl border p-8" style={{ background: 'rgba(0,229,190,0.03)', borderColor: 'rgba(0,229,190,0.15)' }}>
                        <h2 className="text-xl font-bold text-white mb-2">Commission Distribution</h2>
                        <p className="text-xs text-gray-500 mb-6">Active validators by commission rate bucket</p>
                        <div style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={commissionChart} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#050510', border: '1px solid rgba(0,229,190,0.3)', borderRadius: 12 }}
                                        formatter={(v: number) => [v, 'Validators']}
                                    />
                                    <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Provider breakdown */}
                    <ProviderComparison providerBreakdown={metrics.providerBreakdown} />
                </div>
            </main>
        </div>
    );
}
```

**Step 1: Navigate to analytics page in browser**

Open `http://localhost:3000/hyperliquid/analytics`. Should show real KPIs, stake distribution chart, commission chart, and provider breakdown.

---

## Task 8: Build Nodes Explorer (win-back focused)

**Files:**
- Create: `ovh-blockchain-tracker/src/components/nodes/HyperliquidValidatorExplorer.tsx`
- Modify: `ovh-blockchain-tracker/src/app/hyperliquid/nodes/page.tsx`

**Step 1: Create the explorer component**

```typescript
// src/components/nodes/HyperliquidValidatorExplorer.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { HyperliquidValidator } from '@/types/hyperliquid';

const ACCENT = '#00E5BE';
const OVH_KEYWORDS = ['ovh', 'ovhcloud', 'soyoustart', 'kimsufi'];

const PROVIDER_RULES: { key: string; label: string; keywords: string[] }[] = [
    { key: 'ovh',          label: 'OVHcloud',      keywords: OVH_KEYWORDS },
    { key: 'aws',          label: 'AWS',            keywords: ['aws', 'amazon'] },
    { key: 'google',       label: 'Google Cloud',   keywords: ['google', 'gcp'] },
    { key: 'hetzner',      label: 'Hetzner',        keywords: ['hetzner'] },
    { key: 'digitalocean', label: 'DigitalOcean',   keywords: ['digitalocean', 'digital ocean'] },
    { key: 'vultr',        label: 'Vultr',          keywords: ['vultr'] },
    { key: 'equinix',      label: 'Equinix',        keywords: ['equinix', 'packet'] },
];

function detectProvider(name: string, description: string): { key: string; label: string } {
    const hay = `${name} ${description}`.toLowerCase();
    for (const rule of PROVIDER_RULES) {
        if (rule.keywords.some(kw => hay.includes(kw))) return rule;
    }
    return { key: 'unknown', label: 'Unknown' };
}

function extractWebsite(description: string): string | null {
    const match = description.match(/https?:\/\/[^\s,)]+/);
    return match ? match[0] : null;
}

function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

type SortKey = 'stake_desc' | 'stake_asc' | 'commission_asc' | 'uptime_desc';
type ViewMode = 'all' | 'targets' | 'ovh';

interface ValidatorRow extends HyperliquidValidator {
    provider: { key: string; label: string };
    website: string | null;
    stakeHYPE: number;
    stakePct: number;
}

export default function HyperliquidValidatorExplorer() {
    const [raw, setRaw] = useState<HyperliquidValidator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('stake_desc');
    const [viewMode, setViewMode] = useState<ViewMode>('all');

    useEffect(() => {
        fetch('/api/hyperliquid/validators')
            .then(r => r.json())
            .then(d => { if (d.success) setRaw(d.data); else setError(d.error); })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const totalStakeRaw = useMemo(() => raw.reduce((s, v) => s + (v.stake ?? 0), 0), [raw]);

    const rows: ValidatorRow[] = useMemo(() => raw.map(v => ({
        ...v,
        provider: detectProvider(v.name, v.description),
        website: extractWebsite(v.description),
        stakeHYPE: Math.round(v.stake / 1e8),
        stakePct: totalStakeRaw > 0 ? (v.stake / totalStakeRaw) * 100 : 0,
    })), [raw, totalStakeRaw]);

    const filtered = useMemo(() => {
        let r = rows;
        if (viewMode === 'targets') r = r.filter(v => v.provider.key !== 'ovh' && v.isActive);
        if (viewMode === 'ovh') r = r.filter(v => v.provider.key === 'ovh');
        if (search) {
            const q = search.toLowerCase();
            r = r.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.validator.toLowerCase().includes(q) ||
                v.description.toLowerCase().includes(q)
            );
        }
        const s = [...r];
        if (sortBy === 'stake_desc') s.sort((a, b) => b.stake - a.stake);
        if (sortBy === 'stake_asc') s.sort((a, b) => a.stake - b.stake);
        if (sortBy === 'commission_asc') s.sort((a, b) => a.commissionRate - b.commissionRate);
        if (sortBy === 'uptime_desc') s.sort((a, b) => (b.dailyUptime ?? 0) - (a.dailyUptime ?? 0));
        return s;
    }, [rows, viewMode, search, sortBy]);

    const exportCSV = () => {
        const headers = ['Name', 'Address', 'Stake (HYPE)', 'Stake %', 'Commission', 'Status', 'Uptime (Day)', 'Provider', 'Website'];
        const csvRows = [
            headers.join(','),
            ...filtered.map(v => [
                `"${v.name}"`,
                v.validator,
                v.stakeHYPE,
                v.stakePct.toFixed(2),
                (v.commissionRate * 100).toFixed(1) + '%',
                v.isActive ? 'Active' : (v.isJailed ? 'Jailed' : 'Inactive'),
                v.dailyUptime !== undefined ? (v.dailyUptime * 100).toFixed(1) + '%' : 'N/A',
                `"${v.provider.label}"`,
                `"${v.website ?? ''}"`,
            ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'hyperliquid_validators.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="text-[#00E5BE] animate-pulse py-20 text-center">Loading validators…</div>;
    if (error) return <div className="text-red-400 py-20 text-center">{error}</div>;

    const targets = rows.filter(v => v.provider.key !== 'ovh' && v.isActive).length;

    return (
        <div>
            {/* Win-back banner */}
            <div className="mb-8 rounded-2xl border p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                style={{ background: 'rgba(0,229,190,0.04)', borderColor: 'rgba(0,229,190,0.2)' }}>
                <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[#00E5BE] mb-1">Win-Back Opportunity</div>
                    <p className="text-white font-bold text-lg">{targets} active validators on non-OVH infrastructure</p>
                    <p className="text-gray-400 text-sm mt-1">Each validator entity is a potential OVH bare-metal customer. Sort by stake to prioritize the highest-value targets.</p>
                </div>
                <button onClick={exportCSV}
                    className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:scale-105"
                    style={{ background: ACCENT }}>
                    Export CSV
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, address…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5BE]/40"
                    />
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none">
                    <option value="stake_desc">Stake ↓</option>
                    <option value="stake_asc">Stake ↑</option>
                    <option value="commission_asc">Commission ↑</option>
                    <option value="uptime_desc">Uptime ↓</option>
                </select>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                    {(['all', 'targets', 'ovh'] as ViewMode[]).map(m => (
                        <button key={m} onClick={() => setViewMode(m)}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
                            style={{ background: viewMode === m ? ACCENT : 'rgba(255,255,255,0.05)', color: viewMode === m ? '#000' : '#9CA3AF' }}>
                            {m === 'all' ? 'All' : m === 'targets' ? `Targets (${targets})` : 'OVH'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-600 mb-4 italic">
                Provider column is estimated from validator name/description — IPs are not available in the Hyperliquid API.
            </p>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-left">
                            {['Validator', 'Stake (HYPE)', 'Stake %', 'Commission', 'Status', 'Uptime', 'Provider', 'Website'].map(h => (
                                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(v => {
                            const isOVH = v.provider.key === 'ovh';
                            return (
                                <tr key={v.validator} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-white">{v.name}</div>
                                        <div className="text-xs text-gray-600 font-mono">{v.validator.slice(0, 10)}…</div>
                                    </td>
                                    <td className="px-4 py-3 text-white font-mono">{v.stakeHYPE.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-300">{v.stakePct.toFixed(1)}%</td>
                                    <td className="px-4 py-3 text-gray-300">{(v.commissionRate * 100).toFixed(1)}%</td>
                                    <td className="px-4 py-3">
                                        {v.isActive ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20">Active</span>
                                        ) : v.isJailed ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20">Jailed</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold text-gray-400 bg-gray-400/10 border border-gray-400/20">Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {v.dailyUptime !== undefined ? `${(v.dailyUptime * 100).toFixed(1)}%` : <span className="text-gray-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isOVH ? 'text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/20' : 'text-gray-400 bg-white/5 border border-white/10'}`}>
                                            {v.provider.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {v.website ? (
                                            <a href={v.website} target="_blank" rel="noreferrer"
                                                className="text-xs text-[#00E5BE] hover:underline truncate max-w-[140px] block">
                                                {truncate(v.website.replace(/^https?:\/\//, ''), 22)}
                                            </a>
                                        ) : <span className="text-gray-600 text-xs">—</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="py-16 text-center text-gray-500">No validators match your filters.</div>
                )}
            </div>

            <p className="text-xs text-gray-700 mt-4">{filtered.length} validators shown</p>
        </div>
    );
}
```

**Step 2: Update the Nodes page to use the explorer**

Replace `src/app/hyperliquid/nodes/page.tsx` with:

```typescript
import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';
import HyperliquidValidatorExplorer from '@/components/nodes/HyperliquidValidatorExplorer';

export default function HyperliquidNodes() {
    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
            <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
                <Header network="Hyperliquid" subtitle="Validator Explorer — Infrastructure Prospecting" />
                <div className="mt-8">
                    <HyperliquidValidatorExplorer />
                </div>
            </main>
        </div>
    );
}
```

**Step 3: Test in browser**

Navigate to `http://localhost:3000/hyperliquid/nodes`. Should show:
- Win-back banner with target count
- Searchable, sortable validator table
- "Targets" filter showing only non-OVH active validators
- CSV export working

---

## Task 9: Tests

**Files:**
- Modify: `ovh-blockchain-tracker/src/lib/hyperliquid/calculateMetrics.test.ts` (create if not exists)

**Step 1: Check existing test files**

```bash
find ovh-blockchain-tracker -name "*.test.ts" | grep hyperliquid
```

**Step 2: Write tests for the extended calculateMetrics**

```typescript
// src/lib/hyperliquid/__tests__/calculateMetrics.test.ts
import { describe, it, expect } from 'vitest';
import { calculateHyperliquidMetrics } from '../calculateMetrics';
import { HyperliquidValidator, HyperliquidOVHValidator } from '@/types/hyperliquid';

const makeValidator = (overrides: Partial<HyperliquidValidator> = {}): HyperliquidValidator => ({
    validator: '0x1234',
    signer: '0x1234',
    name: 'Test Validator',
    description: '',
    nRecentBlocks: 100,
    stake: 1_000_000_00, // 1000 HYPE
    isJailed: false,
    unjailableAfter: null,
    isActive: true,
    commission: '0.05',
    stats: [],
    commissionRate: 0.05,
    dailyUptime: 0.99,
    ...overrides,
});

describe('calculateHyperliquidMetrics', () => {
    it('includes allValidators in the returned metrics', () => {
        const validators = [makeValidator(), makeValidator({ validator: '0x5678', name: 'Val 2' })];
        const metrics = calculateHyperliquidMetrics(validators, []);
        expect(metrics.allValidators).toHaveLength(2);
        expect(metrics.allValidators[0].name).toBe('Test Validator');
    });

    it('counts only active validators in activeValidators', () => {
        const validators = [
            makeValidator({ isActive: true }),
            makeValidator({ validator: '0xjail', isActive: false, isJailed: true }),
        ];
        const metrics = calculateHyperliquidMetrics(validators, []);
        expect(metrics.activeValidators).toBe(1);
        expect(metrics.totalValidators).toBe(2);
    });

    it('computes OVH market share as 0 when no OVH validators', () => {
        const validators = [makeValidator(), makeValidator({ validator: '0x5678' })];
        const metrics = calculateHyperliquidMetrics(validators, []);
        expect(metrics.marketShare).toBe(0);
        expect(metrics.ovhValidators).toBe(0);
    });

    it('computes OVH market share correctly when OVH validators present', () => {
        const validators = [makeValidator(), makeValidator({ validator: '0x5678' })];
        const ovh: HyperliquidOVHValidator[] = [{
            ...validators[0],
            detectionMethod: 'name-match',
            matchedText: 'OVH',
        }];
        const metrics = calculateHyperliquidMetrics(validators, ovh);
        expect(metrics.marketShare).toBeCloseTo(50, 0);
    });
});
```

**Step 3: Run tests**

```bash
cd ovh-blockchain-tracker && npm run test -- --reporter=verbose 2>&1 | tail -30
```
Expected: all tests pass.

---

## Task 10: Final verification

**Step 1: Lint check**

```bash
cd ovh-blockchain-tracker && npm run lint 2>&1 | tail -20
```
Expected: no errors (warnings OK).

**Step 2: TypeScript check**

```bash
cd ovh-blockchain-tracker && npx tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

**Step 3: Full walkthrough in browser**

- `/hyperliquid` — dashboard loads, shows validator count, KPI pills, provider chart
- `/hyperliquid/analytics` — KPI row, stake chart, commission chart, provider breakdown
- `/hyperliquid/nodes` — validator table, search works, "Targets" filter isolates non-OVH, CSV export downloads

**Step 4: Commit**

```bash
cd ovh-blockchain-tracker
git add src/lib/hyperliquid/ src/types/hyperliquid.ts src/app/api/hyperliquid/ src/app/hyperliquid/ src/components/nodes/HyperliquidValidatorExplorer.tsx
git commit -m "feat(hyperliquid): wire up live data — dashboard fallback, analytics, validator explorer"
```
