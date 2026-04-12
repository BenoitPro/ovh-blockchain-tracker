import { NextResponse } from 'next/server';
import { readChainCache } from '@/lib/cache/chain-storage';
import { buildHyperliquidMetrics } from '@/lib/hyperliquid/buildMetrics';
import { HyperliquidDashboardMetrics, HyperliquidValidator } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * GET /api/hyperliquid/validators
 * Returns all validators (active + jailed).
 * Reads from cache if available; fetches live otherwise.
 */
export async function GET() {
    try {
        const cache = await readChainCache<HyperliquidDashboardMetrics>('hyperliquid');

        let validators: HyperliquidValidator[] | undefined = cache?.data?.allValidators;

        if (!validators || validators.length === 0) {
            logger.info('[API/hyperliquid/validators] No cache — live fetch');
            const { metrics } = await buildHyperliquidMetrics();
            validators = metrics.allValidators;
        }

        return NextResponse.json({ success: true, data: validators });
    } catch (error) {
        logger.error('[API/hyperliquid/validators] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 503 },
        );
    }
}
