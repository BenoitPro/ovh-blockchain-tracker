import type { ProviderBreakdownEntry } from '@/types/dashboard';

interface ChainBreakdownInput {
    providerBreakdown: ProviderBreakdownEntry[];
    totalNodes: number;
}

/**
 * Aggregate per-chain providerBreakdown arrays into a single cross-chain breakdown.
 * Sums nodeCount per provider key, then recomputes marketShare against global total.
 * Providers that appear in multiple chains are merged (color from first occurrence).
 */
export function aggregateProviderBreakdowns(
    chains: ChainBreakdownInput[],
): ProviderBreakdownEntry[] {
    if (chains.length === 0) return [];

    const totals = new Map<string, { label: string; nodeCount: number; color: string }>();
    let globalTotal = 0;

    for (const chain of chains) {
        globalTotal += chain.totalNodes;
        for (const entry of chain.providerBreakdown) {
            const existing = totals.get(entry.key);
            if (existing) {
                existing.nodeCount += entry.nodeCount;
            } else {
                totals.set(entry.key, {
                    label: entry.label,
                    nodeCount: entry.nodeCount,
                    color: entry.color,
                });
            }
        }
    }

    return Array.from(totals.entries())
        .map(([key, val]) => ({
            key,
            label: val.label,
            nodeCount: val.nodeCount,
            marketShare: globalTotal > 0 ? (val.nodeCount / globalTotal) * 100 : 0,
            color: val.color,
        }))
        .sort((a, b) => b.nodeCount - a.nodeCount);
}
