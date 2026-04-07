# Tron Blockchain Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Tron as a tracked blockchain, showing OVHcloud's infrastructure market share among TRON network nodes using IP-based ASN detection.

**Architecture:** Fetch all network nodes from TronGrid's `wallet/listnodes` REST endpoint (returns ~200–500 nodes with IP:port), run MaxMind ASN lookup on each IP, filter OVH nodes, calculate provider breakdown and geo distribution. Cache results in Turso (2h TTL). Mirror the Sui integration pattern exactly.

**Tech Stack:** TypeScript, Next.js App Router, MaxMind GeoLite2 (offline), Turso/LibSQL cache, TronGrid public API (`https://api.trongrid.io`), Tailwind CSS, Recharts/react-simple-maps for the dashboard.

---

## Files Overview

**Create (8 new files):**
- `src/types/tron.ts`
- `src/lib/tron/fetchNodes.ts`
- `src/lib/tron/filterOVH.ts`
- `src/lib/tron/calculateMetrics.ts`
- `src/app/api/tron/route.ts`
- `src/app/api/cron/tron-refresh/route.ts`
- `src/app/tron/layout.tsx`
- `src/app/tron/page.tsx`

**Modify (4 existing files):**
- `src/lib/chains.ts` — add `tron` ChainId + config
- `src/lib/config/constants.ts` — add `TRON_API_URL`, `CACHE_KEY_TRON`, `CACHE_TTL_TRON_MS`
- `src/lib/cache/chain-storage.ts` — add `tron` to `CACHE_KEYS` and `CACHE_TTL`
- `src/components/OthersDropdown.tsx` — add Tron entry

---

## Task 1: Type Definitions

**Files:**
- Create: `src/types/tron.ts`

**Step 1: Create the file**

```typescript
/**
 * Tron-specific types
 *
 * Data source: TronGrid HTTP API `wallet/listnodes`
 * Endpoint: https://api.trongrid.io/wallet/listnodes (POST, no params)
 *
 * Response shape:
 * {
 *   "nodes": [
 *     { "address": { "host": "34.86.86.229", "port": 18888 } }
 *   ]
 * }
 *
 * Unlike Sui (validators with voting power), Tron nodes are raw
 * network participants — no staking metadata. Pure infra tracking.
 */

export interface TronNode {
  /** IPv4 address extracted from the API response */
  ip: string;
  /** P2P port (typically 18888) */
  port: number;
}

export interface TronIPInfo {
  ip: string;
  asn: string;
  org: string;
  country: string;
  country_name: string;
  city: string;
  lat: number;
  lon: number;
}

export interface TronOVHNode extends TronNode {
  ipInfo: TronIPInfo;
  provider?: string;
}

export interface TronProviderCategorizationResult {
  distribution: Record<string, number>;
  othersBreakdown: Record<string, number>;
  globalGeoDistribution: Record<string, number>;
}

export interface TronDashboardMetrics {
  totalNodes: number;
  ovhNodes: number;
  marketShare: number;
  geoDistribution: Record<string, number>;
  globalGeoDistribution?: Record<string, number>;
  providerDistribution: Record<string, number>;
  providerBreakdown?: import('./dashboard').ProviderBreakdownEntry[];
  othersBreakdown?: Record<string, number>;
  topValidators: TronOVHNode[];
}

export interface TronAPIResponse {
  success: boolean;
  data?: TronDashboardMetrics;
  error?: string;
  cached?: boolean;
  stale?: boolean;
  timestamp?: number;
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd "ovh-blockchain-tracker" && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors related to `src/types/tron.ts`.

**Step 3: Commit**

```bash
git add src/types/tron.ts
git commit -m "feat(tron): add type definitions"
```

---

## Task 2: Update Constants & Chain Storage

**Files:**
- Modify: `src/lib/config/constants.ts`
- Modify: `src/lib/cache/chain-storage.ts`

**Step 1: Add Tron constants to `constants.ts`**

Add at the end of `src/lib/config/constants.ts`:

```typescript
// Tron API
export const TRON_API_URL = 'https://api.trongrid.io';

