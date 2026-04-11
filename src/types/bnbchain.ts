/**
 * BNB Chain-specific types
 *
 * Data source: DNS resolution of 14 professional RPC providers
 * Methodology: professional-rpc-providers (not full node discovery)
 * Validators: ~45 known validators (on-chain count only — IPs not discoverable)
 *
 * Coverage: ~65% of BSC public API traffic by request volume.
 * NOT tracked: validators (~45, private sentries) + private nodes (~8,000+).
 */

import type { ProviderBreakdownEntry } from './dashboard';

/** One tracked IP endpoint (one provider can have multiple IPs via DNS) */
export interface BNBChainNode {
  id: string;       // "{providerName}:{ip}" composite key
  ip: string;       // resolved IPv4 address
  version?: string; // provider name (reused field for compatibility with shared utils)
  caps?: string[];  // ["official" | "professional" | "community"]
  port?: number;
}

export interface BNBChainIPInfo {
  ip: string;
  asn: string;
  org: string;
  country: string;
  country_name: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface BNBChainOVHNode extends BNBChainNode {
  ipInfo: BNBChainIPInfo;
  provider: string;      // cloud provider (OVHcloud, AWS, Cloudflare, etc.)
  providerName?: string; // BSC RPC provider name (Ankr, NodeReal, etc.)
  isValidator?: boolean;
}

/** Metadata about what this dataset covers — shown in UI for transparency */
export interface BNBCoverageMeta {
  trackedProviders: number;
  /** Estimated % of BSC public API traffic (by request volume) */
  estimatedTrafficCoverage: number;
  /** Total BSC network size estimate (not trackable) */
  totalNetworkEstimate: number;
  methodology: 'professional-rpc-providers';
  caveat: string;
}

export interface BNBChainDashboardMetrics {
  // Provider-scope metrics (what we actually track)
  totalTrackedEndpoints: number;   // unique IPs resolved across all providers
  totalTrackedProviders: number;   // providers that resolved successfully
  ovhEndpoints: number;            // IPs on OVH infrastructure
  ovhProviders: number;            // distinct providers with ≥1 OVH IP

  // Validator count (on-chain, display only — IPs not tracked)
  totalValidators: number;

  // Market share (scoped to tracked providers — labeled clearly in UI)
  marketShare: number;             // % of tracked endpoints on OVH

  // Geographic & provider distribution
  geoDistribution: Record<string, number>;
  globalGeoDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
  providerBreakdown: ProviderBreakdownEntry[];
  othersBreakdown?: Record<string, number>;

  topNodes: BNBChainOVHNode[];

  /** Coverage metadata — always shown in UI for transparency */
  coverage: BNBCoverageMeta;
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
