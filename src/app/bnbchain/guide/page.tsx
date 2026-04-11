'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#F3BA2F';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'BNB Smart Chain node types',
        answer: 'BNB Smart Chain (BSC) supports three node configurations. Full Nodes store the complete blockchain history and are used for APIs, wallets, and dApps. Validators (21 active + candidates) produce blocks via the Parlia consensus mechanism and earn fees. Archive Nodes store all historical states — essential for analytics platforms and block explorers but require significantly more storage. Post-Fermi upgrade (2024), validator hardware requirements increased substantially: 128 GB RAM and 7 TB NVMe are now required.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware',
        answer: 'RPC / Full Node: 8 cores, 32 GB RAM, 2 TB NVMe, 100 Mbps. Validator (post-Fermi): 16 cores, 128 GB RAM, 7 TB NVMe, 1 Gbps — OVHcloud SCALE-A1 is the recommended match. Archive Node (Erigon / Reth): 16 cores, 128 GB RAM, 10 TB NVMe, 1 Gbps. Fast sync via geth is recommended over full sync; official BSC snapshots can reduce bootstrap time from weeks to 1–2 days.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'BSC runs a geth fork with the Parlia consensus engine. Provision your OVHcloud server with Ubuntu 22.04 LTS. Download the latest BSC binary from the official GitHub release page. Configure genesis.json and config.toml with BSC mainnet parameters (chainID 56). Enable state pruning for full nodes, or use --syncmode full --gcmode archive for archive nodes. Open P2P port 30311 for peer discovery. For validators, submit a self-delegation transaction and register your node with the BSC staking contract.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional BNB Chain infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function BNBChainGuidePage() {
    return (
        <GuidePageLayout
            chainId="bnbchain"
            accent={ACCENT}
            networkName="BNB Chain"
            description="Deploy and operate BNB Smart Chain validators, full nodes, and archive nodes on OVHcloud's bare-metal infrastructure."
            items={items}
        />
    );
}
