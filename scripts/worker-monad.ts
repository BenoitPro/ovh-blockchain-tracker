#!/usr/bin/env tsx

/**
 * Background Worker — Monad Validator Collection
 *
 * Scrapes gmonads.com public API for Monad validator data (country, city, stake).
 * No MaxMind/ASN lookup — OVH detection not available for Monad (requires MonadBFT crawler).
 *
 * Usage  : npx tsx scripts/worker-monad.ts
 * PM2    : ovh-monad-worker in ecosystem.config.js (every 2h)
 */

require('dotenv').config({ path: '.env.local' });
import { fetchMonadValidators } from '../src/lib/monad/fetchValidators';
import { calculateMonadMetrics } from '../src/lib/monad/calculateMetrics';
import { writeChainCache } from '../src/lib/cache/chain-storage';

async function runMonadWorker() {
    console.log('🟣 [Monad Worker] Starting Monad data collection...');
    console.log(`⏰ [Monad Worker] Timestamp: ${new Date().toISOString()}`);

    const startTime = Date.now();

    try {
        console.log('📡 [Monad Worker] Fetching validators from gmonads.com...');
        const validators = await fetchMonadValidators();
        console.log(`✅ [Monad Worker] Fetched ${validators.length} validators`);

        if (!validators.length) {
            throw new Error('No validators returned from gmonads.com — aborting cache write');
        }

        console.log('📊 [Monad Worker] Calculating metrics...');
        const metrics = calculateMonadMetrics(validators);

        console.log('💾 [Monad Worker] Writing to cache...');
        await writeChainCache('monad', metrics, validators.length);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ [Monad Worker] Done in ${elapsed}s`);
        console.log(`📊 [Monad Worker] ${metrics.activeValidators}/${metrics.totalValidators} active | ${metrics.countryCount} countries`);

        process.exit(0);
    } catch (err) {
        console.error('❌ [Monad Worker] Fatal error:', err);
        process.exit(1);
    }
}

runMonadWorker();
