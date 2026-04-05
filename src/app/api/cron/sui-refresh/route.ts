import { fetchSuiValidators } from '@/lib/sui/fetchValidators';
import { filterOVHSuiNodes, categorizeSuiNodesByProvider } from '@/lib/sui/filterOVH';
import { calculateSuiMetrics } from '@/lib/sui/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Sui validator data refresh
 * Schedule: every 2 hours (configured in vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const handler = createCronHandler('Sui', async () => {
    const allValidators = await fetchSuiValidators();

    const [ovhNodes, providerCategorization] = await Promise.all([
        filterOVHSuiNodes(allValidators),
        categorizeSuiNodesByProvider(allValidators),
    ]);

    const metrics = calculateSuiMetrics(allValidators, ovhNodes, providerCategorization);
    await writeChainCache('sui', metrics, metrics.totalNodes);

    return {
        totalNodes: metrics.totalNodes,
        ovhNodes: metrics.ovhNodes,
        ovhVotingPowerShare: metrics.ovhVotingPowerShare,
    };
});

export const GET = handler;
export const POST = handler;
