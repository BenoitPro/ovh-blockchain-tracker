/**
 * Generic multi-chain cache storage
 *
 * Design decisions:
 * ─────────────────
 * The existing Turso `cache` table uses (key TEXT PRIMARY KEY, data TEXT, timestamp INTEGER, node_count INTEGER).
 * We leverage the same table without any migration: each blockchain gets its own key.
 *
 * Pre-defined keys (add one line here whenever a new chain is integrated):
 *   'solana-metrics'    → Solana dashboard (legacy key, unchanged)
 *   'avalanche-metrics' → Avalanche dashboard
 *   'sui-metrics'       → Sui (Phase 1, future)
 *   'celestia-metrics'  → Celestia (Phase 2, future)
 *
 * This pattern is intentionally ADDITIVE — adding a new chain never touches existing cache entries,
 * never changes the schema, and never risks breaking running dashboards.
 */

import { logger } from '@/lib/utils';
import { getDatabase } from '@/lib/db/database';

// ── Chain cache key registry ───────────────────────────────────────────────────
export const CACHE_KEYS = {
    solana: 'solana-metrics',
    avalanche: 'avalanche-metrics',
    // Future chains — uncomment when implemented:
    // sui: 'sui-metrics',
    // celestia: 'celestia-metrics',
} as const;

export type ChainId = keyof typeof CACHE_KEYS;

// TTL per chain (ms). Avalanche peers refresh quickly so 2h is safer than 1h.
export const CACHE_TTL: Record<ChainId, number> = {
    solana: 60 * 60 * 1000,       // 1 hour
    avalanche: 2 * 60 * 60 * 1000, // 2 hours
};

// ── Core types ─────────────────────────────────────────────────────────────────

export interface ChainCacheEntry<T = unknown> {
    data: T;
    timestamp: number;
    nodeCount: number;
}

// ── Generic read / write ───────────────────────────────────────────────────────

/**
 * Read a chain-specific cache entry from Turso.
 * Returns null if not found (safe — callers fall back to live fetch).
 */
export async function readChainCache<T = unknown>(chain: ChainId): Promise<ChainCacheEntry<T> | null> {
    try {
        const db = getDatabase();
        const key = CACHE_KEYS[chain];

        const result = await db.execute({
            sql: 'SELECT data, timestamp, node_count FROM cache WHERE key = ?',
            args: [key],
        });

        if (result.rows.length === 0) {
            logger.info(`[Cache:${chain}] No cache entry found`);
            return null;
        }

        const row = result.rows[0];
        const entry: ChainCacheEntry<T> = {
            data: JSON.parse(row.data as string) as T,
            timestamp: row.timestamp as number,
            nodeCount: row.node_count as number,
        };

        logger.info(`[Cache:${chain}] Loaded entry from ${new Date(entry.timestamp).toISOString()}`);
        return entry;
    } catch (error) {
        logger.error(`[Cache:${chain}] Error reading cache:`, error);
        return null;
    }
}

/**
 * Write/update a chain-specific cache entry in Turso.
 * Uses INSERT OR REPLACE (upsert) — safe to call multiple times.
 */
export async function writeChainCache<T = unknown>(
    chain: ChainId,
    data: T,
    nodeCount: number,
): Promise<void> {
    try {
        const db = getDatabase();
        const key = CACHE_KEYS[chain];
        const timestamp = Date.now();

        await db.execute({
            sql: `INSERT OR REPLACE INTO cache (key, data, timestamp, node_count) VALUES (?, ?, ?, ?)`,
            args: [key, JSON.stringify(data), timestamp, nodeCount],
        });

        logger.info(`[Cache:${chain}] Saved ${nodeCount} nodes at ${new Date(timestamp).toISOString()}`);
    } catch (error) {
        logger.error(`[Cache:${chain}] Error writing cache:`, error);
        throw error;
    }
}

/**
 * Check if a cache entry is still within its TTL.
 * Uses per-chain TTL defined in CACHE_TTL above.
 */
export function isChainCacheFresh(entry: ChainCacheEntry | null, chain: ChainId): boolean {
    if (!entry) return false;
    const age = Date.now() - entry.timestamp;
    return age < CACHE_TTL[chain];
}
