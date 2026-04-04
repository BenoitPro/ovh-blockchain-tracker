import { SuiValidator } from '@/types/sui';
import { logger } from '@/lib/utils';
import { SUI_RPC_ENDPOINT } from '@/lib/config/constants';
import dns from 'node:dns/promises';

/**
 * Sui mainnet validator fetcher
 * ...
 */

/**
 * Extract clean IPv4 from Sui multiaddr format: "/ip4/X.X.X.X/tcp/XXXX"
 * or resolves hostname from "/dns/X.X.X/tcp/XXXX"
 */
async function getSuiIP(multiaddr: string): Promise<string | null> {
    if (!multiaddr) return null;
    
    // 1. Literal IP4
    const ip4Match = multiaddr.match(/\/ip4\/(\d+\.\d+\.\d+\.\d+)/);
    if (ip4Match) return ip4Match[1];
    
    // 2. DNS
    const dnsMatch = multiaddr.match(/\/dns\/([^\/]+)/);
    if (dnsMatch) {
        const hostname = dnsMatch[1];
        try {
            const addresses = await dns.resolve4(hostname);
            return addresses[0] || null;
        } catch (error) {
            logger.warn(`[Sui] Failed to resolve DNS for ${hostname}:`, error);
            return null;
        }
    }
    
    return null;
}

export async function fetchSuiValidators(): Promise<SuiValidator[]> {
    logger.info('[Sui] Fetching latest system state from RPC...');

    const response = await fetch(SUI_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'suix_getLatestSuiSystemState',
            params: []
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
        throw new Error(`[Sui] RPC HTTP error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.error) {
        throw new Error(`[Sui] RPC error: ${json.error.message}`);
    }

    const activeValidators = json.result?.activeValidators ?? [];
    logger.info(`[Sui] Received ${activeValidators.length} active validators`);

    const validators: SuiValidator[] = await Promise.all(
        activeValidators.map(async (v: any) => ({
            suiAddress: v.suiAddress,
            name: v.name,
            netAddress: v.netAddress,
            p2pAddress: v.p2pAddress,
            votingPower: v.votingPower,
            commissionRate: v.commissionRate,
            stakingPoolSuiBalance: v.stakingPoolSuiBalance,
            ip: await getSuiIP(v.netAddress),
        }))
    );

    return validators;
}