// Cache keys
export const CACHE_KEY_TRON = 'tron-metrics';
export const CACHE_TTL_TRON_MS = 2 * 60 * 60 * 1000; // 2 hours
```

**Step 2: Add `tron` to `chain-storage.ts`**

In `src/lib/cache/chain-storage.ts`, update the `CACHE_KEYS` object (add `tron`):

```typescript
export const CACHE_KEYS = {
    solana: 'solana-metrics',
    avalanche: 'avalanche-metrics',
    sui: 'sui-metrics',
    tron: 'tron-metrics',
    // celestia: 'celestia-metrics',
} as const;
```

And update `CACHE_TTL` to add `tron`:

```typescript
export const CACHE_TTL: Record<ChainId, number> = {
    solana: 60 * 60 * 1000,        // 1 hour
    avalanche: 2 * 60 * 60 * 1000, // 2 hours
    sui: 2 * 60 * 60 * 1000,       // 2 hours
    tron: 2 * 60 * 60 * 1000,      // 2 hours
};
```

Note: `ChainId` in `chain-storage.ts` is derived from `CACHE_KEYS` via `keyof typeof CACHE_KEYS` — adding the entry above automatically extends the type. No other change needed.

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

**Step 4: Commit**

```bash
git add src/lib/config/constants.ts src/lib/cache/chain-storage.ts
git commit -m "feat(tron): add cache key and TTL constants"
```

---

## Task 3: Fetch Nodes

**Files:**
- Create: `src/lib/tron/fetchNodes.ts`

**Step 1: Create the file**

```typescript
import { TronNode } from '@/types/tron';
import { logger } from '@/lib/utils';
import { TRON_API_URL } from '@/lib/config/constants';

/**
 * Raw shape returned by POST https://api.trongrid.io/wallet/listnodes
 */
interface TronListNodesResponse {
  nodes?: Array<{
    address?: {
      host?: string;
      port?: number;
    };
  }>;
}

/**
 * Normalise an IP string from the TronGrid response.
 *
 * Edge cases handled:
 *  - IPv6-mapped IPv4 "::ffff:1.2.3.4" → "1.2.3.4"
 *  - Pure IPv6 → null (MaxMind GeoLite2 ASN DB only covers IPv4)
 *  - Hostname strings → null (skip DNS resolution for simplicity)
 */
function normaliseIP(raw: string): string | null {
  if (!raw) return null;

  // IPv6-mapped IPv4
  const mapped = raw.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];

  // Pure IPv4
  if (/^\d+\.\d+\.\d+\.\d+$/.test(raw)) return raw;

  // Anything else (pure IPv6, hostnames) — skip
  return null;
}

/**
 * Fetch all TRON network nodes from TronGrid.
 * Returns nodes that have a valid IPv4 address only.
 */
