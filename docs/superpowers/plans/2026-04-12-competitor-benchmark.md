# Competitor Benchmark — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `CompetitorBenchmark.tsx` fully functional — live data from the existing market-share API, top-6 dynamic providers, all 5 chains, and snapshot infrastructure for the evolution chart that will populate over time.

**Architecture:** A new `benchmark_snapshots` DB table accumulates one row per worker run per chain. A new `/api/benchmark/evolution` route reads those rows and returns monthly time-series + 7-day OVH delta. `CompetitorBenchmark.tsx` is refactored to fetch both APIs and render live data; the evolution chart and delta column display an empty-state gracefully until data accumulates.

**Tech Stack:** LibSQL (`@libsql/client`), Next.js App Router, Recharts, Vitest, TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/db/database.ts` | Modify | Add `CREATE TABLE IF NOT EXISTS benchmark_snapshots` |
| `src/lib/benchmark/normalizeProviders.ts` | **New** | Pure fn: top-N providers + "Others" rollup |
| `src/lib/benchmark/normalizeProviders.test.ts` | **New** | Vitest unit tests for normalizeProviders |
| `src/lib/benchmark/snapshotRepository.ts` | **New** | DB read/write for benchmark_snapshots |
| `src/lib/benchmark/snapshotRepository.test.ts` | **New** | Vitest unit tests with in-memory LibSQL |
| `src/app/api/benchmark/evolution/route.ts` | **New** | API: monthly evolution + weekly delta |
| `src/components/benchmark/CompetitorBenchmark.tsx` | Modify | Wire live data, remove ComingSoonCard |
| `scripts/worker.ts` | Modify | Add writeBenchmarkSnapshot after writeChainCache |
| `scripts/worker-avax.ts` | Modify | Add writeBenchmarkSnapshot after writeChainCache |
| `scripts/worker-sui.ts` | Modify | Add writeBenchmarkSnapshot after writeChainCache |
| `scripts/worker-tron.ts` | Modify | Add writeBenchmarkSnapshot after writeChainCache |
| `src/lib/ethereum/fetchMigalabs.ts` | Modify | Add writeBenchmarkSnapshot after ethereum_snapshots insert |

---

## Task 1: Add `benchmark_snapshots` table to DB init

**Files:**
- Modify: `src/lib/db/database.ts:89-97`

The `cache` table is appended to the schema string at runtime in `initializeSchema`. We add `benchmark_snapshots` the same way, right after the cache table block.

- [ ] **Step 1: Edit `database.ts`**

In `src/lib/db/database.ts`, find the block that appends the cache table (around line 89-97):

```typescript
        // Add Cache Table schema
        schema += `
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                node_count INTEGER NOT NULL
            );
        `;
```

Replace it with:

```typescript
        // Add Cache Table schema
        schema += `
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                node_count INTEGER NOT NULL
            );
        `;

        // Benchmark provider snapshots — one row per worker run per chain
        schema += `
            CREATE TABLE IF NOT EXISTS benchmark_snapshots (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp          INTEGER NOT NULL,
                chain_id           TEXT NOT NULL,
                total_nodes        INTEGER NOT NULL,
                provider_breakdown TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_bs_chain_ts
                ON benchmark_snapshots(chain_id, timestamp);
        `;
```

- [ ] **Step 2: Verify syntax**

```bash
cd "ovh-blockchain-tracker" && npm run lint -- --max-warnings=0 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/database.ts
git commit -m "feat(db): add benchmark_snapshots table for provider evolution tracking"
```

---

## Task 2: `normalizeProviders` — pure utility (TDD)

**Files:**
- Create: `src/lib/benchmark/normalizeProviders.ts`
- Create: `src/lib/benchmark/normalizeProviders.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/benchmark/normalizeProviders.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeProviders } from './normalizeProviders';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

function makeEntry(key: string, nodeCount: number): ProviderBreakdownEntry {
  return { key, label: key, nodeCount, marketShare: 0, color: '#000' };
}

