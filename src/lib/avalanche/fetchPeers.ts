import { AvalancheNode } from '@/types';
import { logger } from '@/lib/utils';

/**
 * Avalanche Primary Network peer fetcher
 *
 * Data source  : Avalanche public API  →  method `info.peers`
 * Endpoint     : https://api.avax.network/ext/info
 *
 * ── Methodology note (shown in Data Methodology modal) ────────────────────────
 * `info.peers` returns the set of peers that are *currently connected* to the
 * single node being queried — not the full canonical validator set.  On a
 * well-connected bootstrap node this typically represents 400-700 of the ~1 700
 * active Primary Network validators.
 *
 * We made the deliberate choice to start with a **single trusted endpoint**
 * (AvaLabs' official API) for Phase 1 because:
 *   1. It is public, rate-limit free, and always available.
 *   2. It gives a representative sample sufficient for OVH market-share
 *      estimation (OVH nodes are distributed across the network graph).
 *   3. It avoids operational complexity before we validate the usefulness
 *      of the Avalanche dashboard to stakeholders.
 *
 * Phase 1b (multi-node crawl) will add 3-4 additional RPC endpoints and
 * deduplicate by `nodeID` to approach full network coverage.  This will be
 * reflected in the methodology section when implemented.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const AVAX_RPC_ENDPOINT = 'https://api.avax.network/ext/info';

/**
 * Raw peer object returned by `info.peers`
 */
interface RawPeer {
    ip: string;
    publicIP: string;
    nodeID: string;
    version: string;
    lastSent: string;
    lastReceived: string;
    benched: string[];
    observedUptime: string;
    observedSubnetUptimes: Record<string, string>;
    trackedSubnets: string[];
}

/**
 * Extract a clean IPv4 address from "IP:PORT" format.
 * Returns null if not parseable.
 */
export function extractAvalancheIP(raw: string): string | null {
    if (!raw) return null;
    // Handle IPv6-mapped IPv4: "::ffff:1.2.3.4:9651"
    const ipv4Mapped = raw.match(/::ffff:(\d+\.\d+\.\d+\.\d+)(?::\d+)?$/);
    if (ipv4Mapped) return ipv4Mapped[1];
    // Standard "IP:PORT"
    const parts = raw.split(':');
    if (parts.length >= 2) return parts[0];
    return null;
}

/**
 * Fetch peers from the Avalanche Primary Network via `info.peers`.
 *
 * @returns Array of AvalancheNode with normalised IP and uptime as a number.
 */
export async function fetchAvalanchePeers(): Promise<AvalancheNode[]> {
    logger.info('[Avalanche] Fetching peers from api.avax.network...');

    const response = await fetch(AVAX_RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'info.peers' }),
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
        throw new Error(`[Avalanche] RPC HTTP error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.error) {
        throw new Error(`[Avalanche] RPC error: ${json.error.message}`);
    }

    const rawPeers: RawPeer[] = json.result?.peers ?? [];
    const numPeers: number = json.result?.numPeers ?? rawPeers.length;

    logger.info(`[Avalanche] Received ${numPeers} peers from api.avax.network`);

    const nodes: AvalancheNode[] = [];

    for (const peer of rawPeers) {
        // Prefer publicIP (reachable from outside) over gossip ip
        const rawIP = peer.publicIP || peer.ip;
        const ip = extractAvalancheIP(rawIP);
        if (!ip) continue;

        nodes.push({
            nodeID: peer.nodeID,
            ip: rawIP,
            version: peer.version ?? '',
            observedUptime: parseFloat(peer.observedUptime ?? '0'),
            observedSubnetUptimes: Object.fromEntries(
                Object.entries(peer.observedSubnetUptimes ?? {}).map(([k, v]) => [k, parseFloat(v as string)])
            ),
            lastSent: peer.lastSent ? new Date(peer.lastSent).getTime() : undefined,
            lastReceived: peer.lastReceived ? new Date(peer.lastReceived).getTime() : undefined,
        });
    }

    logger.info(`[Avalanche] Parsed ${nodes.length} valid peers (with usable IPs)`);
    return nodes;
}
