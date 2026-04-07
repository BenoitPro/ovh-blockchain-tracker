import { ProviderBreakdownEntry } from '@/types';

export interface DecentralizationScore {
    /** Provider concentration score 0-100 (based on inverted HHI) */
    providerConcentration: number;
    /** Nakamoto coefficient score 0-100 (normalized min providers for 33% control) */
    nakamotoScore: number;
    /** Geographic entropy score 0-100 (Shannon entropy normalized) */
    geoEntropy: number;
    /** Weighted composite score 0-100 */
    composite: number;
    /** Letter grade: A (≥80), B (≥60), C (≥40), D (<40) */
    grade: 'A' | 'B' | 'C' | 'D';
    /** Raw Nakamoto coefficient (number of providers) */
    nakamotoCoefficient: number;
    /** Number of countries in geo distribution */
    countryCount: number;
    /**
     * Stake-weighted metrics (Solana only, present when stakeDistribution provided).
     * More relevant for consensus safety than node-count-based metrics.
     */
    stakeWeighted?: {
        providerConcentration: number;
        nakamotoScore: number;
        nakamotoCoefficient: number;
        composite: number;
        grade: 'A' | 'B' | 'C' | 'D';
    };
}

export interface DecentralizationScoreOptions {
    /**
     * Raw per-provider node counts (e.g. { ovh: 100, aws: 800, others: 100 }).
     * When provided together with rawOthersBreakdown, the HHI is computed from
     * individual orgs instead of the merged "Others" bucket — more accurate.
     */
    rawDistribution?: Record<string, number>;
    /** Per-org breakdown of nodes that didn't match a known provider ASN. */
    rawOthersBreakdown?: Record<string, number>;
    /** Per-provider stake totals (e.g. { aws: 9000, ovh: 1000 }). Solana only. */
    stakeDistribution?: Record<string, number>;
    /** Total stake across all providers. Required when stakeDistribution is provided. */
    totalStake?: number;
}

/**
 * Compute HHI from an arbitrary count map.
 * Each key gets its own (count/total)^2 term.
 */
function computeHHI(counts: Record<string, number>, total: number): number {
    if (total === 0) return 1; // monopoly by convention
    let hhi = 0;
    for (const count of Object.values(counts)) {
        if (count > 0) {
            const fraction = count / total;
            hhi += fraction * fraction;
        }
    }
    return hhi;
}

/**
 * Compute Nakamoto coefficient from a sorted-desc share array.
 * Returns the minimum number of entries whose cumulative share exceeds 33%.
 */
function computeNakamoto(shares: number[]): number {
    const sorted = [...shares].sort((a, b) => b - a);
    let cumulative = 0;
    for (let i = 0; i < sorted.length; i++) {
        cumulative += sorted[i];
        if (cumulative > 33) return i + 1;
    }
    return sorted.length;
}

function nakamotoToScore(coefficient: number): number {
    // 1 → 0, 2 → 75, 3+ → 100
    return coefficient <= 1 ? 0 : Math.min(100, (coefficient - 1) * 75);
}

function toGrade(composite: number): 'A' | 'B' | 'C' | 'D' {
    return composite >= 80 ? 'A' : composite >= 60 ? 'B' : composite >= 40 ? 'C' : 'D';
}

/**
 * Build the full per-org count map for HHI when raw data is available.
 * Named providers (aws, ovh, …) keep their bucket counts.
 * The "others" bucket is replaced by its constituent orgs from othersBreakdown.
 * Any remainder not covered by othersBreakdown stays as '__unknown__'.
 */
function buildRawCountMap(
    rawDistribution: Record<string, number>,
    rawOthersBreakdown: Record<string, number>,
): Record<string, number> {
    const map: Record<string, number> = {};

    // Named providers (exclude 'others' — we'll expand it)
    for (const [key, count] of Object.entries(rawDistribution)) {
        if (key !== 'others' && count > 0) map[key] = count;
    }

    // Expand others
    const othersTotal = rawDistribution['others'] ?? 0;
    let accountedOthers = 0;
    for (const [org, count] of Object.entries(rawOthersBreakdown)) {
        if (count > 0) {
            map[org] = count;
            accountedOthers += count;
        }
    }
    const remainder = othersTotal - accountedOthers;
    if (remainder > 0) map['__unknown__'] = remainder;

    return map;
}

