/**
 * fetchPeers.ts tests
 *
 * Note: The DNS-based approach cannot be unit-tested without mocking `dns/promises`.
 * These tests cover the exported constants and synchronous logic.
 * Integration testing (actual DNS resolution) is done via `npm run worker:bnb`.
 */
import { describe, it, expect } from 'vitest';
import { BSC_RPC_PROVIDERS, BSC_COVERAGE_META } from './fetchPeers';

describe('BSC_RPC_PROVIDERS', () => {
  it('has at least 10 providers', () => {
    expect(BSC_RPC_PROVIDERS.length).toBeGreaterThanOrEqual(10);
  });

  it('each provider has required fields', () => {
    for (const p of BSC_RPC_PROVIDERS) {
      expect(p.name).toBeTruthy();
      expect(p.hostname).toBeTruthy();
      expect(p.rpcUrl).toBeTruthy();
      expect(['official', 'professional', 'community']).toContain(p.tier);
    }
  });

  it('all hostnames have no http prefix (raw domain only)', () => {
    for (const p of BSC_RPC_PROVIDERS) {
      expect(p.hostname).not.toMatch(/^https?:\/\//);
    }
  });

  it('has at least one official-tier provider', () => {
    expect(BSC_RPC_PROVIDERS.some(p => p.tier === 'official')).toBe(true);
  });
});

describe('BSC_COVERAGE_META', () => {
  it('methodology is professional-rpc-providers', () => {
    expect(BSC_COVERAGE_META.methodology).toBe('professional-rpc-providers');
  });

  it('estimatedTrafficCoverage is between 1 and 100', () => {
    expect(BSC_COVERAGE_META.estimatedTrafficCoverage).toBeGreaterThan(0);
    expect(BSC_COVERAGE_META.estimatedTrafficCoverage).toBeLessThanOrEqual(100);
  });

  it('trackedProviders matches BSC_RPC_PROVIDERS length', () => {
    expect(BSC_COVERAGE_META.trackedProviders).toBe(BSC_RPC_PROVIDERS.length);
  });

  it('caveat is non-empty and mentions validators', () => {
    expect(BSC_COVERAGE_META.caveat).toBeTruthy();
    expect(BSC_COVERAGE_META.caveat.toLowerCase()).toContain('validator');
  });
});
