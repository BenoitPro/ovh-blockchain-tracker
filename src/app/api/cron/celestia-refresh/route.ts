import { fetchCelestiaPeers, fetchCelestiaValidatorCount } from '@/lib/celestia/fetchPeers';
import { filterOVHCelestiaNodes, categorizeCelestiaNodesByProvider } from '@/lib/celestia/filterOVH';
import { calculateCelestiaMetrics } from '@/lib/celestia/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { initMaxMind } from '@/lib/asn/maxmind';
import { createCronHandler } from '@/lib/utils/cronHandler';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('Celestia', async () => {
    await initMaxMind();

    const [allPeers, totalValidators] = await Promise.all([
        fetchCelestiaPeers(),
        fetchCelestiaValidatorCount(),
    ]);

    if (!allPeers.length) throw new Error('No peers returned from Celestia /net_info endpoints');

    const [providerCategorization, ovhNodes] = await Promise.all([
        categorizeCelestiaNodesByProvider(allPeers),
        filterOVHCelestiaNodes(allPeers),
    ]);

    const metrics = calculateCelestiaMetrics(allPeers, ovhNodes, providerCategorization, totalValidators);

    await writeChainCache('celestia', metrics, allPeers.length);

    return {
        totalPeers: allPeers.length,
        totalValidators,
        ovhNodes: ovhNodes.length,
        marketShare: metrics.marketShare.toFixed(2) + '%',
    };
});
