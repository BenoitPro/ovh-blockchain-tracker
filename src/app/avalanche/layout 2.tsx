import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Avalanche Dashboard — OVHcloud Node Tracker',
    description: 'Distribution of Avalanche Primary Network validators hosted on OVHcloud infrastructure.',
};

export default function AvalancheLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
