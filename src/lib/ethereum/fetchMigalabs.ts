/**
 * fetchMigalabs.ts
 *
 * Fetches Ethereum consensus layer node distribution from the MigaLabs API
 * and saves a snapshot to Turso.
 *
 * Endpoints:
 *   /api/eth/v1/beacon/consensus-layer-nodes/hosting_type
 *   /api/eth/v1/beacon/consensus-layer-nodes/geographical_distribution
 *
 * Auth: X-Api-Key header (env var MIGALABS_API)
 */

import { calculateEthMetrics } from '@/lib/ethereum/calculateEthMetrics';
import { getDatabase } from '@/lib/db/database';
import { PROVIDER_ASN_MAP } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

const MIGALABS_BASE = 'https://api.migalabs.io/api/eth/v1/beacon';
const MIN_NODES = 100;

// ─── Provider name mapping ────────────────────────────────────────────────────
// Maps MigaLabs ISP/hosting-type strings → our internal provider keys.
// Regex-based for robustness against minor naming variations.
const PROVIDER_NAME_PATTERNS: Array<[RegExp, string]> = [
    [/ovh/i, 'ovh'],
    [/amazon|aws/i, 'aws'],
    [/google/i, 'google'],
    [/hetzner/i, 'hetzner'],
    [/digitalocean/i, 'digitalocean'],
    [/vultr/i, 'vultr'],
    [/equinix/i, 'equinix'],
];

function mapProviderName(name: string): string {
    for (const [pattern, key] of PROVIDER_NAME_PATTERNS) {
        if (pattern.test(name)) return key;
    }
    return 'others';
}

// ─── Response field extraction ────────────────────────────────────────────────
// The exact MigaLabs field names are not confirmed (server SSL issue at time of
// writing). We handle multiple plausible variants defensively and log the first
// sample item so the mapping can be verified on the first successful run.
type DataItem = Record<string, unknown>;

function extractNodeCount(item: DataItem): number {
    const raw = item.node_count ?? item.count ?? item.nodes ?? item.total ?? 0;
    return typeof raw === 'number' ? raw : parseInt(String(raw), 10) || 0;
}

function extractProviderName(item: DataItem): string {
    const raw = item.name ?? item.hosting_type ?? item.isp ?? item.label ?? item.provider ?? '';
    return String(raw);
}

function extractCountryCode(item: DataItem): string {
    const raw = item.country_code ?? item.country ?? item.code ?? item.iso_code ?? '';
    return String(raw).toUpperCase();
}

// ─── HTTP with retry ──────────────────────────────────────────────────────────

async function fetchPage(url: string, apiKey: string, maxRetries = 3): Promise<DataItem[]> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
            const delayMs = Math.pow(2, attempt) * 1000;
            logger.info(`[MigaLabs] Retry ${attempt}/${maxRetries - 1} after ${delayMs}ms…`);
            await new Promise(r => setTimeout(r, delayMs));
        }

        try {
            const res = await fetch(url, { headers: { 'X-Api-Key': apiKey } });
            if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

            const body = await res.json() as { data?: DataItem[] };

            // Log sample item on first attempt to verify field names
            if (attempt === 0 && body.data && body.data.length > 0) {
                logger.info(`[MigaLabs] Sample keys: ${Object.keys(body.data[0]).join(', ')}`);
                logger.info(`[MigaLabs] Sample item: ${JSON.stringify(body.data[0])}`);
            }

            return body.data ?? [];
        } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            logger.warn(`[MigaLabs] Attempt ${attempt + 1} failed: ${lastError.message}`);
        }
    }

    throw lastError;
}

