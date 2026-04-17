import { describe, it, expect } from 'vitest';
import { calculateCelestiaMetrics } from './calculateMetrics';
import type { CelestiaNode, CelestiaOVHNode } from '@/types';
import type { CelestiaProviderCategorizationResult } from './filterOVH';

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeNode(ip: string): CelestiaNode {
    return { ip, port: 26656, isOutbound: false };
}

function makeOVHNode(ip: string, country = 'FR'): CelestiaOVHNode {
    return {
        ip,
        port: 26656,
        isOutbound: false,
        ipInfo: {
            ip,
            asn: 'AS16276',
            org: 'OVH SAS',
            country,
            country_name: 'France',
            city: 'Unknown',
            lat: 0,
            lon: 0,
        },
        provider: 'OVHcloud',
    };
}

function makeProviderCat(
    distribution: Record<string, number> = {},
): CelestiaProviderCategorizationResult {
    return {
        distribution: { ovhcloud: 0, aws: 0, others: 0, ...distribution },
        othersBreakdown: {},
        globalGeoDistribution: {},
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateCelestiaMetrics', () => {
    it('marketShare is 100% for 1 OVH node out of 1 total peer', () => {
        const allPeers = [makeNode('1.2.3.4')];
        const ovhNodes = [makeOVHNode('1.2.3.4')];
        const cat = makeProviderCat({ ovhcloud: 1 });

        const m = calculateCelestiaMetrics(allPeers, ovhNodes, cat);

        expect(m.marketShare).toBe(100);
    });

    it('marketShare is 10% for 1 OVH node out of 10 total peers', () => {
        const allPeers = Array.from({ length: 10 }, (_, i) => makeNode(`1.2.3.${i + 1}`));
        const ovhNodes = [makeOVHNode('1.2.3.1')];
        const cat = makeProviderCat({ ovhcloud: 1 });

        const m = calculateCelestiaMetrics(allPeers, ovhNodes, cat);

        expect(m.marketShare).toBeCloseTo(10, 5);
    });

    it('marketShare is 0 when there are 0 total peers (no divide-by-zero)', () => {
        const m = calculateCelestiaMetrics([], [], makeProviderCat());

        expect(m.marketShare).toBe(0);
    });

    it('totalPeers equals allPeers.length', () => {
        const allPeers = Array.from({ length: 42 }, (_, i) => makeNode(`10.0.0.${i + 1}`));

        const m = calculateCelestiaMetrics(allPeers, [], makeProviderCat());

        expect(m.totalPeers).toBe(42);
    });

    it('totalValidators is passed through unchanged', () => {
        const m = calculateCelestiaMetrics([], [], makeProviderCat(), 150);

        expect(m.totalValidators).toBe(150);
    });

    it('geoDistribution is built from OVH nodes only (not all peers)', () => {
        const allPeers = [makeNode('1.2.3.1'), makeNode('5.6.7.8')];
        const ovhNodes = [makeOVHNode('1.2.3.1', 'FR'), makeOVHNode('1.2.3.2', 'DE')];
        const cat = makeProviderCat({ ovhcloud: 2 });

        const m = calculateCelestiaMetrics(allPeers, ovhNodes, cat);

        expect(m.geoDistribution['FR']).toBe(1);
        expect(m.geoDistribution['DE']).toBe(1);
        // Non-OVH peer '5.6.7.8' must NOT appear
        expect(Object.keys(m.geoDistribution)).toHaveLength(2);
    });

    it('globalGeoDistribution comes from providerCategorization (not computed)', () => {
        const cat: CelestiaProviderCategorizationResult = {
            distribution: { ovhcloud: 1 },
            othersBreakdown: {},
            globalGeoDistribution: { US: 50, FR: 30 },
        };

        const m = calculateCelestiaMetrics([makeNode('1.2.3.1')], [], cat);

        expect(m.globalGeoDistribution).toEqual({ US: 50, FR: 30 });
    });

    it('topNodes contains the first 10 OVH nodes when more than 10 are provided', () => {
        const ovhNodes = Array.from({ length: 15 }, (_, i) => makeOVHNode(`10.0.0.${i + 1}`));
        const cat = makeProviderCat({ ovhcloud: 15 });

        const m = calculateCelestiaMetrics(ovhNodes, ovhNodes, cat);

        expect(m.topNodes).toHaveLength(10);
        expect(m.topNodes[0].ip).toBe('10.0.0.1');
        expect(m.topNodes[9].ip).toBe('10.0.0.10');
    });

    it('topNodes returns all OVH nodes when fewer than 10', () => {
        const ovhNodes = [makeOVHNode('1.2.3.4'), makeOVHNode('5.6.7.8')];
        const cat = makeProviderCat({ ovhcloud: 2 });

        const m = calculateCelestiaMetrics(ovhNodes, ovhNodes, cat);

        expect(m.topNodes).toHaveLength(2);
    });

    it('totalValidators defaults to 0 when not provided', () => {
        const m = calculateCelestiaMetrics([], [], makeProviderCat());

        expect(m.totalValidators).toBe(0);
    });

    it('provider below 5% threshold goes into Others subProviders, not top-level', () => {
        // 100 total peers: aws=90, tiny_provider=4 (4% < threshold) → tiny_provider folded into Others
        const allPeers = Array.from({ length: 100 }, (_, i) => makeNode(`10.0.0.${i + 1}`));
        const cat: CelestiaProviderCategorizationResult = {
            distribution: { ovhcloud: 0, aws: 90, others: 4 },
            othersBreakdown: { 'Tiny Provider': 4 },
            globalGeoDistribution: {},
        };

        const m = calculateCelestiaMetrics(allPeers, [], cat);

        const topLevelKeys = m.providerBreakdown?.map(e => e.key) ?? [];
        expect(topLevelKeys).not.toContain('tiny_provider');
        const othersEntry = m.providerBreakdown?.find(e => e.key === 'others');
        expect(othersEntry).toBeDefined();
        expect(othersEntry?.nodeCount).toBe(4);
    });

    it('providerBreakdown entries are sorted descending by nodeCount', () => {
        // 100 total peers: aws=60, ovhcloud=30, hetzner=10 (none qualify for "Others" promotion)
        const allPeers = Array.from({ length: 100 }, (_, i) => makeNode(`10.0.${Math.floor(i / 256)}.${i % 256}`));
        const cat: CelestiaProviderCategorizationResult = {
            distribution: { ovhcloud: 30, aws: 60, hetzner: 10, others: 0 },
            othersBreakdown: {},
            globalGeoDistribution: {},
        };

        const m = calculateCelestiaMetrics(allPeers, [], cat);

        // All three providers are > 5% of 100, so all should appear
        expect(m.providerBreakdown).toBeDefined();
        const breakdown = m.providerBreakdown!;
        // Sorted descending by nodeCount
        for (let i = 1; i < breakdown.length; i++) {
            expect(breakdown[i - 1].nodeCount).toBeGreaterThanOrEqual(breakdown[i].nodeCount);
        }
        expect(breakdown[0].nodeCount).toBe(60); // aws first
        expect(breakdown[1].nodeCount).toBe(30); // ovhcloud second
        expect(breakdown[2].nodeCount).toBe(10); // hetzner third
    });
});
