import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sui Network Explorer | OVHcloud Node Tracker',
    description: 'Explore all validators currently contributing to the Sui network. Analyze geographic distribution, infrastructure providers, and consensus power across the global validator set.',
};

export default function SuiNodesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
