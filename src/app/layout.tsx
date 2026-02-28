import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'OVHcloud Solana Infrastructure Monitor',
    description: 'Real-time monitoring of OVHcloud market share in Solana blockchain infrastructure. Track nodes, validators, and geographic distribution.',
    keywords: ['OVHcloud', 'Solana', 'Blockchain', 'Infrastructure', 'Validators', 'Bare Metal'],
    authors: [{ name: 'OVHcloud' }],
    openGraph: {
        title: 'OVHcloud Solana Infrastructure Monitor',
        description: 'Real-time monitoring of OVHcloud market share in Solana blockchain infrastructure',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'OVHcloud Solana Infrastructure Monitor',
        description: 'Real-time monitoring of OVHcloud market share in Solana blockchain infrastructure',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} bg-[#000d1e] text-white selection:bg-[#00F0FF]/30`}>{children}</body>
        </html>
    );
}
