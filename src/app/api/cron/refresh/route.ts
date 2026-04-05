import { fetchSolanaNodes } from '@/lib/solana/fetchNodes';
import { filterOVHNodes, categorizeNodesByProvider } from '@/lib/solana/filterOVH';
import { calculateMetrics } from '@/lib/solana/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { initMaxMind } from '@/lib/asn/maxmind';
import { MetricsRepository } from '@/lib/db/metrics-repository';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Solana node data refresh
 * Schedule: every day at 00:00 (configured in vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export const GET = createCronHandler('Solana', async () => {
    await initMaxMind();

    const allNodes = await fetchSolanaNodes();
    if (!allNodes?.length) throw new Error('No nodes returned from Solana RPC');

    const [providerDistribution, ovhNodes] = await Promise.all([
        categorizeNodesByProvider(allNodes),
        filterOVHNodes(allNodes),
    ]);

    const metrics = calculateMetrics(allNodes, ovhNodes, providerDistribution);

    await writeChainCache('solana', metrics, allNodes.length);
    await MetricsRepository.saveMetrics(metrics);

    return {
        totalNodes: allNodes.length,
        ovhNodes: ovhNodes.length,
        marketShare: metrics.marketShare.toFixed(2) + '%',
    };
});
