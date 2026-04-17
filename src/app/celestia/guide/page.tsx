'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#7B2FBE';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Validator vs. Bridge vs. Light Node on Celestia',
        answer: 'Celestia separates consensus from data availability. Validators (100 active) participate in CometBFT consensus and require GFNI+SHA-NI CPU instructions for data availability sampling. Bridge Nodes connect the data availability layer to external blockchains and require substantial storage (15 TB+). Light Nodes sample only small portions of block data and run on consumer hardware — they are the primary unit of decentralisation in Celestia\'s trust model.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Hardware requirements',
        answer: 'Validator: 16 cores with GFNI+SHA-NI (mandatory), 32 GB RAM, 4× 3.84 TB NVMe, 1 Gbps symmetric — OVHcloud SCALE-A3 is the recommended match. Bridge / Full Storage Node: same CPU requirement, 64 GB RAM, 4× 7.68 TB NVMe. Note: archival mode (624 TiB) is not viable for current hardware. All Celestia node types require GFNI and SHA-NI CPU instruction sets — verify CPU compatibility before provisioning.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'Provision an OVHcloud SCALE-A3 server with Ubuntu 22.04 LTS. Download the celestia-node binary from the official GitHub release page. For validators, also install celestia-app. Configure the network to celestia (mainnet). Initialise the node store with celestia full init --p2p.network celestia. Open port 2121 for P2P. For validators, sync via a trusted snapshot provider to avoid multi-week sync times. Register your validator by submitting a create-validator transaction after your node reaches tip.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional Celestia infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function CelestiaGuidePage() {
    return (
        <GuidePageLayout
            chainId="celestia"
            accent={ACCENT}
            networkName="Celestia"
            description="Deploy and operate Celestia validators, bridge nodes, and light nodes on OVHcloud's bare-metal infrastructure."
            items={items}
        />
    );
}
