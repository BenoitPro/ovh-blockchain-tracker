import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/dashboard/Sidebar';
import NetworkThemeProvider from '@/components/NetworkThemeProvider';

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
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var path = window.location.pathname;
                                    var theme = 'solana';
                                    if (path === '/' || path.startsWith('/solana')) {
                                        theme = 'solana';
                                    } else if (path.startsWith('/ethereum')) {
                                        theme = 'ethereum';
                                    } else {
                                        var savedTheme = localStorage.getItem('network-theme');
                                        if (savedTheme) {
                                            theme = savedTheme;
                                        }
                                    }
                                    if (theme === 'ethereum') {
                                        document.documentElement.classList.add('eth-theme');
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
            </head>
            <body className={`${inter.className} selection:bg-[#00F0FF]/30`}>
                <NetworkThemeProvider>
                    <Sidebar />
                    <div className="ml-60">{children}</div>
                </NetworkThemeProvider>
            </body>
        </html>
    );
}

