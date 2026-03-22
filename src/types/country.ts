export interface CountryNode {
    pubkey: string;
    ip: string; // Masked IP e.g. "51.XXX.XXX.XXX"
    city: string;
    activatedStake: number;
    commission: number;
    votePubkey: string;
    isValidator: boolean;
    version: string | null;
    name?: string;
    image?: string;
}

export interface CountryDetailResponse {
    success: boolean;
    countryCode: string;
    countryName: string;
    nodes: CountryNode[];
    totalNodes: number;
    totalStake: number;
    error?: string;
}
