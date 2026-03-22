import { SolanaNode, IPInfo, OVHNode, EnrichedNode } from '@/types';
import { extractIP } from './fetchNodes';
import { logger, RateLimiter } from '@/lib/utils';
import {
    initMaxMind,
    getASNFromMaxMind,
    getCountryFromMaxMind,
    isOVHIP,
    batchGetASN
} from '@/lib/asn/maxmind';
import { OVH_ASN_LIST, PROVIDER_ASN_MAP } from '@/lib/config/constants';

// Simple in-memory cache for geolocation data
const geoCache = new Map<string, IPInfo>();

// Rate limiter instance (1500ms delay for ip-api.com free tier: 45 req/min = 1.33s/req)
// Only used for geolocation of OVH nodes now
const rateLimiter = new RateLimiter(1500, 3);

/**
 * Get geolocation data from ip-api.com (used only for OVH nodes)
 * This is a fallback for geolocation data that MaxMind ASN DB doesn't provide
 */
async function getGeolocation(ip: string): Promise<Partial<IPInfo> | null> {
    // Check cache first
    if (geoCache.has(ip)) {
        return geoCache.get(ip)!;
    }

    try {
        const geoInfo = await rateLimiter.execute(async () => {
            const response = await fetch(
                `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,lat,lon`,
                {
                    method: 'GET',
                    headers: { 'User-Agent': 'OVH-Blockchain-Tracker/2.0-MaxMind' },
                    signal: AbortSignal.timeout(5000),
                }
            );

            if (!response.ok) {
                logger.warn(`Geolocation API failed for ${ip}: ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (data.status === 'fail') {
                logger.warn(`Geolocation API error for ${ip}:`, data.message);
                return null;
            }

            return {
                country: data.countryCode || 'Unknown',
                country_name: data.country || 'Unknown',
                city: data.city || 'Unknown',
                latitude: data.lat || 0,
                longitude: data.lon || 0,
            };
        });

        if (geoInfo) {
            geoCache.set(ip, geoInfo as IPInfo);
        }

        return geoInfo;
    } catch (error) {
        logger.error(`Error fetching geolocation for ${ip}:`, error);
        return null;
    }
}

/**
 * Get IP information using MaxMind (ASN) + ip-api.com (geolocation for OVH only)
 * This hybrid approach is 150x faster than the old method
 */
export async function getIPInfo(ip: string, includeGeolocation: boolean = false): Promise<IPInfo | null> {
    try {
        // Step 1: Get ASN from MaxMind (instant, offline)
        const asnInfo = getASNFromMaxMind(ip);

        if (!asnInfo) {
            return null;
        }

        // Step 2: Get geolocation only if requested (for OVH nodes)
        let geoInfo: Partial<IPInfo> | null = null;
        if (includeGeolocation) {
            geoInfo = await getGeolocation(ip);
        }

        // Combine ASN and geolocation data
        const result: IPInfo = {
            ip,
            asn: asnInfo.asn,
            org: asnInfo.org,
            country: geoInfo?.country || 'Unknown',
            country_name: geoInfo?.country_name || 'Unknown',
            city: geoInfo?.city || 'Unknown',
            latitude: geoInfo?.latitude || 0,
            longitude: geoInfo?.longitude || 0,
        };

        return result;
    } catch (error) {
        logger.error(`Error fetching IP info for ${ip}:`, error);
        return null;
    }
}

/**
 * Filter nodes by OVH ASN using MaxMind (ultra-fast)
 * Returns only nodes hosted on OVHcloud infrastructure
 */
export async function filterOVHNodes(nodes: SolanaNode[]): Promise<OVHNode[]> {
    const ovhNodes: OVHNode[] = [];

    logger.info(`[MaxMind] Filtering ${nodes.length} nodes for OVH infrastructure...`);

    // Helper to check if node has enriched data
    const isEnriched = (n: any): n is EnrichedNode => 'country' in n || 'countryName' in n;

    // Step 1: Filter and Enrich (Fast)
    for (const node of nodes) {
        const ip = extractIP(node.gossip);
        if (!ip) continue;

        // Check if IP belongs to OVH
        if (isOVHIP(ip, OVH_ASN_LIST)) {
            const asnInfo = getASNFromMaxMind(ip);
            if (asnInfo) {
                // Use existing enriched data if available, otherwise use MaxMind country lookup
                const enriched = isEnriched(node) ? node : null;
                const countryInfo = enriched?.country ? null : getCountryFromMaxMind(ip);

                ovhNodes.push({
                    ...node,
                    ipInfo: {
                        ip,
                        asn: asnInfo.asn,
                        org: asnInfo.org,
                        country: enriched?.country || countryInfo?.countryCode || 'Unknown',
                        country_name: enriched?.countryName || countryInfo?.country || 'Unknown',
                        city: enriched?.city || 'Unknown',
                        latitude: enriched?.latitude || 0,
                        longitude: enriched?.longitude || 0,
                    },
                    provider: identifyProvider(asnInfo.asn, asnInfo.org),
                    // Pass through enriched fields to OVHNode
                    activatedStake: enriched?.activatedStake,
                    commission: enriched?.commission,
                    votePubkey: enriched?.votePubkey,
                    countryName: enriched?.countryName,
                    name: enriched?.name,
                    image: enriched?.image
                });
            }
        }
    }

    logger.info(`[MaxMind] Found ${ovhNodes.length} OVH nodes`);
    return ovhNodes;
}

export interface ProviderCategorizationResult {
    distribution: Record<string, number>;
    othersBreakdown: Record<string, number>;
}

/**
 * Categorize all nodes by provider using MaxMind (ultra-fast)
 * This is 150x faster than the old ip-api.com method
 */
export async function categorizeNodesByProvider(
    nodes: SolanaNode[]
): Promise<ProviderCategorizationResult> {
    const distribution: Record<string, number> = {};
    const othersBreakdown: Record<string, number> = {};

    // Initialize distribution for all known providers
    for (const key of Object.keys(PROVIDER_ASN_MAP)) {
        distribution[key] = 0;
    }
    distribution.others = 0;

    logger.info(`[MaxMind] Categorizing ${nodes.length} nodes by provider...`);

    // Extract all IPs
    const ips: string[] = [];
    for (const node of nodes) {
        const ip = extractIP(node.gossip);
        if (ip) {
            ips.push(ip);
        } else {
            distribution.others++;
        }
    }

    // Batch process all IPs with MaxMind
    const asnResults = batchGetASN(ips);

    // Categorize by ASN
    for (const asnInfo of asnResults.values()) {
        let categorized = false;

        for (const [provider, providerInfo] of Object.entries(PROVIDER_ASN_MAP)) {
            if (providerInfo.asns.includes(asnInfo.asn)) {
                distribution[provider]++;
                categorized = true;
                break;
            }
        }

        if (!categorized) {
            distribution.others++;
            const org = asnInfo.org || 'Unknown Provider';
            othersBreakdown[org] = (othersBreakdown[org] || 0) + 1;
        }
    }

    logger.debug(`[MaxMind] Provider distribution:`, distribution);

    return { distribution, othersBreakdown };
}


/**
 * Identify the provider from ASN or Organiztion name
 * Maps raw ASN/Org to clean labels (e.g. "OVHcloud", "AWS", "Hetzner")
 */
export function identifyProvider(asn: string, orgName: string): string {
    // 1. Check strict ASN mapping
    for (const [key, info] of Object.entries(PROVIDER_ASN_MAP)) {
        if (info.asns.includes(asn)) {
            return info.label;
        }
    }

    // 2. Fallback to flexible string matching on Org Name
    const lowerOrg = orgName.toLowerCase();

    if (lowerOrg.includes('amazon') || lowerOrg.includes('aws')) return 'AWS';
    if (lowerOrg.includes('google')) return 'Google Cloud';
    if (lowerOrg.includes('hetzner')) return 'Hetzner';
    if (lowerOrg.includes('digitalocean') || lowerOrg.includes('digital ocean')) return 'DigitalOcean';
    if (lowerOrg.includes('ovh')) return 'OVHcloud';
    if (lowerOrg.includes('alibaba')) return 'Alibaba Cloud';
    if (lowerOrg.includes('oracle')) return 'Oracle Cloud';
    if (lowerOrg.includes('microsoft') || lowerOrg.includes('azure')) return 'Azure';
    if (lowerOrg.includes('latitude') || lowerOrg.includes('maxihost')) return 'Latitude.sh';
    if (lowerOrg.includes('equinix') || lowerOrg.includes('packet')) return 'Equinix';
    if (lowerOrg.includes('vultr') || lowerOrg.includes('choopa')) return 'Vultr';
    if (lowerOrg.includes('contabo')) return 'Contabo';
    if (lowerOrg.includes('linode') || lowerOrg.includes('akamai')) return 'Linode (Akamai)';

    // 3. Fallback to original Org Name or Unknown
    return orgName || 'Unknown Provider';
}

/**
 * Clear geolocation cache (useful for testing)
 */
export function clearIPCache(): void {
    geoCache.clear();
}
