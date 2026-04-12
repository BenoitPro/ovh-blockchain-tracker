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

/**
 * One tracked BSC RPC provider with resolved infrastructure info.
 * This is the business-relevant view: "Ankr runs on AWS — potential OVH win-back."
 */
export interface BNBProviderDetail {
  providerName: string;                              // "Ankr", "NodeReal", "BNB Chain (Binance)"
  hostname: string;                                  // "rpc.ankr.com"
  tier: 'official' | 'professional' | 'community';  // provider tier
  ipCount: number;                                   // IPs resolved via DNS (0 = DNS failed)
  infrastructure: string;                            // "AWS", "Cloudflare", "OVHcloud", "Other"
  isOnOVH: boolean;                                  // true if ≥1 IP is on OVH infrastructure
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

  /**
   * Per-provider detail for the Explorer page.
   * Primary identity is the BSC provider (Ankr, NodeReal…), not the infra (AWS, Cloudflare…).
   */
  providerDetails: BNBProviderDetail[];

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
