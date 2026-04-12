import { fetchBNBPeers } from '@/lib/bnbchain/fetchPeers';
import { getOVHBNBNodes, categorizeBNBByProvider, enrichProviderResolutions } from '@/lib/bnbchain/filterOVH';
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

    const { nodes, validatorCount, providerResolutions } = await fetchBNBPeers();
    const resolvedProviders = providerResolutions.filter(r => r.ips.length > 0).length;

    const [categorization, ovhNodes] = await Promise.all([
        categorizeBNBByProvider(nodes),
        getOVHBNBNodes(nodes),
    ]);

    const providerDetails = enrichProviderResolutions(providerResolutions, ovhNodes);
    const metrics = calculateBNBMetrics(ovhNodes, nodes.length, validatorCount, categorization, resolvedProviders, providerDetails);
    await writeChainCache('bnbchain', metrics, nodes.length);

    return {
        resolvedProviders,
        totalEndpoints: nodes.length,
        ovhEndpoints: ovhNodes.length,
        marketShare: metrics.marketShare.toFixed(2) + '%',
    };
});
