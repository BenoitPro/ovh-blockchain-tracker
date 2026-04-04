import { NextResponse } from 'next/server';
import { fetchSuiValidators } from '@/lib/sui/fetchValidators';
import { filterOVHSuiNodes, categorizeSuiNodesByProvider } from '@/lib/sui/filterOVH';
import { calculateSuiMetrics } from '@/lib/sui/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { logger } from '@/lib/utils';
import { CACHE_KEY_SUI } from '@/lib/config/constants';

/**
 * GET /api/cron/sui-refresh
 * Manual or CRON-driven trigger to refresh Sui metrics.
 */
export async function GET() {
    return handleRefresh();
}

/**
 * POST /api/cron/sui-refresh
 * Some environments prefer POST for triggers.
 */
export async function POST() {
    return handleRefresh();
}

async function handleRefresh() {
    const startTime = Date.now();
    logger.info('[Cron/Sui] Starting refresh cycle...');

    try {
        // 1. Fetch
        const allValidators = await fetchSuiValidators();
        
        // 2. Filter & Categorize
        const [ovhNodes, providerCategorization] = await Promise.all([
            filterOVHSuiNodes(allValidators),
            categorizeSuiNodesByProvider(allValidators)
        ]);

        // 3. Calculate
        const metrics = calculateSuiMetrics(allValidators, ovhNodes, providerCategorization);

        // 4. Cache
        await writeChainCache('sui', metrics, metrics.totalNodes);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`[Cron/Sui] Refresh completed successfully in ${duration}s`);

        return NextResponse.json({
            success: true,
            message: `Sui metrics refreshed successfully in ${duration}s`,
            stats: {
                totalNodes: metrics.totalNodes,
                ovhNodes: metrics.ovhNodes,
                ovhVotingPowerShare: metrics.ovhVotingPowerShare
            }
        });

    } catch (error) {
        logger.error('[Cron/Sui] Refresh failed:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
