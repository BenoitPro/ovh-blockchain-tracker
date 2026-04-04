/**
 * MaxMind GeoLite2 ASN Resolution
 * 
 * This module provides ultra-fast IP → ASN resolution using MaxMind GeoLite2 ASN database.
 * 
 * Performance: ~1ms per IP lookup (vs 1500ms with ip-api.com)
 * 
 * Setup:
 * 1. npm install maxmind
 * 2. Download GeoLite2-ASN.mmdb from MaxMind
 * 3. Place it in /data/GeoLite2-ASN.mmdb
 */

import maxmind, { AsnResponse, CountryResponse, Reader } from 'maxmind';
import { IPInfo } from '@/types';
import path from 'path';
import fs from 'fs';
import { logger } from '@/lib/utils';

// Path to MaxMind database
const ASN_DB_PATH = path.join(process.cwd(), 'data', 'GeoLite2-ASN.mmdb');
const COUNTRY_DB_PATH = path.join(process.cwd(), 'data', 'GeoLite2-Country.mmdb');

// Singleton reader instances persisted across HMR reloads
const globalForMaxMind = globalThis as unknown as {
    asnReader: Reader<AsnResponse> | undefined;
    countryReader: Reader<CountryResponse> | undefined;
};

// Access readers through global property to avoid leaks during dev reloads
let asnReader: Reader<AsnResponse> | undefined = globalForMaxMind.asnReader;
let countryReader: Reader<CountryResponse> | undefined = globalForMaxMind.countryReader;

/**
 * Initialize MaxMind readers (call once at startup)
 */
export async function initMaxMind(): Promise<void> {
    const globalContext = globalThis as any;
    if (globalContext.asnReader && globalContext.countryReader) return; // Already initialized

    try {
        // Initialize ASN Reader
        if (fs.existsSync(ASN_DB_PATH) && !globalContext.asnReader) {
            globalContext.asnReader = await maxmind.open<AsnResponse>(ASN_DB_PATH);
            logger.success('MaxMind GeoLite2 ASN database loaded');
        } else if (!fs.existsSync(ASN_DB_PATH)) {
            logger.warn(`MaxMind ASN database missing at ${ASN_DB_PATH}`);
        }

        // Initialize Country Reader
        if (fs.existsSync(COUNTRY_DB_PATH) && !globalContext.countryReader) {
            globalContext.countryReader = await maxmind.open<CountryResponse>(COUNTRY_DB_PATH);
            logger.success('MaxMind GeoLite2 Country database loaded');
        } else if (!fs.existsSync(COUNTRY_DB_PATH)) {
            logger.warn(`MaxMind Country database missing at ${COUNTRY_DB_PATH}`);
        }
    } catch (error) {
        logger.error('Failed to load MaxMind database:', error);
    }
}

/**
 * Get ASN information from IP using MaxMind (ultra-fast, offline)
 */
export function getASNFromMaxMind(ip: string): { asn: string; org: string } | null {
    const reader = (globalThis as any).asnReader;
    if (!reader) return null;

    try {
        const response = reader.get(ip);

        if (!response || !response.autonomous_system_number) {
            return null;
        }

        return {
            asn: `AS${response.autonomous_system_number}`,
            org: response.autonomous_system_organization || 'Unknown',
        };
    } catch (error) {
        return null;
    }
}

/**
 * Get Country information from IP using MaxMind (ultra-fast, offline)
 */
export function getCountryFromMaxMind(ip: string): { country: string; countryCode: string } | null {
    const reader = (globalThis as any).countryReader;
    if (!reader) return null;

    try {
        const response = reader.get(ip);

        if (!response || !response.country) {
            return null;
        }

        return {
            country: response.country.names.en,
            countryCode: response.country.iso_code,
        };
    } catch (error) {
        return null;
    }
}

/**
 * Check if an IP belongs to OVHcloud using MaxMind
 */
export function isOVHIP(ip: string, ovhAsnList: string[] = ['AS16276', 'AS35540', 'AS21351', 'AS198203']): boolean {
    const asnInfo = getASNFromMaxMind(ip);

    if (!asnInfo) {
        return false;
    }

    return ovhAsnList.includes(asnInfo.asn);
}

/**
 * Batch process multiple IPs (ultra-fast)
 */
export function batchGetASN(ips: string[]): Map<string, { asn: string; org: string }> {
    const results = new Map<string, { asn: string; org: string }>();

    for (const ip of ips) {
        const asnInfo = getASNFromMaxMind(ip);
        if (asnInfo) {
            results.set(ip, asnInfo);
        }
    }

    return results;
}

/**
 * Batch process multiple IPs for Country (ultra-fast)
 */
export function batchGetCountry(ips: string[]): Map<string, { country: string; countryCode: string }> {
    const results = new Map<string, { country: string; countryCode: string }>();

    for (const ip of ips) {
        const countryInfo = getCountryFromMaxMind(ip);
        if (countryInfo) {
            results.set(ip, countryInfo);
        }
    }

    return results;
}

/**
 * Get full IP info (ASN from MaxMind + Geolocation from ip-api.com)
 */
export async function getIPInfoHybrid(ip: string): Promise<IPInfo | null> {
    // Step 1: Get ASN and Country from MaxMind (instant, offline)
    const asnInfo = getASNFromMaxMind(ip);
    const countryInfo = getCountryFromMaxMind(ip);

    if (!asnInfo) {
        return null;
    }

    // Step 2: Get detailed geolocation from ip-api.com (only if needed for city/coordinates)
    // We try to avoid this for lists, but use it for details
    try {
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,city,lat,lon`,
            {
                headers: { 'User-Agent': 'OVH-Blockchain-Tracker/2.0' },
                signal: AbortSignal.timeout(5000),
            }
        );

        const data = response.ok ? await response.json() : {};

        return {
            ip,
            asn: asnInfo.asn,
            org: asnInfo.org,
            country: countryInfo?.countryCode || 'Unknown',
            country_name: countryInfo?.country || 'Unknown',
            city: data.city || 'Unknown',
            latitude: data.lat || 0,
            longitude: data.lon || 0,
        };
    } catch (error) {
        // Fallback: return MaxMind info
        return {
            ip,
            asn: asnInfo.asn,
            org: asnInfo.org,
            country: countryInfo?.countryCode || 'Unknown',
            country_name: countryInfo?.country || 'Unknown',
            city: 'Unknown',
            latitude: 0,
            longitude: 0,
        };
    }
}

/**
 * Close MaxMind readers (call on shutdown)
 */
export function closeMaxMind(): void {
    globalForMaxMind.asnReader = undefined;
    globalForMaxMind.countryReader = undefined;
    asnReader = undefined;
    countryReader = undefined;
    logger.success('MaxMind readers closed');
}
