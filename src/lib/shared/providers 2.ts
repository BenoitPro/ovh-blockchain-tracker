/**
 * Shared provider identification logic.
 *
 * Used by all chain-specific filterOVH modules (Solana, Avalanche, Sui, …).
 * Add new providers here — changes propagate automatically to every chain.
 */

import { PROVIDER_ASN_MAP } from '@/lib/config/constants';

/**
 * Map an ASN + org name to a clean provider label (e.g. "OVHcloud", "AWS").
 * Priority:
 *   1. Strict ASN lookup against PROVIDER_ASN_MAP
 *   2. Fuzzy org-name matching (covers ISP name variants)
 *   3. Raw org name, or "Unknown Provider" as last resort
 */
export function identifyProvider(asn: string, orgName: string): string {
    // 1. Strict ASN mapping
    for (const [, info] of Object.entries(PROVIDER_ASN_MAP)) {
        if (info.asns.includes(asn)) return info.label;
    }

    // 2. Fuzzy org-name matching
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

    // 3. Fallback
    return orgName || 'Unknown Provider';
}
