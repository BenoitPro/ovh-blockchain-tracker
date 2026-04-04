import { TronNode, TronOVHNode, TronIPInfo, TronProviderCategorizationResult } from '@/types/tron';
export type { TronProviderCategorizationResult } from '@/types/tron';
import { logger } from '@/lib/utils';
import {
    initMaxMind,
    getASNFromMaxMind,
    getCountryFromMaxMind,
    isOVHIP,
    batchGetASN,
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';
import { identifyProvider } from '@/lib/shared/providers';


export async function filterOVHTronNodes(nodes: TronNode[]): Promise<TronOVHNode[]> {
    await initMaxMind();

    const ovhNodes: TronOVHNode[] = [];
    logger.info(`[Tron/MaxMind] Filtering ${nodes.length} nodes for OVH ASNs...`);

    for (const n of nodes) {
        if (!n.ip || !isOVHIP(n.ip, OVH_ASN_LIST)) continue;

        const asnInfo = getASNFromMaxMind(n.ip);
        if (!asnInfo) continue;

        const countryInfo = getCountryFromMaxMind(n.ip);

        const ipInfo: TronIPInfo = {
            ip: n.ip,
            asn: asnInfo.asn,
            org: asnInfo.org,
            country: countryInfo?.countryCode ?? 'Unknown',
            country_name: countryInfo?.country ?? 'Unknown',
            city: 'Unknown',
            lat: 0,
            lon: 0,
        };

        ovhNodes.push({
            ...n,
            ipInfo,
            provider: identifyProvider(asnInfo.asn, asnInfo.org),
        });
    }

    logger.info(`[Tron/MaxMind] Found ${ovhNodes.length} OVH Tron nodes`);
    return ovhNodes;
}

export async function categorizeTronNodesByProvider(
    nodes: TronNode[],
): Promise<TronProviderCategorizationResult> {
    await initMaxMind();

    const distribution: Record<string, number> = {};
    const othersBreakdown: Record<string, number> = {};
    const globalGeoDistribution: Record<string, number> = {};

    // Seed distribution
    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    logger.info(`[Tron/MaxMind] Categorising ${nodes.length} nodes by provider...`);

    const ips: string[] = [];
    for (const n of nodes) {
        if (n.ip) {
            ips.push(n.ip);
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
