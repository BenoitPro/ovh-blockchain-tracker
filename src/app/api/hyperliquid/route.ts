import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { HyperliquidDashboardMetrics, HyperliquidAPIResponse } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * GET /api/hyperliquid
 *
 * Returns Hyperliquid dashboard metrics (cached).
 * Falls back to stale cache if the entry is older than 6h but otherwise available.
 * Returns 503 only when no cache exists at all.
 *
 * Cache is populated by:
 *   - Vercel Cron: /api/cron/hyperliquid-refresh  [production]
 *   - Manual GET to /api/cron/hyperliquid-refresh  [dev/staging]
 */
export async function GET() {
    try {
        const cache = await readChainCache<HyperliquidDashboardMetrics>('hyperliquid');

        if (cache && isChainCacheFresh(cache, 'hyperliquid')) {
            logger.info('[API/hyperliquid] Returning fresh cache');
            const response: HyperliquidAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        if (cache) {
            logger.info('[API/hyperliquid] Cache is stale — returning with warning');
            const response: HyperliquidAPIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // No cache yet — cron has not run. Return 503 with helpful message.
        logger.warn('[API/hyperliquid] No cache available. Run the cron job first.');
        return NextResponse.json(
            {
                success: false,
                error:
                    'Hyperliquid data is not yet available. The background worker has not run yet. Please try again in a few minutes.',
            },
            { status: 503 },
        );
    } catch (error) {
        logger.error('[API/hyperliquid] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
