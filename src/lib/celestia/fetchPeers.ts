import { CelestiaNode } from '@/types';
import { logger } from '@/lib/utils';

/**
 * Celestia peer fetcher
 *
 * Data source  : Multiple Celestia public RPC nodes  →  CometBFT `/net_info`
 * Endpoints    : See RPC_ENDPOINTS below
 *
 * ── Methodology note (shown in Data Methodology modal) ────────────────────────
 * `/net_info` returns the set of peers *currently connected* to the queried
 * node — not the full canonical validator set.  A single well-connected node
 * typically sees a subset of the active network peers.
 *
 * To maximise coverage we query multiple independent public RPC nodes in
 * parallel and deduplicate results by IP address.  With 5 diverse endpoints
 * this approach captures a broad view of the active peer set while remaining
 * dependency-free (no indexer / third-party API required).
 *
 * Each endpoint is given a 15-second timeout; failures are silently skipped so
 * that a single unresponsive host never blocks the pipeline.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * Public Celestia RPC endpoints that expose CometBFT `/net_info`.
 * Chosen for geographic & operator diversity.
 */
const RPC_ENDPOINTS: string[] = [
    'https://celestia-rpc.publicnode.com',
    'https://rpc.celestia.nodestake.org',
    'https://celestia-rpc.polkachu.com',
    'https://celestia.rpc.stakin-nodes.com',
    'https://rpc-1.celestia.nodes.guru',
];

/**
 * REST endpoint to fetch the bonded validator count.
 * Using pagination.limit=1 to get only the total count efficiently.
 */
const VALIDATOR_REST_ENDPOINT =
    'https://celestia-rest.publicnode.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1&pagination.count_total=true';

/**
 * Raw peer object returned by CometBFT `/net_info`
 */
interface RawNetInfoPeer {
    is_outbound: boolean;
    remote_ip: string;
    node_info?: {
        listen_addr?: string;
        version?: string;
    };
}

/**
 * Extract a clean IPv4 address from a CelestiaNode.
 * For Celestia, `remote_ip` is already a clean IPv4 — just return it.
 * Returns null if empty or falsy.
 */
export function extractCelestiaIP(node: CelestiaNode): string | null {
    return node.ip || null;
}

/**
 * Parse port from a CometBFT listen_addr string like "tcp://0.0.0.0:26656".
 * Returns 26656 as default if not parseable.
 */
function parsePort(listenAddr: string | undefined): number {
    if (!listenAddr) return 26656;
    const match = listenAddr.match(/:(\d+)$/);
    if (match) return parseInt(match[1], 10);
    return 26656;
}

/**
 * Fetch peers from a single Celestia RPC endpoint via CometBFT `/net_info`.
 * Returns an empty array on any error so callers can safely merge results.
 */
async function fetchPeersFromEndpoint(endpoint: string): Promise<CelestiaNode[]> {
    try {
        const url = `${endpoint}/net_info`;
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            logger.warn(`[Celestia] ${endpoint} → HTTP ${response.status}`);
            return [];
        }

        const json = await response.json();
        const rawPeers: RawNetInfoPeer[] = json.result?.peers ?? [];

        logger.info(`[Celestia] ${endpoint} → ${rawPeers.length} peers`);

        const nodes: CelestiaNode[] = [];

        for (const peer of rawPeers) {
            const ip = peer.remote_ip;
            if (!ip) continue;

            nodes.push({
                ip,
                port: parsePort(peer.node_info?.listen_addr),
                isOutbound: peer.is_outbound,
                version: peer.node_info?.version,
            });
        }

        return nodes;
    } catch (err) {
        logger.warn(`[Celestia] ${endpoint} → failed: ${err instanceof Error ? err.message : err}`);
        return [];
    }
}

/**
 * Fetch peers from all configured RPC endpoints in parallel and deduplicate
 * by IP address.  The first occurrence of a given IP wins.
 *
 * @returns Deduplicated array of CelestiaNode across all queried endpoints.
 */
export async function fetchCelestiaPeers(): Promise<CelestiaNode[]> {
    logger.info(`[Celestia] Querying ${RPC_ENDPOINTS.length} RPC endpoints in parallel...`);

    const results = await Promise.all(RPC_ENDPOINTS.map(fetchPeersFromEndpoint));

    // Deduplicate by IP — first-seen wins
    const seen = new Map<string, CelestiaNode>();
    for (const batch of results) {
        for (const node of batch) {
            if (!seen.has(node.ip)) {
                seen.set(node.ip, node);
            }
        }
    }

    const nodes = Array.from(seen.values());

    const perEndpoint = results
        .map((r, i) => `${new URL(RPC_ENDPOINTS[i]).hostname}:${r.length}`)
        .join(', ');
    logger.info(`[Celestia] Per-endpoint counts — ${perEndpoint}`);
    logger.info(`[Celestia] Total unique peers after deduplication: ${nodes.length}`);

    return nodes;
}

/**
 * Fetch the bonded validator count from the Celestia REST API.
 *
 * This is the authoritative source for the total number of active validators — it reflects
 * the staking set as recorded on-chain, independent of peer connectivity.  It does NOT
 * include IP addresses; use `fetchCelestiaPeers` for IP-resolvable nodes.
 *
 * Returns 0 on error so the caller can degrade gracefully.
 */
export async function fetchCelestiaValidatorCount(): Promise<number> {
    try {
        const response = await fetch(VALIDATOR_REST_ENDPOINT, {
            method: 'GET',
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            logger.warn(`[Celestia/REST] HTTP ${response.status}`);
            return 0;
        }

        const json = await response.json();
        const total = parseInt(json.pagination?.total ?? '0', 10);

        logger.info(`[Celestia/REST] Canonical validator count: ${total}`);
        return isNaN(total) ? 0 : total;
    } catch (err) {
        logger.warn(
            `[Celestia/REST] Failed to fetch validator count: ${err instanceof Error ? err.message : err}`,
        );
        return 0;
    }
}
