/**
 * Celestia-specific types
 *
 * Data sources:
 *   - Peers: CometBFT /net_info on 5 public RPC endpoints → result.peers[].remote_ip
 *   - Validator count: GET https://celestia-rest.publicnode.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1
 */
import { ProviderBreakdownEntry } from '@/types/dashboard';

export interface CelestiaNode {
    ip: string;
    port: number;
    isOutbound: boolean;
    version?: string;
}

export interface CelestiaIPInfo {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
    city: string;
    lat: number;
    lon: number;
}

export interface CelestiaOVHNode extends CelestiaNode {
    ipInfo: CelestiaIPInfo;
    provider?: string;
}

export interface CelestiaNodeMetrics {
    totalPeers: number;
    totalValidators: number;
    ovhNodes: number;
    marketShare: number;
    geoDistribution: Record<string, number>;
    globalGeoDistribution?: Record<string, number>;
    providerDistribution: Record<string, number>;
    providerBreakdown?: ProviderBreakdownEntry[];
    othersBreakdown?: Record<string, number>;
    topNodes: CelestiaOVHNode[];
}

export interface CelestiaAPIResponse {
    success: boolean;
    data?: CelestiaNodeMetrics;
    error?: string;
    cached?: boolean;
    stale?: boolean;
    timestamp?: number;
}
