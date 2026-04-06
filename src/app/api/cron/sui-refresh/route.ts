import { fetchSuiValidators } from '@/lib/sui/fetchValidators';
import { filterOVHSuiNodes, categorizeSuiNodesByProvider } from '@/lib/sui/filterOVH';
import { calculateSuiMetrics } from '@/lib/sui/calculateMetrics';
import { writeChainCache } from '@/lib/cache/chain-storage';
import { createCronHandler } from '@/lib/utils/cronHandler';
import { getASNFromMaxMind } from '@/lib/asn/maxmind';
import { identifyProvider } from '@/lib/shared/providers';
import { ProspectEntry } from '@/types/dashboard';

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

    const ovhAddresses = new Set(ovhNodes.map((n) => n.suiAddress));
    const topProspects: ProspectEntry[] = allValidators
        .filter((v) => v.name && v.ip && !ovhAddresses.has(v.suiAddress))
        .map((v) => {
            const asnInfo = getASNFromMaxMind(v.ip!);
            const provider = asnInfo
                ? identifyProvider(asnInfo.asn, asnInfo.org)
                : 'Unknown';
            return {
                name: v.name,
                currentProvider: provider,
                stake: parseInt(v.votingPower ?? '0'),
                stakeUnit: 'SUI' as const,
            };
        })
        .filter((p) => p.currentProvider !== 'OVHcloud')
        .sort((a, b) => b.stake - a.stake)
        .slice(0, 30);

    const metricsWithProspects = { ...metrics, topProspects };

    await writeChainCache('sui', metricsWithProspects, metricsWithProspects.totalNodes);

    return {
        totalNodes: metricsWithProspects.totalNodes,
        ovhNodes: metricsWithProspects.ovhNodes,
        ovhVotingPowerShare: metricsWithProspects.ovhVotingPowerShare,
        prospects: topProspects.length,
    };
});

export const GET = handler;
export const POST = handler;
