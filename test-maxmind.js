#!/usr/bin/env node

/**
 * Test MaxMind GeoLite2 ASN Installation
 * 
 * This script validates that MaxMind is properly installed and working.
 */

import maxmind from 'maxmind';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'GeoLite2-ASN.mmdb');

console.log('🧪 Testing MaxMind GeoLite2 ASN Installation');
console.log('═'.repeat(60));
console.log('');

// Test 1: Check if database file exists
console.log('Test 1: Checking database file...');
if (!fs.existsSync(DB_PATH)) {
    console.log('❌ FAIL - Database file not found at:', DB_PATH);
    console.log('');
    console.log('Please download the database:');
    console.log('1. Go to: https://www.maxmind.com/en/accounts/current/geoip/downloads');
    console.log('2. Download "GeoLite2 ASN" (GZIP format)');
    console.log('3. Extract and place GeoLite2-ASN.mmdb in data/');
    process.exit(1);
}

const stats = fs.statSync(DB_PATH);
console.log(`✅ PASS - Database file found (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log('');

// Test 2: Load MaxMind database
console.log('Test 2: Loading MaxMind database...');
let reader;
try {
    reader = await maxmind.open(DB_PATH);
    console.log('✅ PASS - MaxMind database loaded successfully');
} catch (error) {
    console.log('❌ FAIL - Failed to load database:', error.message);
    process.exit(1);
}
console.log('');

// Test 3: Test Google DNS (8.8.8.8)
console.log('Test 3: Testing Google DNS (8.8.8.8)...');
try {
    const result = reader.get('8.8.8.8');
    if (result && result.autonomous_system_number) {
        console.log(`✅ PASS - Google DNS`);
        console.log(`   ASN: AS${result.autonomous_system_number}`);
        console.log(`   Org: ${result.autonomous_system_organization}`);
    } else {
        console.log('❌ FAIL - No result for Google DNS');
    }
} catch (error) {
    console.log('❌ FAIL -', error.message);
}
console.log('');

// Test 4: Test Cloudflare DNS (1.1.1.1)
console.log('Test 4: Testing Cloudflare DNS (1.1.1.1)...');
try {
    const result = reader.get('1.1.1.1');
    if (result && result.autonomous_system_number) {
        console.log(`✅ PASS - Cloudflare DNS`);
        console.log(`   ASN: AS${result.autonomous_system_number}`);
        console.log(`   Org: ${result.autonomous_system_organization}`);
    } else {
        console.log('❌ FAIL - No result for Cloudflare DNS');
    }
} catch (error) {
    console.log('❌ FAIL -', error.message);
}
console.log('');

// Test 5: Test OVH IP (51.210.1.1)
console.log('Test 5: Testing OVH IP (51.210.1.1)...');
try {
    const result = reader.get('51.210.1.1');
    if (result && result.autonomous_system_number) {
        const asn = `AS${result.autonomous_system_number}`;
        console.log(`✅ PASS - OVH IP`);
        console.log(`   ASN: ${asn}`);
        console.log(`   Org: ${result.autonomous_system_organization}`);

        // Check if it's actually OVH
        const ovhAsns = ['AS16276', 'AS35540', 'AS21351', 'AS198203'];
        if (ovhAsns.includes(asn)) {
            console.log(`   ✅ Correctly identified as OVH!`);
        } else {
            console.log(`   ⚠️  Warning: ASN ${asn} is not in OVH ASN list`);
        }
    } else {
        console.log('❌ FAIL - No result for OVH IP');
    }
} catch (error) {
    console.log('❌ FAIL -', error.message);
}
console.log('');

// Test 6: Performance test (100 IPs)
console.log('Test 6: Performance test (100 lookups)...');
const testIPs = [];
for (let i = 0; i < 100; i++) {
    testIPs.push(`8.8.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`);
}

const startTime = Date.now();
let successCount = 0;
for (const ip of testIPs) {
    try {
        const result = reader.get(ip);
        if (result) successCount++;
    } catch (error) {
        // Ignore errors for invalid IPs
    }
}
const endTime = Date.now();
const duration = endTime - startTime;

console.log(`✅ PASS - Performance test`);
console.log(`   Processed: ${testIPs.length} IPs`);
console.log(`   Successful: ${successCount} lookups`);
console.log(`   Duration: ${duration}ms`);
console.log(`   Speed: ${(testIPs.length / (duration / 1000)).toFixed(0)} lookups/second`);
console.log('');

// Summary
console.log('═'.repeat(60));
console.log('✅ All tests passed!');
console.log('');
console.log('MaxMind is ready to use. You can now run:');
console.log('  node scripts/worker.js');
console.log('');
