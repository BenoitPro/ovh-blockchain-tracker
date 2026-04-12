import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Monad Dashboard — OVHcloud Node Tracker',
    description: 'Geographic distribution of Monad validators. OVH infrastructure detection coming soon.',
};

export default function MonadLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
