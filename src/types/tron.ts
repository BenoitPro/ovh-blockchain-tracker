/**
 * Tron-specific types
 *
 * Data source: TronGrid HTTP API `wallet/listnodes`
 * Endpoint: https://api.trongrid.io/wallet/listnodes (POST, no params)
 *
 * Response shape:
 * {
 *   "nodes": [
 *     { "address": { "host": "34.86.86.229", "port": 18888 } }
 *   ]
 * }
 *
 * Unlike Sui (validators with voting power), Tron nodes are raw
 * network participants — no staking metadata. Pure infra tracking.
 */

export interface TronNode {
  /** IPv4 address extracted from the API response */
  ip: string;
  /** P2P port (typically 18888) */
  port: number;
}

export interface TronIPInfo {
  ip: string;
  asn: string;
  org: string;
  country: string;
  country_name: string;
  city: string;
  lat: number;
  lon: number;
}

export interface TronOVHNode extends TronNode {
  ipInfo: TronIPInfo;
  provider?: string;
}

export interface TronProviderCategorizationResult {
  distribution: Record<string, number>;
  othersBreakdown: Record<string, number>;
  globalGeoDistribution: Record<string, number>;
}

export interface TronDashboardMetrics {
  totalNodes: number;
  ovhNodes: number;
  marketShare: number;
  geoDistribution: Record<string, number>;
  globalGeoDistribution?: Record<string, number>;
  providerDistribution: Record<string, number>;
  providerBreakdown?: import('./dashboard').ProviderBreakdownEntry[];
  othersBreakdown?: Record<string, number>;
  topValidators: TronOVHNode[];
}

export interface TronAPIResponse {
  success: boolean;
  data?: TronDashboardMetrics;
  error?: string;
  cached?: boolean;
  stale?: boolean;
  timestamp?: number;
}
