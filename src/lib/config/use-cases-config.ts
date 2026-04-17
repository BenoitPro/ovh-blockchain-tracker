import type { ChainId } from '@/lib/chains';

export interface TechHighlight {
    value: string;   // big text, e.g. "3000+"
    label: string;   // label above, e.g. "IOPS NVMe"
    sub: string;     // small text below, e.g. "Avalanche requirement"
}

export interface ServerSpec {
    nodeType: string;     // "Validator", "RPC node", "Archive node"
    cpu: string;
    ram: string;
    storage: string;
    network: string;
    ovhServer: string;    // display name, e.g. "SCALE-A2"
    priceEur: number;     // monthly price EUR (pricelist April 2026)
    ovhServerUrl: string; // direct link to OVH product page /en/
}

export interface UseCasesChainConfig {
    apiRoute: string;
    techHighlights: [TechHighlight, TechHighlight];
    serverSpecs: ServerSpec[];
}

export const USE_CASES_CONFIG: Partial<Record<ChainId, UseCasesChainConfig>> = {
    solana: {
        apiRoute: '/api/solana',
        techHighlights: [
            { value: '<10ms', label: 'Latency', sub: 'Bare metal, no hypervisor' },
            { value: '10G+', label: 'Bandwidth', sub: 'Turbine-ready networking' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator',
                cpu: '24 cores+ (AVX-512)',
                ram: '512 GB ECC',
                storage: '2 TB NVMe (accounts) + 1 TB NVMe (ledger)',
                network: '1 Gbps+',
                ovhServer: 'SCALE-A2 + 512 GB RAM',
                priceEur: 1066,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-2/',
            },
            {
                nodeType: 'Light RPC',
                cpu: '8 cores',
                ram: '128 GB',
                storage: '1 TB NVMe',
                network: '300 Mbps',
                ovhServer: 'ADVANCE-3 + 128 GB RAM',
                priceEur: 210,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-3/',
            },
        ],
    },
    ethereum: {
        apiRoute: '/api/ethereum',
        techHighlights: [
            { value: 'Unmetered', label: 'Bandwidth', sub: '500 GB–4 TB/mo node traffic' },
            { value: 'NVMe', label: 'Storage', sub: 'Fast sync, archive-ready' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator + consensus',
                cpu: '4 cores+',
                ram: '32 GB',
                storage: '2 TB SSD',
                network: '25 Mbps+',
                ovhServer: 'ADVANCE-2',
                priceEur: 125,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
            },
            {
                nodeType: 'Archive (Erigon / Reth)',
                cpu: '8 cores',
                ram: '32 GB',
                storage: '2.5–4 TB NVMe',
                network: '100 Mbps+',
                ovhServer: 'ADVANCE-3 + 4× NVMe',
                priceEur: 367,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-3/',
            },
            {
                nodeType: 'Archive (Geth / Nethermind)',
                cpu: '8 cores',
                ram: '64 GB+',
                storage: '12–15 TB HDD',
                network: '100 Mbps+',
                ovhServer: 'ADVANCE-STOR + 6× HDD',
                priceEur: 481,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-stor/',
            },
        ],
    },
    avalanche: {
        apiRoute: '/api/avalanche',
        techHighlights: [
            { value: '3000+', label: 'IOPS NVMe', sub: 'Avalanche subnet requirement' },
            { value: 'High', label: 'CPU Freq.', sub: 'Validator performance' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator / Full node',
                cpu: '8 cores (4 min)',
                ram: '32 GB (16 min)',
                storage: '2 TB NVMe local',
                network: '1 Gbps (100 Mbps min)',
                ovhServer: 'ADVANCE-2',
                priceEur: 125,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
            },
        ],
    },
    sui: {
        apiRoute: '/api/sui',
        techHighlights: [
            { value: 'NVMe', label: 'SSD Required', sub: 'Sui validator spec' },
            { value: '<5ms', label: 'Intra-DC Latency', sub: 'Low-latency networking' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator (official minimum)',
                cpu: '24 cores',
                ram: '128 GB',
                storage: '4× 1.92 TB NVMe',
                network: '1 Gbps',
                ovhServer: 'SCALE-A2 + 4× NVMe',
                priceEur: 530,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-2/',
            },
            {
                nodeType: 'Validator (production-grade)',
                cpu: '24 cores',
                ram: '384 GB',
                storage: '10 TB+ NVMe',
                network: '1 Gbps+',
                ovhServer: 'SCALE-A2 + 512 GB RAM',
                priceEur: 1066,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-2/',
            },
        ],
    },
    hyperliquid: {
        apiRoute: '/api/hyperliquid',
        techHighlights: [
            { value: '<1ms', label: 'Ultra-Low Latency', sub: 'HFT-grade bare metal' },
            { value: '25G+', label: 'Networking', sub: 'Market-maker ready' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator',
                cpu: '32 vCPU',
                ram: '128 GB',
                storage: '1 TB NVMe',
                network: 'Stable, low-latency',
                ovhServer: 'SCALE-A1',
                priceEur: 370,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-1/',
            },
            {
                nodeType: 'API / RPC',
                cpu: '16 vCPU',
                ram: '64 GB',
                storage: '500 GB SSD',
                network: 'Stable',
                ovhServer: 'ADVANCE-2',
                priceEur: 125,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
            },
        ],
    },
    tron: {
        apiRoute: '/api/tron',
        techHighlights: [
            { value: 'High', label: 'Throughput', sub: 'TPS-optimised storage' },
            { value: '1.3 Tbit/s', label: 'Anti-DDoS', sub: 'Enterprise protection' },
        ],
        serverSpecs: [
            {
                nodeType: 'Super Representative (SR)',
                cpu: '32 cores',
                ram: '64 GB',
                storage: '3.5 TB+ NVMe',
                network: '100 Mbps',
                ovhServer: 'SCALE-A3',
                priceEur: 730,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-3/',
            },
            {
                nodeType: 'Full node / RPC',
                cpu: '16 cores (8 min)',
                ram: '32 GB',
                storage: '3.5 TB+ SSD',
                network: '100 Mbps',
                ovhServer: 'ADVANCE-3 + 128 GB RAM',
                priceEur: 252,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-3/',
            },
        ],
    },
    bnbchain: {
        apiRoute: '/api/bnbchain',
        techHighlights: [
            { value: '2 TB', label: 'NVMe Storage', sub: 'BSC fast-sync requirement' },
            { value: '128 GB', label: 'RAM (validator)', sub: 'Post-Fermi upgrade spec' },
        ],
        serverSpecs: [
            {
                nodeType: 'RPC / Full node',
                cpu: '8 cores',
                ram: '32 GB',
                storage: '2 TB NVMe',
                network: '100 Mbps+',
                ovhServer: 'ADVANCE-2',
                priceEur: 125,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
            },
            {
                nodeType: 'Validator (post-Fermi)',
                cpu: '16 cores',
                ram: '128 GB',
                storage: '7 TB NVMe',
                network: '1 Gbps',
                ovhServer: 'SCALE-A1',
                priceEur: 370,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-1/',
            },
            {
                nodeType: 'Archive (Erigon / Reth)',
                cpu: '16 cores',
                ram: '128 GB',
                storage: '10 TB NVMe',
                network: '1 Gbps',
                ovhServer: 'SCALE-A1 + 10 TB NVMe',
                priceEur: 490,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-1/',
            },
        ],
    },
    celestia: {
        apiRoute: '/api/celestia',
        techHighlights: [
            { value: 'GFNI+SHA-NI', label: 'CPU Required', sub: 'CometBFT DA consensus req.' },
            { value: '15 TB+', label: 'NVMe Storage', sub: 'Bridge node data availability' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator',
                cpu: '16c (GFNI+SHA-NI)',
                ram: '32 GB',
                storage: '4× 3.84 TB NVMe',
                network: '1 Gbps symmetric',
                ovhServer: 'SCALE-A3 + 4× 3.84 TB NVMe',
                priceEur: 686,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-3/',
            },
            {
                nodeType: 'Bridge / Full Storage',
                cpu: '16c (GFNI+SHA-NI)',
                ram: '64 GB',
                storage: '4× 7.68 TB NVMe',
                network: '1 Gbps symmetric',
                ovhServer: 'SCALE-A3 + 4× 7.68 TB NVMe',
                priceEur: 870,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/scale/scale-3/',
            },
        ],
    },
    monad: {
        apiRoute: '/api/monad',
        techHighlights: [
            { value: '4.5 GHz+', label: 'Base Clock', sub: 'MonadBFT bare-metal req.' },
            { value: 'PCIe Gen4', label: 'NVMe Storage', sub: '2.5 TB required' },
        ],
        serverSpecs: [
            {
                nodeType: 'Validator (MonadBFT)',
                cpu: '16 cores @ 4.5 GHz+',
                ram: '32 GB',
                storage: '2.5 TB NVMe PCIe Gen4',
                network: '300 Mbps symmetric',
                ovhServer: 'ADVANCE-3',
                priceEur: 210,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-3/',
            },
            {
                nodeType: 'RPC / Full node',
                cpu: '16 cores @ 4.5 GHz+',
                ram: '32 GB',
                storage: '2.5 TB NVMe PCIe Gen4',
                network: '100 Mbps',
                ovhServer: 'ADVANCE-2',
                priceEur: 125,
                ovhServerUrl: 'https://www.ovhcloud.com/en/bare-metal/advance/adv-2/',
            },
        ],
    },
};
