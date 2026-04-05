#!/usr/bin/env tsx

/**
 * Background Worker — Avalanche Peer Collection
 *
 * Fetches Avalanche Primary Network peers, runs MaxMind ASN analysis,
 * and writes results to the `cache` table under key `avalanche-metrics`.
 *
 * Usage  : npx tsx scripts/worker-avax.ts
 * PM2    : started by `ovh-avax-worker` in ecosystem.config.js (every 2h)
 */

require('dotenv').config({ path: '.env.local' });
import { fetchAvalanchePeers, fetchAvalancheValidatorCount } from '../src/lib/avalanche/fetchPeers';
import { filterOVHAvalancheNodes, categorizeAvalancheNodesByProvider } from '../src/lib/avalanche/filterOVH';
import { calculateAvalancheMetrics } from '../src/lib/avalanche/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { initMaxMind } from '../src/lib/asn/maxmind';

async function runAvaxWorker() {
    console.log('🔺 [AVAX Worker] Starting Avalanche data collection...');
    console.log(`⏰ [AVAX Worker] Timestamp: ${new Date().toISOString()}`);

    const startTime = Date.now();

    try {
        // 1. MaxMind (shared with Solana/Ethereum — idempotent init)
        console.log('📦 [AVAX Worker] Initializing MaxMind...');
        await initMaxMind();
        console.log('✅ [AVAX Worker] MaxMind ready');

        // 2. Fetch peers (IP-resolvable) + canonical validator count in parallel
        console.log('📡 [AVAX Worker] Fetching Avalanche peers + canonical validator count...');
        const [allNodes, totalValidators] = await Promise.all([
            fetchAvalanchePeers(),
            fetchAvalancheValidatorCount(),
        ]);
        console.log(`✅ [AVAX Worker] Peers with IP: ${allNodes.length} | Canonical validators (P-Chain): ${totalValidators}`);

        // 3. Provider categorization
        console.log('🔍 [AVAX Worker] Categorizing by provider...');
        const providerCategorization = await categorizeAvalancheNodesByProvider(allNodes);

        // 4. OVH filter
        console.log('🔎 [AVAX Worker] Finding OVH nodes...');
        const ovhNodes = await filterOVHAvalancheNodes(allNodes);
        const pct = allNodes.length > 0 ? ((ovhNodes.length / allNodes.length) * 100).toFixed(2) : '0';
        console.log(`✅ [AVAX Worker] OVH: ${ovhNodes.length} / ${allNodes.length} peers (${pct}%)`);

        // 5. Metrics
        const metrics = calculateAvalancheMetrics(allNodes, ovhNodes, providerCategorization, totalValidators);

        // 6. Cache (key: 'avalanche-metrics' — isolated from Solana)
        console.log('💾 [AVAX Worker] Writing to cache...');
        await writeChainCache('avalanche', metrics, allNodes.length);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [AVAX Worker] Done in ${elapsed}s`);
        if (metrics.avgOVHUptime !== undefined) {
            console.log(`📊 [AVAX Worker] Avg OVH uptime: ${metrics.avgOVHUptime.toFixed(1)}%`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ [AVAX Worker] Fatal error:', err);
        process.exit(1);
    }
}

runAvaxWorker();
