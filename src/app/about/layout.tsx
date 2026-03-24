import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Team & Contact | OVHcloud Blockchain Monitor',
    description: 'Meet the team behind the OVHcloud Blockchain Infrastructure Monitor and get in touch.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
