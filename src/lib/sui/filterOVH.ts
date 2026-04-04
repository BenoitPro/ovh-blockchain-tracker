import { SuiValidator, SuiOVHNode, SuiIPInfo } from '@/types/sui';
import { logger } from '@/lib/utils';
import {
    initMaxMind,
    getASNFromMaxMind,
    getCountryFromMaxMind,
    isOVHIP,
    batchGetASN,
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';

// Provider identification logic (shared with other chains)
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
    return orgName || 'Unknown Provider';
}

export async function filterOVHSuiNodes(validators: SuiValidator[]): Promise<SuiOVHNode[]> {
    await initMaxMind();

    const ovhNodes: SuiOVHNode[] = [];
    logger.info(`[Sui/MaxMind] Filtering ${validators.length} validators for OVH ASNs...`);

    for (const v of validators) {
        if (!v.ip || !isOVHIP(v.ip, OVH_ASN_LIST)) continue;

        const asnInfo = getASNFromMaxMind(v.ip);
        if (!asnInfo) continue;

        const countryInfo = getCountryFromMaxMind(v.ip);

        const ipInfo: SuiIPInfo = {
            ip: v.ip,
            asn: asnInfo.asn,
            org: asnInfo.org,
            country: countryInfo?.countryCode ?? 'Unknown',
            country_name: countryInfo?.country ?? 'Unknown',
            city: 'Unknown',
            lat: 0,
            lon: 0,
        };

        ovhNodes.push({
            ...v,
            ipInfo,
            provider: identifyProvider(asnInfo.asn, asnInfo.org),
        });
    }

    logger.info(`[Sui/MaxMind] Found ${ovhNodes.length} OVH Sui validators`);
    return ovhNodes;
}

export interface SuiProviderCategorizationResult {
    distribution: Record<string, number>;
    othersBreakdown: Record<string, number>;
    globalGeoDistribution: Record<string, number>;
}

export async function categorizeSuiNodesByProvider(
    validators: SuiValidator[],
): Promise<SuiProviderCategorizationResult> {
    await initMaxMind();

    const distribution: Record<string, number> = {};
    const othersBreakdown: Record<string, number> = {};
    const globalGeoDistribution: Record<string, number> = {};

    // Seed distribution
    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    logger.info(`[Sui/MaxMind] Categorising ${validators.length} validators by provider...`);

    const ips: string[] = [];
    for (const v of validators) {
        if (v.ip) {
            ips.push(v.ip);
        } else {
            distribution.others++;
        }
    }

    const asnResults = batchGetASN(ips);

    for (const ip of ips) {
        const countryInfo = getCountryFromMaxMind(ip);
        if (countryInfo?.countryCode) {
            globalGeoDistribution[countryInfo.countryCode] =
                (globalGeoDistribution[countryInfo.countryCode] ?? 0) + 1;
        }

        const asnInfo = asnResults.get(ip);
        if (!asnInfo) {
            distribution.others++;
            continue;
        }

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

    return { distribution, othersBreakdown, globalGeoDistribution };
}
