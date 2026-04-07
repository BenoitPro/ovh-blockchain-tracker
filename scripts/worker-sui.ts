#!/usr/bin/env tsx

/**
 * Background Worker — Sui Validator Collection
 *
 * Fetches Sui active validators, runs MaxMind ASN analysis,
 * and writes results to the `cache` table under key `sui-metrics`.
 *
 * Usage  : npx tsx scripts/worker-sui.ts
 * PM2    : started by `ovh-sui-worker` in ecosystem.config.js (every 2h)
 */

require('dotenv').config({ path: '.env.local' });
import { fetchSuiValidators } from '../src/lib/sui/fetchValidators';
import { filterOVHSuiNodes, categorizeSuiNodesByProvider } from '../src/lib/sui/filterOVH';
import { calculateSuiMetrics } from '../src/lib/sui/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';
import { initMaxMind } from '../src/lib/asn/maxmind';

async function runSuiWorker() {
    console.log('💧 [Sui Worker] Starting Sui data collection...');
    console.log(`⏰ [Sui Worker] Timestamp: ${new Date().toISOString()}`);

    const startTime = Date.now();

    try {
        // 1. MaxMind (shared with other chains — idempotent init)
        console.log('📦 [Sui Worker] Initializing MaxMind...');
        await initMaxMind();
        console.log('✅ [Sui Worker] MaxMind ready');

        // 2. Fetch validators (with DNS resolution for netAddress)
        console.log('📡 [Sui Worker] Fetching Sui validators...');
        const allValidators = await fetchSuiValidators();
        console.log(`✅ [Sui Worker] Validators fetched: ${allValidators.length}`);

        // 3. Provider categorization
        console.log('🔍 [Sui Worker] Categorizing by provider...');
        const providerCategorization = await categorizeSuiNodesByProvider(allValidators);

        // 4. OVH filter
        console.log('🔎 [Sui Worker] Finding OVH nodes...');
        const ovhNodes = await filterOVHSuiNodes(allValidators);
        const pct = allValidators.length > 0 ? ((ovhNodes.length / allValidators.length) * 100).toFixed(2) : '0';
        console.log(`✅ [Sui Worker] OVH: ${ovhNodes.length} / ${allValidators.length} validators (${pct}%)`);

        // 5. Metrics
        const metrics = calculateSuiMetrics(allValidators, ovhNodes, providerCategorization);

        // 6. Cache (key: 'sui-metrics' — isolated from other chains)
        console.log('💾 [Sui Worker] Writing to cache...');
        await writeChainCache('sui', metrics, allValidators.length);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [Sui Worker] Done in ${elapsed}s`);
        if (metrics.ovhVotingPowerShare !== undefined) {
            console.log(`📊 [Sui Worker] OVH voting power share: ${metrics.ovhVotingPowerShare.toFixed(2)}%`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ [Sui Worker] Fatal error:', err);
        process.exit(1);
    }
}

runSuiWorker();
