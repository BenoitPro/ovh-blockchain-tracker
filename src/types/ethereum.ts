export interface EthereumNode {
    id: string;       // node ID from ENR
    ip: string;
    port: number;
    enode?: string;   // full enode URL
}

export interface EthSnapshotMetrics {
    totalNodes: number;
    timestamp: number;
    crawlDurationMin?: number;
    providerDistribution: Record<string, number>;
    providerBreakdown: import('./dashboard').ProviderBreakdownEntry[];
    geoDistribution: Record<string, number>;
    decentralizationScore?: import('./dashboard').DecentralizationScore;
}

export interface EthAPIResponse {
    success: boolean;
    data?: EthSnapshotMetrics;
    error?: string;
    timestamp?: number;
}
