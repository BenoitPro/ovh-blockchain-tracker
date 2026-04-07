import { logger } from '@/lib/utils';
import { getKnownValidatorName } from './knownValidators';

export interface AvalancheValidatorMeta {
    name?: string;
    stakeAmount?: string;  // nAVAX as string (from P-Chain `weight` field)
    delegationFee?: number;
    rewardAddress?: string;
}

const PCHAIN_ENDPOINT = 'https://api.avax.network/ext/bc/P';
// Glacier correct path discovered via swagger: /v1/networks/{network}/validators
const GLACIER_ENDPOINT = 'https://glacier-api.avax.network/v1/networks/mainnet/validators';

/**
 * Source 1: P-Chain platform.getCurrentValidators
 *
 * Field mapping (verified against live API 2026-04-06):
 * - P-Chain uses `weight` for stake amount (NOT `stakeAmount`)
 * - P-Chain uses `validationRewardOwner.addresses` (NOT `rewardOwner`)
 * - `delegationFee` is already in percent: "2.0000" = 2%
 *
 * No human names available — reward address is the entity identifier.
 */
async function fetchPChainValidators(): Promise<Map<string, AvalancheValidatorMeta>> {
    const map = new Map<string, AvalancheValidatorMeta>();
    try {
        const response = await fetch(PCHAIN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1,
                method: 'platform.getCurrentValidators',
                params: {},
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) throw new Error(`P-Chain HTTP ${response.status}`);
        const json = await response.json();
        if (json.error) throw new Error(json.error.message);

        const validators: any[] = json.result?.validators ?? [];
        for (const v of validators) {
            if (!v.nodeID) continue;
            // P-Chain uses `weight` for stake, not `stakeAmount`
            const addresses: string[] = v.validationRewardOwner?.addresses ?? [];
            map.set(v.nodeID, {
                stakeAmount: v.weight ?? undefined,
                delegationFee: v.delegationFee !== undefined
                    ? parseFloat(v.delegationFee)
                    : undefined,
                rewardAddress: addresses[0] ?? undefined,
            });
        }
        logger.info(`[Avalanche/PChain] ${map.size} validators fetched`);
    } catch (e) {
        logger.warn('[Avalanche/PChain] Failed to fetch validators:', e);
    }
    return map;
}

/**
 * Source 2: Glacier API (AvaLabs official, paginated)
 * Correct endpoint: /v1/networks/mainnet/validators (discovered via swagger)
 * Provides stake + fee data as cross-check. No names.
 * Fails gracefully if endpoint is unavailable or requires auth.
 */
async function fetchGlacierValidators(): Promise<Map<string, AvalancheValidatorMeta>> {
    const map = new Map<string, AvalancheValidatorMeta>();
    try {
        let pageToken: string | undefined;
        let page = 0;
        do {
            const url = new URL(GLACIER_ENDPOINT);
            url.searchParams.set('pageSize', '100');
            if (pageToken) url.searchParams.set('pageToken', pageToken);

            const response = await fetch(url.toString(), {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok) throw new Error(`Glacier HTTP ${response.status}`);
            const json = await response.json();

            const validators: any[] = json.validators ?? [];
            for (const v of validators) {
                const nodeId: string = v.nodeId ?? v.nodeID;
                if (!nodeId) continue;
                if (!map.has(nodeId)) {
                    const rewards: string[] = v.rewardAddresses ?? [];
                    map.set(nodeId, {
                        stakeAmount: v.amountStaked?.toString() ?? v.weight?.toString() ?? undefined,
                        delegationFee: v.delegationFee !== undefined
                            ? parseFloat(v.delegationFee)
                            : undefined,
                        rewardAddress: rewards[0] ?? undefined,
                    });
                }
            }

            pageToken = json.nextPageToken;
            page++;
            if (page > 50) break; // Safety: max 5000 validators
        } while (pageToken);

        logger.info(`[Avalanche/Glacier] ${map.size} validators fetched`);
    } catch (e) {
        logger.warn('[Avalanche/Glacier] Failed to fetch validators (non-blocking):', e);
    }
    return map;
}

/**
 * Fetch and merge validator metadata from P-Chain and Glacier.
 *
 * Note on names: The Avalanche network does not have an on-chain name registry
 * equivalent to Solana's Config program. Community explorer APIs (Avascan) block
 * server-side requests (403). Entity identification uses the reward address
 * (P-avax1...) as the primary identifier — it can be looked up on block explorers.
 *
 * @returns Map<nodeID, AvalancheValidatorMeta>
 */
export async function fetchAvalancheValidatorInfo(): Promise<Map<string, AvalancheValidatorMeta>> {
    const [pchainMap, glacierMap] = await Promise.all([
        fetchPChainValidators(),
        fetchGlacierValidators(),
    ]);

    // Merge: P-Chain is authoritative (canonical on-chain data)
    const merged = new Map<string, AvalancheValidatorMeta>();

    pchainMap.forEach((meta, nodeId) => merged.set(nodeId, { ...meta }));

    // Glacier fills gaps (stake from a different source, reward addresses)
    glacierMap.forEach((meta, nodeId) => {
        const existing = merged.get(nodeId);
        if (!existing) {
            merged.set(nodeId, { ...meta });
        } else {
            if (!existing.stakeAmount && meta.stakeAmount) existing.stakeAmount = meta.stakeAmount;
            if (existing.delegationFee === undefined && meta.delegationFee !== undefined) {
                existing.delegationFee = meta.delegationFee;
            }
            if (!existing.rewardAddress && meta.rewardAddress) existing.rewardAddress = meta.rewardAddress;
        }
    });

    // Overlay names from the local curated registry (knownValidators.ts)
    // This is the primary source for human-readable organization names on Avalanche,
    // since no public server-accessible API provides this data.
    merged.forEach((meta, nodeId) => {
        const knownName = getKnownValidatorName(nodeId);
        if (knownName) meta.name = knownName;
    });
    // Also register any known validators not yet in the map (e.g. offline but known)
    // — skip for now, only enrich peers we've already seen.

    const namedCount = Array.from(merged.values()).filter(m => m.name).length;
    const withStake = Array.from(merged.values()).filter(m => m.stakeAmount).length;
    const withAddress = Array.from(merged.values()).filter(m => m.rewardAddress).length;
    logger.info(`[Avalanche/ValidatorInfo] ${merged.size} validators | ${namedCount} named | ${withStake} with stake | ${withAddress} with reward address`);

    return merged;
}
