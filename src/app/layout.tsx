import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'OVHcloud Blockchain Infrastructure Monitor',
    description: 'Real-time monitoring of OVHcloud market share in blockchain infrastructure. Track nodes, validators, and geographic distribution across multiple networks.',
    keywords: ['OVHcloud', 'Solana', 'Ethereum', 'Blockchain', 'Infrastructure', 'Validators', 'Bare Metal'],
    authors: [{ name: 'OVHcloud' }],
    openGraph: {
        title: 'OVHcloud Blockchain Infrastructure Monitor',
        description: 'Real-time monitoring of OVHcloud market share in blockchain infrastructure',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'OVHcloud Blockchain Infrastructure Monitor',
        description: 'Real-time monitoring of OVHcloud market share in blockchain infrastructure',
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
