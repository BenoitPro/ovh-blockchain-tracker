import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sui Dashboard — OVHcloud Node Tracker',
    description: 'Real-time tracking of Sui Network validators hosted on OVHcloud infrastructure.',
};

export default function SuiLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
