import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hyperliquid Dashboard — OVHcloud Node Tracker',
    description: 'Hyperliquid validator decentralization tracking. See which cloud providers dominate the network and help decentralize with OVHcloud.',
};

export default function HyperliquidLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
