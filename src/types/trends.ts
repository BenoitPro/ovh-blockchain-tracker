export type TrendPeriod = 90 | 365 | 'all';

export interface TrendDataPoint {
    timestamp: number;
    date: string; // ISO date string for display
    marketShare: number;
    ovhNodes: number;
    totalNodes: number;
}

export interface HistoricalMetrics {
    id: number;
    timestamp: number;
    total_nodes: number;
    ovh_nodes: number;
    market_share: number;
    estimated_revenue: number;
    geo_distribution: string; // JSON string
    provider_distribution: string; // JSON string
    created_at: number;
}

export interface TrendResponse {
    success: boolean;
    period: TrendPeriod;
    data: TrendDataPoint[];
    error?: string;
}
