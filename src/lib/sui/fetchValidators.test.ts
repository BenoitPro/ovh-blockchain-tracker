import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:dns/promises BEFORE importing the module under test
vi.mock('node:dns/promises', () => ({
    default: { resolve4: vi.fn() },
    resolve4: vi.fn(),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger to avoid noise in test output
vi.mock('@/lib/utils', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock constants
vi.mock('@/lib/config/constants', () => ({
    SUI_RPC_ENDPOINT: 'https://mock-sui-rpc.example.com',
}));

import dns from 'node:dns/promises';
import { fetchSuiValidators } from './fetchValidators';

function makeRpcResponse(validators: any[]) {
    return {
        ok: true,
        json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: { activeValidators: validators },
        }),
    };
}

function makeValidator(overrides: Partial<{
    suiAddress: string;
    name: string;
    netAddress: string;
    p2pAddress: string;
    votingPower: string;
    commissionRate: string;
    stakingPoolSuiBalance: string;
}> = {}) {
    return {
        suiAddress: '0xabc',
        name: 'Test Validator',
        netAddress: '/ip4/1.2.3.4/tcp/8080',
        p2pAddress: '/ip4/1.2.3.4/udp/8084',
        votingPower: '1000',
        commissionRate: '200',
        stakingPoolSuiBalance: '500000',
        ...overrides,
    };
}

describe('fetchSuiValidators', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the module-level DNS cache between tests by re-importing
        // We achieve this via vi.resetModules() — but since we need a stable import
        // we instead clear the mock call counts and rely on the cache being warm.
        // For cache isolation, test 3 explicitly checks call count with same hostname.
    });

    it('1. resolves literal IPv4 without any DNS call', async () => {
        mockFetch.mockResolvedValueOnce(
            makeRpcResponse([
                makeValidator({ netAddress: '/ip4/1.2.3.4/tcp/8080' }),
            ])
        );

        const validators = await fetchSuiValidators();

        expect(validators).toHaveLength(1);
        expect(validators[0].ip).toBe('1.2.3.4');
        expect(vi.mocked(dns.resolve4)).not.toHaveBeenCalled();
    });

    it('2. resolves DNS for 10 validators and returns correct IPs', async () => {
        vi.mocked(dns.resolve4).mockResolvedValue(['10.0.0.1'] as any);

        const rawValidators = Array.from({ length: 10 }, (_, i) =>
            makeValidator({ netAddress: `/dns/node${i}.example.com/tcp/8080`, suiAddress: `0x${i}` })
        );
        mockFetch.mockResolvedValueOnce(makeRpcResponse(rawValidators));

        const validators = await fetchSuiValidators();

        expect(validators).toHaveLength(10);
        for (const v of validators) {
            expect(v.ip).toBe('10.0.0.1');
        }
        // Each unique hostname resolved once
        expect(vi.mocked(dns.resolve4)).toHaveBeenCalledTimes(10);
    });

    it('3. DNS cache — same hostname resolved only once across two validators', async () => {
        vi.mocked(dns.resolve4).mockResolvedValue(['10.0.0.2'] as any);

        const rawValidators = [
            makeValidator({ netAddress: '/dns/shared.example.com/tcp/8080', suiAddress: '0x1' }),
            makeValidator({ netAddress: '/dns/shared.example.com/tcp/8080', suiAddress: '0x2' }),
        ];
        mockFetch.mockResolvedValueOnce(makeRpcResponse(rawValidators));

        const validators = await fetchSuiValidators();

        expect(validators).toHaveLength(2);
        expect(validators[0].ip).toBe('10.0.0.2');
        expect(validators[1].ip).toBe('10.0.0.2');
        // Despite two validators sharing the same hostname, DNS resolved only once
        expect(vi.mocked(dns.resolve4)).toHaveBeenCalledTimes(1);
    });

    it('4. DNS failure results in null ip', async () => {
        vi.mocked(dns.resolve4).mockRejectedValue(new Error('ENOTFOUND'));

        const rawValidators = [
            makeValidator({ netAddress: '/dns/bad-hostname.example.com/tcp/8080' }),
        ];
        mockFetch.mockResolvedValueOnce(makeRpcResponse(rawValidators));

        const validators = await fetchSuiValidators();

        expect(validators).toHaveLength(1);
        expect(validators[0].ip).toBeNull();
    });
});
