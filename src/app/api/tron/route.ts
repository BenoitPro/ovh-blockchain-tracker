import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { TronDashboardMetrics, TronAPIResponse } from '@/types/tron';
import { logger } from '@/lib/utils';

/**
 * GET /api/tron
 *
 * Returns Tron dashboard metrics (cached).
 */
export async function GET() {
    try {
        const cache = await readChainCache<TronDashboardMetrics>('tron');

        if (cache && isChainCacheFresh(cache, 'tron')) {
            logger.info('[API/tron] Returning fresh cache');
            const response: TronAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/tron] Cache is stale — returning with warning');
            const response: TronAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // No cache available
        logger.warn('[API/tron] No cache available. Run the cron job first.');
        return NextResponse.json(
            {
                success: false,
                error: 'Tron data is not yet available. Trigger /api/cron/tron-refresh first.',
            },
            { status: 503 },
        );
    } catch (error) {
        logger.error('[API/tron] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
