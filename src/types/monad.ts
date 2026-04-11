/**
 * Monad-specific types
 *
 * Data source: gmonads.com (community validator dashboard)
 * OVH/ASN detection: NOT AVAILABLE — requires MonadBFT crawler (roadmap)
 */

export interface MonadValidator {
  /** Validator display name */
  name: string;
  /** Country name (e.g. "United States") */
  country: string;
  /** City name (e.g. "Ashburn") */
  city: string;
  /** Total stake in MON */
  stake: number;
  /** Success rate 0–100 */
  successRate: number;
  /** Whether the validator is in the active set */
  active: boolean;
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
   * Key = country name, value = validator count.
   */
  geoDistribution: Record<string, number>;
  /** Top countries with count + total stake */
  countryBreakdown: MonadCountryEntry[];
  /** Top cities with validator count */
  cityBreakdown: MonadCityEntry[];
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
