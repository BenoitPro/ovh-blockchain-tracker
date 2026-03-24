import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Solana Node Explorer | OVHcloud Blockchain Monitor',
    description: 'Browse all Solana nodes hosted on OVHcloud infrastructure — filter by country, stake, and version.',
};

export default function NodesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
