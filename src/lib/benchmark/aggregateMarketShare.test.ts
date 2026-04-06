import { describe, it, expect } from 'vitest';
import { aggregateProviderBreakdowns } from './aggregateMarketShare';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

const entry = (key: string, nodeCount: number, color = '#aaa'): ProviderBreakdownEntry => ({
    key, label: key, nodeCount, marketShare: 0, color,
});

describe('aggregateProviderBreakdowns', () => {
    it('sums nodeCount by provider key across chains', () => {
        const chains = [
            { providerBreakdown: [entry('ovh', 100), entry('aws', 200)], totalNodes: 300 },
            { providerBreakdown: [entry('ovh', 50), entry('hetzner', 150)], totalNodes: 200 },
        ];
        const result = aggregateProviderBreakdowns(chains);
        expect(result.find(e => e.key === 'ovh')?.nodeCount).toBe(150);
        expect(result.find(e => e.key === 'aws')?.nodeCount).toBe(200);
        expect(result.find(e => e.key === 'hetzner')?.nodeCount).toBe(150);
    });

    it('recomputes marketShare as % of global total nodes', () => {
        const chains = [
            { providerBreakdown: [entry('ovh', 100)], totalNodes: 100 },
            { providerBreakdown: [entry('aws', 300)], totalNodes: 300 },
        ];
        const result = aggregateProviderBreakdowns(chains);
        expect(result.find(e => e.key === 'ovh')?.marketShare).toBeCloseTo(25, 1);
        expect(result.find(e => e.key === 'aws')?.marketShare).toBeCloseTo(75, 1);
    });

    it('sorts results by nodeCount descending', () => {
        const chains = [
            { providerBreakdown: [entry('ovh', 50), entry('aws', 300)], totalNodes: 350 },
        ];
        const result = aggregateProviderBreakdowns(chains);
        expect(result[0].key).toBe('aws');
        expect(result[1].key).toBe('ovh');
    });

    it('returns empty array for empty input', () => {
        expect(aggregateProviderBreakdowns([])).toEqual([]);
    });

    it('preserves color from first occurrence of each provider', () => {
        const chains = [
            { providerBreakdown: [entry('ovh', 10, '#00F0FF')], totalNodes: 10 },
        ];
        const result = aggregateProviderBreakdowns(chains);
        expect(result[0].color).toBe('#00F0FF');
    });

    it('handles chains with empty providerBreakdown gracefully', () => {
        const chains = [
            { providerBreakdown: [], totalNodes: 0 },
            { providerBreakdown: [entry('ovh', 100)], totalNodes: 100 },
        ];
        const result = aggregateProviderBreakdowns(chains);
        expect(result).toHaveLength(1);
        expect(result[0].nodeCount).toBe(100);
    });
});
