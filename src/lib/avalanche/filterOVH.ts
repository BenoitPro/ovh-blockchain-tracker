import { AvalancheNode, AvalancheIPInfo, AvalancheOVHNode } from '@/types';
import { extractAvalancheIP } from './fetchPeers';
import { logger } from '@/lib/utils';
import {
    initMaxMind,
    getASNFromMaxMind,
    getCountryFromMaxMind,
    isOVHIP,
    batchGetASN,
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';

// ── Provider identification (shared logic, same as Solana) ───────────────────

function identifyProvider(asn: string, orgName: string): string {
    for (const [, info] of Object.entries(PROVIDER_ASN_MAP)) {
        if (info.asns.includes(asn)) return info.label;
    }
    const o = orgName.toLowerCase();
    if (o.includes('amazon') || o.includes('aws')) return 'AWS';
    if (o.includes('google')) return 'Google Cloud';
    if (o.includes('hetzner')) return 'Hetzner';
    if (o.includes('digitalocean') || o.includes('digital ocean')) return 'DigitalOcean';
    if (o.includes('ovh')) return 'OVHcloud';
    if (o.includes('alibaba')) return 'Alibaba Cloud';
    if (o.includes('oracle')) return 'Oracle Cloud';
    if (o.includes('microsoft') || o.includes('azure')) return 'Azure';
    if (o.includes('latitude') || o.includes('maxihost')) return 'Latitude.sh';
    if (o.includes('equinix') || o.includes('packet')) return 'Equinix';
    if (o.includes('vultr') || o.includes('choopa')) return 'Vultr';
    if (o.includes('contabo')) return 'Contabo';
    if (o.includes('linode') || o.includes('akamai')) return 'Linode (Akamai)';
    return orgName || 'Unknown Provider';
}

// ── OVH filter ────────────────────────────────────────────────────────────────

/**
 * Filter Avalanche nodes that are hosted on OVHcloud infrastructure.
 * Uses MaxMind ASN lookup (offline, instant) — identical approach to Solana.
 */
export async function filterOVHAvalancheNodes(nodes: AvalancheNode[]): Promise<AvalancheOVHNode[]> {
    await initMaxMind();

    const ovhNodes: AvalancheOVHNode[] = [];

    logger.info(`[Avalanche/MaxMind] Filtering ${nodes.length} peers for OVH ASNs...`);

    for (const node of nodes) {
        const ip = extractAvalancheIP(node.ip);
        if (!ip) continue;

        if (!isOVHIP(ip, OVH_ASN_LIST)) continue;

        const asnInfo = getASNFromMaxMind(ip);
        if (!asnInfo) continue;

        const countryInfo = getCountryFromMaxMind(ip);

        const ipInfo: AvalancheIPInfo = {
            ip,
            asn: asnInfo.asn,
            org: asnInfo.org,
            country: countryInfo?.countryCode ?? 'Unknown',
            country_name: countryInfo?.country ?? 'Unknown',
            city: 'Unknown', // MaxMind ASN DB doesn't include city
            latitude: 0,
            longitude: 0,
        };

        ovhNodes.push({
            ...node,
            ipInfo,
            provider: identifyProvider(asnInfo.asn, asnInfo.org),
        });
    }

    logger.info(`[Avalanche/MaxMind] Found ${ovhNodes.length} OVH Avalanche peers`);
    return ovhNodes;
}

// ── Provider categorisation ───────────────────────────────────────────────────

export interface AvalancheProviderCategorizationResult {
    distribution: Record<string, number>;
    othersBreakdown: Record<string, number>;
    globalGeoDistribution: Record<string, number>;
}

/**
 * Categorize all Avalanche nodes by cloud provider using MaxMind (offline).
 * Pattern identical to `categorizeNodesByProvider` in lib/solana/filterOVH.ts.
 */
export async function categorizeAvalancheNodesByProvider(
    nodes: AvalancheNode[],
): Promise<AvalancheProviderCategorizationResult> {
    await initMaxMind();

    const distribution: Record<string, number> = {};
    const othersBreakdown: Record<string, number> = {};
    const globalGeoDistribution: Record<string, number> = {};

    // Seed with zeros for known providers
    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    logger.info(`[Avalanche/MaxMind] Categorising ${nodes.length} peers by provider...`);

    const ips: string[] = [];
    for (const node of nodes) {
        const ip = extractAvalancheIP(node.ip);
        if (ip) {
            ips.push(ip);
        } else {
            distribution.others++;
        }
    }

    // Batch MaxMind lookup
    const asnResults = batchGetASN(ips);

    // Global geo distribution
    for (const ip of ips) {
        const countryInfo = getCountryFromMaxMind(ip);
        if (countryInfo?.countryCode) {
            globalGeoDistribution[countryInfo.countryCode] =
                (globalGeoDistribution[countryInfo.countryCode] ?? 0) + 1;
        }
    }

    // Categorise
    for (const asnInfo of asnResults.values()) {
        let matched = false;
        for (const [provider, providerInfo] of Object.entries(PROVIDER_ASN_MAP)) {
            if (providerInfo.asns.includes(asnInfo.asn)) {
                distribution[provider]++;
                matched = true;
                break;
            }
        }
        if (!matched) {
            distribution.others++;
            const org = asnInfo.org ?? 'Unknown Provider';
            othersBreakdown[org] = (othersBreakdown[org] ?? 0) + 1;
        }
    }

    logger.debug('[Avalanche/MaxMind] Provider distribution:', distribution);
    return { distribution, othersBreakdown, globalGeoDistribution };
}
