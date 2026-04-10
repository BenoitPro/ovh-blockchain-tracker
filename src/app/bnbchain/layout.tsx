import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'BNB Chain Dashboard — OVHcloud Node Tracker',
    description: 'Track BNB Chain validators and full nodes hosted on OVHcloud infrastructure.',
};

export default function BNBChainLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
