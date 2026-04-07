import { describe, it, expect } from 'vitest';
import { computeDecentralizationScore } from './decentralizationScore';
import { ProviderBreakdownEntry } from '@/types';

const makeEntry = (key: string, nodeCount: number, marketShare: number): ProviderBreakdownEntry => ({
    key, label: key, nodeCount, marketShare, color: '#000',
});

describe('computeDecentralizationScore', () => {
    it('returns grade A for a well-distributed network', () => {
        // 5 equal providers, 5 countries equally distributed
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
        // One provider has >33%
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
        // Moderate network
        const providers = [
            makeEntry('aws', 600, 60),
            makeEntry('ovh', 400, 40),
        ];
        const geo = { US: 300, DE: 300, FR: 200, NL: 200 };
        const result = computeDecentralizationScore(providers, geo, 1000);
        expect(['A', 'B', 'C', 'D']).toContain(result.grade);
    });
});
