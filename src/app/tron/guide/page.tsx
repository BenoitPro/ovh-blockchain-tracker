'use client';

import GuidePageLayout, { type GuideItem } from '@/components/dashboard/GuidePageLayout';

const ACCENT = '#FF060A';

const items: GuideItem[] = [
    {
        id: 'node-types',
        icon: 'info',
        question: 'Super Representative vs. Full Node on Tron',
        answer: 'A Super Representative (SR) is one of the top 27 elected block producers on the TRON network — they earn block rewards and transaction fees in exchange for producing blocks every 3 seconds. SR nodes require the highest-spec hardware: 32 cores, 64 GB RAM, and 3.5 TB+ NVMe. Below SRs are 100 SR Partners (candidates) and SR Observers. Full Nodes store the complete blockchain and serve RPC requests — lighter on RAM but still demanding on storage (3.5 TB+ SSD).',
    },
    {
        id: 'hardware',
        icon: 'server',
        question: 'Recommended hardware',
        answer: 'Super Representative: 32 CPU cores, 64 GB RAM, 3.5 TB+ NVMe SSD, 100 Mbps minimum bandwidth. OVHcloud SCALE-A3 is the recommended match. Full Node / RPC: 16 cores (8 minimum), 32 GB RAM, 3.5 TB+ SSD, 100 Mbps. OVHcloud ADVANCE-3 with 128 GB RAM expansion covers this use case. Note: TRON\'s java-tron requires a JVM with significant heap space — allocate at least 32 GB Java heap for an SR node.',
    },
    {
        id: 'deploy',
        icon: 'deploy',
        question: 'Deployment overview',
        answer: 'TRON runs java-tron, written in Java. Provision your OVHcloud server with Ubuntu 22.04 LTS and install JDK 17+. Download the latest FullNode.jar or SolidityNode.jar from the official TRON GitHub. Configure config.conf with network parameters, your witness address (for SRs), and storage paths. Initial sync from genesis takes several days — a snapshot download from the official TRON snapshot repository is strongly recommended to reduce bootstrap time to under 24 hours.',
    },
    {
        id: 'partners',
        icon: 'partners',
        question: 'Enterprise Solutions: Join our Web3 Partner Network',
        answer: 'Connect with OVHcloud\'s specialized technical partners to scale your institutional TRON infrastructure.',
        link: 'https://blog.ovhcloud.com/partners-ovhcloud-blockchain/',
        isExternal: true,
    },
];

export default function TronGuidePage() {
    return (
        <GuidePageLayout
            chainId="tron"
            accent={ACCENT}
            networkName="Tron"
            description="Deploy and operate TRON Super Representative nodes and Full Nodes on OVHcloud's bare-metal infrastructure."
            items={items}
        />
    );
}
