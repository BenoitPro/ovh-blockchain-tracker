import type { ChainId } from '@/lib/chains';

export interface TechHighlight {
    value: string;   // big text, e.g. "3000+"
    label: string;   // label above, e.g. "IOPS NVMe"
    sub: string;     // small text below, e.g. "Avalanche requirement"
}

export interface UseCasesChainConfig {
    apiRoute: string;
    techHighlights: [TechHighlight, TechHighlight];
}

export const USE_CASES_CONFIG: Partial<Record<ChainId, UseCasesChainConfig>> = {
    solana: {
        apiRoute: '/api/solana',
        techHighlights: [
            { value: '<10ms', label: 'Latency', sub: 'Bare metal, no hypervisor' },
            { value: '10G+', label: 'Bandwidth', sub: 'Turbine-ready networking' },
        ],
    },
    ethereum: {
        apiRoute: '/api/ethereum',
        techHighlights: [
            { value: 'Unmetered', label: 'Bandwidth', sub: '500 GB–4 TB/mo node traffic' },
            { value: 'NVMe', label: 'Storage', sub: 'Fast sync, archive-ready' },
        ],
    },
    avalanche: {
        apiRoute: '/api/avalanche',
        techHighlights: [
            { value: '3000+', label: 'IOPS NVMe', sub: 'Avalanche subnet requirement' },
            { value: 'High', label: 'CPU Freq.', sub: 'Validator performance' },
        ],
    },
    sui: {
        apiRoute: '/api/sui',
        techHighlights: [
            { value: 'NVMe', label: 'SSD Required', sub: 'Sui validator spec' },
            { value: '<5ms', label: 'Intra-DC Latency', sub: 'Low-latency networking' },
        ],
    },
    hyperliquid: {
        apiRoute: '/api/hyperliquid',
        techHighlights: [
            { value: '<1ms', label: 'Ultra-Low Latency', sub: 'HFT-grade bare metal' },
            { value: '25G+', label: 'Networking', sub: 'Market-maker ready' },
        ],
    },
    tron: {
        apiRoute: '/api/tron',
        techHighlights: [
            { value: 'High', label: 'Throughput', sub: 'TPS-optimised storage' },
            { value: '1.3 Tbit/s', label: 'Anti-DDoS', sub: 'Enterprise protection' },
        ],
    },
};
