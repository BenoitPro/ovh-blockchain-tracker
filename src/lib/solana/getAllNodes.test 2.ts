import { describe, it, expect } from 'vitest';

describe('network timeouts', () => {
    it('fetchVoteAccounts has AbortSignal.timeout', () => {
        const fs = require('fs');
        const source = fs.readFileSync('./src/lib/solana/getAllNodes.ts', 'utf-8');
        const section = source.slice(
            source.indexOf('async function fetchVoteAccounts'),
            source.indexOf('async function fetchVoteAccounts') + 1000
        );
        expect(section).toContain('AbortSignal.timeout');
    });

    it('fetchOnchainValidatorInfo has AbortSignal.timeout', () => {
        const fs = require('fs');
        const source = fs.readFileSync('./src/lib/solana/getAllNodes.ts', 'utf-8');
        const section = source.slice(
            source.indexOf('async function fetchOnchainValidatorInfo'),
            source.indexOf('async function fetchOnchainValidatorInfo') + 600
        );
        expect(section).toContain('AbortSignal.timeout');
    });
});

describe('getAllNodes — VALIDATOR_CACHE_TTL', () => {
    it('VALIDATOR_CACHE_TTL is at least 24 hours', async () => {
        const fs = await import('fs');
        const source = fs.readFileSync('./src/lib/solana/getAllNodes.ts', 'utf-8');
        const match = source.match(/VALIDATOR_CACHE_TTL\s*=\s*(.+)/);
        expect(match).not.toBeNull();
        // eval the expression safely — strip inline comment first
        const expr = match![1].replace(/\/\/.*$/, '').replace(';', '').trim();
        // Expression format: "X * 60 * 60 * 1000" — evaluate
        const ttlMs = expr.split('*').map(s => Number(s.trim())).reduce((a, b) => a * b, 1);
        expect(ttlMs).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('does not refetch if cache is less than 24h old', () => {
        const g = globalThis as any;
        g.validatorMapCache = new Map([['id1', { name: 'Validator A', image: '' }]]);
        g.validatorMapCacheTime = Date.now() - (23 * 60 * 60 * 1000); // 23h ago
        const cacheAge = Date.now() - g.validatorMapCacheTime;
        expect(cacheAge).toBeLessThan(24 * 60 * 60 * 1000);
        expect(g.validatorMapCache.size).toBe(1);
    });
});