describe('normalizeProviders', () => {
  it('returns at most topN + Others entries', () => {
    const breakdown = Array.from({ length: 8 }, (_, i) => makeEntry(`p${i}`, 100 - i * 10));
    const result = normalizeProviders(breakdown, 6);
    expect(result).toHaveLength(7); // 6 + Others
    expect(result[6].key).toBe('others');
    expect(result[6].label).toBe('Others');
  });

  it('aggregates remainder into Others nodeCount correctly', () => {
    // p0=100, p1=90, ..., p5=50, p6=40, p7=30 → Others = 40+30 = 70
    const breakdown = Array.from({ length: 8 }, (_, i) => makeEntry(`p${i}`, 100 - i * 10));
    const result = normalizeProviders(breakdown, 6);
    expect(result[6].nodeCount).toBe(70);
  });

  it('computes correct marketShare for Others', () => {
    const breakdown = Array.from({ length: 8 }, (_, i) => makeEntry(`p${i}`, 100 - i * 10));
    // total = 100+90+80+70+60+50+40+30 = 520, Others = 70
    const result = normalizeProviders(breakdown, 6);
    expect(result[6].marketShare).toBeCloseTo((70 / 520) * 100, 1);
  });

  it('does not add Others when breakdown has <= topN entries', () => {
    const breakdown = [makeEntry('ovh', 100), makeEntry('aws', 50)];
    const result = normalizeProviders(breakdown, 6);
    expect(result).toHaveLength(2);
    expect(result.find(p => p.key === 'others')).toBeUndefined();
  });

  it('sorts by nodeCount descending', () => {
    const breakdown = [makeEntry('aws', 50), makeEntry('ovh', 100), makeEntry('hetzner', 75)];
    const result = normalizeProviders(breakdown, 6);
    expect(result[0].key).toBe('ovh');
    expect(result[1].key).toBe('hetzner');
    expect(result[2].key).toBe('aws');
  });

  it('returns empty array for empty input', () => {
    expect(normalizeProviders([], 6)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
npm run test -- normalizeProviders --run 2>&1 | tail -20
```

Expected: `Cannot find module './normalizeProviders'`

- [ ] **Step 3: Implement `normalizeProviders.ts`**

Create `src/lib/benchmark/normalizeProviders.ts`:

```typescript
import type { ProviderBreakdownEntry } from '@/types/dashboard';

/**
 * Takes a providerBreakdown array, keeps the top N entries by nodeCount,
 * and aggregates the rest into a single "Others" entry.
 */
export function normalizeProviders(
  breakdown: ProviderBreakdownEntry[],
  topN = 6,
): ProviderBreakdownEntry[] {
  if (breakdown.length === 0) return [];

  const sorted = [...breakdown].sort((a, b) => b.nodeCount - a.nodeCount);
  const top = sorted.slice(0, topN);

  if (sorted.length <= topN) return top;

  const rest = sorted.slice(topN);
  const total = sorted.reduce((sum, p) => sum + p.nodeCount, 0);
  const othersCount = rest.reduce((sum, p) => sum + p.nodeCount, 0);

  return [
    ...top,
    {
      key: 'others',
      label: 'Others',
      nodeCount: othersCount,
      marketShare: total > 0 ? (othersCount / total) * 100 : 0,
      color: '#6B7280',
    },
  ];
}
```

- [ ] **Step 4: Run test — verify PASS**

```bash
npm run test -- normalizeProviders --run 2>&1 | tail -20
```

Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/benchmark/normalizeProviders.ts src/lib/benchmark/normalizeProviders.test.ts
git commit -m "feat(benchmark): add normalizeProviders utility (top-N + Others rollup)"
```

---

## Task 3: `snapshotRepository.ts` — DB read/write (TDD)

**Files:**
- Create: `src/lib/benchmark/snapshotRepository.ts`
- Create: `src/lib/benchmark/snapshotRepository.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/benchmark/snapshotRepository.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import {
  _writeBenchmarkSnapshot,
  _readBenchmarkEvolution,
  _readWeeklyDelta,
} from './snapshotRepository';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS benchmark_snapshots (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp          INTEGER NOT NULL,
    chain_id           TEXT NOT NULL,
    total_nodes        INTEGER NOT NULL,
    provider_breakdown TEXT NOT NULL
  );
`;

const OVH: ProviderBreakdownEntry = {
  key: 'ovh', label: 'OVHcloud', nodeCount: 100, marketShare: 10, color: '#00F0FF',
};
const HETZNER: ProviderBreakdownEntry = {
  key: 'hetzner', label: 'Hetzner', nodeCount: 200, marketShare: 20, color: '#F97316',
};

async function freshDb(): Promise<Client> {
  const db = createClient({ url: ':memory:' });
  await db.executeMultiple(SCHEMA);
  return db;
}

describe('_writeBenchmarkSnapshot', () => {
  it('inserts one row per call', async () => {
    const db = await freshDb();
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH, HETZNER]);
    const rows = await db.execute('SELECT * FROM benchmark_snapshots');
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].chain_id).toBe('solana');
    expect(rows.rows[0].total_nodes).toBe(1000);
  });

  it('prunes snapshots older than 180 days for that chain', async () => {
    const db = await freshDb();
    const oldTs = Date.now() - 181 * 24 * 60 * 60 * 1000;
    await db.execute({
      sql: 'INSERT INTO benchmark_snapshots (timestamp, chain_id, total_nodes, provider_breakdown) VALUES (?, ?, ?, ?)',
      args: [oldTs, 'solana', 500, '[]'],
    });
    // Fresh write should prune the old row
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH]);
    const rows = await db.execute("SELECT * FROM benchmark_snapshots WHERE chain_id = 'solana'");
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].total_nodes).toBe(1000);
  });

  it('does not prune rows from other chains', async () => {
    const db = await freshDb();
    const oldTs = Date.now() - 181 * 24 * 60 * 60 * 1000;
    await db.execute({
      sql: 'INSERT INTO benchmark_snapshots (timestamp, chain_id, total_nodes, provider_breakdown) VALUES (?, ?, ?, ?)',
      args: [oldTs, 'ethereum', 500, '[]'],
    });
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH]);
    const ethRows = await db.execute("SELECT * FROM benchmark_snapshots WHERE chain_id = 'ethereum'");
    expect(ethRows.rows).toHaveLength(1); // Not pruned
  });
});

