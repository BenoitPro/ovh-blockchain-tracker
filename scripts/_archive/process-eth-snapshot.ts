/**
 * process-eth-snapshot.ts
 *
 * Reads a nodes.json file produced by:
 *   go run github.com/ethereum/go-ethereum/cmd/devp2p@latest discv4 crawl \
 *     -timeout 30m nodes.json
 *
 * Format: { "<nodeId>": { "record": "enr:...", "score": 1, ... }, ... }
 *
 * IPs are extracted from ENR records (Ethereum Node Records, RLP encoded).
 *
 * Usage:
 *   npx tsx scripts/process-eth-snapshot.ts nodes.json [--crawl-duration-min=30]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { initMaxMind, batchGetASN, batchGetCountry } from '../src/lib/asn/maxmind';
import { PROVIDER_ASN_MAP } from '../src/lib/config/constants';
import { identifyProvider } from '../src/lib/solana/filterOVH';
import { buildProviderBreakdown } from '../src/lib/ethereum/calculateEthMetrics';
import { getDatabase } from '../src/lib/db/database';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeRecord {
    seq?: number;
    record?: string;  // ENR string: "enr:-KO4Q..."
    score?: number;
    firstResponse?: string;
    lastResponse?: string;
    lastCheck?: string;
}

type NodesJson = Record<string, NodeRecord>;

// ─── Minimal RLP decoder ─────────────────────────────────────────────────────

function rlpDecodeItem(buf: Buffer, offset: number): [Buffer | Buffer[], number] {
    const prefix = buf[offset];

    if (prefix <= 0x7f) {
        return [buf.slice(offset, offset + 1), offset + 1];
    } else if (prefix <= 0xb7) {
        const len = prefix - 0x80;
        return [buf.slice(offset + 1, offset + 1 + len), offset + 1 + len];
    } else if (prefix <= 0xbf) {
        const lenOfLen = prefix - 0xb7;
        const len = parseInt(buf.slice(offset + 1, offset + 1 + lenOfLen).toString('hex') || '0', 16);
        return [buf.slice(offset + 1 + lenOfLen, offset + 1 + lenOfLen + len), offset + 1 + lenOfLen + len];
    } else if (prefix <= 0xf7) {
        const len = prefix - 0xc0;
        const items: Buffer[] = [];
        let pos = offset + 1;
        while (pos < offset + 1 + len) {
            const [item, newPos] = rlpDecodeItem(buf, pos);
            items.push(item as Buffer);
            pos = newPos;
        }
        return [items, offset + 1 + len];
    } else {
        const lenOfLen = prefix - 0xf7;
        const len = parseInt(buf.slice(offset + 1, offset + 1 + lenOfLen).toString('hex') || '0', 16);
        const items: Buffer[] = [];
        let pos = offset + 1 + lenOfLen;
        while (pos < offset + 1 + lenOfLen + len) {
            const [item, newPos] = rlpDecodeItem(buf, pos);
            items.push(item as Buffer);
            pos = newPos;
        }
        return [items, offset + 1 + lenOfLen + len];
    }
}

/**
 * Extract IPv4 address from an ENR string.
 * ENR format: enr:<base64url-encoded RLP>
 * RLP structure: [signature, seq, k1, v1, k2, v2, ...]
 * Key "ip" → 4 bytes IPv4
 */
function extractIPFromENR(enrString: string): string | null {
    try {
        const b64 = enrString.replace(/^enr:/, '');
        const b64std = b64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64std + '='.repeat((4 - (b64std.length % 4)) % 4);
        const bytes = Buffer.from(padded, 'base64');

        const [list] = rlpDecodeItem(bytes, 0);
        if (!Array.isArray(list) || list.length < 4) return null;

        // [signature, seq, k1, v1, k2, v2, ...]  — keys start at index 2
        for (let i = 2; i < list.length - 1; i += 2) {
            const key = (list[i] as Buffer).toString('utf8');
            if (key === 'ip') {
                const ipBuf = list[i + 1] as Buffer;
                if (ipBuf.length === 4) {
                    const ip = `${ipBuf[0]}.${ipBuf[1]}.${ipBuf[2]}.${ipBuf[3]}`;
                    if (ip === '0.0.0.0') return null;
                    return ip;
                }
            }
        }
        return null;
    } catch {
        return null;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const entries = Object.values(raw);
    console.log(`      ${entries.length} entries found`);

    console.log('\n[2/5] Extracting IPs from ENR records...');
    const ips: string[] = [];
    let skipped = 0;
    for (const entry of entries) {
        if (!entry.record) { skipped++; continue; }
        const ip = extractIPFromENR(entry.record);
        if (ip) {
            ips.push(ip);
        } else {
            skipped++;
        }
    }
    // Deduplicate
    const uniqueIPs = [...new Set(ips)];
    console.log(`      ${uniqueIPs.length} unique IPs extracted (${skipped} skipped — no IP or IPv6-only)`);

    console.log('\n[3/5] Initializing MaxMind databases...');
    await initMaxMind();

    console.log('\n[4/5] Resolving ASNs and countries...');
    const asnResults = batchGetASN(uniqueIPs);
    const countryResults = batchGetCountry(uniqueIPs);
    console.log(`      ASN resolved:     ${asnResults.size}/${uniqueIPs.length}`);
    console.log(`      Country resolved: ${countryResults.size}/${uniqueIPs.length}`);

    console.log('\n[5/5] Computing provider and geo distributions...');

    const distribution: Record<string, number> = {};
    for (const key of Object.keys(PROVIDER_ASN_MAP)) distribution[key] = 0;
    distribution.others = 0;

    const othersBreakdown: Record<string, number> = {};
    const geoDistribution: Record<string, number> = {};

    for (const ip of uniqueIPs) {
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

        // Geo — full country name (WorldMap expects "France", not "FR")
        if (countryInfo?.country) {
            geoDistribution[countryInfo.country] = (geoDistribution[countryInfo.country] || 0) + 1;
        }
    }

    const totalNodes = uniqueIPs.length;
    const providerBreakdown = buildProviderBreakdown(distribution, othersBreakdown, totalNodes);
    const timestamp = Math.floor(Date.now() / 1000);

    // Summary
    console.log('\n─── Snapshot Summary ────────────────────────────────');
    console.log(`Total nodes:      ${totalNodes.toLocaleString()}`);
    console.log(`Timestamp:        ${new Date(timestamp * 1000).toISOString()}`);
    if (crawlDurationMin) console.log(`Crawl duration:   ${crawlDurationMin} min`);
    console.log('\nProvider distribution:');
    for (const entry of providerBreakdown) {
        console.log(`  ${entry.label.padEnd(20)} ${entry.nodeCount.toString().padStart(5)}  (${entry.marketShare.toFixed(2)}%)`);
    }
    console.log('\nTop 5 countries:');
    for (const [name, count] of Object.entries(geoDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
        console.log(`  ${name.padEnd(20)} ${count}`);
    }
    console.log('─────────────────────────────────────────────────────');

    // Push to Turso
    console.log('\nPushing snapshot to Turso...');
    const db = getDatabase();

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

    console.log('Snapshot saved successfully!');
    console.log(`→ http://localhost:3000/ethereum\n`);
    process.exit(0);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
