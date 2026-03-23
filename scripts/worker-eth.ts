/**
 * worker-eth.ts
 *
 * Standalone script for local testing of the Ethereum MigaLabs refresh.
 * Fetches hosting & geo distribution from MigaLabs API and saves a snapshot.
 *
 * Usage:
 *   npx tsx scripts/worker-eth.ts
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { runEthRefresh } from '../src/lib/ethereum/fetchMigalabs';

async function main() {
    console.log('\n[worker-eth] Starting Ethereum snapshot refresh via MigaLabs API…');
    console.log(`[worker-eth] Timestamp: ${new Date().toISOString()}\n`);

    const startTime = Date.now();

    try {
        const result = await runEthRefresh();

        const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n─── Snapshot Summary ─────────────────────────────────');
        console.log(`Total nodes:    ${result.totalNodes.toLocaleString()}`);
        console.log(`OVH nodes:      ${result.ovhNodes.toLocaleString()}`);
        console.log(`OVH share:      ${result.ovhSharePct.toFixed(2)}%`);
        console.log(`Duration:       ${durationSec}s`);
        console.log('──────────────────────────────────────────────────────');
        console.log('\n✅ Snapshot saved. Check → http://localhost:3000/ethereum\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