describe('_readBenchmarkEvolution', () => {
  it('returns empty monthly array when no data', async () => {
    const db = await freshDb();
    const result = await _readBenchmarkEvolution(db);
    expect(result.monthly).toEqual([]);
    expect(result.providers).toEqual([]);
  });

  it('returns monthly points with provider node counts', async () => {
    const db = await freshDb();
    // Insert a snapshot in current month
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH, HETZNER]);
    const result = await _readBenchmarkEvolution(db);
    expect(result.monthly).toHaveLength(1);
    expect(result.monthly[0]['OVHcloud']).toBe(100);
    expect(result.monthly[0]['Hetzner']).toBe(200);
    expect(result.providers).toContain('Hetzner');
    expect(result.providers).toContain('OVHcloud');
  });

  it('filters by chain_id when provided', async () => {
    const db = await freshDb();
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH]);
    await _writeBenchmarkSnapshot(db, 'ethereum', 9000, [
      { key: 'aws', label: 'AWS', nodeCount: 5000, marketShare: 55, color: '#FACC15' },
    ]);
    const result = await _readBenchmarkEvolution(db, 'solana');
    // Should only include Solana's OVHcloud, not Ethereum's AWS
    expect(result.monthly[0]['OVHcloud']).toBe(100);
    expect(result.monthly[0]['AWS']).toBeUndefined();
  });
});

describe('_readWeeklyDelta', () => {
  it('returns 0 delta when no historical data', async () => {
    const db = await freshDb();
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH]);
    const delta = await _readWeeklyDelta(db);
    expect(delta['solana']).toBe(0);
  });

  it('computes OVH delta between current and 7-day-old snapshots', async () => {
    const db = await freshDb();
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const oldOVH: ProviderBreakdownEntry = { ...OVH, nodeCount: 88 };
    // Insert old snapshot directly
    await db.execute({
      sql: 'INSERT INTO benchmark_snapshots (timestamp, chain_id, total_nodes, provider_breakdown) VALUES (?, ?, ?, ?)',
      args: [eightDaysAgo, 'solana', 950, JSON.stringify([oldOVH])],
    });
    // Insert current snapshot
    await _writeBenchmarkSnapshot(db, 'solana', 1000, [OVH]); // OVH.nodeCount = 100
    const delta = await _readWeeklyDelta(db);
    expect(delta['solana']).toBe(100 - 88); // +12
  });
});
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
npm run test -- snapshotRepository --run 2>&1 | tail -20
```

Expected: `Cannot find module './snapshotRepository'`

- [ ] **Step 3: Implement `snapshotRepository.ts`**

Create `src/lib/benchmark/snapshotRepository.ts`:

```typescript
import { type Client } from '@libsql/client';
import { getDatabase } from '@/lib/db/database';
import { aggregateProviderBreakdowns } from '@/lib/benchmark/aggregateMarketShare';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

const RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days

export interface EvolutionPoint {
  month: string;
  [provider: string]: number | string;
}

export interface EvolutionResult {
  monthly: EvolutionPoint[];
  providers: string[];
}

// ─── Internal (injectable db for tests) ──────────────────────────────────────

export async function _writeBenchmarkSnapshot(
  db: Client,
  chainId: string,
  totalNodes: number,
  providerBreakdown: ProviderBreakdownEntry[],
): Promise<void> {
  const now = Date.now();
  const cutoff = now - RETENTION_MS;

  await db.batch([
    {
      sql: `INSERT INTO benchmark_snapshots (timestamp, chain_id, total_nodes, provider_breakdown)
            VALUES (?, ?, ?, ?)`,
      args: [now, chainId, totalNodes, JSON.stringify(providerBreakdown)],
    },
    {
      sql: `DELETE FROM benchmark_snapshots WHERE chain_id = ? AND timestamp < ?`,
      args: [chainId, cutoff],
    },
  ]);
}

export async function _readBenchmarkEvolution(
  db: Client,
  chainId?: string,
  months = 6,
): Promise<EvolutionResult> {
  const cutoff = Date.now() - months * 30 * 24 * 60 * 60 * 1000;

  const sql = chainId
    ? `SELECT chain_id,
              strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch')) AS month,
              provider_breakdown,
              total_nodes,
              MAX(timestamp) AS ts
       FROM benchmark_snapshots
       WHERE timestamp > ? AND chain_id = ?
       GROUP BY chain_id, month
       ORDER BY month ASC`
    : `SELECT chain_id,
              strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch')) AS month,
              provider_breakdown,
              total_nodes,
              MAX(timestamp) AS ts
       FROM benchmark_snapshots
       WHERE timestamp > ?
       GROUP BY chain_id, month
       ORDER BY month ASC`;

  const args = chainId ? [cutoff, chainId] : [cutoff];
  const result = await db.execute({ sql, args });

  if (result.rows.length === 0) return { monthly: [], providers: [] };

  // Group rows by month → aggregate chains per month
  const byMonth = new Map<string, Array<{ providerBreakdown: ProviderBreakdownEntry[]; totalNodes: number }>>();

  for (const row of result.rows) {
    const m = row.month as string;
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push({
      providerBreakdown: JSON.parse(row.provider_breakdown as string) as ProviderBreakdownEntry[],
      totalNodes: row.total_nodes as number,
    });
  }

  // Aggregate per month → top 6 providers across all months
  const monthlyPoints: Array<{ month: string; breakdown: ProviderBreakdownEntry[] }> = [];
  for (const [month, chains] of byMonth) {
    const aggregate = aggregateProviderBreakdowns(chains);
    monthlyPoints.push({ month, breakdown: aggregate });
  }

  // Determine top 6 providers by peak node count across all months
  const providerPeak = new Map<string, number>();
  for (const { breakdown } of monthlyPoints) {
    for (const entry of breakdown) {
      providerPeak.set(entry.label, Math.max(providerPeak.get(entry.label) ?? 0, entry.nodeCount));
    }
  }
  const providers = Array.from(providerPeak.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label]) => label);

  // Build EvolutionPoint[]
  const monthly: EvolutionPoint[] = monthlyPoints.map(({ month, breakdown }) => {
    const point: EvolutionPoint = { month };
    for (const label of providers) {
      const entry = breakdown.find(e => e.label === label);
      point[label] = entry?.nodeCount ?? 0;
    }
    return point;
  });

  return { monthly, providers };
}

