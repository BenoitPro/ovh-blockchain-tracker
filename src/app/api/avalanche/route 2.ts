import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { AvalancheDashboardMetrics, AvalancheAPIResponse } from '@/types';
import { logger } from '@/lib/utils';

/**
 * GET /api/avalanche
 *
 * Returns Avalanche dashboard metrics (cached).
 * Falls back to stale cache if the entry is older than 2h but otherwise available.
 * Returns 503 only when no cache exists at all.
 *
 * Cache is populated by:
 *   - The PM2 worker (cron/refresh/avax)  [production]
 *   - Manual POST to /api/cron/avax-refresh [dev/staging]
 */
export async function GET() {
    try {
        const cache = await readChainCache<AvalancheDashboardMetrics>('avalanche');

        if (cache && isChainCacheFresh(cache, 'avalanche')) {
            logger.info('[API/avalanche] Returning fresh cache');
            const response: AvalancheAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/avalanche] Cache is stale — returning with warning');
            const response: AvalancheAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // No cache yet — worker hasn't run. Return 503 with helpful message.
        logger.warn('[API/avalanche] No cache available. Run the cron job first.');
        return NextResponse.json(
            {
                success: false,
                error:
                    'Avalanche data is not yet available. The background worker has not run yet. Please try again in a few minutes.',
            },
            { status: 503 },
        );
    } catch (error) {
        logger.error('[API/avalanche] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
