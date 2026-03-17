/**
 * seed-eth-mock.ts — injects a fake Ethereum snapshot into Turso for UI testing
 * Usage: npx tsx scripts/seed-eth-mock.ts
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { getDatabase } from '../src/lib/db/database';

const TOTAL = 7240;

const distribution: Record<string, number> = {
    aws:          2030,  // 28.0%
    hetzner:      1130,  // 15.6%
    google:        580,  //  8.0%
    ovh:           290,  //  4.0%
    digitalocean:  220,  //  3.0%
    vultr:         180,  //  2.5%
    equinix:       140,  //  1.9%
    others:       2670,  // 36.9%
};

const providerBreakdown = [
    { key: 'aws',     label: 'AWS',          nodeCount: 2030, marketShare: 28.04, color: '#FF9900' },
    { key: 'hetzner', label: 'Hetzner',       nodeCount: 1130, marketShare: 15.61, color: '#D50C2D' },
    { key: 'google',  label: 'Google Cloud',  nodeCount:  580, marketShare:  8.01, color: '#4285F4' },
    { key: 'others',  label: 'Others',        nodeCount: 2670, marketShare: 36.88, color: '#6B7280',
      subProviders: [
          { label: 'Contabo',       nodeCount: 420, marketShare: 5.80 },
          { label: 'OVHcloud',      nodeCount: 290, marketShare: 4.00 },
          { label: 'Alibaba Cloud', nodeCount: 210, marketShare: 2.90 },
          { label: 'Azure',         nodeCount: 185, marketShare: 2.56 },
          { label: 'Linode',        nodeCount: 140, marketShare: 1.93 },
      ]
    },
    { key: 'ovh',          label: 'OVHcloud',     nodeCount:  290, marketShare:  4.00, color: '#00F0FF' },
    { key: 'digitalocean', label: 'DigitalOcean', nodeCount:  220, marketShare:  3.04, color: '#0080FF' },
    { key: 'vultr',        label: 'Vultr',        nodeCount:  180, marketShare:  2.49, color: '#007BFC' },
    { key: 'equinix',      label: 'Equinix',      nodeCount:  140, marketShare:  1.93, color: '#ED2126' },
];

const geoDistribution: Record<string, number> = {
    'United States': 2180,
    'Germany':        980,
    'France':         410,
    'United Kingdom': 360,
    'Singapore':      290,
    'Netherlands':    270,
    'Canada':         210,
    'Japan':          180,
    'Finland':        160,
    'Australia':      140,
    'Switzerland':    120,
    'Poland':         100,
};

async function main() {
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

    const timestamp = Math.floor(Date.now() / 1000);

    await db.execute({
        sql: `INSERT INTO ethereum_snapshots
              (timestamp, total_nodes, provider_distribution, geo_distribution, provider_breakdown, crawl_duration_min)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            timestamp,
            TOTAL,
            JSON.stringify(distribution),
            JSON.stringify(geoDistribution),
            JSON.stringify(providerBreakdown),
            30,
        ],
    });

    console.log(`✓ Mock Ethereum snapshot inserted (${TOTAL} nodes, timestamp ${timestamp})`);
    console.log('  Open http://localhost:3000/ethereum to check');
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
