# UseCasesHero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the duplicate/broken stats banners on all Use Cases pages with a single reusable `UseCasesHero` component showing OVH's provider rank, chain-specific infra highlights, and OVH global infra summary.

**Architecture:** A client component `UseCasesHero` fetches the chain's API on mount, computes OVH's rank in `providerBreakdown` (excluding `others`), and renders up to 4 stat tiles. Per-chain static config (tech highlights) lives in `src/lib/config/use-cases-config.ts`. Each use-cases page replaces its current stats block with `<UseCasesHero chainId="..." />`.

**Tech Stack:** Next.js App Router, React (client component), TypeScript, Tailwind CSS v4, existing `ChainId` type from `src/lib/chains.ts`

---

### Task 1: Create the per-chain config file

**Files:**
- Create: `src/lib/config/use-cases-config.ts`

**Step 1: Write the file**

```ts
import type { ChainId } from '@/lib/chains';

export interface TechHighlight {
    value: string;   // big text, e.g. "3000+"
    label: string;   // label above, e.g. "IOPS NVMe"
    sub: string;     // small text below, e.g. "Avalanche requirement"
}

export interface UseCasesChainConfig {
    apiRoute: string;
    techHighlights: [TechHighlight, TechHighlight];
}

export const USE_CASES_CONFIG: Partial<Record<ChainId, UseCasesChainConfig>> = {
    solana: {
        apiRoute: '/api/solana',
        techHighlights: [
            { value: '<10ms', label: 'Latency', sub: 'Bare metal, no hypervisor' },
            { value: '10G+', label: 'Bandwidth', sub: 'Turbine-ready networking' },
        ],
    },
    ethereum: {
        apiRoute: '/api/ethereum',
        techHighlights: [
            { value: 'Unmetered', label: 'Bandwidth', sub: '500 GB–4 TB/mo node traffic' },
            { value: 'NVMe', label: 'Storage', sub: 'Fast sync, archive-ready' },
        ],
    },
    avalanche: {
        apiRoute: '/api/avalanche',
        techHighlights: [
            { value: '3000+', label: 'IOPS NVMe', sub: 'Avalanche subnet requirement' },
            { value: 'High', label: 'CPU Freq.', sub: 'Validator performance' },
        ],
    },
    sui: {
        apiRoute: '/api/sui',
        techHighlights: [
            { value: 'NVMe', label: 'SSD Required', sub: 'Sui validator spec' },
            { value: '<5ms', label: 'Intra-DC Latency', sub: 'Low-latency networking' },
        ],
    },
    hyperliquid: {
        apiRoute: '/api/hyperliquid',
        techHighlights: [
            { value: '<1ms', label: 'Ultra-Low Latency', sub: 'HFT-grade bare metal' },
            { value: '25G+', label: 'Networking', sub: 'Market-maker ready' },
        ],
    },
    tron: {
        apiRoute: '/api/tron',
        techHighlights: [
            { value: 'High', label: 'Throughput', sub: 'TPS-optimised storage' },
            { value: '1.3 Tbit/s', label: 'Anti-DDoS', sub: 'Enterprise protection' },
        ],
    },
};
```

**Step 2: No test needed** — pure config object, no logic to test.

**Step 3: Commit**

```bash
git add src/lib/config/use-cases-config.ts
git commit -m "feat: add per-chain use-cases config (tech highlights)"
```

---

### Task 2: Create the `UseCasesHero` component

**Files:**
- Create: `src/components/dashboard/UseCasesHero.tsx`

**Context on data shape:**

The chain API endpoints (`/api/solana`, `/api/ethereum`, etc.) return:
```json
{ "success": true, "data": { "providerBreakdown": [ { "key": "ovh", "label": "OVHcloud", "marketShare": 15.3, "nodeCount": 120 }, { "key": "others", ... }, ... ] } }
```

OVH rank = position in the list sorted by `marketShare` DESC, after removing the `others` entry (key === `'others'`). If rank > 3 or OVH not found, the rank tile is not rendered.

**Step 1: Write the component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { CHAINS, type ChainId } from '@/lib/chains';
import { USE_CASES_CONFIG } from '@/lib/config/use-cases-config';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

