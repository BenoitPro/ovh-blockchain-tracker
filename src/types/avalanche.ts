/**
 * Avalanche-specific types
 *
 * Data source: Avalanche API `info.peers` endpoint
 * Endpoint: https://api.avax.network/ext/info
 */

export interface AvalancheNode {
    /** The unique identifier of the node (e.g., "NodeID-...") */
    nodeID: string;
    /** IP address extracted from the `ip` or `publicIP` field (e.g., "1.2.3.4:9651") */
    ip: string;
    /** Client version string (e.g., "avalanche/1.11.3") */
    version: string;
    /** Observed uptime percentage as reported by the queried node (0–100) */
    observedUptime: number;
    /** Observed sub-network uptimes keyed by subnet ID */
    observedSubnetUptimes?: Record<string, number>;
    /** Timestamp (Unix ms) when this peer was last seen */
    lastSent?: number;
    lastReceived?: number;
}

export interface AvalancheIPInfo {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
    city: string;
    latitude: number;
    longitude: number;
}

export interface AvalancheOVHNode extends AvalancheNode {
    ipInfo: AvalancheIPInfo;
    provider?: string;
}

/**
 * Dashboard metrics specific to Avalanche.
 * Extends generic metrics with the `avgOVHUptime` field.
 */
export interface AvalancheDashboardMetrics {
    /** Peers with a resolvable public IP (subset of the full validator set) */
    totalNodes: number;
    /**
     * Canonical validator count from platform.getCurrentValidators (P-Chain).
     * 0 if the P-Chain query failed. Use this for displaying the "true" network size.
     */
    totalValidators: number;
    ovhNodes: number;
    marketShare: number;
    geoDistribution: Record<string, number>;
    globalGeoDistribution?: Record<string, number>;
    providerDistribution: Record<string, number>;
    providerBreakdown?: import('./dashboard').ProviderBreakdownEntry[];
    othersBreakdown?: Record<string, number>;
    topValidators: AvalancheOVHNode[];
    /** Average observedUptime (0–100) across all OVH nodes */
    avgOVHUptime?: number;
    /** % of OVH nodes with uptime ≥ 80 */
    pctOVHUptimeAbove80?: number;
}

export interface AvalancheAPIResponse {
    success: boolean;
    data?: AvalancheDashboardMetrics;
    error?: string;
    cached?: boolean;
    stale?: boolean;
    timestamp?: number;
}
