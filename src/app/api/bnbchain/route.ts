import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { BNBChainDashboardMetrics, BNBChainAPIResponse } from '@/types';
import { logger } from '@/lib/utils';

/**
 * GET /api/bnbchain
 *
 * Returns BNB Chain dashboard metrics (cached).
 * Falls back to stale cache if the entry is older than 2h but otherwise available.
 * Returns 503 only when no cache exists at all.
 *
 * Cache is populated by:
 *   - The PM2 worker (scripts/worker-bnb.ts)  [production]
 *   - Manual POST to /api/cron/bnb-refresh     [dev/staging]
 */
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cache = await readChainCache<BNBChainDashboardMetrics>('bnbchain');

        if (cache && isChainCacheFresh(cache, 'bnbchain')) {
            logger.info('[API/bnbchain] Returning fresh cache');
            const response: BNBChainAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
                nodeCount: cache.nodeCount,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/bnbchain] Cache is stale — returning with warning');
            const response: BNBChainAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
                nodeCount: cache.nodeCount,
            };
            return NextResponse.json(response);
        }

        // No cache yet — worker hasn't run. Return 503 with helpful message.
        logger.warn('[API/bnbchain] No cache available. Run the cron job first.');
        return NextResponse.json(
            {
                success: false,
                error:
                    'BNB Chain data is not yet available. The background worker has not run yet. Please try again in a few minutes.',
            },
            { status: 503 },
        );
    } catch (error) {
        logger.error('[API/bnbchain] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
