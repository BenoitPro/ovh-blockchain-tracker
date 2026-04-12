import { describe, it, expect } from 'vitest';
import { calculateMonadMetrics } from './calculateMetrics';
import type { MonadValidator } from '@/types';

const mockValidators: MonadValidator[] = [
  { name: 'Alpha', country: 'US', city: 'Ashburn', stake: 200_000, successRate: 100, active: true },
  { name: 'Beta',  country: 'US', city: 'Dallas',  stake: 150_000, successRate: 100, active: true },
  { name: 'Gamma', country: 'DE', city: 'Frankfurt', stake: 100_000, successRate: 100, active: true },
  { name: 'Delta', country: 'DE', city: 'Frankfurt', stake: 80_000,  successRate: 0,   active: false },
  { name: 'Epsilon', country: 'FR', city: 'Paris',  stake: 110_000, successRate: 100, active: true },
];

describe('calculateMonadMetrics', () => {
  it('counts total and active validators correctly', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.totalValidators).toBe(5);
    expect(m.activeValidators).toBe(4);
  });

  it('builds geoDistribution correctly', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.geoDistribution['US']).toBe(2);
    expect(m.geoDistribution['DE']).toBe(2);
    expect(m.geoDistribution['FR']).toBe(1);
  });

  it('counts distinct countries', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.countryCount).toBe(3);
  });

  it('sums totalStakeMON', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.totalStakeMON).toBe(640_000);
  });

  it('averages successRate across all validators', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.avgSuccessRate).toBeCloseTo(80, 0);
  });

  it('sorts countryBreakdown by count desc', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.countryBreakdown[0].country).toBe('US');
    expect(m.countryBreakdown[0].count).toBe(2);
    expect(m.countryBreakdown[0].percentage).toBeCloseTo(40, 0);
  });

  it('returns max 10 cities in cityBreakdown', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.cityBreakdown.length).toBeLessThanOrEqual(10);
  });

  it('handles empty input without throwing', () => {
    const m = calculateMonadMetrics([]);
    expect(m.totalValidators).toBe(0);
    expect(m.avgSuccessRate).toBe(0);
    expect(m.geoDistribution).toEqual({});
  });

  it('OVH optional fields are 0 or absent', () => {
    const m = calculateMonadMetrics(mockValidators);
    expect(m.ovhNodes ?? 0).toBe(0);
    expect(m.marketShare ?? 0).toBe(0);
  });
});
