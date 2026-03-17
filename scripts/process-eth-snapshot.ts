/**
 * process-eth-snapshot.ts
 *
 * Reads a nodes.json file produced by:
 *   go run github.com/ethereum/go-ethereum/cmd/devp2p@latest discv4 crawl \
 *     -timeout 30m nodes.json
 *
 * Then:
 *   1. Extracts IPs from enode URLs
 *   2. Resolves ASNs via MaxMind (offline, ~1ms/IP)
 *   3. Maps ASNs to cloud providers using PROVIDER_ASN_MAP
 *   4. Resolves countries via MaxMind
 *   5. Pushes a snapshot row into the Turso `ethereum_snapshots` table
 *
 * Usage:
 *   npx tsx scripts/process-eth-snapshot.ts nodes.json [--crawl-duration-min=30]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { initMaxMind, batchGetASN, batchGetCountry } from '../src/lib/asn/maxmind';
import { PROVIDER_ASN_MAP, identifyProvider } from '../src/lib/solana/filterOVH';
import { buildProviderBreakdown } from '../src/lib/ethereum/calculateEthMetrics';
import { getDatabase } from '../src/lib/db/database';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeRecord {
    Seq?: number;
    Score?: number;
    FirstResponse?: string;
    LastResponse?: string;
    LastCheck?: string;
}

type NodesJson = Record<string, NodeRecord>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract IP from an enode URL: enode://pubkey@IP:PORT
 */
function extractIPFromEnode(enodeUrl: string): string | null {
    // Handle both enode:// format and plain node IDs with @
    const match = enodeUrl.match(/@([^:@\]]+)(?::\d+)?$/);
    if (!match) return null;
    const ip = match[1];
    // Skip IPv6 link-local or unspecified
    if (ip === '0.0.0.0' || ip === '::' || ip.startsWith('fe80:')) return null;
    return ip;
}

/**
 * Parse --crawl-duration-min=N from CLI args
 */
function parseCrawlDuration(args: string[]): number | undefined {
    for (const arg of args) {
        const m = arg.match(/--crawl-duration-min[=\s](\d+)/);
        if (m) return parseInt(m[1], 10);
    }
    return undefined;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const inputFile = args.find(a => !a.startsWith('--'));

    if (!inputFile) {
        console.error('Usage: npx tsx scripts/process-eth-snapshot.ts <nodes.json> [--crawl-duration-min=30]');
        process.exit(1);
    }

    const filePath = path.resolve(inputFile);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const crawlDurationMin = parseCrawlDuration(args);

    console.log(`\n[1/5] Loading nodes from ${filePath}...`);
    const raw: NodesJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const enodeKeys = Object.keys(raw);
    console.log(`      ${enodeKeys.length} entries found`);

    console.log('\n[2/5] Extracting IPs from enode URLs...');
    const ipToEnode = new Map<string, string>();
    for (const enodeUrl of enodeKeys) {
        const ip = extractIPFromEnode(enodeUrl);
        if (ip) ipToEnode.set(ip, enodeUrl);
    }
    const ips = Array.from(ipToEnode.keys());
    console.log(`      ${ips.length} valid IPs extracted (${enodeKeys.length - ips.length} skipped)`);

    console.log('\n[3/5] Initializing MaxMind databases...');
    await initMaxMind();

    console.log('\n[4/5] Resolving ASNs and countries...');
    const asnResults = batchGetASN(ips);
    const countryResults = batchGetCountry(ips);
    console.log(`      ASN resolved: ${asnResults.size}/${ips.length}`);
    console.log(`      Country resolved: ${countryResults.size}/${ips.length}`);

    console.log('\n[5/5] Computing provider and geo distributions...');

    // Initialize distribution for all known providers
    const distribution: Record<string, number> = {};
    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    const othersBreakdown: Record<string, number> = {};
    const geoDistribution: Record<string, number> = {}; // ISO country code → count

    for (const ip of ips) {
        const asnInfo = asnResults.get(ip);
        const countryInfo = countryResults.get(ip);

        // Provider
        if (asnInfo) {
            let categorized = false;
            for (const [providerKey, providerInfo] of Object.entries(PROVIDER_ASN_MAP)) {
                if (providerInfo.asns.includes(asnInfo.asn)) {
                    distribution[providerKey]++;
                    categorized = true;
                    break;
                }
            }
            if (!categorized) {
                distribution.others++;
                const org = identifyProvider(asnInfo.asn, asnInfo.org);
                othersBreakdown[org] = (othersBreakdown[org] || 0) + 1;
            }
        } else {
            distribution.others++;
        }

        // Geo — use full country name as key (WorldMap expects "France", not "FR")
        if (countryInfo?.country) {
            const name = countryInfo.country;
            geoDistribution[name] = (geoDistribution[name] || 0) + 1;
        }
    }

    const totalNodes = ips.length;
    const providerBreakdown = buildProviderBreakdown(distribution, othersBreakdown, totalNodes);
    const timestamp = Math.floor(Date.now() / 1000);

    // Print summary
    console.log('\n─── Snapshot Summary ────────────────────────────────');
    console.log(`Total nodes:      ${totalNodes.toLocaleString()}`);
    console.log(`Timestamp:        ${new Date(timestamp * 1000).toISOString()}`);
    if (crawlDurationMin) console.log(`Crawl duration:   ${crawlDurationMin} min`);
    console.log('\nProvider distribution:');
    for (const entry of providerBreakdown) {
        console.log(`  ${entry.label.padEnd(20)} ${entry.nodeCount.toString().padStart(5)}  (${entry.marketShare.toFixed(2)}%)`);
    }
    console.log('\nTop 5 countries:');
    const topCountries = Object.entries(geoDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    for (const [name, count] of topCountries) {
        console.log(`  ${name.padEnd(20)} ${count}`);
    }
    console.log('─────────────────────────────────────────────────────');

    // Push to Turso
    console.log('\nPushing snapshot to Turso...');
    const db = getDatabase();

    // Ensure table exists (in case schema.sql wasn't applied yet)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ethereum_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            total_nodes INTEGER NOT NULL,
            provider_distribution TEXT NOT NULL,
            geo_distribution TEXT NOT NULL,
            provider_breakdown TEXT NOT NULL,
            crawl_duration_min INTEGER,
            created_at INTEGER DEFAULT (unixepoch())
        )
    `);

    await db.execute({
        sql: `INSERT INTO ethereum_snapshots
              (timestamp, total_nodes, provider_distribution, geo_distribution, provider_breakdown, crawl_duration_min)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            timestamp,
            totalNodes,
            JSON.stringify(distribution),
            JSON.stringify(geoDistribution),
            JSON.stringify(providerBreakdown),
            crawlDurationMin ?? null,
        ],
    });

    console.log('Snapshot saved successfully!\n');
    console.log(`You can now view it at: http://localhost:3000/ethereum`);

    process.exit(0);
}

main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
