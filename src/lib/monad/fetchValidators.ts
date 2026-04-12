import { MonadValidator } from '@/types';
import { logger } from '@/lib/utils';

/**
 * Monad validator fetcher — data source: gmonads.com public API
 *
 * Base URL : https://www.gmonads.com/api/v1/public
 * Auth     : none
 * Rate     : 30 req/min
 *
 * ── Endpoints used ────────────────────────────────────────────────────────────
 *
 * GET /validators/geolocations?network=mainnet
 *   Response shape (array of ~200 consensus validators):
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "address": "64.130.43.22",       // IP address (same as ip)
 *         "ip": "64.130.43.22",            // IP address
 *         "timestamp": "2026-04-12T12:58:53Z",
 *         "epoch": "1353",
 *         "node_id": "02c67b1a...",         // hex pubkey — join key with epoch
 *         "val_index": 97,                  // numeric index (may align with metadata.id)
 *         "stake": 1498226694,              // MON stake (number)
 *         "validator_set_type": "consensus",
 *         "connected": true,
 *         "city": "Amsterdam",
 *         "country": "Netherlands",
 *         "countryCode": "NL",             // ISO 3166-1 alpha-2
 *         "lat": 52.3740,
 *         "lon": 4.8897,
 *         "isp": "TeraSwitch Networks Inc.",
 *         "as": "AS395954 TeraSwitch Networks Inc."
 *       }
 *     ],
 *     "meta": {
 *       "timestamp": "2026-04-12T13:04:03.020Z",
 *       "network": "mainnet",
 *       "epoch": 1353,
 *       "count": 200
 *     }
 *   }
 *
 * GET /validators/epoch?network=mainnet
 *   Response shape (array of ~218 validators, includes registered but inactive):
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "timestamp": "2026-04-12T12:58:53Z",
 *         "epoch": "1353",
 *         "node_id": "02c67b1a...",         // hex pubkey — join key with geolocations
 *         "val_index": 97,
 *         "stake": "1498226694",            // MON stake (STRING — must parseInt)
 *         "validator_set_type": "active",   // "active" | "registered" | other
 *         "flags": "0",
 *         "commission": "0",
 *         "auth_address": "0xbB8EE00846BF924F34Ba4f8a86d690Ff11Eed7cA",
 *         "ip_address": "64.130.43.22"     // may be empty string ""
 *       }
 *     ],
 *     "meta": {
 *       "timestamp": "2026-04-12T13:04:03.020Z",
 *       "network": "mainnet",
 *       "isCurrentEpoch": true,
 *       "validatorCount": 218
 *     }
 *   }
 *
 * GET /validators/metadata?network=mainnet
 *   Response shape (array — NOT all validators have metadata):
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "id": 97,                        // numeric id — appears to align with val_index
 *         "name": "Monad Foundation",
 *         "secp": "02c67b1a...",           // secp256k1 pubkey — same as node_id in other endpoints
 *         "bls": "...",
 *         "website": "https://monad.xyz",
 *         "description": "...",
 *         "logo": "https://...",
 *         "x": "https://x.com/..."
 *       }
 *     ]
 *   }
 *   NOTE: metadata.secp matches node_id in geolocations/epoch endpoints (hex pubkey).
 *         metadata.id appears to align with val_index, but secp is the reliable join key.
 *         Not all validators have a metadata entry; fallback to val_index label.
 *
 * ── Join strategy ─────────────────────────────────────────────────────────────
 * Primary source : geolocations (has geo + stake)
 * Enrichment     : epoch joined by node_id (adds active status confirmation)
 * Name lookup    : metadata joined by node_id == metadata.secp (hex pubkey)
 * Fallback name  : "Validator #<val_index>"
 *
 * ── successRate ───────────────────────────────────────────────────────────────
 * gmonads.com does not expose a per-validator success/uptime rate in any of the
 * three public endpoints (confirmed April 2026). We use connected status as a
 * binary proxy: connected → 100, disconnected → 0.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = 'https://www.gmonads.com/api/v1/public';
const NETWORK = 'mainnet';

const FETCH_HEADERS = {
    'User-Agent': 'OVHcloud-Node-Tracker/1.0',
    Accept: 'application/json',
};

// ── Raw API types ──────────────────────────────────────────────────────────────

interface RawGeoValidator {
    address?: string;
    ip?: string;
    timestamp?: string;
    epoch?: string;
    node_id?: string;
    val_index?: number;
    stake?: number;
    validator_set_type?: string;
    connected?: boolean;
    city?: string;
    country?: string;
    countryCode?: string;
    lat?: number;
    lon?: number;
    isp?: string;
    as?: string;
}

interface RawEpochValidator {
    timestamp?: string;
    epoch?: string;
    node_id?: string;
    val_index?: number;
    stake?: string;       // stake is a STRING in this endpoint
    validator_set_type?: string;
    flags?: string;
    commission?: string;
    auth_address?: string;
    ip_address?: string;
}

interface RawMetadataValidator {
    id?: number;
    name?: string;
    secp?: string;        // secp256k1 pubkey — matches node_id in other endpoints
    bls?: string;
    website?: string;
    description?: string;
    logo?: string;
    x?: string;
}

interface GmonadsApiResponse<T> {
    success?: boolean;
    data?: T[];
    meta?: Record<string, unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Fetch one gmonads endpoint with an independent AbortSignal timeout and error handling.
 * Returns an empty array on failure so callers can degrade gracefully.
 * Each call creates its own signal so a timeout on one endpoint does not cancel the others.
 */
