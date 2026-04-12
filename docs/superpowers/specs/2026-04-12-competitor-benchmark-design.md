# Competitor Benchmark — Design Spec

**Date:** 2026-04-12  
**Status:** Approved  

---

## Context

`CompetitorBenchmark.tsx` exists with a complete UI (grouped bar chart, area chart, data table) but runs entirely on hardcoded fake data and is hidden behind a `ComingSoonCard` overlay. The API `/api/benchmark/market-share` already returns live provider breakdown data from all active chains (Solana, Ethereum, Avalanche, Sui, Tron) via MaxMind ASN detection.

The goal is to make the component functional: wire it to real data, remove the "Coming Soon" blocker, and lay the foundation for historical evolution data (snapshots).

---

## Architecture

### Data flow

```
workers (per chain)
  → writeChainCache()
  → writeBenchmarkSnapshot()          ← NEW: persists provider breakdown + timestamp
        ↓
  benchmark_snapshots table (Turso)
        ↓
GET /api/benchmark/evolution           ← NEW: serves last 6 months per chain
        ↓
CompetitorBenchmark.tsx (evolution chart + Δ delta)

GET /api/benchmark/market-share        ← EXISTS: serves current live snapshot
        ↓
CompetitorBenchmark.tsx (bar chart + table)
```

---

## Database

### New table: `benchmark_snapshots`

```sql
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp         INTEGER NOT NULL,
  chain_id          TEXT NOT NULL,
  total_nodes       INTEGER NOT NULL,
  provider_breakdown TEXT NOT NULL   -- JSON: ProviderBreakdownEntry[]
);
CREATE INDEX IF NOT EXISTS idx_bs_chain_ts
  ON benchmark_snapshots(chain_id, timestamp);
```

- Created at DB init in `src/lib/db/database.ts` alongside existing tables
- Snapshots older than 180 days pruned on each write (no separate cleanup job)
- One row per worker run per chain (~hourly cadence)

---

## New: `src/lib/benchmark/snapshotRepository.ts`

Two exported functions:

**`writeBenchmarkSnapshot(chainId, totalNodes, providerBreakdown)`**
- Inserts one row into `benchmark_snapshots`
- Prunes rows older than 180 days for that chain_id
- Called by each worker after `writeChainCache()`

**`readBenchmarkEvolution(chainId?, months?)`**
- Returns snapshots grouped by month (last N months, default 6)
- If `chainId` is provided: per-chain data
- If omitted: aggregates across all chains
- Returns `{ month: string, [provider]: number }[]` — ready for Recharts AreaChart

---

## New: `src/app/api/benchmark/evolution/route.ts`

```
GET /api/benchmark/evolution?chain=solana&months=6
GET /api/benchmark/evolution?months=6          (aggregate)
```

- Calls `readBenchmarkEvolution()`
- Returns `{ success, data: EvolutionPoint[], providers: string[] }`
- `providers` list is derived from the data (top 6 by total node count)
- Returns `{ success: true, data: [], providers: [] }` when no snapshots exist yet (first run)

---

## Workers — snapshot write hook

In each `scripts/worker-{chain}.ts`, after `writeChainCache()`:

```typescript
import { writeBenchmarkSnapshot } from '@/lib/benchmark/snapshotRepository';

// after writeChainCache(...)
await writeBenchmarkSnapshot(chainId, metrics.totalNodes, metrics.providerBreakdown);
```

Chains: `worker.ts` (Solana), `worker-avax.ts`, `worker-sui.ts`, `worker-tron.ts`.  
Ethereum uses `worker-eth.ts` which reads from Migalabs — add snapshot write there too after its DB insert.

---

## Component: `CompetitorBenchmark.tsx`

### Changes from current state

| Element | Before | After |
|---|---|---|
| Wrapper | `ComingSoonCard` | Removed — plain `div` |
| Bar chart data | Hardcoded `TABLE_DATA` | Live from `/api/benchmark/market-share` |
| Providers shown | Fixed: OVH, Hetzner, AWS, GCP | Dynamic top 6 from API |
| Chain tabs | Static: All, Solana, Ethereum, Avalanche | Dynamic from API response |
| Evolution chart | Hardcoded `EVOLUTION_ALL/BY_CHAIN` | Fetched from `/api/benchmark/evolution` |
| Δ OVH /7d column | Hardcoded `deltaOVH` | Computed from snapshots (last 7 days); `—` if no data |
| Disclaimer | "* Simulated data" | Removed |
| Loading state | None | Skeleton/spinner while fetching |
| Error state | None | Silent fallback (last known data or empty) |

### Provider normalization

API returns `ProviderBreakdownEntry[]` per chain. Component logic:
1. Sort by `nodeCount` descending
2. Keep top 6
3. Aggregate remainder into an `Others` entry
4. OVH always highlighted with `#00F0FF`; other colors from `entry.color`

### Evolution chart — empty state

When `/api/benchmark/evolution` returns `data: []` (no snapshots yet):
- Area chart replaced by a simple message: `"Historical data will appear here once enough snapshots accumulate"` — subtle, no overlay
- Delta column shows `—` for all rows

Once data exists: chart and delta render normally. No "coming soon" treatment needed.

---

## Files Modified / Created

| File | Action |
|---|---|
| `src/lib/db/database.ts` | Add `CREATE TABLE IF NOT EXISTS benchmark_snapshots` |
| `src/lib/benchmark/snapshotRepository.ts` | **NEW** |
| `src/app/api/benchmark/evolution/route.ts` | **NEW** |
| `src/components/benchmark/CompetitorBenchmark.tsx` | Refactor — wire live data |
| `scripts/worker.ts` | Add `writeBenchmarkSnapshot` call |
| `scripts/worker-avax.ts` | Add `writeBenchmarkSnapshot` call |
| `scripts/worker-sui.ts` | Add `writeBenchmarkSnapshot` call |
| `scripts/worker-tron.ts` | Add `writeBenchmarkSnapshot` call |
| `scripts/worker-eth.ts` | Add `writeBenchmarkSnapshot` call |

---

## Verification

1. **Live data**: Run `npm run worker` locally → check `/api/benchmark/market-share` returns data → component shows real counts with top 6 providers
2. **Snapshots**: After worker run, query `benchmark_snapshots` table → confirm row inserted per chain
3. **Evolution API**: Hit `/api/benchmark/evolution` → returns points after ≥ 2 runs
4. **Empty state**: Hit `/api/benchmark/evolution` on fresh DB → returns `data: []` → component shows empty state message (no crash)
5. **Delta**: After runs on 2 separate days (7d apart), Δ column shows computed diff
6. **Tests**: `npm run test` passes; `npm run lint` passes; `npm run build` passes
