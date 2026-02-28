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

/**
 * Calculate all dashboard metrics from node data
 */
export function calculateMetrics(
    allNodes: SolanaNode[],
    ovhNodes: OVHNode[],
    providerDistribution: Record<string, number>
): DashboardMetrics {
    const totalNodes = allNodes.length;
    const ovhNodeCount = ovhNodes.length;

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
    const providerBreakdown: ProviderBreakdownEntry[] = Object.entries(providerDistribution)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => ({
            key,
            label: PROVIDER_LABELS[key] ?? key,
            nodeCount: count,
            marketShare: totalNodes > 0 ? (count / totalNodes) * 100 : 0,
            color: PROVIDER_COLORS[key] ?? '#6B7280',
        }))
        .sort((a, b) => b.nodeCount - a.nodeCount);

    return {
        totalNodes,
        ovhNodes: ovhNodeCount,
        marketShare,
        geoDistribution,
        providerDistribution, // Now dynamic from the worker
        providerBreakdown,
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