async function fetchEndpoint<T>(
    path: string,
    label: string,
): Promise<T[]> {
    const signal = AbortSignal.timeout(30_000);
    const url = `${BASE_URL}/${path}?network=${NETWORK}`;

    try {
        const response = await fetch(url, {
            headers: FETCH_HEADERS,
            cache: 'no-store',
            signal,
        });

        if (!response.ok) {
            logger.warn(`[Monad] ${label} → HTTP ${response.status} ${response.statusText}`);
            return [];
        }

        const json: GmonadsApiResponse<T> = await response.json();

        if (json.success === false) {
            logger.warn(`[Monad] ${label} → API returned success=false`);
            return [];
        }

        const items = json.data ?? [];
        logger.info(`[Monad] ${label} → ${items.length} entries`);
        return items;
    } catch (err) {
        logger.warn(`[Monad] ${label} → failed: ${err instanceof Error ? err.message : String(err)}`);
        return [];
    }
}

// ── Public fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetch and merge all three gmonads.com endpoints into a unified MonadValidator[].
 *
 * Parallel fetches: geolocations + epoch + metadata.
 * Join strategy  : node_id (hex pubkey) as primary key.
 *
 * @returns Array of MonadValidator, one per validator entry in geolocations.
 *          Falls back to epoch-only entries if geolocations is empty.
 */
export async function fetchMonadValidators(): Promise<MonadValidator[]> {
    logger.info('[Monad] Fetching validators from gmonads.com...');

    // Fetch all three endpoints in parallel — each gets its own independent timeout
    const [geoData, epochData, metaData] = await Promise.all([
        fetchEndpoint<RawGeoValidator>('validators/geolocations', 'geolocations'),
        fetchEndpoint<RawEpochValidator>('validators/epoch', 'epoch'),
        fetchEndpoint<RawMetadataValidator>('validators/metadata', 'metadata'),
    ]);

    // Build lookup maps keyed by node_id (hex pubkey)
    const epochByNodeId = new Map<string, RawEpochValidator>();
    for (const e of epochData) {
        if (e.node_id) epochByNodeId.set(e.node_id, e);
    }

    // metadata.secp matches node_id in geo/epoch endpoints
    const nameByNodeId = new Map<string, string>();
    const logoByNodeId = new Map<string, string>();
    const websiteByNodeId = new Map<string, string>();
    for (const m of metaData) {
        if (!m.secp) continue;
        if (m.name) nameByNodeId.set(m.secp, m.name);
        if (m.logo) logoByNodeId.set(m.secp, m.logo);
        if (m.website) websiteByNodeId.set(m.secp, m.website);
    }

    logger.info(
        `[Monad] Merging: ${geoData.length} geo + ${epochData.length} epoch + ${metaData.length} metadata entries`
    );

    // ── Primary path: geolocations as the base ────────────────────────────────
    if (geoData.length > 0) {
        const validators: MonadValidator[] = geoData.map((geo) => {
            const epoch = geo.node_id ? (epochByNodeId.get(geo.node_id) ?? null) : null;

            // Name: prefer metadata (via secp == node_id), fallback to val_index label
            const name =
                (geo.node_id && nameByNodeId.get(geo.node_id)) ||
                (geo.val_index != null ? `Validator #${geo.val_index}` : 'Unknown Validator');

            // Country: prefer ISO-2 countryCode, fallback to full country name, then 'Unknown'
            const country = geo.countryCode?.trim() || geo.country?.trim() || 'Unknown';

            const city = geo.city?.trim() || '';

            // Stake: geolocations provides it as a number; epoch provides it as a string
            const stake =
                geo.stake ??
                (epoch?.stake ? parseInt(epoch.stake, 10) || 0 : 0);

            // Active: validator_set_type "active" or "consensus" → active
            const geoType = geo.validator_set_type?.toLowerCase() ?? '';
            const epochType = epoch?.validator_set_type?.toLowerCase() ?? '';
            const active =
                geoType === 'active' ||
                geoType === 'consensus' ||
                epochType === 'active' ||
                epochType === 'consensus';

            // successRate: gmonads.com does not expose uptime/success rate in public endpoints.
            // Use connected status as a binary proxy (connected=true → 100, false/undefined → 0).
            const successRate = geo.connected === true ? 100 : 0; // false or undefined → 0 (unknown = conservative)

            const logo = geo.node_id ? (logoByNodeId.get(geo.node_id) ?? undefined) : undefined;
            const website = geo.node_id ? (websiteByNodeId.get(geo.node_id) ?? undefined) : undefined;

            return { name, country, city, stake, successRate, active, logo, website };
        });

        const activeCount = validators.filter((v) => v.active).length;
        logger.info(
            `[Monad] Built ${validators.length} validators (${activeCount} active) from geolocations`
        );
        return validators;
    }

    // ── Fallback path: epoch-only (no geo data available) ─────────────────────
    logger.warn('[Monad] geolocations endpoint returned no data — falling back to epoch-only');

    const validators: MonadValidator[] = epochData.map((e) => {
        const name =
            (e.node_id && nameByNodeId.get(e.node_id)) ||
            (e.val_index != null ? `Validator #${e.val_index}` : 'Unknown Validator');

        const stake = e.stake ? parseInt(e.stake, 10) : 0;
        const epochType = e.validator_set_type?.toLowerCase() ?? '';
        const active = epochType === 'active' || epochType === 'consensus';

        return {
            name,
            country: 'Unknown',
            city: '',
            stake,
            successRate: 100,
            active,
        };
    });

    const activeCount = validators.filter((v) => v.active).length;
    logger.info(`[Monad] Built ${validators.length} validators (${activeCount} active) from epoch fallback`);
    return validators;
}
