import { SuiValidator } from '@/types/sui';
import { logger } from '@/lib/utils';
import { SUI_RPC_ENDPOINT } from '@/lib/config/constants';
import dns from 'node:dns/promises';

/**
 * Sui mainnet validator fetcher
 * ...
 */

/**
 * Module-level DNS cache — avoids re-resolving the same hostname within a worker run.
 * Stores Promises to deduplicate concurrent in-flight lookups for the same hostname.
 */
const dnsCache = new Map<string, Promise<string | null>>();

/**
 * Generic concurrency pool: runs fn on each item with at most `limit` concurrent executions.
 */
async function withConcurrency<T>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<void>
): Promise<void> {
    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length > 0) {
            const item = queue.shift()!;
            await fn(item);
        }
    });
    await Promise.all(workers);
}

/**
 * Extract clean IPv4 from Sui multiaddr format: "/ip4/X.X.X.X/tcp/XXXX"
 * or resolves hostname from "/dns/X.X.X/tcp/XXXX" (with in-module cache).
 */
async function getSuiIP(multiaddr: string): Promise<string | null> {
    if (!multiaddr) return null;

    // 1. Literal IP4 — no DNS needed
    const ip4Match = multiaddr.match(/\/ip4\/(\d+\.\d+\.\d+\.\d+)/);
    if (ip4Match) return ip4Match[1];

    // 2. DNS hostname
    const dnsMatch = multiaddr.match(/\/dns\/([^\/]+)/);
    if (dnsMatch) {
        const hostname = dnsMatch[1];

        if (dnsCache.has(hostname)) return dnsCache.get(hostname)!;

        const promise = dns.resolve4(hostname)
            .then((addresses) => addresses[0] || null)
            .catch((error) => {
                logger.warn(`[Sui] Failed to resolve DNS for ${hostname}:`, error);
                return null;
            });

        dnsCache.set(hostname, promise);
        return promise;
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

    // Pre-allocate validators with ip: null, then fill IPs via bounded concurrency pool
    const validators: SuiValidator[] = activeValidators.map((v: any) => ({
        suiAddress: v.suiAddress,
        name: v.name,
        netAddress: v.netAddress,
        p2pAddress: v.p2pAddress,
        votingPower: v.votingPower,
        commissionRate: v.commissionRate,
        stakingPoolSuiBalance: v.stakingPoolSuiBalance,
        ip: null as string | null,
    }));

    await withConcurrency(
        validators.map((validator, i) => ({ validator, raw: activeValidators[i] })),
        5,
        async ({ validator, raw }) => {
            validator.ip = await getSuiIP(raw.netAddress);
        }
    );

    return validators;
}
