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
    ? `SELECT s.chain_id,
              strftime('%Y-%m', datetime(s.timestamp/1000, 'unixepoch')) AS month,
              s.provider_breakdown,
              s.total_nodes
       FROM benchmark_snapshots s
       WHERE s.id IN (
         SELECT MAX(id)
         FROM benchmark_snapshots
         WHERE timestamp > ? AND chain_id = ?
         GROUP BY chain_id, strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch'))
       )
       ORDER BY month ASC`
    : `SELECT s.chain_id,
              strftime('%Y-%m', datetime(s.timestamp/1000, 'unixepoch')) AS month,
              s.provider_breakdown,
              s.total_nodes
       FROM benchmark_snapshots s
       WHERE s.id IN (
         SELECT MAX(id)
         FROM benchmark_snapshots
         WHERE timestamp > ?
         GROUP BY chain_id, strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch'))
       )
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

  // Aggregate per month → build time-series
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
