import { describe, it, expect } from 'vitest';
import { calculateBNBMetrics } from './calculateMetrics';
import type { BNBChainOVHNode } from '@/types/bnbchain';
import type { ProviderCategorizationResult } from '@/lib/shared/filterOVH';

const baseNode: BNBChainOVHNode = {
  id: 'abc',
  ip: '135.148.1.1',
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

  it('sets totalNodes and totalValidators', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.totalNodes).toBe(100);
    expect(metrics.totalValidators).toBe(45);
  });

  it('counts ovhNodes correctly', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.ovhNodes).toBe(1);
  });

  it('counts ovhValidators (only nodes with isValidator=true)', () => {
    const validator: BNBChainOVHNode = { ...baseNode, isValidator: true };
    const metrics = calculateBNBMetrics([baseNode, validator], 100, 45, mockCategorization);
    expect(metrics.ovhValidators).toBe(1); // only 1 has isValidator=true
  });

  it('computes geoDistribution from OVH nodes', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.geoDistribution).toEqual({ FR: 1 });
  });

  it('passes globalGeoDistribution from categorization', () => {
    const metrics = calculateBNBMetrics([baseNode], 100, 45, mockCategorization);
    expect(metrics.globalGeoDistribution).toEqual({ FR: 2, US: 8 });
  });

  it('returns 0 marketShare when totalNodes is 0', () => {
    const metrics = calculateBNBMetrics([], 0, 45, mockCategorization);
    expect(metrics.marketShare).toBe(0);
  });
});
