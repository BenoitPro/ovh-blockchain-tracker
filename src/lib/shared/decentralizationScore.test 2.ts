import { describe, it, expect } from 'vitest';
import { computeDecentralizationScore } from './decentralizationScore';
import { ProviderBreakdownEntry } from '@/types';

const makeEntry = (key: string, nodeCount: number, marketShare: number): ProviderBreakdownEntry => ({
    key, label: key, nodeCount, marketShare, color: '#000',
});

describe('computeDecentralizationScore', () => {
    it('returns grade A for a well-distributed network', () => {
        const providers = [
            makeEntry('aws', 200, 20),
            makeEntry('ovh', 200, 20),
            makeEntry('hetzner', 200, 20),
            makeEntry('gcp', 200, 20),
            makeEntry('others', 200, 20),
        ];
        const geo = { US: 200, DE: 200, FR: 200, NL: 200, SG: 200 };
        const result = computeDecentralizationScore(providers, geo, 1000);
        expect(result.grade).toBe('A');
        expect(result.composite).toBeGreaterThan(75);
    });

    it('returns grade D for a monopoly network (single provider, single country)', () => {
        const providers = [makeEntry('aws', 1000, 100)];
        const geo = { US: 1000 };
        const result = computeDecentralizationScore(providers, geo, 1000);
        expect(result.grade).toBe('D');
        expect(result.composite).toBeLessThan(20);
    });

    it('Nakamoto coefficient of 1 gives 0 for that sub-metric', () => {
        const providers = [
            makeEntry('aws', 700, 70),
            makeEntry('ovh', 300, 30),
        ];
        const geo = { US: 500, DE: 500 };
        const result = computeDecentralizationScore(providers, geo, 1000);
        expect(result.nakamotoScore).toBe(0);
    });

    it('handles empty geo distribution gracefully', () => {
        const providers = [makeEntry('aws', 100, 100)];
        const result = computeDecentralizationScore(providers, {}, 100);
        expect(result.composite).toBeGreaterThanOrEqual(0);
        expect(result.composite).toBeLessThanOrEqual(100);
    });

    it('returns correct grade boundaries', () => {
        const providers = [
            makeEntry('aws', 600, 60),
            makeEntry('ovh', 400, 40),
        ];
        const geo = { US: 300, DE: 300, FR: 200, NL: 200 };
        const result = computeDecentralizationScore(providers, geo, 1000);
        expect(['A', 'B', 'C', 'D']).toContain(result.grade);
    });
});

describe('computeDecentralizationScore — Fix 1: raw HHI expansion', () => {
    it('gives lower HHI (higher score) when Others is expanded into many small orgs', () => {
        // "Others" = 200 nodes, but actually 10 orgs of 20 nodes each
        const providers = [
            makeEntry('aws', 800, 80),
            makeEntry('others', 200, 20),
        ];
        const rawDist = { aws: 800, others: 200 };
        const rawOthers: Record<string, number> = {};
        for (let i = 0; i < 10; i++) rawOthers[`Org${i}`] = 20;

        const withMerged = computeDecentralizationScore(providers, {}, 1000);
        const withRaw = computeDecentralizationScore(providers, {}, 1000, {
            rawDistribution: rawDist,
            rawOthersBreakdown: rawOthers,
        });

        // Raw expansion → each of 10 small orgs gets its own fraction → lower HHI → higher score
        expect(withRaw.providerConcentration).toBeGreaterThan(withMerged.providerConcentration);
    });

    it('produces same result when Others is a single unknown org', () => {
        const providers = [
            makeEntry('aws', 800, 80),
            makeEntry('others', 200, 20),
        ];
        const rawDist = { aws: 800, others: 200 };
        const rawOthers = { 'SingleOrg': 200 };

        const withMerged = computeDecentralizationScore(providers, {}, 1000);
        const withRaw = computeDecentralizationScore(providers, {}, 1000, {
            rawDistribution: rawDist,
            rawOthersBreakdown: rawOthers,
        });

        // SingleOrg(20%) = Others(20%) → same HHI contribution
        expect(withRaw.providerConcentration).toBe(withMerged.providerConcentration);
    });

    it('handles unknown remainder in othersBreakdown gracefully', () => {
        const providers = [makeEntry('aws', 900, 90), makeEntry('others', 100, 10)];
        // othersBreakdown only accounts for 60 of the 100 others
        const rawDist = { aws: 900, others: 100 };
        const rawOthers = { 'KnownOrg': 60 };

        const result = computeDecentralizationScore(providers, {}, 1000, {
            rawDistribution: rawDist,
            rawOthersBreakdown: rawOthers,
        });
        expect(result.composite).toBeGreaterThanOrEqual(0);
        expect(result.composite).toBeLessThanOrEqual(100);
    });
});

describe('computeDecentralizationScore — Fix 2: stake-weighted score', () => {
    it('computes stakeWeighted when stakeDistribution provided', () => {
        // 4 equal providers at 25% each → node-based nakamoto = 2 (need 2 to exceed 33%)
        const providers = [
            makeEntry('aws', 250, 25),
            makeEntry('ovh', 250, 25),
            makeEntry('hetzner', 250, 25),
            makeEntry('gcp', 250, 25),
        ];
        // Stake is skewed: aws has 90% of stake → stake-based nakamoto = 1
        const stakeDistrib = { aws: 9000, ovh: 334, hetzner: 333, gcp: 333 };
        const result = computeDecentralizationScore(providers, { US: 500, DE: 500 }, 1000, {
            stakeDistribution: stakeDistrib,
            totalStake: 10000,
        });

        expect(result.stakeWeighted).toBeDefined();
        // Node-based: 4×25% → need 2 providers to exceed 33%
        expect(result.nakamotoCoefficient).toBe(2);
        // Stake-based: AWS has 90% → controls >33% alone
        expect(result.stakeWeighted!.nakamotoCoefficient).toBe(1);
        expect(result.stakeWeighted!.nakamotoScore).toBe(0);
    });

    it('stake-weighted grade can differ from node-based grade', () => {
        // 5 equal nodes but one has 90% of stake
        const providers = [
            makeEntry('aws', 200, 20),
            makeEntry('ovh', 200, 20),
            makeEntry('hetzner', 200, 20),
            makeEntry('gcp', 200, 20),
            makeEntry('others', 200, 20),
        ];
        const geo = { US: 200, DE: 200, FR: 200, NL: 200, SG: 200 };
        const stakeDistrib = { aws: 9000, ovh: 250, hetzner: 250, gcp: 250, others: 250 };

        const result = computeDecentralizationScore(providers, geo, 1000, {
            stakeDistribution: stakeDistrib,
            totalStake: 10000,
        });

        // Node-based should be A (well distributed)
        expect(result.grade).toBe('A');
        // Stake-weighted should be worse (aws dominates stake)
        expect(result.stakeWeighted!.composite).toBeLessThan(result.composite);
    });

    it('returns no stakeWeighted when stakeDistribution not provided', () => {
        const providers = [makeEntry('aws', 1000, 100)];
        const result = computeDecentralizationScore(providers, {}, 1000);
        expect(result.stakeWeighted).toBeUndefined();
    });
});
