import { fetchBNBPeers } from '@/lib/bnbchain/fetchPeers';
import { getOVHBNBNodes, categorizeBNBByProvider } from '@/lib/bnbchain/filterOVH';
import { calculateBNBMetrics } from '@/lib/bnbchain/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { initMaxMind } from '@/lib/asn/maxmind';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — BNB Chain peer data refresh
 * Schedule: every 2 hours (configured in vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('BNB', async () => {
    await initMaxMind();

    const { nodes, validatorCount } = await fetchBNBPeers();
    if (!nodes.length) throw new Error('No peers returned from BSC endpoints');

    const [categorization, ovhNodes] = await Promise.all([
        categorizeBNBByProvider(nodes),
        getOVHBNBNodes(nodes),
    ]);

    const metrics = calculateBNBMetrics(ovhNodes, nodes.length, validatorCount, categorization);
    await writeChainCache('bnbchain', metrics, nodes.length);

    return {
        totalPeers: nodes.length,
        ovhNodes: ovhNodes.length,
        marketShare: metrics.marketShare.toFixed(2) + '%',
    };
});
