/**
 * GET /api/celestia
 * Returns Celestia dashboard metrics from cache (written by the background worker).
 */
import { NextResponse } from 'next/server';
import { readChainCache, isChainCacheFresh } from '@/lib/cache/chain-storage';
import { CelestiaNodeMetrics, CelestiaAPIResponse } from '@/types';
import { logger } from '@/lib/utils';

export async function GET() {
    try {
        const cache = await readChainCache<CelestiaNodeMetrics>('celestia');

        if (cache && isChainCacheFresh(cache, 'celestia')) {
            logger.info('[API/celestia] Serving fresh cache');
            return NextResponse.json<CelestiaAPIResponse>({
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            });
        }

        if (cache) {
            logger.warn('[API/celestia] Serving stale cache');
            return NextResponse.json<CelestiaAPIResponse>({
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            });
        }

        logger.error('[API/celestia] No cache found');
        return NextResponse.json<CelestiaAPIResponse>(
            {
                success: false,
                error: 'Celestia data is not yet available. The background worker has not run yet. Please try again in a few minutes.',
            },
            { status: 503 }
        );
    } catch (error) {
        logger.error('[API/celestia] Unexpected error:', error);
        return NextResponse.json<CelestiaAPIResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
