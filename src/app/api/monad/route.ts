import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { MonadDashboardMetrics, MonadAPIResponse } from '@/types';
import { logger } from '@/lib/utils';

/**
 * GET /api/monad
 *
 * Returns Monad dashboard metrics (cached from gmonads.com scrape).
 * Falls back to stale cache if older than 2h.
 * Returns 503 only when no cache exists at all.
 *
 * Cache populated by:
 *   - PM2 worker (scripts/worker-monad.ts) [production]
 *   - GET /api/cron/monad-refresh [dev/staging]
 */
export async function GET() {
    try {
        const cache = await readChainCache<MonadDashboardMetrics>('monad');

        if (cache && isChainCacheFresh(cache, 'monad')) {
            logger.info('[API/monad] Returning fresh cache');
            const response: MonadAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/monad] Cache is stale — returning with warning');
            const response: MonadAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        logger.warn('[API/monad] No cache available. Run the worker first.');
        return NextResponse.json(
            {
                success: false,
                error: 'Monad data is not yet available. The background worker has not run yet. Please try again in a few minutes.',
            },
            { status: 503 },
        );
    } catch (error) {
        logger.error('[API/monad] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
