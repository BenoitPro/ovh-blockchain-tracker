import { logger } from '@/lib/utils';
import {
    initMaxMind,
    getASNFromMaxMind,
    getCountryFromMaxMind,
    isOVHIP,
    batchGetASN,
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';

export interface OVHNodeEnrichment {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
}

export interface ProviderCategorizationResult {
    distribution: Record<string, number>;
    othersBreakdown: Record<string, number>;
    globalGeoDistribution: Record<string, number>;
    /** Per-provider sum of a numeric node value (e.g. stake). Present only when extractValue was provided. */
    valueDistribution?: Record<string, number>;
    /** Total of the numeric value across all nodes. Present only when extractValue was provided. */
    totalValue?: number;
}

/**
 * Generic OVH filter — returns enrichment data for each node on OVH infrastructure.
 * Chain-specific functions wrap this to build their own typed output.
 *
 * @param nodes       Array of raw nodes (any type)
 * @param extractIP   Chain-specific IP extractor
 * @param chainLabel  Label for log messages (e.g. "Avalanche")
 */
export async function filterOVHNodesByASN<T>(
    nodes: T[],
    extractIP: (node: T) => string | null,
    chainLabel: string = 'Chain',
): Promise<Array<{ node: T; enrichment: OVHNodeEnrichment }>> {
    await initMaxMind();

    const results: Array<{ node: T; enrichment: OVHNodeEnrichment }> = [];
    logger.info(`[${chainLabel}/MaxMind] Filtering ${nodes.length} nodes for OVH ASNs...`);

    for (const node of nodes) {
        const ip = extractIP(node);
        if (!ip) continue;
        if (!isOVHIP(ip, OVH_ASN_LIST)) continue;

        const asnInfo = getASNFromMaxMind(ip);
        if (!asnInfo) continue;

        const countryInfo = getCountryFromMaxMind(ip);

        results.push({
            node,
            enrichment: {
                ip,
                asn: asnInfo.asn,
                org: asnInfo.org,
                country: countryInfo?.countryCode ?? 'Unknown',
                country_name: countryInfo?.country ?? 'Unknown',
            },
        });
    }

    logger.info(`[${chainLabel}/MaxMind] Found ${results.length} OVH nodes`);
    return results;
}

/**
 * Generic provider categorization — fully identical logic across all RPC chains.
 *
 * @param nodes      Array of raw nodes (any type)
 * @param extractIP  Chain-specific IP extractor
 * @param chainLabel Label for log messages
 */
export async function categorizeByProvider<T>(
    nodes: T[],
    extractIP: (node: T) => string | null,
    chainLabel: string = 'Chain',
    extractValue?: (node: T) => number,
): Promise<ProviderCategorizationResult> {
    await initMaxMind();

    const distribution: Record<string, number> = {};
    const othersBreakdown: Record<string, number> = {};
    const globalGeoDistribution: Record<string, number> = {};
    const valueDistribution: Record<string, number> = {};
    let totalValue = 0;

    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    logger.info(`[${chainLabel}/MaxMind] Categorising ${nodes.length} nodes by provider...`);

    // Build ip→node map to retrieve node when accumulating values
    const ipToNode = new Map<string, T>();
    const ips: string[] = [];
    for (const node of nodes) {
        const ip = extractIP(node);
        if (ip) {
            ips.push(ip);
            ipToNode.set(ip, node);
        } else {
            distribution.others++;
            if (extractValue) {
                const val = extractValue(node);
                totalValue += val;
                valueDistribution['others'] = (valueDistribution['others'] ?? 0) + val;
            }
        }
    }

    const asnResults = batchGetASN(ips);

    for (const ip of ips) {
        const node = ipToNode.get(ip);
        const val = extractValue && node ? extractValue(node) : 0;
        if (extractValue) totalValue += val;

        const countryInfo = getCountryFromMaxMind(ip);
        if (countryInfo?.countryCode) {
            globalGeoDistribution[countryInfo.countryCode] =
                (globalGeoDistribution[countryInfo.countryCode] ?? 0) + 1;
        }

        const asnInfo = asnResults.get(ip);
        if (!asnInfo) {
            distribution.others++;
            if (extractValue) valueDistribution['others'] = (valueDistribution['others'] ?? 0) + val;
            continue;
        }

        let matched = false;
        for (const [provider, providerInfo] of Object.entries(PROVIDER_ASN_MAP)) {
            if (providerInfo.asns.includes(asnInfo.asn)) {
                distribution[provider]++;
                if (extractValue) valueDistribution[provider] = (valueDistribution[provider] ?? 0) + val;
                matched = true;
                break;
            }
        }
        if (!matched) {
            distribution.others++;
            if (extractValue) valueDistribution['others'] = (valueDistribution['others'] ?? 0) + val;
            const org = asnInfo.org ?? 'Unknown Provider';
            othersBreakdown[org] = (othersBreakdown[org] ?? 0) + 1;
        }
    }

    logger.debug(`[${chainLabel}/MaxMind] Provider distribution:`, distribution);
    const result: ProviderCategorizationResult = { distribution, othersBreakdown, globalGeoDistribution };
    if (extractValue) {
        result.valueDistribution = valueDistribution;
        result.totalValue = totalValue;
    }
    return result;
}
