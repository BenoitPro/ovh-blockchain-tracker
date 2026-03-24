import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Solana Analytics | OVHcloud Blockchain Monitor',
    description: 'Track OVHcloud market share trends and provider distribution across the Solana network.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
