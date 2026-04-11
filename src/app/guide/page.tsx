'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#00F0FF';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Validator vs. RPC Node: Which should I run?',
        answer: 'Solana has two main node types. A Validator participates in consensus, votes on blocks, and earns staking rewards — it requires the highest-spec hardware (512 GB ECC RAM, AVX-512 CPU, multiple NVMe drives) and a staking delegation to be active. An RPC node serves API requests to developers, wallets, and dApps; it does not vote but must keep up with the network in real time. For institutional infrastructure, a Validator is the primary revenue-generating configuration.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware for a Solana Validator',
        answer: 'A production Solana Validator demands exceptional hardware. CPU: 24+ cores with AVX-512 instruction support (AMD EPYC or Intel Ice Lake / Sapphire Rapids). RAM: 512 GB ECC — the accounts state is kept almost entirely in memory. Storage: 2 TB NVMe (accounts) + 1 TB NVMe (ledger) on separate drives to avoid I/O contention. Networking: 1 Gbps+ unmetered — Turbine shred propagation is extremely bandwidth-intensive. OVHcloud\'s SCALE-A2 upgraded to 512 GB RAM is the recommended match.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'Provision an OVHcloud SCALE-A2 server running Ubuntu 22.04 LTS. Install the Agave validator client (the reference Solana implementation, maintained by Anza). Generate your validator identity keypair and vote account, then register them on-chain. Tune the OS for performance: raise file descriptor limits (ulimit), set the CPU governor to "performance", and configure the network stack for high-throughput UDP. Enable log rotation and monitoring (Telegraf + Grafana) to track vote latency and skip rate from day one.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional Solana infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function SolanaGuidePage() {
    return (
        <GuidePageLayout
            chainId="solana"
            accent={ACCENT}
            networkName="Solana"
            description="Everything you need to deploy and run a Solana node on OVHcloud's bare-metal infrastructure — from choosing your node type to production-grade configuration."
            items={items}
        />
    );
}
