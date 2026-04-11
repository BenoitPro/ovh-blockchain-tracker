import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { buildHyperliquidMetrics } from '@/lib/hyperliquid/buildMetrics';
import { HyperliquidDashboardMetrics, HyperliquidAPIResponse } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * GET /api/hyperliquid
 *
 * Priority:
 *   1. Fresh cache  → return immediately
 *   2. Stale cache  → return with stale:true warning
 *   3. No cache     → live-fetch from Hyperliquid API (no cache write; cron does that)
 *   4. Live-fetch fails → 503
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

        // No cache at all — fetch live (first run / cron not yet triggered)
        logger.info('[API/hyperliquid] No cache — falling back to live fetch');
        const { metrics } = await buildHyperliquidMetrics();

        const response: HyperliquidAPIResponse = {
            success: true,
            data: metrics,
            cached: false,
            timestamp: Date.now(),
        };
        return NextResponse.json(response);

    } catch (error) {
        logger.error('[API/hyperliquid] Unexpected error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 },
        );
    }
}
