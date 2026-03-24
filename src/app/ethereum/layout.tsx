import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ethereum Dashboard | OVHcloud Blockchain Monitor',
    description: 'Real-time OVHcloud market share across the Ethereum execution-layer network — nodes, validators, and geographic distribution.',
};

export default function EthereumLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
