import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sui Network Use Cases | OVHcloud Node Tracker',
    description: 'Explore key validator partnerships and verified infrastructure deployments on the Sui network leveraging OVHcloud.',
};

export default function SuiUseCasesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
