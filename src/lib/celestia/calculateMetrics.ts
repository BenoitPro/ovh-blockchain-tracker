import { CelestiaNode, CelestiaOVHNode, CelestiaNodeMetrics, ProviderBreakdownEntry } from '@/types';
import { CelestiaProviderCategorizationResult } from './filterOVH';
import { PROVIDER_COLORS, PROVIDER_LABELS } from '@/lib/config/constants';

const MARKET_SHARE_THRESHOLD = 5; // providers below this % go into "Others"

/**
 * Calculate all Celestia dashboard metrics from peer data.
 *
 * Notable differences vs Avalanche:
 *   - Uses `totalPeers` (not `totalNodes`) — Celestia separates peer count from validator count
 *   - Top list is `topNodes` (not `topValidators`)
 *   - No uptime fields (`avgOVHUptime`, `pctOVHUptimeAbove80`)
 */
export function calculateCelestiaMetrics(
    allPeers: CelestiaNode[],
    ovhNodes: CelestiaOVHNode[],
    providerCategorization: CelestiaProviderCategorizationResult,
    totalValidators = 0,
): CelestiaNodeMetrics {
    const totalPeers = allPeers.length;
    const ovhNodeCount = ovhNodes.length;
    const { distribution, othersBreakdown, globalGeoDistribution } = providerCategorization;

    const marketShare = totalPeers > 0 ? (ovhNodeCount / totalPeers) * 100 : 0;

    // ── Geo distribution (OVH nodes only) ─────────────────────────────────────
    const geoDistribution: Record<string, number> = {};
    for (const node of ovhNodes) {
        const country = node.ipInfo.country;
        if (country && country !== 'Unknown') {
            geoDistribution[country] = (geoDistribution[country] ?? 0) + 1;
        }
    }

    // ── Top nodes list ────────────────────────────────────────────────────────
    const topNodes = ovhNodes.slice(0, 10);

    // ── Provider breakdown chart ──────────────────────────────────────────────
    const eligibleEntries: ProviderBreakdownEntry[] = [];
    let totalOthersCount = (distribution as Record<string, number>).others ?? 0;
    const newOthersBreakdown: Record<string, number> = { ...(othersBreakdown ?? {}) };

    // 1. Known providers
    for (const [key, count] of Object.entries(distribution)) {
        if (key === 'others' || (count as number) === 0) continue;
        const share = totalPeers > 0 ? ((count as number) / totalPeers) * 100 : 0;
        if (share > MARKET_SHARE_THRESHOLD) {
            eligibleEntries.push({
                key,
                label: PROVIDER_LABELS[key] ?? key,
                nodeCount: count as number,
                marketShare: share,
                color: PROVIDER_COLORS[key] ?? '#6B7280',
            });
        } else {
            totalOthersCount += count as number;
            newOthersBreakdown[PROVIDER_LABELS[key] ?? key] = count as number;
        }
    }

    // 2. Promote orgs from othersBreakdown that exceed the threshold
    if (othersBreakdown) {
        for (const [org, orgCount] of Object.entries(othersBreakdown)) {
            const share = totalPeers > 0 ? ((orgCount as number) / totalPeers) * 100 : 0;
            if (share > MARKET_SHARE_THRESHOLD) {
                eligibleEntries.push({
                    key: org.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    label: org,
                    nodeCount: orgCount as number,
                    marketShare: share,
                    color: '#6B7280',
                });
                totalOthersCount -= orgCount as number;
                delete newOthersBreakdown[org];
            }
        }
    }

    // 3. Aggregate "Others"
    if (totalOthersCount > 0) {
        const othersShare = totalPeers > 0 ? (totalOthersCount / totalPeers) * 100 : 0;
        const topOthers = Object.entries(newOthersBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, nodeCount]) => ({
                label,
                nodeCount,
                marketShare: totalPeers > 0 ? (nodeCount / totalPeers) * 100 : 0,
            }));

        const othersEntry: ProviderBreakdownEntry = {
            key: 'others',
            label: 'Others',
            nodeCount: totalOthersCount,
            marketShare: othersShare,
            color: PROVIDER_COLORS['others'],
        };
        if (topOthers.length > 0) othersEntry.subProviders = topOthers;
        eligibleEntries.push(othersEntry);
    }

    const providerBreakdown = eligibleEntries.sort((a, b) => b.nodeCount - a.nodeCount);

    return {
        totalPeers,
        totalValidators,
        ovhNodes: ovhNodeCount,
        marketShare,
        geoDistribution,
        globalGeoDistribution,
        providerDistribution: distribution,
        providerBreakdown,
        othersBreakdown,
        topNodes,
    };
}
