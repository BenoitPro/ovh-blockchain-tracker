#!/usr/bin/env tsx

/**
 * Background Worker — Tron Node Collection
 *
 * Fetches Tron network nodes from TronGrid, runs MaxMind ASN analysis,
 * and writes results to the `cache` table under key `tron-metrics`.
 *
 * Usage  : npx tsx scripts/worker-tron.ts
 * PM2    : started by `ovh-tron-worker` in ecosystem.config.js (every 2h)
 */

require('dotenv').config({ path: '.env.local' });
import { fetchTronNodes } from '../src/lib/tron/fetchNodes';
import { filterOVHTronNodes, categorizeTronNodesByProvider } from '../src/lib/tron/filterOVH';
import { calculateTronMetrics } from '../src/lib/tron/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { initMaxMind } from '../src/lib/asn/maxmind';
import { writeBenchmarkSnapshot } from '../src/lib/benchmark/snapshotRepository';

async function runTronWorker() {
    console.log('🔴 [Tron Worker] Starting Tron data collection...');
    console.log(`⏰ [Tron Worker] Timestamp: ${new Date().toISOString()}`);

    const startTime = Date.now();

    try {
        // 1. MaxMind (shared with other chains — idempotent init)
        console.log('📦 [Tron Worker] Initializing MaxMind...');
        await initMaxMind();
        console.log('✅ [Tron Worker] MaxMind ready');

        // 2. Fetch all Tron nodes
        console.log('📡 [Tron Worker] Fetching Tron nodes from TronGrid...');
        const allNodes = await fetchTronNodes();
        console.log(`✅ [Tron Worker] Nodes with valid IPv4: ${allNodes.length}`);

        // 3. Provider categorization
        console.log('🔍 [Tron Worker] Categorizing by provider...');
        const providerCategorization = await categorizeTronNodesByProvider(allNodes);

        // 4. OVH filter
        console.log('🔎 [Tron Worker] Finding OVH nodes...');
        const ovhNodes = await filterOVHTronNodes(allNodes);
        const pct = allNodes.length > 0 ? ((ovhNodes.length / allNodes.length) * 100).toFixed(2) : '0';
        console.log(`✅ [Tron Worker] OVH: ${ovhNodes.length} / ${allNodes.length} nodes (${pct}%)`);

        // 5. Metrics
        const metrics = calculateTronMetrics(allNodes, ovhNodes, providerCategorization);

        // 6. Cache (key: 'tron-metrics' — isolated from other chains)
        console.log('💾 [Tron Worker] Writing to cache...');
        await writeChainCache('tron', metrics, allNodes.length);

        try {
            await writeBenchmarkSnapshot('tron', metrics.totalNodes, metrics.providerBreakdown ?? []);
            console.log('📸 [Tron Worker] Benchmark snapshot saved');
        } catch (snapErr) {
            console.warn('⚠️  [Tron Worker] Failed to save benchmark snapshot:', snapErr);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [Tron Worker] Done in ${elapsed}s`);
        console.log(`📊 [Tron Worker] Market share: ${metrics.marketShare.toFixed(2)}%`);

        process.exit(0);
    } catch (err) {
        console.error('❌ [Tron Worker] Fatal error:', err);
        process.exit(1);
    }
}

runTronWorker();