async function fetchAllPages(path: string, apiKey: string): Promise<DataItem[]> {
    const results: DataItem[] = [];
    let page = 0;
    const limit = 200;

    while (true) {
        const url = `${MIGALABS_BASE}${path}?network=mainnet&limit=${limit}&page=${page}`;
        const items = await fetchPage(url, apiKey);
        results.push(...items);
        if (items.length < limit) break; // last page
        page++;
    }

    return results;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface EthRefreshResult {
    totalNodes: number;
    ovhNodes: number;
    ovhSharePct: number;
}

export async function runEthRefresh(): Promise<EthRefreshResult> {
    const apiKey = process.env.MIGALABS_API;
    if (!apiKey) throw new Error('MIGALABS_API env var is not set');

    // 1. Fetch hosting type distribution
    logger.info('[MigaLabs] Fetching consensus-layer-nodes/hosting_type…');
    const hostingItems = await fetchAllPages('/consensus-layer-nodes/hosting_type', apiKey);
    logger.info(`[MigaLabs] ${hostingItems.length} hosting type entries received`);

    // 2. Fetch geographical distribution
    logger.info('[MigaLabs] Fetching consensus-layer-nodes/geographical_distribution…');
    const geoItems = await fetchAllPages('/consensus-layer-nodes/geographical_distribution', apiKey);
    logger.info(`[MigaLabs] ${geoItems.length} geo entries received`);

    // 3. Build provider distribution
    const distribution: Record<string, number> = {};
    for (const key of Object.keys(PROVIDER_ASN_MAP)) distribution[key] = 0;
    distribution.others = 0;

    const othersBreakdown: Record<string, number> = {};
    let totalNodes = 0;

    for (const item of hostingItems) {
        const name = extractProviderName(item);
        const count = extractNodeCount(item);
        if (!name || count === 0) continue;

        totalNodes += count;
        const providerKey = mapProviderName(name);

        if (providerKey === 'others') {
            distribution.others += count;
            othersBreakdown[name] = (othersBreakdown[name] || 0) + count;
        } else {
            distribution[providerKey] = (distribution[providerKey] || 0) + count;
        }
    }

    // 4. Build geo distribution (ISO codes → English country names)
    const geoDistribution: Record<string, number> = {};
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

    for (const item of geoItems) {
        const code = extractCountryCode(item);
        const count = extractNodeCount(item);
        if (!code || count === 0) continue;

        let countryName: string;
        try {
            countryName = displayNames.of(code) ?? code;
        } catch {
            countryName = code;
        }
        geoDistribution[countryName] = (geoDistribution[countryName] || 0) + count;
    }

    // 5. Anomaly guard
    if (totalNodes < MIN_NODES) {
        throw new Error(
            `Anomaly: only ${totalNodes} nodes from MigaLabs (minimum: ${MIN_NODES}). Snapshot NOT saved.`
        );
    }

    logger.info(`[MigaLabs] Total nodes: ${totalNodes.toLocaleString()}`);
    logger.info(`[MigaLabs] OVH: ${distribution.ovh} | AWS: ${distribution.aws} | Hetzner: ${distribution.hetzner}`);

    // 6. Calculate metrics using existing utility
    const timestamp = Math.floor(Date.now() / 1000);
    const metrics = calculateEthMetrics(
        totalNodes,
        distribution,
        othersBreakdown,
        geoDistribution,
        timestamp
    );

    // 7. Save to Turso
    logger.info('[MigaLabs] Saving snapshot to Turso…');
    const db = getDatabase();

    await db.execute({
        sql: `INSERT INTO ethereum_snapshots
              (timestamp, total_nodes, provider_distribution, geo_distribution, provider_breakdown, crawl_duration_min)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            metrics.timestamp,
            metrics.totalNodes,
            JSON.stringify(metrics.providerDistribution),
            JSON.stringify(metrics.geoDistribution),
            JSON.stringify(metrics.providerBreakdown),
            null,
        ],
    });

    logger.info('[MigaLabs] Snapshot saved.');

    const ovhNodes = distribution.ovh || 0;
    const ovhSharePct = totalNodes > 0 ? (ovhNodes / totalNodes) * 100 : 0;

    return { totalNodes, ovhNodes, ovhSharePct };
}
