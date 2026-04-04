import { TronNode, TronOVHNode, TronDashboardMetrics } from '@/types/tron';
import { ProviderBreakdownEntry } from '@/types/dashboard';
import { TronProviderCategorizationResult } from './filterOVH';
import { PROVIDER_COLORS, PROVIDER_LABELS } from '@/lib/config/constants';

const MARKET_SHARE_THRESHOLD = 5; // providers below this % go into "Others"

export function calculateTronMetrics(
    allNodes: TronNode[],
    ovhNodes: TronOVHNode[],
    providerCategorization: TronProviderCategorizationResult,
): TronDashboardMetrics {
    const totalNodes = allNodes.length;
    const ovhNodeCount = ovhNodes.length;
    const { distribution, othersBreakdown, globalGeoDistribution } = providerCategorization;

    const marketShare = totalNodes > 0 ? (ovhNodeCount / totalNodes) * 100 : 0;

    // ── Geo distribution (OVH nodes only) ─────────────────────────────────────
    const geoDistribution: Record<string, number> = {};
    for (const node of ovhNodes) {
        const country = node.ipInfo.country;
        if (country && country !== 'Unknown') {
            geoDistribution[country] = (geoDistribution[country] ?? 0) + 1;
        }
    }

    // ── Top validators list (OVH nodes, sorted alphabetically by IP) ──────────
    // Tron nodes have no staking metadata — sort by IP address alphabetically
    const topValidators = [...ovhNodes].sort((a, b) => a.ip.localeCompare(b.ip));

    // ── Provider breakdown chart ──────────────────────────────────────────────
    const eligibleEntries: ProviderBreakdownEntry[] = [];
    let totalOthersCount = distribution.others ?? 0;
    const newOthersBreakdown: Record<string, number> = { ...(othersBreakdown ?? {}) };

    for (const [key, count] of Object.entries(distribution)) {
        if (key === 'others' || count === 0) continue;
        const share = totalNodes > 0 ? (count / totalNodes) * 100 : 0;

        if (share > MARKET_SHARE_THRESHOLD) {
            eligibleEntries.push({
                key,
                label: PROVIDER_LABELS[key] ?? key,
                nodeCount: count,
                marketShare: share,
                color: PROVIDER_COLORS[key] ?? '#6B7280',
            });
        } else {
            totalOthersCount += count;
            newOthersBreakdown[PROVIDER_LABELS[key] ?? key] = count;
        }
    }

    // Promote orgs from othersBreakdown that exceed the threshold
    if (othersBreakdown) {
        for (const [org, orgCount] of Object.entries(othersBreakdown)) {
            const share = totalNodes > 0 ? (orgCount / totalNodes) * 100 : 0;
            if (share > MARKET_SHARE_THRESHOLD) {
                eligibleEntries.push({
                    key: org.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    label: org,
                    nodeCount: orgCount,
                    marketShare: share,
                    color: '#6B7280',
                });
                totalOthersCount -= orgCount;
                delete newOthersBreakdown[org];
            }
        }
    }

    // Aggregate "Others"
    if (totalOthersCount > 0) {
        const othersShare = totalNodes > 0 ? (totalOthersCount / totalNodes) * 100 : 0;
        const topOthers = Object.entries(newOthersBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, nodeCount]) => ({
                label,
                nodeCount,
                marketShare: totalNodes > 0 ? (nodeCount / totalNodes) * 100 : 0,
            }));

        const othersEntry: ProviderBreakdownEntry = {
            key: 'others',
            label: 'Others',
            nodeCount: totalOthersCount,
            marketShare: othersShare,
            color: PROVIDER_COLORS['others'],
            subProviders: topOthers.length > 0 ? topOthers : undefined,
        };
        eligibleEntries.push(othersEntry);
    }

    const providerBreakdown = eligibleEntries.sort((a, b) => b.nodeCount - a.nodeCount);

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
    };
}
