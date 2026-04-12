/**
 * Monad-specific types
 *
 * Data source: gmonads.com (community validator dashboard)
 * OVH/ASN detection: NOT AVAILABLE — requires MonadBFT crawler (roadmap)
 */

export interface MonadValidator {
    /** Validator display name */
    name: string;
    /** ISO 3166-1 alpha-2 code (e.g. "US") when available from API, otherwise full country name */
    country: string;
    /** City name (e.g. "Ashburn") */
    city: string;
    /** Total stake in MON */
    stake: number;
    /** Success rate 0–100 */
    successRate: number;
    /** Whether the validator is in the active set */
    active: boolean;
    /** Logo URL from gmonads.com metadata (not all validators have one) */
    logo?: string;
    /** Website URL from gmonads.com metadata */
    website?: string;
}

export interface MonadDashboardMetrics {
    /** Total validators scraped */
    totalValidators: number;
    /** Validators with active status */
    activeValidators: number;
    /** Number of distinct countries */
    countryCount: number;
    /** Total MON staked across all validators */
    totalStakeMON: number;
    /** Average success rate (0–100) */
    avgSuccessRate: number;
    /**
     * Geo distribution for WorldMap component.
     * Key = ISO-2 country code (e.g. "US", "FR") — calculateMetrics.ts normalises
     * country names from gmonads.com to ISO-2 codes before populating this map.
     * WorldMap also accepts full country names via its internal displayNameToIso
     * fallback, but ISO-2 is the canonical format used by every other chain.
     */
    geoDistribution: Record<string, number>;
    /** Top countries with count + total stake */
    countryBreakdown: MonadCountryEntry[];
    /** Top cities with validator count */
    cityBreakdown: MonadCityEntry[];
    /** Full list of individual validators — used by the Node Explorer */
    validators: MonadValidator[];

    // ── OVH detection fields ─────────────────────────────────────────────────
    // All optional: OVH IP detection requires a MonadBFT p2p crawler that is not
    // yet implemented.  Fields are declared here so shared components (WorldMap,
    // DonutChart, KPICards) can consume MonadDashboardMetrics without TypeScript
    // errors.  Until the crawler ships every field will be 0 / undefined.

    /** OVH-hosted validator count — always 0 until MonadBFT crawler is implemented */
    ovhNodes?: number;
    /** OVH market share 0–100 — always 0 until IP detection is available */
    marketShare?: number;
    providerDistribution?: Record<string, number>;
    providerBreakdown?: import('./dashboard').ProviderBreakdownEntry[];
    othersBreakdown?: Record<string, number>;
    globalGeoDistribution?: Record<string, number>;
}

export interface MonadCountryEntry {
    country: string;
    count: number;
    totalStake: number;
    percentage: number;
}

export interface MonadCityEntry {
    city: string;
    country: string;
    count: number;
}

export interface MonadAPIResponse {
    success: boolean;
    data?: MonadDashboardMetrics;
    error?: string;
    cached?: boolean;
    stale?: boolean;
    timestamp?: number;
}
