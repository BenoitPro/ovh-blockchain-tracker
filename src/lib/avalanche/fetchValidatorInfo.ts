import { logger } from '@/lib/utils';

export interface AvalancheValidatorMeta {
    name?: string;
    stakeAmount?: string;  // nAVAX as string
    delegationFee?: number;
    rewardAddress?: string;
}

const PCHAIN_ENDPOINT = 'https://api.avax.network/ext/bc/P';
const GLACIER_ENDPOINT = 'https://glacier-api.avax.network/v1/primaryNetwork/validators';
const AVASCAN_ENDPOINT = 'https://avascan.info/api/v2/staking/validators';

/**
 * Source 1: P-Chain platform.getCurrentValidators
 * Returns stake amounts, delegation fees, and reward addresses.
 * No human names, but authoritative on-chain data.
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
            const addresses: string[] = v.rewardOwner?.addresses ?? [];
            // P-Chain returns delegationFee already in percent (e.g. "2.0000" = 2%, "100.0000" = 100%).
            // No conversion needed. Note: stakeAmount is null from P-Chain; Glacier is the source for stake.
            map.set(v.nodeID, {
                stakeAmount: v.stakeAmount ?? undefined,
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
 * Provides structured stake + fee data as a cross-check. No names.
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
                        stakeAmount: v.amountStaked?.toString() ?? undefined,
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
        logger.warn('[Avalanche/Glacier] Failed to fetch validators:', e);
    }
    return map;
}

/**
 * Source 3: Avascan API (community explorer — best name coverage)
 * Similar role to Marinade Finance for Solana.
 * If endpoint unavailable, returns empty map (graceful degradation).
 */
async function fetchAvascanValidatorNames(): Promise<Map<string, string>> {
    const map = new Map<string, string>(); // nodeID → name
    try {
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
            const url = `${AVASCAN_ENDPOINT}?limit=${limit}&offset=${offset}&type=validator`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
                cache: 'no-store',
                signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) throw new Error(`Avascan HTTP ${response.status}`);
            const json = await response.json();

            // Handle both { validators: [...] } and { results: [...] } shapes
            const items: any[] = json.validators ?? json.results ?? json.data ?? [];
            if (items.length === 0) { hasMore = false; break; }

            for (const v of items) {
                const nodeId: string = v.nodeID ?? v.nodeId ?? v.id ?? '';
                const name: string = (v.name ?? v.validatorName ?? v.moniker ?? '').trim();
                if (nodeId && name) map.set(nodeId, name);
            }

            hasMore = items.length === limit;
            offset += limit;
            if (offset > 5000) break; // Safety cap
        }

        logger.info(`[Avalanche/Avascan] ${map.size} named validators fetched`);
    } catch (e) {
        logger.warn('[Avalanche/Avascan] Name fetch failed (non-blocking):', e);
    }
    return map;
}

/**
 * Fetch and merge validator metadata from all sources.
 * Priority: P-Chain/Glacier for stake data, Avascan for names.
 *
 * @returns Map<nodeID, AvalancheValidatorMeta>
 */
export async function fetchAvalancheValidatorInfo(): Promise<Map<string, AvalancheValidatorMeta>> {
    const [pchainMap, glacierMap, avascanNames] = await Promise.all([
        fetchPChainValidators(),
        fetchGlacierValidators(),
        fetchAvascanValidatorNames(),
    ]);

    // Merge: start with P-Chain data (canonical), layer Glacier, then add names from Avascan
    const merged = new Map<string, AvalancheValidatorMeta>();

    // P-Chain is authoritative for on-chain data
    pchainMap.forEach((meta, nodeId) => merged.set(nodeId, { ...meta }));

    // Glacier may fill gaps or provide the same data differently
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

    // Overlay names from Avascan
    avascanNames.forEach((name, nodeId) => {
        const existing = merged.get(nodeId);
        if (existing) {
            existing.name = name;
        } else {
            merged.set(nodeId, { name });
        }
    });

    const namedCount = Array.from(merged.values()).filter(m => m.name).length;
    const withStake = Array.from(merged.values()).filter(m => m.stakeAmount).length;
    logger.info(`[Avalanche/ValidatorInfo] ${merged.size} total | ${namedCount} named | ${withStake} with stake`);

    return merged;
}
