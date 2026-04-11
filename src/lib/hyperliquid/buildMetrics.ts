// src/lib/hyperliquid/buildMetrics.ts
import { fetchHyperliquidValidators } from './fetchValidators';
import { filterOVHHyperliquidValidators } from './filterOVH';
import { calculateHyperliquidMetrics } from './calculateMetrics';
import { HyperliquidDashboardMetrics } from '@/types/hyperliquid';

/**
 * Fetch + filter + calculate — shared by the cron job and the live-fallback
 * API route. Does NOT write to cache; callers decide whether to persist.
 */
export async function buildHyperliquidMetrics(): Promise<{
    metrics: HyperliquidDashboardMetrics;
    totalValidators: number;
}> {
    const allValidators = await fetchHyperliquidValidators();
    if (!allValidators.length) throw new Error('No validators returned from Hyperliquid API');

    const ovhValidators = filterOVHHyperliquidValidators(allValidators);
    const metrics = calculateHyperliquidMetrics(allValidators, ovhValidators);

    return { metrics, totalValidators: allValidators.length };
}