/**
 * Compute decentralization score from provider breakdown and geo distribution.
 *
 * @param providers  ProviderBreakdownEntry[] from buildProviderBreakdown
 * @param geoDistribution  Record<countryCode, nodeCount>
 * @param totalNodes  Total nodes in the network
 * @param options  Optional raw data for more accurate HHI and stake-weighted metrics
 */
export function computeDecentralizationScore(
    providers: ProviderBreakdownEntry[],
    geoDistribution: Record<string, number>,
    totalNodes: number,
    options?: DecentralizationScoreOptions,
): DecentralizationScore {

    // --- 1. HHI Provider Concentration (node-based) ---
    let hhi: number;
    if (options?.rawDistribution && options?.rawOthersBreakdown !== undefined) {
        const countMap = buildRawCountMap(options.rawDistribution, options.rawOthersBreakdown);
        hhi = computeHHI(countMap, totalNodes);
    } else {
        // Fallback: use aggregated provider breakdown
        const fallback: Record<string, number> = {};
        for (const p of providers) fallback[p.key] = p.nodeCount;
        hhi = computeHHI(fallback, totalNodes);
    }
    const providerConcentration = providers.length === 0 ? 0 : Math.max(0, (1 - hhi) * 100);

    // --- 2. Nakamoto Infra Coefficient (node-based) ---
    const nodeShares = providers.map(p => p.marketShare);
    const nakamotoCoefficient = computeNakamoto(nodeShares);
    const nakamotoScore = nakamotoToScore(nakamotoCoefficient);

    // --- 3. Shannon Geographic Entropy ---
    const countries = Object.values(geoDistribution).filter(c => c > 0);
    const countryCount = countries.length;
    let geoEntropy = 0;
    if (countryCount > 1 && totalNodes > 0) {
        let entropy = 0;
        for (const count of countries) {
            const p = count / totalNodes;
            if (p > 0) entropy -= p * Math.log2(p);
        }
        const maxEntropy = Math.log2(countryCount);
        geoEntropy = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
    }

    // --- 4. Node-based composite ---
    const composite = Math.round(
        providerConcentration * 0.40 +
        nakamotoScore * 0.35 +
        geoEntropy * 0.25,
    );

    // --- 5. Stake-weighted metrics (optional) ---
    let stakeWeighted: DecentralizationScore['stakeWeighted'];
    const { stakeDistribution, totalStake } = options ?? {};
    if (stakeDistribution && totalStake && totalStake > 0) {
        const stakeHHI = computeHHI(stakeDistribution, totalStake);
        const stakePC = Math.max(0, (1 - stakeHHI) * 100);

        const stakeShares = Object.entries(stakeDistribution).map(
            ([, s]) => (s / totalStake) * 100,
        );
        const stakeNakamotoCoef = computeNakamoto(stakeShares);
        const stakeNakamotoSc = nakamotoToScore(stakeNakamotoCoef);

        const stakeComposite = Math.round(
            stakePC * 0.40 +
            stakeNakamotoSc * 0.35 +
            geoEntropy * 0.25, // geo is the same regardless of weighting
        );

        stakeWeighted = {
            providerConcentration: Math.round(stakePC),
            nakamotoScore: Math.round(stakeNakamotoSc),
            nakamotoCoefficient: stakeNakamotoCoef,
            composite: stakeComposite,
            grade: toGrade(stakeComposite),
        };
    }

    return {
        providerConcentration: Math.round(providerConcentration),
        nakamotoScore: Math.round(nakamotoScore),
        geoEntropy: Math.round(geoEntropy),
        composite,
        grade: toGrade(composite),
        nakamotoCoefficient,
        countryCount,
        stakeWeighted,
    };
}

export function gradeLabel(grade: DecentralizationScore['grade']): string {
    return {
        A: 'Well decentralized',
        B: 'Moderate',
        C: 'Concentrated',
        D: 'Highly centralized',
    }[grade];
}

export function gradeColor(grade: DecentralizationScore['grade']): string {
    return { A: '#22c55e', B: '#f59e0b', C: '#f97316', D: '#ef4444' }[grade];
}
