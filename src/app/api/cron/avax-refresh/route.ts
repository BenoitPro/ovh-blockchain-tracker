import { fetchAvalanchePeers } from '@/lib/avalanche/fetchPeers';
import { filterOVHAvalancheNodes, categorizeAvalancheNodesByProvider } from '@/lib/avalanche/filterOVH';
import { calculateAvalancheMetrics } from '@/lib/avalanche/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { initMaxMind } from '@/lib/asn/maxmind';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Avalanche peer data refresh
 * Schedule: every 2 hours (configured in vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('AVAX', async () => {
    await initMaxMind();

    const allNodes = await fetchAvalanchePeers();
    if (!allNodes.length) throw new Error('No peers returned from api.avax.network');

    const [providerCategorization, ovhNodes] = await Promise.all([
        categorizeAvalancheNodesByProvider(allNodes),
        filterOVHAvalancheNodes(allNodes),
    ]);

    const metrics = calculateAvalancheMetrics(allNodes, ovhNodes, providerCategorization);
    await writeChainCache('avalanche', metrics, allNodes.length);

    return {
        totalPeers: allNodes.length,
        ovhNodes: ovhNodes.length,
        marketShare: metrics.marketShare.toFixed(2) + '%',
        avgOVHUptime: metrics.avgOVHUptime?.toFixed(1) + '%',
    };
});
