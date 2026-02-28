import { NextResponse } from 'next/server';
import { fetchSolanaNodes } from '@/lib/solana/fetchNodes';
import { filterOVHNodes, categorizeNodesByProvider } from '@/lib/solana/filterOVH';
import { calculateMetrics } from '@/lib/solana/calculateMetrics';
import { readCache, isCacheFresh } from '@/lib/cache/storage';
import { APIResponse } from '@/types';
import { logger } from '@/lib/utils';

export async function GET() {
    try {
        logger.info('[API] Reading cached data...');

        // Step 1: Try to read from cache
        const cache = await readCache();

        if (cache && isCacheFresh(cache)) {
            logger.info('[API] Returning fresh cached data');
            const response: APIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // Step 2: If cache is stale or missing, return it with a warning
        if (cache) {
            logger.info('[API] Cache is stale, returning with warning');
            const response: APIResponse = {
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            };
            return NextResponse.json(response);
        }

        // Step 3: No cache available - compute on-the-fly (fallback)
        logger.info('[API] No cache found, computing live data (this may take a while)...');

        const allNodes = await fetchSolanaNodes(50); // Limited to 50 for live computation

        if (!allNodes || allNodes.length === 0) {
            throw new Error('No nodes returned from Solana RPC');
        }

        const providerDistribution = await categorizeNodesByProvider(allNodes);
        const ovhNodes = await filterOVHNodes(allNodes);
        const metrics = calculateMetrics(allNodes, ovhNodes, providerDistribution);

        const response: APIResponse = {
            success: true,
            data: metrics,
            cached: false,
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error('[API] Error:', error);

        // Try to return stale cache as last resort
        const cache = await readCache();
        if (cache) {
            logger.info('[API] Returning stale cache due to error');
            return NextResponse.json({
                success: true,
                data: cache.data,
                cached: true,
                stale: true,
                timestamp: cache.timestamp,
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
