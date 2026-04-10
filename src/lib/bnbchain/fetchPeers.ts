import { logger } from '@/lib/utils';
import type { BNBChainNode } from '@/types/bnbchain';

// 5 public BSC endpoints that may expose admin_peers
const BSC_RPC_ENDPOINTS = [
  'https://bsc-dataseed1.bnbchain.org',
  'https://bsc-dataseed2.bnbchain.org',
  'https://bsc-dataseed3.bnbchain.org',
  'https://bsc-dataseed1.defibit.io',
  'https://bsc-dataseed1.ninicoin.io',
];

const PRIVATE_RANGES = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^127\./,
  /^0\./,
];

export function extractBNBPeerIP(networkAddr: string): string | null {
  if (!networkAddr) return null;
  // Strip IPv6-mapped IPv4 (::ffff:1.2.3.4)
  const cleaned = networkAddr.replace(/^::ffff:/i, '');
  // Pure IPv6 addresses are wrapped in brackets
  if (cleaned.startsWith('[')) return null;
  // Remove port — last colon-separated segment if it's numeric
  const parts = cleaned.split(':');
  const ip = parts.length > 1 ? parts.slice(0, -1).join(':') : parts[0];
  if (!ip) return null;
  // If what remains still looks like IPv6, skip
  if ((ip.match(/:/g) || []).length > 1) return null;
  if (PRIVATE_RANGES.some(r => r.test(ip))) return null;
  return ip;
}

interface AdminPeer {
  id?: string;
  name?: string;
  network?: { remoteAddress?: string };
  caps?: string[];
}

async function fetchPeersFromEndpoint(url: string): Promise<BNBChainNode[]> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'admin_peers', params: [], id: 1 }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const json = await res.json() as { result?: AdminPeer[] };
    if (!Array.isArray(json.result)) return [];
    return json.result
      .map((peer): BNBChainNode | null => {
        const addr = peer.network?.remoteAddress ?? '';
        const ip = extractBNBPeerIP(addr);
        if (!ip) return null;
        return {
          id: peer.id ?? ip,
          ip,
          version: peer.name,
          caps: peer.caps,
        };
      })
      .filter((n): n is BNBChainNode => n !== null);
  } catch {
    return [];
  }
}

// Fetch canonical validator count from the BSC staking system contract
// Contract: 0x0000000000000000000000000000000000001000
// Function: getValidators() → address[] (selector: 0xb7ab4db5)
export async function fetchValidatorCount(): Promise<number> {
  try {
    const res = await fetch('https://bsc-dataseed1.bnbchain.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: '0x0000000000000000000000000000000000001000', data: '0xb7ab4db5' }, 'latest'],
        id: 1,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = await res.json() as { result?: string };
    if (!json.result || json.result === '0x') return 45;
    // ABI-encoded address[]: offset at 0x00 (32 bytes), length at 0x20 (32 bytes)
    const hex = json.result.startsWith('0x') ? json.result.slice(2) : json.result;
    if (hex.length < 128) return 45;
    const length = parseInt(hex.slice(64, 128), 16);
    return isNaN(length) || length === 0 ? 45 : length;
  } catch {
    return 45; // known fallback count
  }
}

export async function fetchBNBPeers(): Promise<{ nodes: BNBChainNode[]; validatorCount: number }> {
  logger.info('[BNB] Fetching peers from BSC endpoints...');

  const [peersResults, validatorCount] = await Promise.all([
    Promise.all(BSC_RPC_ENDPOINTS.map(fetchPeersFromEndpoint)),
    fetchValidatorCount(),
  ]);

  // Deduplicate: prefer first occurrence (by enode ID, fallback to IP)
  const seen = new Set<string>();
  const nodes: BNBChainNode[] = [];
  for (const batch of peersResults) {
    for (const node of batch) {
      const key = node.id || node.ip;
      if (!seen.has(key)) {
        seen.add(key);
        nodes.push(node);
      }
    }
  }

  logger.info(`[BNB] Discovered ${nodes.length} unique peers; ${validatorCount} validators on-chain`);
  return { nodes, validatorCount };
}
