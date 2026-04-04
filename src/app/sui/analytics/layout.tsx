import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sui Network Analytics | OVHcloud Node Tracker',
    description: 'Detailed infrastructure analysis of the Sui network. Explore cloud provider distribution, voting power concentration, and geographic node density.',
};

export default function SuiAnalyticsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
