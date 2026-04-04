import { fetchTronNodes } from '@/lib/tron/fetchNodes';
import { filterOVHTronNodes, categorizeTronNodesByProvider } from '@/lib/tron/filterOVH';
import { calculateTronMetrics } from '@/lib/tron/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';

/**
 * Vercel Cron Job — Tron node data refresh
 * Schedule: every 2 hours (configured in vercel.json)
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const handler = createCronHandler('Tron', async () => {
    const allNodes = await fetchTronNodes();

    const [ovhNodes, providerCategorization] = await Promise.all([
        filterOVHTronNodes(allNodes),
        categorizeTronNodesByProvider(allNodes),
    ]);

    const metrics = calculateTronMetrics(allNodes, ovhNodes, providerCategorization);
    await writeChainCache('tron', metrics, metrics.totalNodes);

    return {
        totalNodes: metrics.totalNodes,
        ovhNodes: metrics.ovhNodes,
        marketShare: `${metrics.marketShare.toFixed(2)}%`,
    };
});

export const GET = handler;
export const POST = handler;
