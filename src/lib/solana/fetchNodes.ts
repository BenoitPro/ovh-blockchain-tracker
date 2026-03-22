import { SolanaNode } from '@/types';
import { logger } from '@/lib/utils';
import { SOLANA_RPC_ENDPOINT } from '@/lib/config/constants';

/**
 * Fetch cluster nodes from Solana mainnet
 * 
 * @param limit - Number of nodes to fetch. If undefined, fetches ALL nodes.
 *                Default: 50 (for backward compatibility)
 * 
 * With MaxMind, we can now fetch ALL nodes without rate limit concerns!
 */
export async function fetchSolanaNodes(limit?: number): Promise<SolanaNode[]> {
    try {
        const response = await fetch(SOLANA_RPC_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getClusterNodes',
            }),
            // Bypassing Next.js cache because the payload size is > 2MB 
            // which crashes Turbopack and triggers an infinite reload loop in dev environment.
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Solana RPC error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Solana RPC error: ${data.error.message}`);
        }

        const nodes: SolanaNode[] = data.result || [];

        // If limit is undefined, return ALL nodes
        // Otherwise, return only the first N nodes
        if (limit === undefined) {
            logger.info(`[Solana RPC] Fetched ALL ${nodes.length} nodes from mainnet`);
            return nodes;
        } else {
            logger.info(`[Solana RPC] Fetched ${Math.min(limit, nodes.length)} nodes (limited from ${nodes.length} total)`);
            return nodes.slice(0, limit);
        }
    } catch (error) {
        logger.error('Error fetching Solana nodes:', error);
        throw error;
    }
}

/**
 * Extract IP address from gossip endpoint
 * Format: "IP:PORT" or null
 */
export function extractIP(gossip: string | null): string | null {
    if (!gossip) return null;

    try {
        // Gossip format is typically "IP:PORT"
        const parts = gossip.split(':');
        if (parts.length >= 2) {
            return parts[0];
        }
        return null;
    } catch {
        return null;
    }
}
