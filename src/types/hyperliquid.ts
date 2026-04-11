/**
 * Hyperliquid-specific types
 *
 * Data source: Hyperliquid public API — https://api.hyperliquid.xyz/info
 * Endpoint payload: { "type": "validatorSummaries" }
 *
 * ── Important limitation ─────────────────────────────────────────────────────
 * The Hyperliquid API does NOT expose IP addresses for validators.
 * Each validator entry contains only on-chain metadata (address, stake,
 * name, description, etc.). There is no peer-discovery endpoint comparable
 * to Avalanche's `info.peers` or Solana's gossip protocol.
 *
 * OVH detection strategy (best-effort):
 *   1. Name matching — if validator `name` contains "ovh" / "ovhcloud"
 *   2. Description matching — same for the free-text `description` field
 *
 * This means the OVH market share figure is a lower-bound: validators that
 * run on OVH infrastructure without advertising it cannot be detected.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Stats bucket returned by the API for each time window (day / week / month).
 * The API returns stats as an array of [period, data] tuples.
 */
export interface HyperliquidValidatorStats {
    uptimeFraction: string;
    predictedApr: string;
    nSamples: number;
}

/**
 * Raw validator object returned by the Hyperliquid API.
 * Field names match the JSON payload exactly.
 */
export interface HyperliquidValidatorRaw {
    /** On-chain validator address (hex) */
    validator: string;
    /** Signer address (hex) */
    signer: string;
    /** Human-readable validator name */
    name: string;
    /** Free-text description (may contain website URLs) */
    description: string;
    /** Number of recent blocks signed */
    nRecentBlocks: number;
    /**
     * Staked amount in the native unit (raw integer).
     * Divide by 1e8 to get HYPE tokens.
     */
    stake: number;
    /** Whether the validator is currently jailed */
    isJailed: boolean;
    /** Timestamp (ISO string) after which the validator can be unjailed, or null */
    unjailableAfter: string | null;
    /** Whether the validator is currently participating in consensus */
    isActive: boolean;
    /** Commission rate as a decimal string (e.g. "0.04" = 4%) */
    commission: string;
    /** Performance stats per time window */
    stats: [string, HyperliquidValidatorStats][];
}

/**
 * Normalised validator type used internally after fetching.
 * Identical to the raw type but with a few computed convenience fields.
 */
export interface HyperliquidValidator extends HyperliquidValidatorRaw {
    /** Commission rate as a number (0–1). Parsed from the raw string. */
    commissionRate: number;
    /**
     * Uptime fraction for the "day" window (0–1), or undefined if not available.
     */
    dailyUptime?: number;
}

/**
 * A validator that has been identified as running on (or affiliated with)
 * OVH infrastructure via name/description matching.
 *
 * Since no IP data is available, `detectionMethod` is always "name-match".
 */
export interface HyperliquidOVHValidator extends HyperliquidValidator {
    /** How the OVH affiliation was detected */
    detectionMethod: 'name-match' | 'description-match';
    /** Excerpt of the field that triggered the match */
    matchedText: string;
}

/**
 * Metrics computed for the Hyperliquid dashboard.
 */
export interface HyperliquidDashboardMetrics {
    /** Total number of validators returned by the API */
    totalValidators: number;
    /** Number of currently active (non-jailed, participating) validators */
    activeValidators: number;
    /** Number of validators identified as OVH via name/description matching */
    ovhValidators: number;
    /**
     * OVH market share (%) based on validator count.
     * Denominator is `activeValidators` for a fair comparison.
     */
    marketShare: number;
    /**
     * OVH stake share (%) based on total staked HYPE tokens.
     * 0 if no OVH validators were detected.
     */
    ovhStakeShare: number;
    /** Total staked amount across all active validators (raw unit) */
    totalStake: number;
    /** Total staked amount attributed to OVH validators (raw unit) */
    ovhStake: number;
    /** Provider breakdown for the ProviderComparison chart */
    providerBreakdown: import('./dashboard').ProviderBreakdownEntry[];
    /** Validators identified as OVH */
    ovhValidatorList: HyperliquidOVHValidator[];
    /** Full list of all validators returned by the API (active + jailed). */
    allValidators: HyperliquidValidator[];
    /**
     * NOTE: No IP-based geo distribution is available (API limitation).
     * This field is always an empty object.
     */
    geoDistribution: Record<string, number>;
}

/**
 * API response shape for GET /api/hyperliquid
 */
export interface HyperliquidAPIResponse {
    success: boolean;
    data?: HyperliquidDashboardMetrics;
    error?: string;
    cached?: boolean;
    stale?: boolean;
    timestamp?: number;
}
