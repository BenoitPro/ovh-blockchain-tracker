import { EnrichedNode } from '@/types';
import { fetchSolanaNodes, extractIP } from './fetchNodes';
import { batchGetASN, initMaxMind, batchGetCountry } from '@/lib/asn/maxmind';
import { identifyProvider } from './filterOVH';
import { logger } from '@/lib/utils';
import { SOLANA_RPC_ENDPOINT } from '@/lib/config/constants';

// Cache for validator names
let validatorMapCache: Map<string, { name: string; image: string; }> | null = null;

async function fetchValidatorList(forceRefresh: boolean = false) {
    if (validatorMapCache && !forceRefresh) return validatorMapCache;

    try {
        // Fetch from stakewiz.com public API
        const response = await fetch('https://api.stakewiz.com/validators', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            const map = new Map<string, { name: string; image: string; }>();

            data.forEach((v: any) => {
                // FALLBACK: If name is blank, we try to get it from image filename as a last resort
                // or just keep it as Unknown Validator if no logo either.
                let name = (v.name || v.username || '').trim();
                
                // CRITICAL: We also map both identity AND vote_identity
                const info = {
                    name: name || 'Unknown Validator',
                    image: v.image || ''
                };
                
                if (v.identity) map.set(v.identity, info);
                if (v.vote_identity) map.set(v.vote_identity, info);
            });

            // Re-apply a SHIELD for the JUPITER key which often fails in API
            if (!map.has('JupmVLmA8RoyTUbTMMuTtoPWHEiNQobxgTeGTrPNkzT')) {
                map.set('JupmVLmA8RoyTUbTMMuTtoPWHEiNQobxgTeGTrPNkzT', { name: 'Jupiter', image: '' });
            }

            validatorMapCache = map;
            return map;
        }
    } catch (e) {
        logger.warn('Failed to fetch validator list, using basic map');
    }

    return validatorMapCache || new Map();
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
            })
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
        return new Map();
    }
}

/**
 * Fetch all Solana nodes and enrich them with ASN/Org info using MaxMind + Stake info
 */
export async function fetchEnrichedNodes(forceRefresh: boolean = false): Promise<EnrichedNode[]> {
    try {
        // Ensure MaxMind is initialized
        await initMaxMind();

        // Run fetches in parallel
        const [nodes, voteMap, validatorNames] = await Promise.all([
            fetchSolanaNodes(),
            fetchVoteAccounts(),
            fetchValidatorList(forceRefresh)
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
            
            // Try to find name by node identity OR by vote identity
            let validatorInfo = validatorNames?.get(node.pubkey);
            if (!validatorInfo && voteInfo?.votePubkey) {
                validatorInfo = validatorNames?.get(voteInfo.votePubkey);
            }

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

        logger.info(`[Explorer] Enriched ${enrichedNodes.length} nodes (Identified ${Array.from(validatorNames?.values() || []).filter(v => v.name !== 'Unknown Validator').length} validators)`);
        return enrichedNodes;
    } catch (error) {
        logger.error('Error fetching enriched nodes:', error);
        throw error;
    }
}
