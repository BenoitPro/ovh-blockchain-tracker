/**
 * BNB Chain-specific types
 *
 * Data source: admin_peers RPC endpoint
 * Validators: ~45 known validators from the staking contract
 */

import type { ProviderBreakdownEntry } from './dashboard';

// Node discovered via admin_peers RPC
export interface BNBChainNode {
  id: string;        // enode ID (hex)
  ip: string;        // public IP
  port?: number;
  version?: string;  // client version e.g. "Geth/v1.4.15-stable..."
  caps?: string[];   // capabilities
}

export interface BNBChainIPInfo {
  ip: string;
  asn: string;
  org: string;
  country: string;       // ISO 2-letter country code
  country_name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface BNBChainOVHNode extends BNBChainNode {
  ipInfo: BNBChainIPInfo;
  provider: string;
  isValidator?: boolean;       // true if it's one of the ~45 known validators
  validatorAddress?: string;
}

export interface BNBChainDashboardMetrics {
  totalNodes: number;             // peers discovered via admin_peers
  totalValidators: number;        // ~45 from staking contract
  ovhNodes: number;
  ovhValidators: number;          // OVH validators among the 45
  marketShare: number;            // % OVH peers (out of totalNodes)
  validatorMarketShare: number;   // % OVH validators (out of totalValidators)
  geoDistribution: Record<string, number>;
  globalGeoDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
  providerBreakdown: ProviderBreakdownEntry[];
  othersBreakdown?: Record<string, number>;
  topNodes: BNBChainOVHNode[];
}

export interface BNBChainAPIResponse {
  success: boolean;
  data?: BNBChainDashboardMetrics;
  error?: string;
  cached: boolean;
  stale?: boolean;
  timestamp?: number;
  nodeCount?: number;
}
