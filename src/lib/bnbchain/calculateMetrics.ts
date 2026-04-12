import type { BNBChainOVHNode, BNBChainDashboardMetrics, BNBProviderDetail } from '@/types/bnbchain';
import type { ProviderCategorizationResult } from '@/lib/shared/filterOVH';
import type { ProviderBreakdownEntry } from '@/types/dashboard';
import { PROVIDER_COLORS, PROVIDER_LABELS } from '@/lib/config/constants';
import { BSC_COVERAGE_META, BSC_RPC_PROVIDERS } from './fetchPeers';

const MARKET_SHARE_THRESHOLD = 5; // providers below this % go into "Others"

/**
 * Calculate BNB Chain dashboard metrics.
 *
 * Scope: professional RPC providers only (not full node discovery).
 * See BSC_COVERAGE_META for transparency data shown in the UI.
 *
 * @param ovhNodes           OVH endpoints among resolved provider IPs
 * @param totalEndpoints     Total unique IPs resolved across all providers
 * @param totalValidators    On-chain validator count (~45, IPs not tracked)
 * @param categorization     Provider categorization from categorizeByProvider()
 * @param resolvedProviders  How many providers resolved successfully (for coverage display)
 */
export function calculateBNBMetrics(
    ovhNodes: BNBChainOVHNode[],
    totalEndpoints: number,
    totalValidators: number,
    categorization: ProviderCategorizationResult,
    resolvedProviders?: number,
    providerDetails?: BNBProviderDetail[],
): BNBChainDashboardMetrics {
    const { distribution, othersBreakdown, globalGeoDistribution } = categorization;

    const ovhEndpoints = ovhNodes.length;

    // Count distinct BSC provider names that have ≥1 OVH IP
    const ovhProviderNames = new Set(ovhNodes.map(n => n.providerName ?? n.version ?? '').filter(Boolean));
    const ovhProviders = ovhProviderNames.size;

    const marketShare = totalEndpoints > 0 ? (ovhEndpoints / totalEndpoints) * 100 : 0;

    // ── Geo distribution (OVH endpoints only) ─────────────────────────────────
    const geoDistribution: Record<string, number> = {};
    for (const node of ovhNodes) {
        const country = node.ipInfo.country;
        if (country && country !== 'Unknown') {
            geoDistribution[country] = (geoDistribution[country] ?? 0) + 1;
        }
    }

    // ── Provider breakdown chart ──────────────────────────────────────────────
    const eligibleEntries: ProviderBreakdownEntry[] = [];
    let totalOthersCount = (distribution as Record<string, number>).others ?? 0;
    const newOthersBreakdown: Record<string, number> = { ...(othersBreakdown ?? {}) };

    for (const [key, count] of Object.entries(distribution)) {
        if (key === 'others' || (count as number) === 0) continue;
        const share = totalEndpoints > 0 ? ((count as number) / totalEndpoints) * 100 : 0;
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

    if (othersBreakdown) {
        for (const [org, orgCount] of Object.entries(othersBreakdown)) {
            const share = totalEndpoints > 0 ? ((orgCount as number) / totalEndpoints) * 100 : 0;
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

    if (totalOthersCount > 0) {
        const othersShare = totalEndpoints > 0 ? (totalOthersCount / totalEndpoints) * 100 : 0;
        const topOthers = Object.entries(newOthersBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, nodeCount]) => ({
                label,
                nodeCount,
                marketShare: totalEndpoints > 0 ? (nodeCount / totalEndpoints) * 100 : 0,
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

    return {
        totalTrackedEndpoints: totalEndpoints,
        totalTrackedProviders: resolvedProviders ?? BSC_RPC_PROVIDERS.length,
        ovhEndpoints,
        ovhProviders,
        totalValidators,
        marketShare,
        geoDistribution,
        globalGeoDistribution: globalGeoDistribution ?? {},
        providerDistribution: distribution,
        providerBreakdown: eligibleEntries.sort((a, b) => b.nodeCount - a.nodeCount),
        othersBreakdown: newOthersBreakdown,
        topNodes: ovhNodes.slice(0, 10),
        providerDetails: providerDetails ?? [],
        coverage: {
            ...BSC_COVERAGE_META,
            trackedProviders: resolvedProviders ?? BSC_COVERAGE_META.trackedProviders,
        },
    };
}
