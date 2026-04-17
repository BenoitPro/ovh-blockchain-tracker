#!/usr/bin/env node

/**
 * MaxMind GeoLite2 Database Downloader (ASN + Country)
 * 
 * This script automatically downloads and extracts:
 * - GeoLite2-ASN.mmdb
 * - GeoLite2-Country.mmdb
 * 
 * Requirements:
 * - MaxMind license key (free account)
 * - Set MAXMIND_LICENSE_KEY in .env.local
 */

import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import tar from 'tar-stream';
import { createGunzip } from 'zlib';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;
const DATA_DIR = path.join(process.cwd(), 'data');

const DATABASES = [
    {
        name: 'GeoLite2-ASN',
        filename: 'GeoLite2-ASN.mmdb',
        url: `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-ASN&license_key=${LICENSE_KEY}&suffix=tar.gz`
    },
    {
        name: 'GeoLite2-Country',
        filename: 'GeoLite2-Country.mmdb',
        url: `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${LICENSE_KEY}&suffix=tar.gz`
    }
];

/**
 * Check if license key is set
 */
function checkLicenseKey() {
    if (!LICENSE_KEY) {
        console.warn('⚠️  Warning: MAXMIND_LICENSE_KEY not found. Skipping database download.');
        console.warn('💡 Tip: Set MAXMIND_LICENSE_KEY in your environment variables to enable ultra-fast IP lookups.');
        return false;
    }
    return true;
}

/**
 * Create data directory
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log(`✅ Created directory: ${DATA_DIR}`);
    }
}

/**
 * Download and extract a single MaxMind database
 */
async function downloadDatabase(db) {
    console.log(`📥 Downloading ${db.name}...`);
    const dbPath = path.join(DATA_DIR, db.filename);

    try {
        const response = await fetch(db.url);

        if (!response.ok) {
            throw new Error(`Download failed with status ${response.status}`);
        }

        const extract = tar.extract();
        let mmdbFound = false;

        extract.on('entry', (header, stream, next) => {
            if (header.name.endsWith('.mmdb')) {
                console.log(`📦 Extracting: ${header.name}`);
                mmdbFound = true;
                const writeStream = createWriteStream(dbPath);
                stream.pipe(writeStream);
                writeStream.on('finish', () => {
                    console.log(`✅ Saved to: ${dbPath}`);
                    next();
                });
                writeStream.on('error', (err) => next(err));
            } else {
                stream.on('end', () => next());
                stream.resume();
            }
        });

        await pipeline(
            Readable.fromWeb(response.body),
            createGunzip(),
            extract
        );

        if (!mmdbFound) {
            console.error(`❌ Error: .mmdb file not found in ${db.name} archive`);
        }
    } catch (error) {
        console.error(`❌ Failed to download ${db.name}:`, error.message);
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 MaxMind Database Downloader');
    console.log('═'.repeat(60));

    if (!checkLicenseKey()) {
        console.warn('⚠️  Skipping download steps as no license key is available.');
        return;
    }
    
    ensureDataDir();

    for (const db of DATABASES) {
        if (fs.existsSync(path.join(DATA_DIR, db.filename))) {
            console.log(`⚠️  ${db.filename} already exists. Skipping...`);
            continue;
        }
        await downloadDatabase(db);
    }

    console.log('\n✅ All databases processed!');
}

main().catch(console.error);
