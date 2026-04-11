'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#4DA2FF';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Full Node vs. Validator on Sui',
        answer: 'Sui Full Nodes replicate the full transaction history and serve read queries to developers and wallets. They do not participate in consensus but must keep up with the network in real time. Sui Validators run the Bullshark BFT consensus protocol and process all transactions — they require admission from the validator committee and a minimum stake. Both node types demand high-performance NVMe storage to handle Sui\'s high throughput.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware for Sui',
        answer: 'Minimum (official Sui spec): 24 CPU cores, 128 GB RAM, 4× 1.92 TB NVMe, 1 Gbps networking. Production validator: 24 cores, 384 GB RAM, 10 TB+ NVMe, 1 Gbps+. Sui\'s state grows rapidly — NVMe capacity is often the first bottleneck. OVHcloud\'s SCALE-A2 with NVMe expansion covers both the minimum and production configurations.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'Provision a SCALE-A2 server with Ubuntu 22.04 LTS. Download the latest sui-node binary or use the official Docker image. Configure fullnode.yaml with the genesis blob URL, trusted peer addresses, and your local storage paths. For a validator setup, generate protocol and network keypairs using the sui CLI, fund a SUI address, and submit a validator registration transaction. Monitor epoch changes — Sui validator sets rotate each epoch and your stake must remain above the minimum threshold.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional Sui infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function SuiGuidePage() {
    return (
        <GuidePageLayout
            chainId="sui"
            accent={ACCENT}
            networkName="Sui"
            description="Deploy and operate Sui full nodes and validators on OVHcloud's high-performance bare-metal infrastructure."
            items={items}
        />
    );
}