export async function _readWeeklyDelta(db: Client): Promise<Record<string, number>> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Most recent snapshot per chain
  const currentResult = await db.execute(
    `SELECT chain_id, provider_breakdown
     FROM benchmark_snapshots
     WHERE id IN (SELECT MAX(id) FROM benchmark_snapshots GROUP BY chain_id)`,
  );

  // Latest snapshot per chain that is at least 7 days old
  const oldResult = await db.execute({
    sql: `SELECT chain_id, provider_breakdown
          FROM benchmark_snapshots
          WHERE id IN (
            SELECT MAX(id) FROM benchmark_snapshots
            WHERE timestamp <= ?
            GROUP BY chain_id
          )`,
    args: [sevenDaysAgo],
  });

  const getOVH = (breakdown: ProviderBreakdownEntry[]): number =>
    breakdown.find(e => e.key === 'ovh' || e.label === 'OVHcloud')?.nodeCount ?? 0;

  const oldByChain = new Map<string, number>();
  for (const row of oldResult.rows) {
    const bd = JSON.parse(row.provider_breakdown as string) as ProviderBreakdownEntry[];
    oldByChain.set(row.chain_id as string, getOVH(bd));
  }

  const delta: Record<string, number> = {};
  for (const row of currentResult.rows) {
    const chainId = row.chain_id as string;
    const bd = JSON.parse(row.provider_breakdown as string) as ProviderBreakdownEntry[];
    const currentOVH = getOVH(bd);
    const oldOVH = oldByChain.get(chainId) ?? currentOVH;
    delta[chainId] = currentOVH - oldOVH;
  }

  return delta;
}

// ─── Public API (uses getDatabase()) ─────────────────────────────────────────

export async function writeBenchmarkSnapshot(
  chainId: string,
  totalNodes: number,
  providerBreakdown: ProviderBreakdownEntry[],
): Promise<void> {
  return _writeBenchmarkSnapshot(getDatabase(), chainId, totalNodes, providerBreakdown);
}

export async function readBenchmarkEvolution(
  chainId?: string,
  months = 6,
): Promise<EvolutionResult> {
  return _readBenchmarkEvolution(getDatabase(), chainId, months);
}

