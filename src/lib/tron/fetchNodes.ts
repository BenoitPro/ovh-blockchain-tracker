import { TronNode } from '@/types/tron';
import { logger } from '@/lib/utils';
import { TRON_API_URL } from '@/lib/config/constants';

const TRON_P2P_PORT = 18888;

/**
 * Raw shape returned by POST https://api.trongrid.io/wallet/listnodes
 */
interface TronListNodesResponse {
  nodes?: Array<{
    address?: {
      host?: string;
      port?: number;
    };
  }>;
}

/**
 * Decode a TronGrid host field to a plain string.
 *
 * TronGrid encodes the host bytes as a hex string (proto `bytes` → JSON hex).
 * e.g. "3230352e3230392e3131332e323534" → "205.209.113.254"
 * Plain strings (already decoded) are returned as-is.
 */
function decodeHost(raw: string): string {
  if (!raw) return '';
  // Detect hex: even length, only 0-9a-f, and longer than a normal IP
  if (/^[0-9a-f]+$/i.test(raw) && raw.length % 2 === 0 && raw.length > 15) {
    try {
      const decoded = Buffer.from(raw, 'hex').toString('utf8');
      return decoded;
    } catch {
      return raw;
    }
  }
  return raw;
}

/**
 * Normalise a decoded host string to an IPv4 address, or null if unusable.
 *
 * Edge cases handled:
 *  - Hex-encoded bytes (TronGrid proto encoding) → decoded first
 *  - IPv6-mapped IPv4 "::ffff:1.2.3.4" → "1.2.3.4"
 *  - Pure IPv6 → null (MaxMind GeoLite2 ASN DB only covers IPv4)
 *  - Hostname strings → null (skip DNS resolution for simplicity)
 */
export function normaliseIP(raw: string): string | null {
  if (!raw) return null;

  const host = decodeHost(raw);

  // IPv6-mapped IPv4
  const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];

  // Pure IPv4
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return host;

  // Anything else (pure IPv6, hostnames) — skip
  return null;
}

/**
 * Fetch all TRON network nodes from TronGrid.
 * Returns nodes that have a valid IPv4 address only.
 */
export async function fetchTronNodes(): Promise<TronNode[]> {
  try {
    logger.info('[Tron] Fetching node list from TronGrid...');

    const response = await fetch(`${TRON_API_URL}/wallet/listnodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`[Tron] TronGrid HTTP error: ${response.status} ${response.statusText}`);
    }

    const json: TronListNodesResponse = await response.json();
    const rawNodes = json.nodes ?? [];

    logger.info(`[Tron] Received ${rawNodes.length} raw nodes from TronGrid`);

    const nodes: TronNode[] = [];
    for (const raw of rawNodes) {
      const host = raw.address?.host ?? '';
      const ip = normaliseIP(host);
      if (!ip) continue;

      nodes.push({ ip, port: raw.address?.port ?? TRON_P2P_PORT });
    }

    logger.info(`[Tron] ${nodes.length} nodes with valid IPv4 addresses`);
    return nodes;
  } catch (error) {
    throw new Error(
      `[Tron] Failed to fetch nodes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
