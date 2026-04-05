import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterOVHNodes, categorizeNodesByProvider } from './filterOVH';
import { OVH_ASN_LIST } from '@/lib/config/constants';
import { SolanaNode } from '@/types';
import * as maxmind from '@/lib/asn/maxmind';

// Mock MaxMind module
vi.mock('@/lib/asn/maxmind', () => ({
    initMaxMind: vi.fn().mockResolvedValue(undefined),
    getASNFromMaxMind: vi.fn(),
    getCountryFromMaxMind: vi.fn().mockReturnValue(null),
    isOVHIP: vi.fn(),
    batchGetASN: vi.fn(),
}));

// Mock fetch for geolocation API
global.fetch = vi.fn();

const mockSolanaNode = (pubkey: string, ip: string): SolanaNode => ({
    pubkey,
    gossip: `${ip}:8000`,
    tpu: `${ip}:8001`,
    rpc: `${ip}:8899`,
    version: '1.14.0',
});

describe('filterOVHNodes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should filter and return only OVH nodes', async () => {
        const nodes = [
            mockSolanaNode('node1', '1.2.3.4'),
            mockSolanaNode('node2', '5.6.7.8'),
            mockSolanaNode('node3', '9.10.11.12'),
        ];

        // Mock: first and third IPs are OVH
        vi.mocked(maxmind.isOVHIP).mockImplementation((ip: string) => {
            return ip === '1.2.3.4' || ip === '9.10.11.12';
        });

        vi.mocked(maxmind.getASNFromMaxMind).mockImplementation((ip: string) => {
            if (ip === '1.2.3.4') return { asn: 'AS16276', org: 'OVH SAS' };
            if (ip === '9.10.11.12') return { asn: 'AS35540', org: 'OVH Managed' };
            return null;
        });

        // Mock geolocation API responses
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'success',
                countryCode: 'FR',
                country: 'France',
                city: 'Paris',
                lat: 48.8566,
                lon: 2.3522,
            }),
        });

        const result = await filterOVHNodes(nodes);

        expect(result).toHaveLength(2);
        expect(result[0].pubkey).toBe('node1');
        expect(result[0].ipInfo.asn).toBe('AS16276');
        expect(result[1].pubkey).toBe('node3');
        expect(result[1].ipInfo.asn).toBe('AS35540');
    });

    it('should return empty array when no OVH nodes found', async () => {
        const nodes = [
            mockSolanaNode('node1', '1.2.3.4'),
            mockSolanaNode('node2', '5.6.7.8'),
        ];

        vi.mocked(maxmind.isOVHIP).mockReturnValue(false);

        const result = await filterOVHNodes(nodes);

        expect(result).toHaveLength(0);
    });

    it('should handle nodes without gossip IP', async () => {
        const nodeWithoutIP: SolanaNode = {
            pubkey: 'node1',
            gossip: null,
            tpu: null,
            rpc: null,
            version: '1.14.0',
        };

        const result = await filterOVHNodes([nodeWithoutIP]);

        expect(result).toHaveLength(0);
    });

    it('should enrich OVH nodes with geolocation data', async () => {
        const nodes = [mockSolanaNode('node1', '99.88.77.66')]; // Different IP to avoid cache

        vi.mocked(maxmind.isOVHIP).mockReturnValue(true);
        vi.mocked(maxmind.getASNFromMaxMind).mockReturnValue({
            asn: 'AS16276',
            org: 'OVH SAS',
        });

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                countryCode: 'DE',
                country: 'Germany',
                city: 'Frankfurt',
                lat: 50.1109,
                lon: 8.6821,
            }),
        });

        const result = await filterOVHNodes(nodes);

        expect(result[0].ipInfo.country).toBe('DE');
        expect(result[0].ipInfo.country_name).toBe('Germany');
        expect(result[0].ipInfo.city).toBe('Frankfurt');
        expect(result[0].ipInfo.latitude).toBe(50.1109);
        expect(result[0].ipInfo.longitude).toBe(8.6821);
    });
});

describe('categorizeNodesByProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should categorize nodes by provider correctly', async () => {
        const nodes = [
            mockSolanaNode('node1', '1.2.3.4'),
            mockSolanaNode('node2', '5.6.7.8'),
            mockSolanaNode('node3', '9.10.11.12'),
        ];

        const mockASNResults = new Map([
            ['1.2.3.4', { asn: 'AS16276', org: 'OVH SAS' }],
            ['5.6.7.8', { asn: 'AS16509', org: 'AWS' }],
            ['9.10.11.12', { asn: 'AS15169', org: 'Google' }],
        ]);

        vi.mocked(maxmind.batchGetASN).mockReturnValue(mockASNResults);

        const result = await categorizeNodesByProvider(nodes);

        expect(result.distribution.ovh).toBe(1);
        expect(result.distribution.aws).toBe(1);
        expect(result.distribution.google).toBe(1);
        expect(result.distribution.others).toBe(0);
    });

    it('should count unknown providers as others', async () => {
        const nodes = [mockSolanaNode('node1', '1.2.3.4')];

        const mockASNResults = new Map([
            ['1.2.3.4', { asn: 'AS99999', org: 'Unknown Provider' }],
        ]);

        vi.mocked(maxmind.batchGetASN).mockReturnValue(mockASNResults);

        const result = await categorizeNodesByProvider(nodes);

        expect(result.distribution.others).toBe(1);
        expect(result.distribution.ovh).toBe(0);
    });

    it('should handle nodes without valid IPs', async () => {
        const nodeWithoutIP: SolanaNode = {
            pubkey: 'node1',
            gossip: null,
            tpu: null,
            rpc: null,
            version: '1.14.0',
        };

        vi.mocked(maxmind.batchGetASN).mockReturnValue(new Map());

        const result = await categorizeNodesByProvider([nodeWithoutIP]);

        expect(result.distribution.others).toBe(1);
    });
});
