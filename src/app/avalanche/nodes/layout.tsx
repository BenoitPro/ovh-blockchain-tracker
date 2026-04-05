import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Avalanche Network Explorer | OVHcloud Node Tracker',
    description: 'Explore all active validators on the Avalanche Primary Network. Analyze geographic distribution, infrastructure providers, and uptime across the global validator set.',
};

export default function AvalancheNodesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
