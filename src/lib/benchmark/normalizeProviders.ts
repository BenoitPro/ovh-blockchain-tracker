import type { ProviderBreakdownEntry } from '@/types/dashboard';

/**
 * Takes a providerBreakdown array, keeps the top N entries by nodeCount,
 * and aggregates the rest into a single "Others" entry.
 */
export function normalizeProviders(
  breakdown: ProviderBreakdownEntry[],
  topN = 6,
): ProviderBreakdownEntry[] {
  if (breakdown.length === 0) return [];

  const sorted = [...breakdown].sort((a, b) => b.nodeCount - a.nodeCount);
  const top = sorted.slice(0, topN);

  if (sorted.length <= topN) return top;

  const rest = sorted.slice(topN);
  const total = sorted.reduce((sum, p) => sum + p.nodeCount, 0);
  const othersCount = rest.reduce((sum, p) => sum + p.nodeCount, 0);

  return [
    ...top,
    {
      key: 'others',
      label: 'Others',
      nodeCount: othersCount,
      marketShare: total > 0 ? (othersCount / total) * 100 : 0,
      color: '#6B7280',
    },
  ];
}
