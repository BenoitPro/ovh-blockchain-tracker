/**
 * Sui-specific types
 *
 * Data source: Sui JSON-RPC `suix_getLatestSuiSystemState`
 * Endpoint: https://fullnode.mainnet.sui.io:443
 *
 * Unlike Avalanche (peer-sampling), Sui returns ALL active validators
 * in a single RPC call — giving 100% network coverage.
 */

export interface SuiValidator {
    /** Validator's Sui address (0x...) */
    suiAddress: string;
    /** Human-readable validator name */
    name: string;
    /** Libp2p multiaddr for consensus: "/ip4/X.X.X.X/tcp/8080" */
    netAddress: string;
    /** Libp2p multiaddr for p2p: "/ip4/X.X.X.X/udp/8084" */
    p2pAddress: string;
    /** Voting power (bigint serialised as string) */
    votingPower: string;
    /** Commission rate in basis points (e.g. "200" = 2%) */
    commissionRate: string;
    /** Total SUI in the staking pool (serialised bigint) */
    stakingPoolSuiBalance: string;
    /** Clean IPv4 extracted from netAddress (null if DNS hostname) */
    ip?: string | null;
}

export interface SuiIPInfo {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
    city: string;
    lat: number;
    lon: number;
}

export interface SuiOVHNode extends SuiValidator {
    ipInfo: SuiIPInfo;
    provider?: string;
}

export interface SuiProviderCategorizationResult {
    distribution: Record<string, number>;
    othersBreakdown: Record<string, number>;
    globalGeoDistribution: Record<string, number>;
}

/**
 * Dashboard metrics specific to Sui.
 * Notable addition vs Avalanche: `ovhVotingPowerShare` —
 * the fraction of total voting power held by OVH-hosted validators.
 */
export interface SuiDashboardMetrics {
    totalNodes: number;
    ovhNodes: number;
    marketShare: number;
    geoDistribution: Record<string, number>;
    globalGeoDistribution?: Record<string, number>;
    providerDistribution: Record<string, number>;
    providerBreakdown?: import('./dashboard').ProviderBreakdownEntry[];
    othersBreakdown?: Record<string, number>;
    topValidators: SuiOVHNode[];
    /** % of total network voting power held by OVH validators */
    ovhVotingPowerShare?: number;
}

export interface SuiAPIResponse {
    success: boolean;
    data?: SuiDashboardMetrics;
    error?: string;
    cached?: boolean;
    stale?: boolean;
    timestamp?: number;
}
