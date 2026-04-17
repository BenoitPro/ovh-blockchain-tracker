#!/usr/bin/env tsx

/**
 * Background Worker — Celestia Peer Collection
 *
 * Fetches Celestia peers from public RPC endpoints, identifies OVH nodes
 * via MaxMind ASN lookup, calculates metrics, and writes to cache.
 */
require('dotenv').config({ path: '.env.local' });
import { fetchCelestiaPeers, fetchCelestiaValidatorCount } from '../src/lib/celestia/fetchPeers';
import { filterOVHCelestiaNodes, categorizeCelestiaNodesByProvider } from '../src/lib/celestia/filterOVH';
import { calculateCelestiaMetrics } from '../src/lib/celestia/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { initMaxMind } from '../src/lib/asn/maxmind';

async function runCelestiaWorker() {
    console.log('✨ [Celestia Worker] Starting Celestia data collection...');
    console.log(`⏰ [Celestia Worker] Timestamp: ${new Date().toISOString()}`);
    const startTime = Date.now();
    try {
        // 1. MaxMind
        await initMaxMind();
        // 2. Fetch peers + validators in parallel
        const [allPeers, totalValidators] = await Promise.all([fetchCelestiaPeers(), fetchCelestiaValidatorCount()]);
        console.log(`✨ [Celestia Worker] Peers: ${allPeers.length} | Validators: ${totalValidators}`);
        // 3 & 4. Provider categorization + OVH filter in parallel
        const [providerCategorization, ovhNodes] = await Promise.all([
            categorizeCelestiaNodesByProvider(allPeers),
            filterOVHCelestiaNodes(allPeers),
        ]);
        // 5. Metrics
        const metrics = calculateCelestiaMetrics(allPeers, ovhNodes, providerCategorization, totalValidators);
        // 6. Cache
        await writeChainCache('celestia', metrics, allPeers.length);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ [Celestia Worker] Done in ${elapsed}s`);
        process.exit(0);
    } catch (err) {
        console.error('❌ [Celestia Worker] Fatal error:', err);
        process.exit(1);
    }
}
runCelestiaWorker();
