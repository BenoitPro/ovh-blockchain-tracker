export interface SolanaNode {
    pubkey: string;
    gossip: string | null;
    tpu: string | null;
    rpc: string | null;
    version: string | null;
}

export interface IPInfo {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
    city: string;
    latitude: number;
    longitude: number;
}

export interface OVHNode extends SolanaNode {
    ipInfo: IPInfo;
    // Enriched fields
    activatedStake?: number;
    commission?: number;
    votePubkey?: string;
    countryName?: string;
    name?: string;
    image?: string;
    provider?: string;
}

export interface EnrichedNode extends SolanaNode {
    ip?: string;
    asn?: string;
    org?: string;
    activatedStake?: number; // In Lamports
    commission?: number;
    votePubkey?: string;
    // New fields for polishing
    country?: string; // ISO Code (FR, DE)
    countryName?: string; // Full name (Germany, France)
    name?: string; // Validator Name (e.g. Jupiter)
    image?: string; // Validator Icon URL
    city?: string;
    latitude?: number;
    longitude?: number;
    provider?: string; // Cleaned provider name (e.g. AWS, Hetzner, OVHcloud)
}

export interface DashboardMetrics {
    totalNodes: number;
    ovhNodes: number;
    marketShare: number;
    geoDistribution: Record<string, number>;
    providerDistribution: Record<string, number>;
    topValidators: EnrichedNode[];
    // New Stake Metrics
    ovhStake?: number;
    totalStake?: number;
    estimatedRevenue?: number; // Calculated revenue for OVH nodes
    // Provider breakdown for comparison chart
    providerBreakdown?: ProviderBreakdownEntry[];
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
}

// Historical Metrics Types
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

// Country detail types
export interface CountryNode {
    pubkey: string;
    ip: string; // Masked IP e.g. "51.XXX.XXX.XXX"
    city: string;
    activatedStake: number;
    commission: number;
    votePubkey: string;
    isValidator: boolean;
    version: string | null;
    name?: string;
    image?: string;
}

export interface CountryDetailResponse {
    success: boolean;
    countryCode: string;
    countryName: string;
    nodes: CountryNode[];
    totalNodes: number;
    totalStake: number;
    error?: string;
}

