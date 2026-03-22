export interface SolanaNode {
    pubkey: string;
    gossip: string | null;
    tpu: string | null;
    rpc: string | null;
    version: string | null;
}

export interface IPInfo {
    ip: string;
    asn: string;
    org: string;
    country: string;
    country_name: string;
    city: string;
    latitude: number;
    longitude: number;
}

export interface OVHNode extends SolanaNode {
    ipInfo: IPInfo;
    // Enriched fields
    activatedStake?: number;
    commission?: number;
    votePubkey?: string;
    countryName?: string;
    name?: string;
    image?: string;
    provider?: string;
}

export interface EnrichedNode extends SolanaNode {
    ip?: string;
    asn?: string;
    org?: string;
    activatedStake?: number; // In Lamports
    commission?: number;
    votePubkey?: string;
    // New fields for polishing
    country?: string; // ISO Code (FR, DE)
    countryName?: string; // Full name (Germany, France)
    name?: string; // Validator Name (e.g. Jupiter)
    image?: string; // Validator Icon URL
    city?: string;
    latitude?: number;
    longitude?: number;
    provider?: string; // Cleaned provider name (e.g. AWS, Hetzner, OVHcloud)
}
