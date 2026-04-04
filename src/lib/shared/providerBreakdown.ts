import { ProviderBreakdownEntry } from '@/types';
import { PROVIDER_COLORS, PROVIDER_LABELS } from '@/lib/config/constants';

const MARKET_SHARE_THRESHOLD = 5; // percent

/**
 * Build ProviderBreakdownEntry[] from a raw distribution map.
 * Providers below MARKET_SHARE_THRESHOLD are merged into "Others".
 * Shared by all chain integrations.
 */
export function buildProviderBreakdown(
    distribution: Record<string, number>,
    othersBreakdown: Record<string, number>,
    totalNodes: number
): ProviderBreakdownEntry[] {
    if (totalNodes === 0) return [];

    const eligible: ProviderBreakdownEntry[] = [];
    let totalOthersCount = distribution.others || 0;
    const newOthersBreakdown: Record<string, number> = { ...othersBreakdown };

    // 1. Process known providers
    for (const [key, count] of Object.entries(distribution)) {
        if (key === 'others' || count === 0) continue;
        const share = (count / totalNodes) * 100;
        if (share > MARKET_SHARE_THRESHOLD) {
            eligible.push({
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

    // 2. Promote orgs from othersBreakdown that exceed threshold
    for (const [org, orgCount] of Object.entries(othersBreakdown)) {
        const orgShare = (orgCount / totalNodes) * 100;
        if (orgShare > MARKET_SHARE_THRESHOLD) {
            eligible.push({
                key: org.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                label: org,
                nodeCount: orgCount,
                marketShare: orgShare,
                color: '#6B7280',
            });
            totalOthersCount -= orgCount;
            delete newOthersBreakdown[org];
        }
    }

    // 3. Aggregate "Others"
    if (totalOthersCount > 0) {
        const othersShare = (totalOthersCount / totalNodes) * 100;
        const topOthers = Object.entries(newOthersBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([org, c]) => ({
                label: org,
                nodeCount: c,
                marketShare: (c / totalNodes) * 100,
            }));

        const othersEntry: ProviderBreakdownEntry = {
            key: 'others',
            label: 'Others',
            nodeCount: totalOthersCount,
            marketShare: othersShare,
            color: PROVIDER_COLORS['others'],
        };
        if (topOthers.length > 0) othersEntry.subProviders = topOthers;
        eligible.push(othersEntry);
    }

    return eligible.sort((a, b) => b.nodeCount - a.nodeCount);
}
