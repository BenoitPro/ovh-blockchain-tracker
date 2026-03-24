import { describe, it, expect } from 'vitest';
import { calculateMetrics, formatPercentage } from './calculateMetrics';
import { SolanaNode, OVHNode } from '@/types';

// Mock data for testing
const mockSolanaNode = (pubkey: string): SolanaNode => ({
    pubkey,
    gossip: '127.0.0.1:8000',
    tpu: '127.0.0.1:8001',
    rpc: '127.0.0.1:8899',
    version: '1.14.0',
});

const mockOVHNode = (pubkey: string, country: string, city: string): OVHNode => ({
    ...mockSolanaNode(pubkey),
    ipInfo: {
        ip: '127.0.0.1',
        asn: 'AS16276',
        org: 'OVH SAS',
        country: country.slice(0, 2).toUpperCase(),
        country_name: country,
        city,
        latitude: 48.8566,
        longitude: 2.3522,
    },
});

describe('calculateMetrics', () => {
    it('should calculate correct metrics for standard input', () => {
        const allNodes = [
            mockSolanaNode('node1'),
            mockSolanaNode('node2'),
            mockSolanaNode('node3'),
            mockSolanaNode('node4'),
        ];
        const ovhNodes = [
            mockOVHNode('node1', 'France', 'Paris'),
            mockOVHNode('node2', 'Germany', 'Frankfurt'),
        ];
        const providerDistribution = {
            distribution: { ovh: 1, aws: 1, others: 1 },
            othersBreakdown: { 'Some Unknown Org': 1 }
        };

        const result = calculateMetrics(allNodes, ovhNodes, providerDistribution as any);

        expect(result.totalNodes).toBe(4);
        expect(result.ovhNodes).toBe(2);
        expect(result.marketShare).toBe(50); // 2/4 = 50%
        expect(result.geoDistribution).toEqual({ France: 1, Germany: 1 });
        expect(result.providerDistribution).toEqual(providerDistribution.distribution);
        expect(result.topValidators).toHaveLength(2);
    });

    it('should handle empty node arrays', () => {
        const result = calculateMetrics([], [], { distribution: {}, othersBreakdown: {} });

        expect(result.totalNodes).toBe(0);
        expect(result.ovhNodes).toBe(0);
        expect(result.marketShare).toBe(0);
        expect(result.geoDistribution).toEqual({});
        expect(result.topValidators).toHaveLength(0);
    });

    it('should calculate 0% market share when no OVH nodes', () => {
        const allNodes = [mockSolanaNode('node1'), mockSolanaNode('node2')];
        const result = calculateMetrics(allNodes, [], { distribution: {}, othersBreakdown: {} });

        expect(result.totalNodes).toBe(2);
        expect(result.ovhNodes).toBe(0);
        expect(result.marketShare).toBe(0);
    });

    it('should limit topValidators to 10 entries', () => {
        const allNodes = Array.from({ length: 20 }, (_, i) => mockSolanaNode(`node${i}`));
        const ovhNodes = Array.from({ length: 15 }, (_, i) =>
            mockOVHNode(`node${i}`, 'France', 'Paris')
        );

        const result = calculateMetrics(allNodes, ovhNodes, { distribution: {}, othersBreakdown: {} });

        expect(result.topValidators).toHaveLength(10);
    });

    it('should aggregate geoDistribution correctly for same country', () => {
        const allNodes = [mockSolanaNode('node1'), mockSolanaNode('node2')];
        const ovhNodes = [
            mockOVHNode('node1', 'France', 'Paris'),
            mockOVHNode('node2', 'France', 'Lyon'),
        ];

        const result = calculateMetrics(allNodes, ovhNodes, { distribution: {}, othersBreakdown: {} });

        expect(result.geoDistribution).toEqual({ France: 2 });
    });
});

describe('formatPercentage', () => {
    it('should format percentages with 2 decimal places', () => {
        expect(formatPercentage(50)).toBe('50.00%');
        expect(formatPercentage(33.333)).toBe('33.33%');
        expect(formatPercentage(0)).toBe('0.00%');
        expect(formatPercentage(100)).toBe('100.00%');
    });
});
