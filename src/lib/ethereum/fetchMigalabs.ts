/**
 * fetchMigalabs.ts
 *
 * Fetches Ethereum consensus layer node distribution from the MigaLabs API
 * and saves a snapshot to Turso.
 *
 * Endpoints (confirmed via MigaLabs support):
 *   GET https://www.migalabs.io/api/eth/v1/nodes/consensus/all/internet_providers
 *   GET https://www.migalabs.io/api/eth/v1/nodes/consensus/all/geographical_distribution
 *
 * Response shapes (no pagination — full data returned in one call):
 *   internet_providers:        [{isp: string, total_nodes: number}]
 *   geographical_distribution: [{country_code: string, node_count: number}]
 *
 * Auth: X-Api-Key header (env var MIGALABS_API)
 */

import { calculateEthMetrics } from '@/lib/ethereum/calculateEthMetrics';
import { getDatabase } from '@/lib/db/database';
import { PROVIDER_ASN_MAP } from '@/lib/config/constants';
import { identifyProvider } from '@/lib/shared/providers';
import { logger } from '@/lib/utils/logger';

const MIGALABS_BASE = 'https://www.migalabs.io/api/eth/v1/nodes/consensus/all';
const MIN_NODES = 100;

// ─── Provider name mapping ────────────────────────────────────────────────────
// Build a reverse lookup: human-readable label → internal key (e.g. "OVHcloud" → "ovh").
const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
    Object.entries(PROVIDER_ASN_MAP).map(([key, info]) => [info.label, key])
);

/**
 * Maps a MigaLabs ISP name to an internal provider key (e.g. "ovh", "aws").
 * Delegates to the shared identifyProvider() for consistent matching across all chains,
 * then converts the returned label back to the short key used in distribution maps.
 */
function mapProviderName(name: string): string {
    const label = identifyProvider('', name);
    return LABEL_TO_KEY[label] ?? 'others';
}

// ─── HTTP with retry ──────────────────────────────────────────────────────────

type DataItem = Record<string, unknown>;

async function fetchEndpoint(path: string, apiKey: string, maxRetries = 3): Promise<DataItem[]> {
    const url = `${MIGALABS_BASE}/${path}`;
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

            // Response shape: [{timestamp: string, data: DataItem[]}]
            const body = await res.json() as Array<{ data?: DataItem[] }>;
            return body[0]?.data ?? [];
        } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            logger.warn(`[MigaLabs] Attempt ${attempt + 1} failed for ${path}: ${lastError.message}`);
        }
    }

    throw lastError;
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

    // 1. Fetch ISP distribution
    logger.info('[MigaLabs] Fetching internet_providers…');
    const ispItems = await fetchEndpoint('internet_providers', apiKey);
    logger.info(`[MigaLabs] ${ispItems.length} ISP entries received`);

    // 2. Fetch geographical distribution
    logger.info('[MigaLabs] Fetching geographical_distribution…');
    const geoItems = await fetchEndpoint('geographical_distribution', apiKey);
    logger.info(`[MigaLabs] ${geoItems.length} geo entries received`);

    // 3. Build provider distribution
    // Response: [{isp: string, total_nodes: number}]
    const distribution: Record<string, number> = {};
    for (const key of Object.keys(PROVIDER_ASN_MAP)) distribution[key] = 0;
    distribution.others = 0;

    const othersBreakdown: Record<string, number> = {};
    let totalNodes = 0;

    for (const item of ispItems) {
        const name = String(item.isp ?? '');
        const count = Number(item.total_nodes ?? 0);
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

    // 4. Build geo distribution — ISO codes → English country names
    // Response: [{country_code: string, node_count: number}]
    const geoDistribution: Record<string, number> = {};
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

    for (const item of geoItems) {
        const code = String(item.country_code ?? '').toUpperCase();
        const count = Number(item.node_count ?? 0);
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

    // 6. Calculate metrics
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
