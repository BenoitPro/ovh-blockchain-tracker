'use client';

import Link from 'next/link';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

export default function ChainToggle() {
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';
    // SOL is active when on the main Solana dashboard
    const isSol = theme === 'solana';

    return (
        <div className="chain-toggle flex items-center rounded-full p-1 gap-1 w-full relative">
            {/* Solana option */}
            <Link
                href="/"
                className={`chain-toggle-btn sol relative flex-1 flex justify-center items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isSol
                        ? 'chain-toggle-active-sol text-white'
                        : 'text-white/40 hover:text-white/70'
                }`}
            >
                <svg width="14" height="10" viewBox="0 0 20 15" fill="currentColor" className="shrink-0">
                    <path d="M2.508 11.258a.614.614 0 0 1 .434-.18h16.491a.307.307 0 0 1 .217.524l-1.942 1.942a.614.614 0 0 1-.434.18H.783a.307.307 0 0 1-.217-.524l1.942-1.942zM2.508 1.258a.628.628 0 0 1 .434-.18h16.491a.307.307 0 0 1 .217.524L17.708 3.544a.614.614 0 0 1-.434.18H.783a.307.307 0 0 1-.217-.524L2.508 1.258zM17.708 6.196a.614.614 0 0 0-.434-.18H.783a.307.307 0 0 0-.217.524l1.942 1.942a.614.614 0 0 0 .434.18h16.491a.307.307 0 0 0 .217-.524L17.708 6.196z" />
                </svg>
                SOL
            </Link>

            {/* Ethereum option */}
            <Link
                href="/ethereum"
                className={`chain-toggle-btn eth relative flex-1 flex justify-center items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isEth
                        ? 'chain-toggle-active-eth'
                        : 'text-white/40 hover:text-white/70'
                }`}
            >
                <svg width="10" height="12" viewBox="0 0 24 38" fill="currentColor" className="shrink-0">
                    <path d="M11.944 0L11.639 1.026v25.432l.305.305 12.944-7.653L11.944 0z" />
                    <path d="M11.944 0L0 19.11l11.944 7.653V0z" opacity=".6" />
                    <path d="M11.944 27.904l-.153.187v9.447l.153.462 12.95-18.232L11.944 27.904z" />
                    <path d="M11.944 37.998v-10.09L0 19.768l11.944 18.23z" opacity=".6" />
                </svg>
                ETH
            </Link>
        </div>
    );
}
