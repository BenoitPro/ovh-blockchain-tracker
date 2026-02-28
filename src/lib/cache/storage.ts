import fs from 'fs/promises';
import path from 'path';
import { APIResponse } from '@/types';
import { logger } from '@/lib/utils';

const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'cache.json');

export interface CachedMetrics {
    data: APIResponse['data'];
    timestamp: number;
    nodeCount: number;
}

/**
 * Read cached metrics from JSON file
 */
export async function readCache(): Promise<CachedMetrics | null> {
    try {
        const fileContent = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent) as CachedMetrics;

        logger.info(`[Cache] Loaded data from ${new Date(parsed.timestamp).toISOString()}`);
        return parsed;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            logger.info('[Cache] No cache file found');
            return null;
        }
        logger.error('[Cache] Error reading cache:', error);
        return null;
    }
}

/**
 * Write metrics to JSON cache file
 */
export async function writeCache(data: APIResponse['data'], nodeCount: number): Promise<void> {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(CACHE_FILE_PATH);
        await fs.mkdir(dataDir, { recursive: true });

        const cacheData: CachedMetrics = {
            data,
            timestamp: Date.now(),
            nodeCount,
        };

        await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), 'utf-8');
        logger.info(`[Cache] Saved ${nodeCount} nodes at ${new Date().toISOString()}`);
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
