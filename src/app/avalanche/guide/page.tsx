'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#E84142';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Validator vs. Full Node on Avalanche',
        answer: 'An Avalanche Validator participates in consensus on the Primary Network (X-Chain, P-Chain, C-Chain) and can validate additional Subnets. It must stake at least 2,000 AVAX to be eligible. A Full Node is a non-validating node that stores the complete chain history and serves API requests — useful for dApps, explorers, and institutional trading infrastructure. Both run the same AvalancheGo software; the difference is registration and stake.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware for AvalancheGo',
        answer: 'Minimum spec: 8 CPU cores, 16 GB RAM, 1 TB NVMe SSD, 100 Mbps stable bandwidth. Production recommendation: 8+ cores, 32 GB RAM, 2 TB NVMe local storage, 1 Gbps. The NVMe requirement is strict — Avalanche\'s consensus requires >3,000 IOPS. OVHcloud\'s ADVANCE-2 server covers both the minimum and recommended specs, with local NVMe included.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'Provision an OVHcloud ADVANCE-2 server with Ubuntu 22.04 LTS. Download the latest AvalancheGo binary from the official GitHub release page and configure your node with the correct network flags (mainnet or Fuji testnet). Open TCP/UDP port 9651 for staking traffic and port 9650 for the local API. The node will bootstrap automatically by syncing from peers — this can take 24–72 hours for a fresh sync. For validators, generate a NodeID and submit a staking transaction from a wallet holding 2,000+ AVAX.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional Avalanche infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function AvalancheGuidePage() {
    return (
        <GuidePageLayout
            chainId="avalanche"
            accent={ACCENT}
            networkName="Avalanche"
            description="A practical guide to deploying and running Avalanche nodes on OVHcloud bare-metal infrastructure — validators, full nodes, and Subnet operators."
            items={items}
        />
    );
}
