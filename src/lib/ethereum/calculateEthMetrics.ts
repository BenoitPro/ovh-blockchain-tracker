import { EthSnapshotMetrics } from '@/types';
import { buildProviderBreakdown } from '@/lib/shared/providerBreakdown';

export { buildProviderBreakdown };

/**
 * Assemble a full EthSnapshotMetrics from raw distribution data.
 */
export function calculateEthMetrics(
    totalNodes: number,
    distribution: Record<string, number>,
    othersBreakdown: Record<string, number>,
    geoDistribution: Record<string, number>,
    timestamp: number,
    crawlDurationMin?: number
): EthSnapshotMetrics {
    const providerBreakdown = buildProviderBreakdown(distribution, othersBreakdown, totalNodes);

    return {
        totalNodes,
        timestamp,
        crawlDurationMin,
        providerDistribution: distribution,
        providerBreakdown,
        geoDistribution,
    };
}