export async function fetchTronNodes(): Promise<TronNode[]> {
  logger.info('[Tron] Fetching node list from TronGrid...');

  const response = await fetch(`${TRON_API_URL}/wallet/listnodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`[Tron] TronGrid HTTP error: ${response.status} ${response.statusText}`);
  }

  const json: TronListNodesResponse = await response.json();
  const rawNodes = json.nodes ?? [];

  logger.info(`[Tron] Received ${rawNodes.length} raw nodes from TronGrid`);

  const nodes: TronNode[] = [];
  for (const raw of rawNodes) {
    const host = raw.address?.host ?? '';
    const ip = normaliseIP(host);
    if (!ip) continue;

    nodes.push({ ip, port: raw.address?.port ?? 18888 });
  }

  logger.info(`[Tron] ${nodes.length} nodes with valid IPv4 addresses`);
  return nodes;
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/tron/fetchNodes.ts
git commit -m "feat(tron): add TronGrid node fetcher"
```

---

## Task 4: Filter OVH Nodes

**Files:**
- Create: `src/lib/tron/filterOVH.ts`

This is a direct port of `src/lib/sui/filterOVH.ts` with Tron types. The logic is identical.

**Step 1: Create the file**

```typescript
import { TronNode, TronOVHNode, TronIPInfo, TronProviderCategorizationResult } from '@/types/tron';
import { logger } from '@/lib/utils';
import {
  initMaxMind,
  getASNFromMaxMind,
  getCountryFromMaxMind,
  isOVHIP,
  batchGetASN,
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';

function identifyProvider(asn: string, orgName: string): string {
  for (const [, info] of Object.entries(PROVIDER_ASN_MAP)) {
    if (info.asns.includes(asn)) return info.label;
  }
  const o = orgName.toLowerCase();
  if (o.includes('amazon') || o.includes('aws')) return 'AWS';
  if (o.includes('google')) return 'Google Cloud';
  if (o.includes('hetzner')) return 'Hetzner';
  if (o.includes('digitalocean') || o.includes('digital ocean')) return 'DigitalOcean';
  if (o.includes('ovh')) return 'OVHcloud';
  if (o.includes('alibaba')) return 'Alibaba Cloud';
  if (o.includes('oracle')) return 'Oracle Cloud';
  if (o.includes('microsoft') || o.includes('azure')) return 'Azure';
  return orgName || 'Unknown Provider';
}

export async function filterOVHTronNodes(nodes: TronNode[]): Promise<TronOVHNode[]> {
  await initMaxMind();

  const ovhNodes: TronOVHNode[] = [];
  logger.info(`[Tron/MaxMind] Filtering ${nodes.length} nodes for OVH ASNs...`);

  for (const node of nodes) {
    if (!isOVHIP(node.ip, OVH_ASN_LIST)) continue;

    const asnInfo = getASNFromMaxMind(node.ip);
    if (!asnInfo) continue;

    const countryInfo = getCountryFromMaxMind(node.ip);

    const ipInfo: TronIPInfo = {
      ip: node.ip,
      asn: asnInfo.asn,
      org: asnInfo.org,
      country: countryInfo?.countryCode ?? 'Unknown',
      country_name: countryInfo?.country ?? 'Unknown',
      city: 'Unknown',
      lat: 0,
      lon: 0,
    };

    ovhNodes.push({
      ...node,
      ipInfo,
      provider: identifyProvider(asnInfo.asn, asnInfo.org),
    });
  }

  logger.info(`[Tron/MaxMind] Found ${ovhNodes.length} OVH Tron nodes`);
  return ovhNodes;
}

export async function categorizeTronNodesByProvider(
  nodes: TronNode[],
): Promise<TronProviderCategorizationResult> {
  await initMaxMind();

  const distribution: Record<string, number> = {};
  const othersBreakdown: Record<string, number> = {};
  const globalGeoDistribution: Record<string, number> = {};

  for (const key of Object.keys(PROVIDER_ASN_MAP)) {
    distribution[key] = 0;
  }
  distribution.others = 0;

  logger.info(`[Tron/MaxMind] Categorising ${nodes.length} nodes by provider...`);

  const ips = nodes.map(n => n.ip);
  const asnResults = batchGetASN(ips);

  for (const ip of ips) {
    const countryInfo = getCountryFromMaxMind(ip);
    if (countryInfo?.countryCode) {
      globalGeoDistribution[countryInfo.countryCode] =
        (globalGeoDistribution[countryInfo.countryCode] ?? 0) + 1;
    }

    const asnInfo = asnResults.get(ip);
    if (!asnInfo) {
      distribution.others++;
      continue;
    }

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

  return { distribution, othersBreakdown, globalGeoDistribution };
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/tron/filterOVH.ts
git commit -m "feat(tron): add OVH filter and provider categorization"
```

---

## Task 5: Calculate Metrics

**Files:**
- Create: `src/lib/tron/calculateMetrics.ts`

Port of `src/lib/sui/calculateMetrics.ts` — removed `ovhVotingPowerShare` (Tron nodes have no stake metadata). Logic otherwise identical.

**Step 1: Create the file**

```typescript
import { TronNode, TronOVHNode, TronDashboardMetrics } from '@/types/tron';
import { ProviderBreakdownEntry } from '@/types/dashboard';
import { TronProviderCategorizationResult } from './filterOVH';
import { PROVIDER_COLORS, PROVIDER_LABELS } from '@/lib/config/constants';

const MARKET_SHARE_THRESHOLD = 5; // providers below this % go into "Others"

export function calculateTronMetrics(
  allNodes: TronNode[],
  ovhNodes: TronOVHNode[],
  providerCategorization: TronProviderCategorizationResult,
): TronDashboardMetrics {
  const totalNodes = allNodes.length;
  const ovhNodeCount = ovhNodes.length;
  const { distribution, othersBreakdown, globalGeoDistribution } = providerCategorization;

  const marketShare = totalNodes > 0 ? (ovhNodeCount / totalNodes) * 100 : 0;

  // Geo distribution — OVH nodes only
  const geoDistribution: Record<string, number> = {};
  for (const node of ovhNodes) {
    const country = node.ipInfo.country;
    if (country && country !== 'Unknown') {
      geoDistribution[country] = (geoDistribution[country] ?? 0) + 1;
    }
  }

  // Top nodes — OVH nodes sorted by IP (no stake to sort by)
  const topValidators = [...ovhNodes].sort((a, b) => a.ip.localeCompare(b.ip));

  // Provider breakdown chart
  const eligibleEntries: ProviderBreakdownEntry[] = [];
  let totalOthersCount = distribution.others ?? 0;
  const newOthersBreakdown: Record<string, number> = { ...(othersBreakdown ?? {}) };

  for (const [key, count] of Object.entries(distribution)) {
    if (key === 'others' || count === 0) continue;
    const share = totalNodes > 0 ? (count / totalNodes) * 100 : 0;

    if (share > MARKET_SHARE_THRESHOLD) {
      eligibleEntries.push({
        key,
        label: PROVIDER_LABELS[key] ?? key,
        nodeCount: count,
        marketShare: share,
        color: PROVIDER_COLORS[key] ?? '#6B7280',
      });
    } else {
      totalOthersCount += count;
      newOthersBreakdown[PROVIDER_LABELS[key] ?? key] = count;
    }
  }

  if (othersBreakdown) {
    for (const [org, orgCount] of Object.entries(othersBreakdown)) {
      const share = totalNodes > 0 ? (orgCount / totalNodes) * 100 : 0;
      if (share > MARKET_SHARE_THRESHOLD) {
        eligibleEntries.push({
          key: org.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          label: org,
          nodeCount: orgCount,
          marketShare: share,
          color: '#6B7280',
        });
        totalOthersCount -= orgCount;
        delete newOthersBreakdown[org];
      }
    }
  }

  if (totalOthersCount > 0) {
    const othersShare = totalNodes > 0 ? (totalOthersCount / totalNodes) * 100 : 0;
    const topOthers = Object.entries(newOthersBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, nodeCount]) => ({
        label,
        nodeCount,
        marketShare: totalNodes > 0 ? (nodeCount / totalNodes) * 100 : 0,
      }));

    eligibleEntries.push({
      key: 'others',
      label: 'Others',
      nodeCount: totalOthersCount,
      marketShare: othersShare,
      color: PROVIDER_COLORS['others'],
      subProviders: topOthers.length > 0 ? topOthers : undefined,
    });
  }

  return {
    totalNodes,
    ovhNodes: ovhNodeCount,
    marketShare,
    geoDistribution,
    globalGeoDistribution,
    providerDistribution: distribution,
    providerBreakdown: eligibleEntries.sort((a, b) => b.nodeCount - a.nodeCount),
    othersBreakdown,
    topValidators,
  };
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/tron/calculateMetrics.ts
git commit -m "feat(tron): add metrics calculation"
```

---

## Task 6: API Route

**Files:**
- Create: `src/app/api/tron/route.ts`

Direct port of `src/app/api/sui/route.ts` with `sui` → `tron`.

**Step 1: Create the file**

```typescript
import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { TronDashboardMetrics, TronAPIResponse } from '@/types/tron';
import { logger } from '@/lib/utils';

/**
 * GET /api/tron
 *
 * Returns Tron dashboard metrics (cached).
 * Trigger /api/cron/tron-refresh to populate the cache first.
 */
export async function GET() {
  try {
    const cache = await readChainCache<TronDashboardMetrics>('tron');

    if (cache && isChainCacheFresh(cache, 'tron')) {
      logger.info('[API/tron] Returning fresh cache');
      const response: TronAPIResponse = {
        success: true,
        data: cache.data,
        cached: true,
        timestamp: cache.timestamp,
      };
      return NextResponse.json(response);
    }

    if (cache) {
      logger.info('[API/tron] Cache is stale — returning with warning');
      const response: TronAPIResponse = {
        success: true,
        data: cache.data,
        cached: true,
        stale: true,
        timestamp: cache.timestamp,
      };
      return NextResponse.json(response);
    }

    logger.warn('[API/tron] No cache available. Run the cron job first.');
    return NextResponse.json(
      {
        success: false,
        error: 'Tron data is not yet available. Trigger /api/cron/tron-refresh first.',
      },
      { status: 503 },
    );
  } catch (error) {
    logger.error('[API/tron] Unexpected error:', error);
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

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/app/api/tron/route.ts
git commit -m "feat(tron): add GET /api/tron endpoint"
```

---

## Task 7: Cron Refresh Route

**Files:**
- Create: `src/app/api/cron/tron-refresh/route.ts`

**Step 1: Create the file**

```typescript
import { NextResponse } from 'next/server';
import { fetchTronNodes } from '@/lib/tron/fetchNodes';
import { filterOVHTronNodes, categorizeTronNodesByProvider } from '@/lib/tron/filterOVH';
import { calculateTronMetrics } from '@/lib/tron/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { logger } from '@/lib/utils';

/**
 * GET /api/cron/tron-refresh
 * POST /api/cron/tron-refresh
 *
 * Full pipeline: fetch → filter → categorize → calculate → cache.
 * Trigger manually or via Vercel Cron / external scheduler.
 */
export async function GET() {
  return handleRefresh();
}

export async function POST() {
  return handleRefresh();
}

async function handleRefresh() {
  const startTime = Date.now();
  logger.info('[Cron/Tron] Starting refresh cycle...');

  try {
    // 1. Fetch
    const allNodes = await fetchTronNodes();

    // 2. Filter & Categorize in parallel
    const [ovhNodes, providerCategorization] = await Promise.all([
      filterOVHTronNodes(allNodes),
      categorizeTronNodesByProvider(allNodes),
    ]);

    // 3. Calculate
    const metrics = calculateTronMetrics(allNodes, ovhNodes, providerCategorization);

    // 4. Cache
    await writeChainCache('tron', metrics, metrics.totalNodes);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`[Cron/Tron] Refresh completed in ${duration}s`);

    return NextResponse.json({
      success: true,
      message: `Tron metrics refreshed in ${duration}s`,
      stats: {
        totalNodes: metrics.totalNodes,
        ovhNodes: metrics.ovhNodes,
        marketShare: metrics.marketShare.toFixed(2) + '%',
      },
    });
  } catch (error) {
    logger.error('[Cron/Tron] Refresh failed:', error);
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

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/app/api/cron/tron-refresh/route.ts
git commit -m "feat(tron): add cron refresh endpoint"
```

---

## Task 8: Chain Config & Navigation

**Files:**
- Modify: `src/lib/chains.ts`
- Modify: `src/components/OthersDropdown.tsx`

### 8a — chains.ts

**Step 1: Add `tron` to `ChainId` union and `CHAINS` map**

In `src/lib/chains.ts`:

Change:
```typescript
export type ChainId = 'solana' | 'ethereum' | 'avalanche' | 'hyperliquid' | 'sui';
```
To:
```typescript
export type ChainId = 'solana' | 'ethereum' | 'avalanche' | 'hyperliquid' | 'sui' | 'tron';
```

Add to `CHAINS`:
```typescript
  tron: {
    id: 'tron',
    name: 'Tron',
    accent: '#FF060A',
    route: '/tron',
    cssClass: 'tron-theme',
    bgTint: 'rgba(255,6,10,0.10)',
  },
```

### 8b — OthersDropdown.tsx

**Step 2: Add Tron to `OTHER_CHAINS` array**

Add after the `hyperliquid` entry in `src/components/OthersDropdown.tsx`:

```typescript
  {
    id: 'tron',
    label: 'Tron',
    ticker: 'TRX',
    href: '/tron',
    color: '#FF060A',
    live: true,
    icon: (
      <svg width="12" height="13" viewBox="0 0 24 28" fill="currentColor" className="shrink-0">
        <path d="M23.7 6.8L20.3 1.2C20 0.7 19.5 0.4 18.9 0.4H5.1C4.5 0.4 4 0.7 3.7 1.2L0.3 6.8C-0.1 7.5 0 8.3 0.5 8.9L11.4 27.3C11.7 27.7 12.1 28 12.5 28H12.6C13 28 13.4 27.7 13.7 27.3L24.5 8.9C25 8.3 25.1 7.5 23.7 6.8ZM13.5 22.8L13.5 9.8L20.5 8.2L13.5 22.8ZM11.5 9.8L11.5 22.8L4.5 8.2L11.5 9.8ZM12.5 8L5.3 6.3L12.5 2.4L19.7 6.3L12.5 8Z" />
      </svg>
    ),
  },
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add src/lib/chains.ts src/components/OthersDropdown.tsx
git commit -m "feat(tron): register chain config and add to navigation dropdown"
```

---

## Task 9: Dashboard Pages

**Files:**
- Create: `src/app/tron/layout.tsx`
- Create: `src/app/tron/page.tsx`

### 9a — layout.tsx

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tron Dashboard — OVHcloud Node Tracker',
  description: 'Real-time tracking of TRON network nodes hosted on OVHcloud infrastructure.',
};

export default function TronLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### 9b — page.tsx

Port of `src/app/sui/page.tsx` with Tron accent color and copy.

```typescript
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const WorldMap = dynamic(() => import('@/components/dashboard/WorldMap'), { ssr: false });
import LoadingState from '@/components/dashboard/LoadingState';
import ErrorState from '@/components/dashboard/ErrorState';
import AnimatedTagline from '@/components/dashboard/AnimatedTagline';
import MethodologyModal from '@/components/dashboard/MethodologyModal';
import ParticlesBackground from '@/components/ParticlesBackground';
import BlockchainCubes from '@/components/BlockchainCubes';
import { TronDashboardMetrics, TronAPIResponse } from '@/types/tron';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const TRON_RED = '#FF060A';

export default function TronPage() {
  const [metrics, setMetrics] = useState<TronDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useScrollReveal(!loading && !!metrics);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tron');
      const data: TronAPIResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch data');
      if (data.data) setMetrics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const bgStyle = {
    background: '#0a0000',
  };

  if (loading) {
    return (
      <div className="min-h-screen relative" style={bgStyle}>
        <BlockchainCubes opacity={0.05} count={8} />
        <ParticlesBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={bgStyle} className="min-h-screen relative">
        <BlockchainCubes opacity={0.05} count={8} />
        <ParticlesBackground />
        <div className="relative z-10">
          <ErrorState message={error || 'No data available'} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={bgStyle}>
      <BlockchainCubes opacity={0.05} count={8} />
      <ParticlesBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col p-2 md:p-4 w-full max-w-7xl mx-auto">
          <AnimatedTagline
            title={
              <>
                Distribution of Tron Nodes on{' '}
                <span style={{ color: TRON_RED, textShadow: `0 0 20px ${TRON_RED}80` }}>
                  OVHcloud
                </span>
              </>
            }
            subtitle="Mapping OVHcloud's infrastructure footprint across the TRON network"
          />

          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
            {metrics.geoDistribution && (
              <section className="flex-1 flex flex-col relative z-10 w-full h-[600px] md:h-[700px]">
                <div className="w-full h-full flex items-center justify-center">
                  <WorldMap
                    geoDistribution={metrics.geoDistribution}
                    globalGeoDistribution={metrics.globalGeoDistribution || {}}
                    totalNodes={metrics.totalNodes}
                    ovhNodes={metrics.ovhNodes}
                    marketShare={metrics.marketShare}
                  />
                </div>
              </section>
            )}
          </div>
        </main>

        <MethodologyModal />
      </div>
    </div>
  );
}
```

**Step 1: Create both files above**

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/app/tron/layout.tsx src/app/tron/page.tsx
git commit -m "feat(tron): add dashboard page and layout"
```

---

## Task 10: End-to-End Verification

**Step 1: Start the dev server**

```bash
npm run dev
```

**Step 2: Trigger the cron to populate the cache**

```bash
curl -X POST http://localhost:3000/api/cron/tron-refresh
```

Expected response:
```json
{
  "success": true,
  "message": "Tron metrics refreshed in X.XXs",
  "stats": {
    "totalNodes": 250,
    "ovhNodes": 5,
    "marketShare": "2.00%"
  }
}
```

If `totalNodes: 0` — TronGrid might have returned an unexpected format. Check the raw response:
```bash
curl -X POST https://api.trongrid.io/wallet/listnodes | jq '.nodes[0]'
```
This will show you the actual `address.host` field format so you can adjust `normaliseIP()` in `fetchNodes.ts`.

**Step 3: Check the API endpoint**

```bash
curl http://localhost:3000/api/tron | jq '.data.totalNodes, .data.ovhNodes, .data.marketShare'
```
Expected: numbers (not null).

**Step 4: Visit the page**

Open `http://localhost:3000/tron` — should show the WorldMap with geo distribution and the animated tagline.

**Step 5: Check the navigation dropdown**

Click "Others" in the sidebar — Tron (TRX) should appear as a live link.

**Step 6: Run TypeScript check one final time**

```bash
npm run build 2>&1 | tail -20
```
Expected: Build succeeds with no TypeScript errors.

---

## Cron Scheduling (Production)

Add to `vercel.json` (or equivalent) to refresh every 2 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/tron-refresh",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

Or add to `ecosystem.config.js` (PM2) if self-hosted:

```javascript
{
  name: 'tron-refresh',
  script: 'curl -X POST http://localhost:3000/api/cron/tron-refresh',
  cron_restart: '0 */2 * * *',
  autorestart: false,
}
```
