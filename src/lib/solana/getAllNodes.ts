import { EnrichedNode } from '@/types';
import { fetchSolanaNodes, extractIP } from './fetchNodes';
import { batchGetASN, initMaxMind, batchGetCountry } from '@/lib/asn/maxmind';
import { identifyProvider } from '@/lib/shared/providers';
import { logger } from '@/lib/utils';
import { SOLANA_RPC_ENDPOINT } from '@/lib/config/constants';

// Singleton persisted across HMR reloads — same pattern as maxmind.ts and database.ts
const globalForSolana = globalThis as unknown as {
    validatorMapCache: Map<string, { name: string; image: string }> | undefined;
    validatorMapCacheTime: number | undefined;
};

const VALIDATOR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours — validator names rarely change

/**
 * Fetch validator names from Marinade Finance's public registry.
 * Best coverage: 788 validators, 635 named, including major ones (Alchemy, Jupiter, Galaxy…).
 * Free, no auth required, single page at limit=1000.
 */
async function fetchMarinadeValidatorInfo(): Promise<Map<string, { name: string; image: string }>> {
    const map = new Map<string, { name: string; image: string }>();
    try {
        const response = await fetch('https://validators-api.marinade.finance/validators?limit=1000', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Marinade API error: ${response.status}`);
        const data = await response.json();
        const validators: any[] = data.validators || [];
        for (const v of validators) {
            const identity = v.identity;
            if (!identity) continue;
            const name = (v.info_name || '').trim();
            const image = (v.info_icon_url || '').trim();
            if (name || image) {
                const info = { name, image };
                map.set(identity, info);
                // Also index by vote_account so vote-pubkey fallback lookup works
                if (v.vote_account) map.set(v.vote_account, info);
            }
        }
        logger.info(`[Solana] Marinade validator registry: ${validators.filter((v: any) => v.identity && ((v.info_name || '').trim() || (v.info_icon_url || '').trim())).length} validators (${map.size} index keys) fetched`);
    } catch (e) {
        logger.warn('[Solana] Failed to fetch Marinade validator info:', e);
    }
    return map;
}

async function fetchValidatorList(forceRefresh: boolean = false) {
    const cacheAge = Date.now() - (globalForSolana.validatorMapCacheTime || 0);
    if (globalForSolana.validatorMapCache && !forceRefresh && cacheAge < VALIDATOR_CACHE_TTL) {
        return globalForSolana.validatorMapCache;
    }

    const map = new Map<string, { name: string; image: string }>();

    // Primary source: Marinade (best coverage: 53/100 top validators, includes Alchemy, Jupiter, Galaxy…)
    const marinadeMap = await fetchMarinadeValidatorInfo();
    marinadeMap.forEach((info, identity) => map.set(identity, info));

    // Secondary: StakeWiz (on-chain Config program removed — getProgramAccounts response is 50-200 MB)
    try {
        const response = await fetch('https://api.stakewiz.com/validators', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });
        if (response.ok) {
            const data = await response.json();
            data.forEach((v: any) => {
                const name = (v.name || v.username || '').trim();
                const image = (v.image || '').trim();
                if (v.identity && !map.has(v.identity) && (name || image)) {
                    map.set(v.identity, { name, image });
                }
            });
        }
    } catch (e) {
        logger.warn('[Solana] StakeWiz fallback failed:', e);
    }

    const namedCount = Array.from(map.values()).filter(v => v.name).length;
    logger.info(`[Solana] Validator map: ${map.size} entries, ${namedCount} with names`);

    globalForSolana.validatorMapCache = map;
    globalForSolana.validatorMapCacheTime = Date.now();
    return map;
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

        logger.info(`[Explorer] Enriched ${enrichedNodes.length} nodes (Identified ${Array.from(validatorNames?.values() || []).filter(v => v.name).length} validators)`);
        return enrichedNodes;
    } catch (error) {
        logger.error('Error fetching enriched nodes:', error);
        throw error;
    }
}
