import { SolanaNode, OVHNode, DashboardMetrics, ProviderBreakdownEntry } from '@/types';

// Color palette for providers (matches dashboard theme)
const PROVIDER_COLORS: Record<string, string> = {
    ovh: '#00F0FF', // OVHcloud cyan
    aws: '#FF9900', // AWS orange
    hetzner: '#D50C2D', // Hetzner red
    google: '#4285F4', // Google blue
    digitalocean: '#0080FF', // DO blue
    vultr: '#007BFC', // Vultr blue
    equinix: '#ED2126', // Equinix red
    others: '#6B7280', // Gray for others
};

const PROVIDER_LABELS: Record<string, string> = {
    ovh: 'OVHcloud',
    aws: 'AWS',
    hetzner: 'Hetzner',
    google: 'Google Cloud',
    digitalocean: 'DigitalOcean',
    vultr: 'Vultr',
    equinix: 'Equinix',
    others: 'Others',
};

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
    const { distribution, othersBreakdown } = providerCategorization;

    // Calculate market share percentage
    const marketShare = totalNodes > 0 ? (ovhNodeCount / totalNodes) * 100 : 0;

    // Calculate Activated Stake
    const totalStake = allNodes.reduce((acc, node) => acc + ((node as any).activatedStake || 0), 0);
    const ovhStake = ovhNodes.reduce((acc, node) => acc + (node.activatedStake || 0), 0);

    // Geographic distribution
    const geoDistribution: Record<string, number> = {};
    ovhNodes.forEach((node) => {
        const country = node.ipInfo.country_name;
        geoDistribution[country] = (geoDistribution[country] || 0) + 1;
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
    const MARKET_SHARE_THRESHOLD = 5;

    const eligibleEntries: ProviderBreakdownEntry[] = [];
    // Start "others" count from the existing "others" bucket, then adjust below
    let totalOthersCount = distribution.others || 0;
    const newOthersBreakdown: Record<string, number> = { ...(othersBreakdown ?? {}) };

    // 1. Process known providers (fixed categories)
    for (const [key, count] of Object.entries(distribution)) {
        if (key === 'others' || count === 0) continue;
        const marketShare = totalNodes > 0 ? (count / totalNodes) * 100 : 0;
        if (marketShare > MARKET_SHARE_THRESHOLD) {
            eligibleEntries.push({
                key,
                label: PROVIDER_LABELS[key] ?? key,
                nodeCount: count,
                marketShare,
                color: PROVIDER_COLORS[key] ?? '#6B7280',
            });
        } else {
            // Below threshold: merge into "others"
            totalOthersCount += count;
            newOthersBreakdown[PROVIDER_LABELS[key] ?? key] = count;
        }
    }

    // 2. Promote any org from othersBreakdown that exceeds the threshold
    if (othersBreakdown) {
        for (const [org, orgCount] of Object.entries(othersBreakdown)) {
            const orgMarketShare = totalNodes > 0 ? (orgCount / totalNodes) * 100 : 0;
            if (orgMarketShare > MARKET_SHARE_THRESHOLD) {
                eligibleEntries.push({
                    key: org.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    label: org,
                    nodeCount: orgCount,
                    marketShare: orgMarketShare,
                    color: '#6B7280',
                });
                // Remove from the "others" pool
                totalOthersCount -= orgCount;
                delete newOthersBreakdown[org];
            }
        }
    }

    // 3. Add the aggregated "Others" entry
    if (totalOthersCount > 0) {
        const othersMarketShare = totalNodes > 0 ? (totalOthersCount / totalNodes) * 100 : 0;
        const topOthers = Object.entries(newOthersBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([org, orgCount]) => ({
                label: org,
                nodeCount: orgCount,
                marketShare: totalNodes > 0 ? (orgCount / totalNodes) * 100 : 0,
            }));

        const othersEntry: ProviderBreakdownEntry = {
            key: 'others',
            label: 'Others',
            nodeCount: totalOthersCount,
            marketShare: othersMarketShare,
            color: PROVIDER_COLORS['others'],
        };
        if (topOthers.length > 0) othersEntry.subProviders = topOthers;
        eligibleEntries.push(othersEntry);
    }

    const providerBreakdown = eligibleEntries.sort((a, b) => b.nodeCount - a.nodeCount);

    return {
        totalNodes,
        ovhNodes: ovhNodeCount,
        marketShare,
        geoDistribution,
        providerDistribution: distribution, // Now dynamic from the worker
        providerBreakdown,
        othersBreakdown,
        topValidators,
        ovhStake,
        totalStake,
    };
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
}
