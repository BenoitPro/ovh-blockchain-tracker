import { EnrichedNode } from '@/types';
import { fetchSolanaNodes, extractIP } from './fetchNodes';
import { batchGetASN, initMaxMind, batchGetCountry } from '@/lib/asn/maxmind';
import { identifyProvider } from '@/lib/shared/providers';
import { logger } from '@/lib/utils';
import { SOLANA_RPC_ENDPOINT } from '@/lib/config/constants';

// Singleton persisted across HMR reloads — same pattern as maxmind.ts and database.ts
const globalForSolana = globalThis as unknown as {
    validatorMapCache: Map<string, { name: string; image: string }> | undefined;
};

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const VALIDATOR_INFO_CONFIG_KEY = 'Va1idator1nfo111111111111111111111111111111';
const CONFIG_PROGRAM_ID = 'Config1111111111111111111111111111111111111';

function base58Encode(bytes: Buffer): string {
    let leadingZeros = 0;
    for (const byte of bytes) {
        if (byte === 0) leadingZeros++;
        else break;
    }
    const digits = [0];
    for (let i = 0; i < bytes.length; i++) {
        let carry = bytes[i];
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry = Math.floor(carry / 58);
        }
        while (carry > 0) {
            digits.push(carry % 58);
            carry = Math.floor(carry / 58);
        }
    }
    return '1'.repeat(leadingZeros) + digits.reverse().map(d => BASE58_ALPHABET[d]).join('');
}

/**
 * Fetch validator identities and names from Solana's on-chain Config program.
 * This is the official Solana validator info registry — no API key, no rate limits.
 * Binary format per account: [1 byte key_count=2] [32 bytes Va1idator1nfo key] [1 byte signer=0]
 *   [32 bytes identity pubkey] [1 byte signer=1] [8 bytes JSON length u64] [JSON string]
 */
async function fetchOnchainValidatorInfo(): Promise<Map<string, { name: string; image: string }>> {
    const map = new Map<string, { name: string; image: string }>();
    try {
        const response = await fetch(SOLANA_RPC_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getProgramAccounts',
                params: [CONFIG_PROGRAM_ID, { encoding: 'base64' }]
            }),
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Config RPC error: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const accounts: Array<{ pubkey: string; account: { data: [string, string] } }> = data.result || [];

        for (const item of accounts) {
            try {
                const raw = Buffer.from(item.account.data[0], 'base64');
                // Must have exactly 2 keys and be long enough for the full header
                if (raw.length < 75 || raw[0] !== 2) continue;
                // Key 1 must be the ValidatorInfo config key
                if (base58Encode(raw.slice(1, 33)) !== VALIDATOR_INFO_CONFIG_KEY) continue;
                // Key 2 (bytes 34-65) is the validator identity pubkey
                const identity = base58Encode(raw.slice(34, 66));
                // JSON starts at offset 75 (67-byte header + 8-byte u64 length prefix)
                const text = raw.slice(75).toString('utf-8');
                const jsonStart = text.indexOf('{');
                const jsonEnd = text.lastIndexOf('}');
                if (jsonStart < 0 || jsonEnd < jsonStart) continue;
                const info = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
                const name = (info.name || '').trim();
                const image = (info.iconUrl || '').trim();
                if (name || image) {
                    map.set(identity, { name, image });
                }
            } catch {
                // skip malformed accounts
            }
        }
        logger.info(`[Solana] On-chain validator info: ${map.size} entries fetched`);
    } catch (e) {
        logger.warn('[Solana] Failed to fetch on-chain validator info:', e);
    }
    return map;
}

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
    if (globalForSolana.validatorMapCache && !forceRefresh) return globalForSolana.validatorMapCache;

    const map = new Map<string, { name: string; image: string }>();

    // Run primary sources in parallel
    const [marinadeMap, onchainMap] = await Promise.all([
        fetchMarinadeValidatorInfo(),
        fetchOnchainValidatorInfo(),
    ]);

    // Priority 1: Marinade (best coverage: 53/100 top validators, includes Alchemy, Jupiter, Galaxy…)
    marinadeMap.forEach((info, identity) => map.set(identity, info));

    // Priority 2: On-chain Config program (adds validators not in Marinade)
    onchainMap.forEach((info, identity) => {
        if (!map.has(identity) && (info.name || info.image)) {
            map.set(identity, info);
        }
    });

    // Priority 3: StakeWiz as last resort (currently degraded for top validators)
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
