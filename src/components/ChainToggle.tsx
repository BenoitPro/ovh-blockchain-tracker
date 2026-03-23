'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ChainToggle() {
    const pathname = usePathname();
    const isEth = pathname.startsWith('/ethereum');

    return (
        <div className="chain-toggle flex items-center rounded-full p-1 gap-1 w-full relative">
            {/* Solana option */}
            <Link
                href="/"
                className={`chain-toggle-btn sol relative flex-1 flex justify-center items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    !isEth
                        ? 'chain-toggle-active-sol text-white'
                        : 'text-white/40 hover:text-white/70'
                }`}
            >
                {/* Solana diamond icon */}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <path d="M3.37 17.5a.92.92 0 0 0 .65.27h15.96c.51 0 .92-.41.92-.92 0-.25-.1-.49-.27-.66l-2.91-2.91a.92.92 0 0 0-.65-.27H1.11a.92.92 0 0 0-.65 1.58l2.91 2.91zM.46 9.81a.92.92 0 0 1 .65-.27h15.96c.24 0 .48.1.65.27l2.91 2.91c.36.36.36.94 0 1.3l-2.91 2.91a.92.92 0 0 1-.65.27H1.11a.92.92 0 0 1-.65-1.58l2.91-2.91a.92.92 0 0 0 0-1.3L.46 9.81a.92.92 0 0 1 0-1.3zM3.37 6.5.46 3.59a.92.92 0 0 1 .65-1.58h15.96c.24 0 .48.1.65.27l2.91 2.91c.36.36.36.94 0 1.3L17.72 9.4a.92.92 0 0 1-.65.27H1.11a.92.92 0 0 1-.65-1.58L3.37 6.5z"/>
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
                {/* Ethereum diamond icon */}
                <svg width="10" height="12" viewBox="0 0 24 38" fill="currentColor" className="shrink-0">
                    <path d="M11.944 0L11.639 1.026v25.432l.305.305 12.944-7.653L11.944 0z"/>
                    <path d="M11.944 0L0 19.11l11.944 7.653V0z" opacity=".6"/>
                    <path d="M11.944 27.904l-.153.187v9.447l.153.462 12.95-18.232L11.944 27.904z"/>
                    <path d="M11.944 37.998v-10.09L0 19.768l11.944 18.23z" opacity=".6"/>
                </svg>
                ETH
            </Link>
        </div>
    );
}