export async function readWeeklyDelta(): Promise<Record<string, number>> {
  return _readWeeklyDelta(getDatabase());
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
npm run test -- snapshotRepository --run 2>&1 | tail -30
```

Expected: `8 passed`

- [ ] **Step 5: Lint**

```bash
npm run lint -- --max-warnings=0 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/benchmark/snapshotRepository.ts src/lib/benchmark/snapshotRepository.test.ts
git commit -m "feat(benchmark): add snapshotRepository with write/read/delta functions"
```

---

## Task 4: `/api/benchmark/evolution` route

**Files:**
- Create: `src/app/api/benchmark/evolution/route.ts`

- [ ] **Step 1: Create the route**

Create `src/app/api/benchmark/evolution/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readBenchmarkEvolution, readWeeklyDelta } from '@/lib/benchmark/snapshotRepository';
import { logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chainId = searchParams.get('chain') ?? undefined;
    const months = Math.min(parseInt(searchParams.get('months') ?? '6', 10), 12);

    const [evolution, weeklyDelta] = await Promise.all([
      readBenchmarkEvolution(chainId, months),
      readWeeklyDelta(),
    ]);

    return NextResponse.json({
      success: true,
      monthly: evolution.monthly,
      providers: evolution.providers,
      weeklyDelta,
    });
  } catch (error) {
    logger.error('[benchmark/evolution] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read benchmark evolution' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Manual smoke test**

Start the dev server if not running: `npm run dev`

```bash
curl -s "http://localhost:3000/api/benchmark/evolution" | jq '.success'
```

Expected: `true` (returns `monthly: []` if no snapshots yet — that is correct).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/benchmark/evolution/route.ts
git commit -m "feat(api): add /api/benchmark/evolution endpoint"
```

---

## Task 5: Hook snapshot writes into workers

**Files:**
- Modify: `scripts/worker.ts`
- Modify: `scripts/worker-avax.ts`
- Modify: `scripts/worker-sui.ts`
- Modify: `scripts/worker-tron.ts`
- Modify: `src/lib/ethereum/fetchMigalabs.ts`

### worker.ts (Solana)

- [ ] **Step 1: Add import at top of `scripts/worker.ts`**

After the existing imports, add:

```typescript
import { writeBenchmarkSnapshot } from '../src/lib/benchmark/snapshotRepository';
```

- [ ] **Step 2: Add snapshot write after `writeChainCache`**

In `scripts/worker.ts`, find the line:

```typescript
        await writeChainCache('solana-prospects', { topProspects }, topProspects.length);
```

Add after it:

```typescript
        // Save provider breakdown snapshot for historical benchmark tracking
        try {
            await writeBenchmarkSnapshot('solana', metrics.totalNodes, metrics.providerBreakdown ?? []);
            console.log('📸 [Worker] Benchmark snapshot saved');
        } catch (snapErr) {
            console.warn('⚠️  [Worker] Failed to save benchmark snapshot (cache still valid):', snapErr);
        }
```

### worker-avax.ts (Avalanche)

- [ ] **Step 3: Add import to `scripts/worker-avax.ts`**

After existing imports:

```typescript
import { writeBenchmarkSnapshot } from '../src/lib/benchmark/snapshotRepository';
```

- [ ] **Step 4: Add snapshot write after `writeChainCache` in `worker-avax.ts`**

Find:

```typescript
        await writeChainCache('avalanche', metrics, allNodes.length);
```

Add after:

```typescript
        try {
            await writeBenchmarkSnapshot('avalanche', metrics.totalNodes, (metrics as any).providerBreakdown ?? []);
            console.log('📸 [AVAX Worker] Benchmark snapshot saved');
        } catch (snapErr) {
            console.warn('⚠️  [AVAX Worker] Failed to save benchmark snapshot:', snapErr);
        }
```

### worker-sui.ts (Sui)

- [ ] **Step 5: Add import + snapshot write to `scripts/worker-sui.ts`**

After the existing imports (after `import { initMaxMind } from '../src/lib/asn/maxmind';`), add:

```typescript
import { writeBenchmarkSnapshot } from '../src/lib/benchmark/snapshotRepository';
```

Find line 52:

```typescript
        await writeChainCache('sui', metrics, allValidators.length);
```

Add after it:

```typescript
        try {
            await writeBenchmarkSnapshot('sui', metrics.totalNodes, (metrics as any).providerBreakdown ?? []);
            console.log('📸 [Sui Worker] Benchmark snapshot saved');
        } catch (snapErr) {
            console.warn('⚠️  [Sui Worker] Failed to save benchmark snapshot:', snapErr);
        }
```

### worker-tron.ts (Tron)

- [ ] **Step 6: Add import + snapshot write to `scripts/worker-tron.ts`**

After the existing imports (after `import { initMaxMind } from '../src/lib/asn/maxmind';`), add:

```typescript
import { writeBenchmarkSnapshot } from '../src/lib/benchmark/snapshotRepository';
```

Find line 52:

```typescript
        await writeChainCache('tron', metrics, allNodes.length);
```

Add after it:

```typescript
        try {
            await writeBenchmarkSnapshot('tron', metrics.totalNodes, (metrics as any).providerBreakdown ?? []);
            console.log('📸 [Tron Worker] Benchmark snapshot saved');
        } catch (snapErr) {
            console.warn('⚠️  [Tron Worker] Failed to save benchmark snapshot:', snapErr);
        }
```

### fetchMigalabs.ts (Ethereum — covers both worker-eth and cron/eth-refresh)

- [ ] **Step 7: Add import to `src/lib/ethereum/fetchMigalabs.ts`**

After existing imports, add:

```typescript
import { writeBenchmarkSnapshot } from '@/lib/benchmark/snapshotRepository';
```

- [ ] **Step 8: Add snapshot write after the `ethereum_snapshots` DB insert**

Find the line in `runEthRefresh()` (around line 178):

```typescript
    logger.info('[MigaLabs] Snapshot saved.');
```

Add after it:

```typescript
    // Benchmark snapshot for provider evolution tracking
    try {
        await writeBenchmarkSnapshot('ethereum', metrics.totalNodes, metrics.providerBreakdown ?? []);
        logger.info('[MigaLabs] Benchmark snapshot saved.');
    } catch (snapErr) {
        logger.warn('[MigaLabs] Failed to save benchmark snapshot (main snapshot still valid):', snapErr);
    }
```

- [ ] **Step 9: Lint**

```bash
npm run lint -- --max-warnings=0 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add scripts/worker.ts scripts/worker-avax.ts scripts/worker-sui.ts scripts/worker-tron.ts src/lib/ethereum/fetchMigalabs.ts
git commit -m "feat(workers): write benchmark snapshot after each chain cache update"
```

---

## Task 6: Refactor `CompetitorBenchmark.tsx`

**Files:**
- Modify: `src/components/benchmark/CompetitorBenchmark.tsx`

This is the largest task. We replace all static data with live API fetches, remove the `ComingSoonCard`, add loading/empty states, and support all 5 chains dynamically.

- [ ] **Step 1: Replace the entire file content**

Replace `src/components/benchmark/CompetitorBenchmark.tsx` with:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { normalizeProviders } from '@/lib/benchmark/normalizeProviders';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChainEntry {
  id: string;
  name: string;
  color: string;
  totalNodes: number;
  providerBreakdown: ProviderBreakdownEntry[];
  stale: boolean;
}

interface MarketShareData {
  chains: ChainEntry[];
  aggregate: {
    totalNodes: number;
    providerBreakdown: ProviderBreakdownEntry[];
  };
}

interface EvolutionPoint {
  month: string;
  [provider: string]: number | string;
}

interface EvolutionData {
  monthly: EvolutionPoint[];
  providers: string[];
  weeklyDelta: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function deltaLabel(delta: number | undefined): { text: string; cls: string } {
  if (delta === undefined || delta === null) return { text: '—', cls: 'text-white/30' };
  if (delta > 0) return { text: `↑ +${delta}`, cls: 'text-emerald-400' };
  if (delta < 0) return { text: `↓ ${delta}`, cls: 'text-red-400' };
  return { text: '→ 0', cls: 'text-white/30' };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompetitorBenchmark() {
  const [activeChain, setActiveChain] = useState<string>('all');
  const [marketData, setMarketData] = useState<MarketShareData | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingEvolution, setLoadingEvolution] = useState(true);

  // Fetch market-share data (current snapshot)
  useEffect(() => {
    setLoadingMarket(true);
    fetch('/api/benchmark/market-share')
      .then(r => r.json())
      .then((json) => {
        if (json.success) setMarketData(json);
      })
      .catch(() => { /* silently degrade */ })
      .finally(() => setLoadingMarket(false));
  }, []);

  // Fetch evolution data whenever activeChain changes
  useEffect(() => {
    setLoadingEvolution(true);
    const param = activeChain === 'all' ? '' : `?chain=${activeChain}`;
    fetch(`/api/benchmark/evolution${param}`)
      .then(r => r.json())
      .then((json) => {
        if (json.success) setEvolutionData(json);
      })
      .catch(() => { /* silently degrade */ })
      .finally(() => setLoadingEvolution(false));
  }, [activeChain]);

  // Derive display data from marketData
  const chains: ChainEntry[] = marketData?.chains ?? [];
  const chainTabs = [{ id: 'all', name: 'All', color: '#FFFFFF' }, ...chains.map(c => ({ id: c.id, name: c.name, color: c.color }))];

  const activeBreakdown: ProviderBreakdownEntry[] =
    activeChain === 'all'
      ? (marketData?.aggregate.providerBreakdown ?? [])
      : (chains.find(c => c.id === activeChain)?.providerBreakdown ?? []);

  const normalizedProviders = normalizeProviders(activeBreakdown, 6);

  // Bar chart data — one bar per chain (or one bar for the active chain)
  const barRows = activeChain === 'all' ? chains : chains.filter(c => c.id === activeChain);
  const barData = barRows.map(chain => {
    const normalized = normalizeProviders(chain.providerBreakdown, 6);
    const point: Record<string, number | string> = { name: chain.name };
    for (const p of normalized) {
      point[p.label] = p.nodeCount;
    }
    return point;
  });

  // All provider labels visible in bar chart
  const barProviderLabels = Array.from(
    new Set(normalizedProviders.map(p => p.label))
  );

  // Provider color map (from normalizedProviders)
  const providerColorMap: Record<string, string> = {};
  for (const p of normalizedProviders) {
    providerColorMap[p.label] = p.color;
  }

  // Table rows
  const tableRows = activeChain === 'all' ? chains : chains.filter(c => c.id === activeChain);

  // Weekly delta per chain (from evolution API)
  const weeklyDelta = evolutionData?.weeklyDelta ?? {};

  // Evolution chart
  const evolutionMonthly = evolutionData?.monthly ?? [];
  const evolutionProviders = evolutionData?.providers ?? [];
  const hasEvolutionData = evolutionMonthly.length > 0;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-white">Competitor Benchmark</h3>
          <p className="text-white/30 text-[10px] mt-0.5">Nodes detected by provider via ASN (MaxMind)</p>
        </div>
        {marketData && chains.some(c => c.stale) && (
          <span className="text-[9px] text-amber-400/70 font-medium">Partial stale data</span>
        )}
      </div>

      {/* Chain tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {chainTabs.map(chain => (
          <button
            key={chain.id}
            onClick={() => setActiveChain(chain.id)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
              activeChain === chain.id
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                : 'text-white/30 hover:text-white/60 border border-transparent'
            }`}
          >
            {chain.name}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loadingMarket && (
        <div className="text-center py-12 text-white/20 text-xs">Loading provider data…</div>
      )}

      {!loadingMarket && (
        <>
          {/* Grouped bar chart */}
          <div className="mb-6">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">Current distribution</p>
            {barData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-white/20 text-xs">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    // @ts-expect-error recharts formatter type
                    formatter={(value: any, name: string) => [fmt(Number(value ?? 0)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  {barProviderLabels.map(label => (
                    <Bar
                      key={label}
                      dataKey={label}
                      fill={providerColorMap[label] ?? '#6B7280'}
                      opacity={label === 'OVHcloud' ? 1 : 0.65}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Evolution area chart */}
          <div className="mb-6">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-2">6-month evolution</p>
            {loadingEvolution ? (
              <div className="flex items-center justify-center h-[160px] text-white/20 text-xs">Loading…</div>
            ) : !hasEvolutionData ? (
              <div className="flex items-center justify-center h-[160px] text-white/20 text-xs text-center px-4">
                Historical data will appear here as snapshots accumulate
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={evolutionMonthly} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <defs>
                    {evolutionProviders.map((label, i) => (
                      <linearGradient key={label} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={providerColorMap[label] ?? '#6B7280'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={providerColorMap[label] ?? '#6B7280'} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    // @ts-expect-error recharts formatter type
                    formatter={(value: any, name: string) => [fmt(Number(value ?? 0)), name]}
                  />
                  {evolutionProviders.map((label, i) => (
                    <Area
                      key={label}
                      type="monotone"
                      dataKey={label}
                      stroke={providerColorMap[label] ?? '#6B7280'}
                      strokeWidth={label === 'OVHcloud' ? 2 : 1.5}
                      fill={`url(#grad-${i})`}
                      opacity={label === 'OVHcloud' ? 1 : 0.7}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Data table */}
          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-white/30">Chain</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-[#00F0FF]/70">OVHcloud</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Total nodes</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">OVH %</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-widest text-white/30">Δ OVH /7d</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map(row => {
                  const ovhEntry = row.providerBreakdown.find(
                    e => e.key === 'ovh' || e.label === 'OVHcloud',
                  );
                  const delta = weeklyDelta[row.id];
                  const { text: deltaText, cls: deltaCls } = deltaLabel(delta);
                  return (
                    <tr key={row.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                          <span className="text-white/70 font-medium">{row.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#00F0FF]">
                        {fmt(ovhEntry?.nodeCount ?? 0)}
                      </td>
                      <td className="px-3 py-2 text-right text-white/50">
                        {fmt(row.totalNodes)}
                      </td>
                      <td className="px-3 py-2 text-right text-white/50">
                        {ovhEntry ? `${ovhEntry.marketShare.toFixed(1)}%` : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right text-[10px] font-bold ${deltaCls}`}>
                        {deltaText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint -- --max-warnings=0 2>&1 | head -30
```

Fix any type errors before continuing.

- [ ] **Step 3: Run all tests**

```bash
npm run test --run 2>&1 | tail -20
```

Expected: all tests pass (no regressions).

- [ ] **Step 4: Visual check in browser**

```
http://localhost:3000/roadmap
```

Verify:
- No "Coming Soon" overlay on Competitor Benchmark card
- Chain tabs: All, Solana, Ethereum, Avalanche, Sui, Tron (from live API)
- Bar chart shows real provider data
- Evolution chart shows "Historical data will appear here…" message (no snapshots yet)
- Δ column shows `—` for all rows

- [ ] **Step 5: Commit**

```bash
git add src/components/benchmark/CompetitorBenchmark.tsx
git commit -m "feat(benchmark): wire CompetitorBenchmark to live API data — remove ComingSoonCard"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `npm run test --run` → all tests pass
- [ ] `npm run lint` → no errors
- [ ] `npm run build` → build succeeds
- [ ] Navigate to `/roadmap` → CompetitorBenchmark shows live data with real chain tabs
- [ ] Run one worker locally: `npm run worker:avax` → check DB for a new row in `benchmark_snapshots`
- [ ] Hit `GET /api/benchmark/evolution` → returns `success: true`
- [ ] After 2+ worker runs: evolution chart renders monthly points
- [ ] After 8+ days of snapshots: Δ column shows computed deltas
