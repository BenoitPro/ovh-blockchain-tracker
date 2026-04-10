import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the shared module BEFORE importing the module under test
vi.mock('@/lib/shared/filterOVH', () => ({
  filterOVHNodesByASN: vi.fn(),
  categorizeByProvider: vi.fn(),
}));

import { filterOVHNodesByASN, categorizeByProvider, type OVHNodeEnrichment } from '@/lib/shared/filterOVH';
import { getOVHBNBNodes, categorizeBNBByProvider } from './filterOVH';
import type { BNBChainNode } from '@/types/bnbchain';

const testNodes: BNBChainNode[] = [{ id: 'abc', ip: '135.148.1.1' }];

const mockEnrichment: { node: BNBChainNode; enrichment: OVHNodeEnrichment }[] = [{
  node: testNodes[0],
  enrichment: {
    ip: '135.148.1.1',
    asn: 'AS16276',
    org: 'OVH SAS',
    country: 'FR',
    country_name: 'France',
  },
}];

beforeEach(() => {
  vi.mocked(filterOVHNodesByASN).mockResolvedValue(mockEnrichment);
  vi.mocked(categorizeByProvider).mockResolvedValue({
    distribution: { OVHcloud: 1 },
    othersBreakdown: {},
    globalGeoDistribution: { FR: 1 },
  });
});

describe('getOVHBNBNodes', () => {
  it('returns OVH-enriched nodes with correct ipInfo', async () => {
    const result = await getOVHBNBNodes(testNodes);
    expect(result).toHaveLength(1);
    expect(result[0].ipInfo.asn).toBe('AS16276');
    expect(result[0].ipInfo.country).toBe('FR');
    expect(result[0].provider).toBe('OVHcloud');
  });

  it('passes the correct extractIP function (returns node.ip)', async () => {
    await getOVHBNBNodes(testNodes);
    expect(filterOVHNodesByASN).toHaveBeenCalledWith(testNodes, expect.any(Function));
    // Verify the extractIP function returns node.ip
    const extractIP = vi.mocked(filterOVHNodesByASN).mock.calls[0][1];
    expect(extractIP(testNodes[0])).toBe('135.148.1.1');
  });
});

describe('categorizeBNBByProvider', () => {
  it('calls categorizeByProvider with correct extractIP', async () => {
    await categorizeBNBByProvider(testNodes);
    expect(categorizeByProvider).toHaveBeenCalledWith(testNodes, expect.any(Function));
  });
});
