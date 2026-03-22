import { SolanaNode, EnrichedNode } from '@/types';
import { fetchSolanaNodes, extractIP } from './fetchNodes';
import { batchGetASN, initMaxMind, batchGetCountry } from '@/lib/asn/maxmind';
import { identifyProvider } from './filterOVH';
import { logger } from '@/lib/utils';
import { SOLANA_RPC_ENDPOINT } from '@/lib/config/constants';

// Cache for validator names
let validatorMapCache: Map<string, { name: string; image: string; }> | null = null;

async function fetchValidatorList() {
    if (validatorMapCache) return validatorMapCache;

    try {
        // Fetch from stakewiz.com public API
        const response = await fetch('https://api.stakewiz.com/validators', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store' // Avoid caching very large payloads with Turbopack
        });

        if (response.ok) {
            const data = await response.json();
            const map = new Map<string, { name: string; image: string; }>();

            data.forEach((v: any) => {
                if (v.identity) {
                    map.set(v.identity, {
                        name: v.name || 'Unknown Validator',
                        image: v.image || '' // Stakewiz returns logo in `image`
                    });
                }
            });

            // Add manual overrides for top validators if missing
            if (!map.has('JupmVLmA8RoyTUbTMMuTtoPWHEINQobxgTeGTrPNkzT')) {
                map.set('JupmVLmA8RoyTUbTMMuTtoPWHEINQobxgTeGTrPNkzT', { name: 'Jupiter', image: '' });
            }

            validatorMapCache = map;
            return map;
        }
    } catch (e) {
        logger.warn('Failed to fetch validator list, using basic map');
    }

    return new Map();
}

/**
 * Fetch active vote accounts to get stake and commission data
 */
async function fetchVoteAccounts(): Promise<Map<string, { stake: number; commission: number; votePubkey: string }>> {
    try {
        const response = await fetch(SOLANA_RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getVoteAccounts',
                params: [{
                    commitment: 'finalized',
                }]
            }),
            cache: 'no-store' // Avoid Turbopack large cache crashes
        });

        if (!response.ok) throw new Error(`Vote accounts RPC error: ${response.status}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const voteMap = new Map<string, { stake: number; commission: number; votePubkey: string }>();
        const { current, delinquent } = data.result;

        // Process both current and delinquent validators
        [...current, ...delinquent].forEach((account: any) => {
            // Map nodePubkey to vote account details
            voteMap.set(account.nodePubkey, {
                stake: account.activatedStake,
                commission: account.commission,
                votePubkey: account.votePubkey
            });
        });

        return voteMap;
    } catch (error) {
        logger.error('Error fetching vote accounts:', error);
        return new Map(); // Return empty map on error to allow partial data
    }
}

/**
 * Fetch all Solana nodes and enrich them with ASN/Org info using MaxMind + Stake info
 */
export async function fetchEnrichedNodes(): Promise<EnrichedNode[]> {
    try {
        // Ensure MaxMind is initialized
        await initMaxMind();

        // Run fetches in parallel
        const [nodes, voteMap, validatorNames] = await Promise.all([
            fetchSolanaNodes(),
            fetchVoteAccounts(),
            fetchValidatorList()
        ]);

        // Extract all IPs for batch processing
        const ips: string[] = [];
        for (const node of nodes) {
            const ip = extractIP(node.gossip);
            if (ip) ips.push(ip);
        }

        // Get ASN and Country info in batch
        const asnResults = batchGetASN(ips);
        const countryResults = batchGetCountry(ips);

        // Map back to enriched nodes
        const enrichedNodes: EnrichedNode[] = nodes.map(node => {
            const ip = extractIP(node.gossip);
            const asnInfo = ip ? asnResults.get(ip) : null;
            const countryInfo = ip ? countryResults.get(ip) : null;
            const voteInfo = voteMap.get(node.pubkey);
            const validatorInfo = validatorNames?.get(node.pubkey);

            return {
                ...node,
                ip: ip || undefined,
                asn: asnInfo?.asn,
                org: asnInfo?.org,
                activatedStake: voteInfo?.stake || 0,
                commission: voteInfo?.commission,
                votePubkey: voteInfo?.votePubkey,
                country: countryInfo?.countryCode,
                countryName: countryInfo?.country,
                name: validatorInfo?.name,
                image: validatorInfo?.image,
                provider: identifyProvider(asnInfo?.asn || '', asnInfo?.org || '')
            };
        });

        // Sort by Stake (descending) by default
        enrichedNodes.sort((a, b) => (b.activatedStake || 0) - (a.activatedStake || 0));

        logger.info(`[Explorer] Enriched ${enrichedNodes.length} nodes with ASN, Stake & Country info`);
        return enrichedNodes;
    } catch (error) {
        logger.error('Error fetching enriched nodes:', error);
        throw error;
    }
}
