import { APIResponse } from '@/types';
import { logger } from '@/lib/utils';
import { getDatabase } from '@/lib/db/database';

export interface CachedMetrics {
    data: APIResponse['data'];
    timestamp: number;
    nodeCount: number;
}

import { CACHE_KEY } from '@/lib/config/constants';

/**
 * Read cached metrics from Turso Database
 */
export async function readCache(): Promise<CachedMetrics | null> {
    try {
        const db = getDatabase();

        const result = await db.execute({
            sql: 'SELECT data, timestamp, node_count FROM cache WHERE key = ?',
            args: [CACHE_KEY]
        });

        if (result.rows.length === 0) {
            logger.info('[Cache] No cache found in database');
            return null;
        }

        const row = result.rows[0];

        const cachedData: CachedMetrics = {
            data: JSON.parse(row.data as string),
            timestamp: row.timestamp as number,
            nodeCount: row.node_count as number
        };

        logger.info(`[Cache] Loaded data from ${new Date(cachedData.timestamp).toISOString()}`);
        return cachedData;
    } catch (error) {
        logger.error('[Cache] Error reading cache:', error);
        return null;
    }
}

/**
 * Write metrics to Turso Database
 */
export async function writeCache(data: APIResponse['data'], nodeCount: number): Promise<void> {
    try {
        const db = getDatabase();
        const timestamp = Date.now();

        await db.execute({
            sql: `
                INSERT OR REPLACE INTO cache (key, data, timestamp, node_count)
                VALUES (?, ?, ?, ?)
            `,
            args: [
                CACHE_KEY,
                JSON.stringify(data),
                timestamp,
                nodeCount
            ]
        });

        logger.info(`[Cache] Saved ${nodeCount} nodes at ${new Date(timestamp).toISOString()}`);
    } catch (error) {
        logger.error('[Cache] Error writing cache:', error);
        throw error;
    }
}

/**
 * Check if cache is fresh (less than 1 hour old)
 */
export function isCacheFresh(cache: CachedMetrics | null, maxAgeMs: number = 60 * 60 * 1000): boolean {
    if (!cache) return false;
    const age = Date.now() - cache.timestamp;
    return age < maxAgeMs;
}
