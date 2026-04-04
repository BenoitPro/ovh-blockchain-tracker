// Solana RPC
export const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

// Avalanche RPC
export const AVALANCHE_RPC_ENDPOINT = 'https://api.avax.network/ext/info';

// OVHcloud ASN list
export const OVH_ASN_LIST = [
    'AS16276', // OVH SAS (Main)
    'AS35540', // OVH Managed
    'AS21351', // OVH Public Cloud
    'AS198203', // OVH Singapore
    'AS50082',  // OVH Australia
    'AS32790',  // OVH USA
    'AS14061',  // OVH Canada (sometimes DO shares this but mostly OVH CA)
];

// Provider ASN mapping
export const PROVIDER_ASN_MAP: Record<string, { label: string, asns: string[] }> = {
    ovh: {
        label: 'OVHcloud',
        asns: OVH_ASN_LIST
    },
    aws: {
        label: 'AWS',
        asns: ['AS16509', 'AS14618', 'AS16501', 'AS16550', 'AS16551', 'AS32805', 'AS35691']
    },
    google: {
        label: 'Google Cloud',
        asns: ['AS15169', 'AS396982', 'AS19527', 'AS36040']
    },
    hetzner: {
        label: 'Hetzner',
        asns: ['AS24940', 'AS213230']
    },
    digitalocean: {
        label: 'DigitalOcean',
        asns: ['AS14061', 'AS202018', 'AS21245', 'AS201229']
    },
    vultr: {
        label: 'Vultr',
        asns: ['AS20473']
    },
    equinix: {
        label: 'Equinix',
        asns: ['AS13445', 'AS40676', 'AS32133', 'AS54527']
    },
};

// Provider Colors
export const PROVIDER_COLORS: Record<string, string> = {
    ovh: '#00F0FF', // OVHcloud cyan
    aws: '#FF9900', // AWS orange
    hetzner: '#D50C2D', // Hetzner red
    google: '#4285F4', // Google blue
    digitalocean: '#0080FF', // DO blue
    vultr: '#007BFC', // Vultr blue
    equinix: '#ED2126', // Equinix red
    others: '#6B7280', // Gray for others
};

// Provider Labels
export const PROVIDER_LABELS: Record<string, string> = {
    ovh: 'OVHcloud',
    aws: 'AWS',
    hetzner: 'Hetzner',
    google: 'Google Cloud',
    digitalocean: 'DigitalOcean',
    vultr: 'Vultr',
    equinix: 'Equinix',
    others: 'Others',
};

// Sui RPC
export const SUI_RPC_ENDPOINT = 'https://fullnode.mainnet.sui.io:443';

// Cache keys and TTLs are now centralized in lib/cache/chain-storage.ts

// Tron API
export const TRON_API_URL = 'https://api.trongrid.io';
