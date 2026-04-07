import { fetchHyperliquidValidators } from '@/lib/hyperliquid/fetchValidators';
import { filterOVHHyperliquidValidators } from '@/lib/hyperliquid/filterOVH';
import { calculateHyperliquidMetrics } from '@/lib/hyperliquid/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Hyperliquid validator data refresh
 * Schedule: once daily at 05:00 UTC (configured in vercel.json)
 *
 * The Hyperliquid validator set is very small (~30 validators) and changes
 * infrequently, so a daily refresh is sufficient. Validator weights and
 * jailing status can change between runs.
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('Hyperliquid', async () => {
    const allValidators = await fetchHyperliquidValidators();
    if (!allValidators.length) throw new Error('No validators returned from Hyperliquid API');

    const ovhValidators = filterOVHHyperliquidValidators(allValidators);

    const metrics = calculateHyperliquidMetrics(allValidators, ovhValidators);
    await writeChainCache('hyperliquid', metrics, allValidators.length);

    return {
        totalValidators: allValidators.length,
        activeValidators: metrics.activeValidators,
        ovhValidators: ovhValidators.length,
        marketShare: metrics.marketShare.toFixed(2) + '%',
        totalStakeHYPE: (metrics.totalStake / 1e8).toFixed(2),
    };
});
