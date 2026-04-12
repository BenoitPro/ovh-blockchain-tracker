import { describe, it, expect } from 'vitest';
import { normalizeProviders } from './normalizeProviders';
import type { ProviderBreakdownEntry } from '@/types/dashboard';

function makeEntry(key: string, nodeCount: number): ProviderBreakdownEntry {
  return { key, label: key, nodeCount, marketShare: 0, color: '#000' };
}

describe('normalizeProviders', () => {
  it('returns at most topN + Others entries', () => {
    const breakdown = Array.from({ length: 8 }, (_, i) => makeEntry(`p${i}`, 100 - i * 10));
    const result = normalizeProviders(breakdown, 6);
    expect(result).toHaveLength(7); // 6 + Others
    expect(result[6].key).toBe('others');
    expect(result[6].label).toBe('Others');
  });

  it('aggregates remainder into Others nodeCount correctly', () => {
    // p0=100, p1=90, ..., p5=50, p6=40, p7=30 → Others = 40+30 = 70
    const breakdown = Array.from({ length: 8 }, (_, i) => makeEntry(`p${i}`, 100 - i * 10));
    const result = normalizeProviders(breakdown, 6);
    expect(result[6].nodeCount).toBe(70);
  });

  it('computes correct marketShare for Others', () => {
    const breakdown = Array.from({ length: 8 }, (_, i) => makeEntry(`p${i}`, 100 - i * 10));
    // total = 100+90+80+70+60+50+40+30 = 520, Others = 70
    const result = normalizeProviders(breakdown, 6);
    expect(result[6].marketShare).toBeCloseTo((70 / 520) * 100, 1);
  });

  it('does not add Others when breakdown has <= topN entries', () => {
    const breakdown = [makeEntry('ovh', 100), makeEntry('aws', 50)];
    const result = normalizeProviders(breakdown, 6);
    expect(result).toHaveLength(2);
    expect(result.find(p => p.key === 'others')).toBeUndefined();
  });

  it('sorts by nodeCount descending', () => {
    const breakdown = [makeEntry('aws', 50), makeEntry('ovh', 100), makeEntry('hetzner', 75)];
    const result = normalizeProviders(breakdown, 6);
    expect(result[0].key).toBe('ovh');
    expect(result[1].key).toBe('hetzner');
    expect(result[2].key).toBe('aws');
  });

  it('returns empty array for empty input', () => {
    expect(normalizeProviders([], 6)).toEqual([]);
  });
});
