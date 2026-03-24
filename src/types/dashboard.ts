import { EnrichedNode } from './solana';

export interface DashboardMetrics {
    totalNodes: number;
    ovhNodes: number;
    marketShare: number;
    geoDistribution: Record<string, number>;
    globalGeoDistribution?: Record<string, number>;
    providerDistribution: Record<string, number>;
    topValidators: EnrichedNode[];
    // New Stake Metrics
    ovhStake?: number;
    totalStake?: number;
    estimatedRevenue?: number; // Calculated revenue for OVH nodes
    // Provider breakdown for comparison chart
    providerBreakdown?: ProviderBreakdownEntry[];
    // Breakdown of 'Others' category for hovered details
    othersBreakdown?: Record<string, number>;
}

export interface APIResponse {
    success: boolean;
    data?: DashboardMetrics;
    error?: string;
    cached?: boolean;
    stale?: boolean;
    timestamp?: number;
}

export interface ProviderBreakdownEntry {
    key: string;
    label: string;
    nodeCount: number;
    marketShare: number;
    color: string;
    subProviders?: { label: string; nodeCount: number; marketShare: number }[];
}
