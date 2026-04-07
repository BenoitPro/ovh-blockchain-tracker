import { SolanaNode, OVHNode, DashboardMetrics } from '@/types';
import { buildProviderBreakdown } from '@/lib/shared/providerBreakdown';
import { computeDecentralizationScore } from '@/lib/shared/decentralizationScore';

import { ProviderCategorizationResult } from './filterOVH';

/**
 * Calculate all dashboard metrics from node data
 */
export function calculateMetrics(
    allNodes: SolanaNode[],
    ovhNodes: OVHNode[],
    providerCategorization: ProviderCategorizationResult
): DashboardMetrics {
    const totalNodes = allNodes.length;
    const ovhNodeCount = ovhNodes.length;
    const { distribution, othersBreakdown, globalGeoDistribution } = providerCategorization;

    // Calculate market share percentage
    const marketShare = totalNodes > 0 ? (ovhNodeCount / totalNodes) * 100 : 0;

    // Calculate Activated Stake
    const totalStake = allNodes.reduce((acc, node) => acc + ((node as any).activatedStake || 0), 0);
    const ovhStake = ovhNodes.reduce((acc, node) => acc + (node.activatedStake || 0), 0);

    // Geographic distribution (OVH only)
    const geoDistribution: Record<string, number> = {};
    ovhNodes.forEach((node) => {
        const country = node.ipInfo.country; // ISO code (e.g. "FR")
        if (country) geoDistribution[country] = (geoDistribution[country] || 0) + 1;
    });

    // Top validators (sorted by country)
    const topValidators = ovhNodes
        .slice(0, 10)
        .map((node) => ({
            ...node,
            // Ensure compat with EnrichedNode
            country: node.ipInfo.country, // ISO code
            countryName: node.ipInfo.country_name,
            asn: node.ipInfo.asn,
            org: node.ipInfo.org,
            ip: node.ipInfo.ip,
            provider: node.provider,
            name: node.name,
            image: node.image,
        }));

    // Build structured provider breakdown for comparison chart
    // Providers with > 5% market share are shown individually; the rest go into "Others"
    const providerBreakdown = buildProviderBreakdown(
        (distribution as Record<string, number>) ?? {},
        othersBreakdown ?? {},
        totalNodes
    );

    // Use global geo distribution (all providers) for decentralization score
    const geoForScore = globalGeoDistribution ?? geoDistribution;
    const decentralizationScore = computeDecentralizationScore(providerBreakdown, geoForScore, totalNodes);

    return {
        totalNodes,
        ovhNodes: ovhNodeCount,
        marketShare,
        geoDistribution,
        globalGeoDistribution,
        providerDistribution: distribution,
        providerBreakdown,
        othersBreakdown,
        topValidators,
        ovhStake,
        totalStake,
        decentralizationScore,
    };
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
}