interface Props {
    chainId: ChainId;
}

const RANK_LABELS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };

function StatTile({
    label,
    value,
    sub,
    accent,
    highlight,
}: {
    label: string;
    value: string;
    sub?: string;
    accent: string;
    highlight?: boolean;
}) {
    return (
        <div
            className="rounded-xl p-4 border bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-0.5 transition-all"
            style={{
                borderColor: highlight ? `${accent}40` : 'rgba(255,255,255,0.08)',
                boxShadow: highlight ? `0 2px 20px ${accent}15` : undefined,
            }}
        >
            <p className="text-[8px] uppercase tracking-[0.15em] font-bold" style={{ color: highlight ? `${accent}` : 'rgba(255,255,255,0.3)' }}>
                {label}
            </p>
            <p className="text-2xl font-black" style={{ color: highlight ? accent : 'white' }}>
                {value}
            </p>
            {sub && <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">{sub}</p>}
        </div>
    );
}

export default function UseCasesHero({ chainId }: Props) {
    const [ovhRank, setOvhRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const chain = CHAINS[chainId];
    const config = USE_CASES_CONFIG[chainId];

    useEffect(() => {
        if (!config) { setLoading(false); return; }

        fetch(config.apiRoute)
            .then((r) => r.json())
            .then((d) => {
                const breakdown: ProviderBreakdownEntry[] = d?.data?.providerBreakdown ?? [];
                const ranked = breakdown
                    .filter((p) => p.key !== 'others')
                    .sort((a, b) => b.marketShare - a.marketShare);
                const idx = ranked.findIndex((p) => p.key === 'ovh');
                setOvhRank(idx === -1 ? null : idx + 1);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [config]);

    if (!config) return null;

    const { accent } = chain;
    const showRank = !loading && ovhRank !== null && ovhRank <= 3;

    return (
        <div className={`grid gap-3 mb-12 ${showRank ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* A — OVH Rank (only if top 3) */}
            {showRank && (
                <StatTile
                    label={`${chain.name} Provider Rank`}
                    value={`#${RANK_LABELS[ovhRank!] ?? ovhRank}`}
                    sub="by node count"
                    accent={accent}
                    highlight
                />
            )}

            {/* D — Chain-specific highlights */}
            {config.techHighlights.map((h) => (
                <StatTile key={h.label} label={h.label} value={h.value} sub={h.sub} accent={accent} />
            ))}

            {/* C — OVH global infra */}
            <div
                className="rounded-xl p-4 border border-white/8 bg-black/30 backdrop-blur-xl text-center flex flex-col justify-center gap-1 transition-all"
            >
                <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">OVH Infrastructure</p>
                <p className="text-xl font-black text-white">46 DCs</p>
                <p className="text-[8px] text-white/20 uppercase tracking-[0.08em] leading-relaxed">
                    1.3 Tbit/s Anti-DDoS · NVMe Bare Metal
                </p>
            </div>
        </div>
    );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/UseCasesHero.tsx
git commit -m "feat: add UseCasesHero component (rank + tech highlights + OVH infra)"
```

---

### Task 3: Update Solana use-cases page (`/use-cases/page.tsx`)

**Files:**
- Modify: `src/app/use-cases/page.tsx`

**Step 1: Add import at top of file (after existing imports)**

```tsx
import UseCasesHero from '@/components/dashboard/UseCasesHero';
```

**Step 2: Replace the entire stats `<div>` block**

Find and replace this block (lines ~223–229):
```tsx
{/* Stats banner omitted for brevity or kept if short */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-12">
    <div className="rounded-xl p-3 border border-white/8 bg-black/30 text-center">
         <p className="text-[8px] uppercase tracking-[0.15em] text-white/30 font-bold">Solana Share</p>
         <p className="text-2xl font-black text-[#00F0FF]">~15%</p>
    </div>
    {/* ... other stats cards ... */}
</div>
```

With:
```tsx
<UseCasesHero chainId="solana" />
```

**Step 3: Commit**

```bash
git add src/app/use-cases/page.tsx
git commit -m "feat: use UseCasesHero on Solana use-cases page"
```

---

### Task 4: Update Ethereum use-cases page

**Files:**
- Modify: `src/app/ethereum/use-cases/page.tsx`

**Step 1: Remove the metrics state and fetch** (lines ~208–221 — the `useState`, `useEffect`, `ovhEntry`, `ovhShare`, `ovhNodes`, `totalNodes` declarations). The component no longer needs to fetch metrics itself.

Also remove the `EthSnapshotMetrics` import if it's only used for that.

**Step 2: Add import**

```tsx
import UseCasesHero from '@/components/dashboard/UseCasesHero';
```

**Step 3: Replace the stats grid** (lines ~244–268, the `{[...].map(…)}` block) with:

```tsx
<UseCasesHero chainId="ethereum" />
```

**Step 4: Change `'use client'` check** — the page still needs `'use client'` because of other interactivity if any, otherwise it can remain. Leave it as-is.

**Step 5: Commit**

```bash
git add src/app/ethereum/use-cases/page.tsx
git commit -m "feat: use UseCasesHero on Ethereum use-cases page"
```

---

### Task 5: Update Avalanche use-cases page

**Files:**
- Modify: `src/app/avalanche/use-cases/page.tsx`

**Step 1: Add import**

```tsx
import UseCasesHero from '@/components/dashboard/UseCasesHero';
```

**Step 2: Replace the entire stats grid** (the `<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">` block with all its hardcoded tiles) with:

```tsx
<UseCasesHero chainId="avalanche" />
```

**Step 3: Commit**

```bash
git add src/app/avalanche/use-cases/page.tsx
git commit -m "feat: use UseCasesHero on Avalanche use-cases page"
```

---

### Task 6: Update Sui use-cases page

**Files:**
- Modify: `src/app/sui/use-cases/page.tsx`

**Step 1: Add import**

```tsx
import UseCasesHero from '@/components/dashboard/UseCasesHero';
```

**Step 2: Add the component** after the `<Header>` line and before the `<div className="mt-16 space-y-24">` block:

```tsx
<div className="mt-8 px-4">
    <UseCasesHero chainId="sui" />
</div>
```

**Step 3: Commit**

```bash
git add src/app/sui/use-cases/page.tsx
git commit -m "feat: use UseCasesHero on Sui use-cases page"
```

---

### Task 7: Update Tron and Hyperliquid use-cases pages

**Files:**
- Modify: `src/app/tron/use-cases/page.tsx`
- Modify: `src/app/hyperliquid/use-cases/page.tsx`

**Step 1: Both pages — add import**

```tsx
import UseCasesHero from '@/components/dashboard/UseCasesHero';
```

**Step 2: Tron** — add after `<Header>` inside the content wrapper:

```tsx
<div className="mt-8">
    <UseCasesHero chainId="tron" />
</div>
```

**Step 3: Hyperliquid** — add after `<Header>` before the existing placeholder div:

```tsx
<UseCasesHero chainId="hyperliquid" />
```

Note: Hyperliquid has no `/api/hyperliquid` route yet — the component will silently render without the rank tile (config.apiRoute fetch will fail gracefully, `ovhRank` stays `null`). The tech highlights and infra tile will still show.

**Step 4: Commit**

```bash
git add src/app/tron/use-cases/page.tsx src/app/hyperliquid/use-cases/page.tsx
git commit -m "feat: use UseCasesHero on Tron and Hyperliquid use-cases pages"
```

---

### Task 8: Visual check

**Step 1:** Run the dev server

```bash
npm run dev
```

**Step 2:** Visit each use-cases page and verify:
- `/use-cases` — Solana: rank tile + 2 tech tiles + OVH infra tile
- `/ethereum/use-cases` — same pattern, no more duplicate analytics stats
- `/avalanche/use-cases` — replaces the 5 hardcoded tiles
- `/sui/use-cases` — new tiles appear above existing content
- `/tron/use-cases` — new tiles appear
- `/hyperliquid/use-cases` — 3 tiles (no rank since no API)

**Step 3:** Check that rank tile is accent-colored, others are muted white.

**Step 4:** Check TypeScript

```bash
npx tsc --noEmit
```

Expected: no errors.
