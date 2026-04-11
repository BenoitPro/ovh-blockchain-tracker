import { buildHyperliquidMetrics } from '@/lib/hyperliquid/buildMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('Hyperliquid', async () => {
    const { metrics, totalValidators } = await buildHyperliquidMetrics();
    await writeChainCache('hyperliquid', metrics, totalValidators);

    return {
        totalValidators,
        activeValidators: metrics.activeValidators,
        ovhValidators: metrics.ovhValidators,
        marketShare: metrics.marketShare.toFixed(2) + '%',
        totalStakeHYPE: (metrics.totalStake / 1e8).toFixed(2),
    };
});
