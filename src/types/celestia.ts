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
    latitude: number;
    longitude: number;
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
