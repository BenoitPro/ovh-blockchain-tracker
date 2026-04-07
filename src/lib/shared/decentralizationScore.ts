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
}

/**
 * Compute decentralization score from provider breakdown and geo distribution.
 * @param providers - ProviderBreakdownEntry[] from buildProviderBreakdown (includes "Others")
 * @param geoDistribution - Record<countryCode, nodeCount>
 * @param totalNodes - Total number of nodes in the network
 */
export function computeDecentralizationScore(
    providers: ProviderBreakdownEntry[],
    geoDistribution: Record<string, number>,
    totalNodes: number
): DecentralizationScore {
    // --- 1. HHI Provider Concentration ---
    // HHI = Σ (share_i)² where share_i is a fraction 0-1
    // Score = (1 - HHI) * 100 → 0 = monopoly, 100 = perfectly distributed
    let hhi = 0;
    for (const provider of providers) {
        const fraction = provider.marketShare / 100;
        hhi += fraction * fraction;
    }
    const providerConcentration = providers.length === 0 ? 0 : Math.max(0, (1 - hhi) * 100);

    // --- 2. Nakamoto Infra Coefficient ---
    // How many providers to control >33%?
    // Sort descending by marketShare, accumulate until >33%
    const sorted = [...providers].sort((a, b) => b.marketShare - a.marketShare);
    let cumulative = 0;
    let nakamotoCoefficient = sorted.length; // worst case = all providers
    for (let i = 0; i < sorted.length; i++) {
        cumulative += sorted[i].marketShare;
        if (cumulative > 33) {
            nakamotoCoefficient = i + 1;
            break;
        }
    }
    // Normalize: 1 → 0, 2 → 75, 3+ → 100
    // Rationale: needing 2+ providers to control >33% is already fairly good;
    // needing 3+ is excellent. Linear scale 1→0, ≥2 steepens fast.
    const nakamotoScore = nakamotoCoefficient <= 1
        ? 0
        : Math.min(100, (nakamotoCoefficient - 1) * 75);

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

    // --- 4. Composite Score (weighted average) ---
    const composite = Math.round(
        providerConcentration * 0.40 +
        nakamotoScore * 0.35 +
        geoEntropy * 0.25
    );

    // --- 5. Grade ---
    const grade: DecentralizationScore['grade'] =
        composite >= 80 ? 'A' :
        composite >= 60 ? 'B' :
        composite >= 40 ? 'C' : 'D';

    return {
        providerConcentration: Math.round(providerConcentration),
        nakamotoScore: Math.round(nakamotoScore),
        geoEntropy: Math.round(geoEntropy),
        composite,
        grade,
        nakamotoCoefficient,
        countryCount,
    };
}

export function gradeLabel(grade: DecentralizationScore['grade']): string {
    return { A: 'Well decentralized', B: 'Moderate', C: 'Concentrated', D: 'Highly centralized' }[grade];
}

export function gradeColor(grade: DecentralizationScore['grade']): string {
    return { A: '#22c55e', B: '#f59e0b', C: '#f97316', D: '#ef4444' }[grade];
}
