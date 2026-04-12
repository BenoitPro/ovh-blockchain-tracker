'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#836EF9';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Validator vs. Full Node on Monad',
        answer: 'A Monad Validator participates in MonadBFT consensus (the top 200 by delegated stake). It must self-stake ≥ 100,000 MON and accumulate ≥ 10,000,000 MON total delegated stake to enter the active set. A Full Node / RPC Node serves JSON-RPC and WebSocket traffic without staking registration — same binary and hardware, different configuration. Both types require bare-metal dedicated servers; cloud VMs are explicitly not supported due to MonadBFT\'s sub-second timing requirements.',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware for Monad',
        answer: 'Validators and full nodes share the same hardware requirements: 16 CPU cores with 4.5 GHz+ base clock (AMD Ryzen 9 7950X/9950X or EPYC 4584PX class), 32 GB RAM, 2 TB NVMe PCIe Gen4x4 for TrieDB + 500 GB NVMe for MonadBFT/OS. Bandwidth: 300 Mbps symmetric for validators, 100 Mbps for full nodes. Samsung 980/990 Pro and PM9A1 SSDs are preferred; avoid Nextorage SSDs (reported overheating under sustained load).',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'Provision a bare-metal server meeting the hardware specs above. Install the Monad node binary and configure node.toml with bootstrap peers (available in official docs at docs.monad.xyz/node-ops). Run as a full node first to sync — do not start as a validator until fully synced. Once synced, register as a validator candidate via the addValidator staking precompile (0x1000) and accumulate delegated stake to enter the top-200 active set. Open ports 8000 (P2P/MonadBFT) and 8545/8546 (JSON-RPC/WebSocket).',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your Monad infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function MonadGuidePage() {
    return (
        <GuidePageLayout
            chainId="monad"
            accent={ACCENT}
            networkName="Monad"
            description="A practical guide to deploying Monad validators and full nodes on OVHcloud bare-metal infrastructure."
            items={items}
        />
    );
}
