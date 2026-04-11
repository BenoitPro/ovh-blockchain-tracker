import { describe, it, expect } from 'vitest';
import { calculateBNBMetrics } from './calculateMetrics';
import type { BNBChainOVHNode } from '@/types/bnbchain';
import type { ProviderCategorizationResult } from '@/lib/shared/filterOVH';

const baseNode: BNBChainOVHNode = {
  id: 'Ankr:135.148.1.1',
  ip: '135.148.1.1',
  version: 'Ankr',
  ipInfo: {
    ip: '135.148.1.1',
    asn: 'AS16276',
    org: 'OVH SAS',
    country: 'FR',
    country_name: 'France',
    city: 'Unknown',
    latitude: 0,
    longitude: 0,
  },
  provider: 'OVHcloud',
  providerName: 'Ankr',
};

const mockCategorization: ProviderCategorizationResult = {
  distribution: { OVHcloud: 2, AWS: 8 },
  othersBreakdown: {},
  globalGeoDistribution: { FR: 2, US: 8 },
};

describe('calculateBNBMetrics', () => {
  it('calculates marketShare correctly', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.marketShare).toBeCloseTo(1); // 1/100 = 1%
  });

  it('sets totalTrackedEndpoints and totalValidators', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.totalTrackedEndpoints).toBe(100);
    expect(metrics.totalValidators).toBe(45);
  });

  it('counts ovhEndpoints correctly', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.ovhEndpoints).toBe(1);
  });

  it('counts ovhProviders by distinct providerName', () => {
    const node2: BNBChainOVHNode = { ...baseNode, id: 'Ankr:1.2.3.4', ip: '1.2.3.4', providerName: 'Ankr' };
    const node3: BNBChainOVHNode = { ...baseNode, id: 'NodeReal:5.6.7.8', ip: '5.6.7.8', providerName: 'NodeReal' };
    const metrics = calculateBNBMetrics([baseNode, node2, node3], 100, 45, mockCategorization);
    expect(metrics.ovhProviders).toBe(2); // Ankr + NodeReal
  });

  it('computes geoDistribution from OVH endpoints', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.geoDistribution).toEqual({ FR: 1 });
  });

  it('passes globalGeoDistribution from categorization', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.globalGeoDistribution).toEqual({ FR: 2, US: 8 });
  });

  it('returns 0 marketShare when totalEndpoints is 0', () => {
    const metrics = calculateBNBMetrics([], 0, 45, mockCategorization);
    expect(metrics.marketShare).toBe(0);
  });

  it('includes coverage metadata', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.coverage).toBeDefined();
    expect(metrics.coverage.methodology).toBe('professional-rpc-providers');
    expect(metrics.coverage.estimatedTrafficCoverage).toBeGreaterThan(0);
  });
});
