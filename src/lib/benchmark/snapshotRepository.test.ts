import { describe, it, expect } from 'vitest';
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
