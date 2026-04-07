import { HyperliquidValidator, HyperliquidValidatorRaw } from '@/types/hyperliquid';
import { logger } from '@/lib/utils';

/**
 * Hyperliquid validator fetcher
 *
 * Data source  : Hyperliquid public API — https://api.hyperliquid.xyz/info
 * Payload type : { "type": "validatorSummaries" }
 *
 * ── API response notes ────────────────────────────────────────────────────────
 * Returns an array of ~30 validator objects (as of April 2026).
 * Fields: validator (address), signer, name, description, nRecentBlocks,
 *         stake, isJailed, unjailableAfter, isActive, commission, stats.
 *
 * There are NO IP addresses in the response. OVH detection relies solely
 * on name/description matching. See src/lib/hyperliquid/filterOVH.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const HYPERLIQUID_API = 'https://api.hyperliquid.xyz/info';

/**
 * Parse the raw stats tuple array into a keyed object.
 * The API returns stats as: [["day", {...}], ["week", {...}], ["month", {...}]]
 */
function parseDailyUptime(stats: HyperliquidValidatorRaw['stats']): number | undefined {
    if (!stats || !Array.isArray(stats)) return undefined;
    for (const [period, data] of stats) {
        if (period === 'day' && data?.uptimeFraction) {
            return parseFloat(data.uptimeFraction);
        }
    }
    return undefined;
}

/**
 * Fetch all validators from the Hyperliquid API.
 *
 * @throws Error if the HTTP request fails or the response is not an array.
 * @returns Array of normalised HyperliquidValidator objects.
 */
export async function fetchHyperliquidValidators(): Promise<HyperliquidValidator[]> {
    logger.info('[Hyperliquid] Fetching validators from API...');

    const response = await fetch(HYPERLIQUID_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'validatorSummaries' }),
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
        throw new Error(`[Hyperliquid] API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const raw: HyperliquidValidatorRaw[] = await response.json();

    if (!Array.isArray(raw)) {
        throw new Error(`[Hyperliquid] Unexpected API response shape: expected array, got ${typeof raw}`);
    }

    logger.info(`[Hyperliquid] Received ${raw.length} validators`);

    const validators: HyperliquidValidator[] = raw.map((v) => ({
        ...v,
        commissionRate: parseFloat(v.commission) || 0,
        dailyUptime: parseDailyUptime(v.stats),
    }));

    const active = validators.filter((v) => v.isActive).length;
    const jailed = validators.filter((v) => v.isJailed).length;
    logger.info(`[Hyperliquid] Active: ${active} | Jailed: ${jailed} | Total: ${validators.length}`);

    return validators;
}
