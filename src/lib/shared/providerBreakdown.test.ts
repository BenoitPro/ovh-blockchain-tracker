import { describe, it, expect } from 'vitest';
import { buildProviderBreakdown } from './providerBreakdown';

describe('buildProviderBreakdown', () => {
    it('places providers above 5% threshold in eligible list', () => {
        const distribution = { ovh: 100, aws: 800, hetzner: 50, others: 50 };
        const othersBreakdown = { Contabo: 30, Linode: 20 };
        const result = buildProviderBreakdown(distribution, othersBreakdown, 1000);

        const keys = result.map(e => e.key);
        expect(keys).toContain('ovh');
        expect(keys).toContain('aws');
    });

    it('merges providers below 5% threshold into Others', () => {
        const distribution = { ovh: 100, aws: 800, hetzner: 30, others: 70 };
        const othersBreakdown = {};
        const result = buildProviderBreakdown(distribution, othersBreakdown, 1000);

        const hetzner = result.find(e => e.key === 'hetzner');
        const others = result.find(e => e.key === 'others');
        expect(hetzner).toBeUndefined();
        expect(others).toBeDefined();
        expect(others!.nodeCount).toBeGreaterThanOrEqual(30);
    });

    it('sorts results by nodeCount descending', () => {
        const distribution = { ovh: 100, aws: 800, others: 100 };
        const result = buildProviderBreakdown(distribution, {}, 1000);
        expect(result[0].nodeCount).toBeGreaterThanOrEqual(result[1]?.nodeCount ?? 0);
    });

    it('returns empty array when totalNodes is 0', () => {
        const result = buildProviderBreakdown({}, {}, 0);
        expect(result).toEqual([]);
    });
});
