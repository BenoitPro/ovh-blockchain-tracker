'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#00E5BE';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Hyperliquid Validator overview',
        answer: 'Hyperliquid operates a permissioned validator set optimized for ultra-low latency on its fully on-chain order book and perpetual exchange. Validators process all orders, trades, and liquidations in real time — latency directly impacts trading quality. The validator set is elected and managed by the Hyperliquid Foundation. API/RPC nodes serve historical data, order book snapshots, and WebSocket feeds to integrations and market makers.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware',
        answer: 'Validator: 32 vCPU, 128 GB RAM, 1 TB NVMe, stable low-latency networking. The bare-metal advantage is critical here — hypervisor jitter is unacceptable for HFT-grade consensus. OVHcloud\'s SCALE-A1 provides the required hardware profile. API/RPC nodes are less demanding: 16 vCPU, 64 GB RAM, 500 GB SSD — the ADVANCE-2 covers this comfortably. Networking quality (not just speed) is the differentiator; OVHcloud\'s 25G backbone and global anycast anti-DDoS are key advantages.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Joining the validator set',
        answer: 'Hyperliquid\'s validator software is distributed directly to approved validators. The onboarding process involves submitting infrastructure specs to the Hyperliquid team, receiving the validator binary and configuration, and deploying on bare-metal (no hypervisor). Key requirements: stable IPv4 address, bare-metal SCALE-A1, sub-millisecond intra-datacenter latency, and 99.9%+ uptime SLA. Contact the Hyperliquid team through their official channels to begin the validator onboarding process.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional Hyperliquid infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function HyperliquidGuidePage() {
    return (
        <GuidePageLayout
            chainId="hyperliquid"
            accent={ACCENT}
            networkName="Hyperliquid"
            description="Deploy and operate Hyperliquid validators and API nodes on OVHcloud's HFT-grade bare-metal infrastructure."
            items={items}
        />
    );
}
