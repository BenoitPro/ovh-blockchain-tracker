import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { SuiDashboardMetrics, SuiAPIResponse } from '@/types/sui';
import { logger } from '@/lib/utils';
import { CACHE_KEY_SUI } from '@/lib/config/constants';

/**
 * GET /api/sui
 *
 * Returns Sui dashboard metrics (cached).
 */
export async function GET() {
    try {
        const cache = await readChainCache<SuiDashboardMetrics>('sui');

        if (cache && isChainCacheFresh(cache, 'sui')) {
            logger.info('[API/sui] Returning fresh cache');
            const response: SuiAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/sui] Cache is stale — returning with warning');
            const response: SuiAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // No cache available
        logger.warn('[API/sui] No cache available. Run the cron job first.');
        return NextResponse.json(
            {
                success: false,
                error: 'Sui data is not yet available. The background worker has not run yet.',
            },
            { status: 503 },
        );
    } catch (error) {
        logger.error('[API/sui] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
