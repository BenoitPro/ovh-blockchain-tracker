'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { usePathname } from 'next/navigation';

/**
 * Registry of "other" chains.
 * To add a new chain: simply push a new entry here.
 *
 * Fields:
 *   id      → unique key, matches Theme type
 *   label   → display name shown in the dropdown
 *   ticker  → short ticker shown on the active pill
 *   href    → Next.js route
 *   color   → accent color for active state
 *   icon    → inline SVG node (JSX)
 *   live    → false = "Coming soon" (grayed out, no navigation)
 */
interface OtherChain {
    id: string;
    label: string;
    ticker: string;
    href: string;
    color: string;
    icon: React.ReactNode;
    live: boolean;
}

const OTHER_CHAINS: OtherChain[] = [
    {
        id: 'avalanche',
        label: 'Avalanche',
        ticker: 'AVAX',
        href: '/avalanche',
        color: '#E84142',
        live: true,
        icon: (
            <svg width="13" height="13" viewBox="0 0 1503 1504" fill="currentColor" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M1502.8 1502.86H1002.1L751.503 1066.63L500.902 1502.86H0.203125L751.503 167.301L1502.8 1502.86ZM751.503 750.573L500.902 1251.33H1002.1L751.503 750.573Z" />
            </svg>
        ),
    },
    // ── Future chains — set live: false until implemented ──────────────────────
    {
        id: 'sui',
        label: 'Sui',
        ticker: 'SUI',
        href: '/sui',
        color: '#4DA2FF',
        live: true,

        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M17.636 10.009a7.16 7.16 0 0 1 1.565 4.474 7.2 7.2 0 0 1-1.608 4.53l-.087.106-.023-.135a7 7 0 0 0-.07-.349c-.502-2.21-2.142-4.106-4.84-5.642-1.823-1.034-2.866-2.278-3.14-3.693-.177-.915-.046-1.834.209-2.62.254-.787.631-1.446.953-1.843l1.05-1.284a.46.46 0 0 1 .713 0l5.28 6.456zm1.66-1.283L12.26.123a.336.336 0 0 0-.52 0L4.704 8.726l-.023.029a9.33 9.33 0 0 0-2.07 5.872C2.612 19.803 6.816 24 12 24s9.388-4.197 9.388-9.373a9.32 9.32 0 0 0-2.07-5.871zM6.389 9.981l.63-.77.018.142q.023.17.055.34c.408 2.136 1.862 3.917 4.294 5.297 2.114 1.203 3.345 2.586 3.7 4.103a5.3 5.3 0 0 1 .109 1.801l-.004.034-.03.014A7.2 7.2 0 0 1 12 21.67c-3.976 0-7.2-3.218-7.2-7.188 0-1.702.594-3.267 1.587-4.503z"/>
            </svg>
        ),
    },
    {
        id: 'hyperliquid',
        label: 'Hyperliquid',
        ticker: 'HYPE',
        href: '/hyperliquid',
        color: '#00E5BE',
        live: true,
        icon: (
            <svg width="13" height="13" viewBox="0 0 150 150" fill="currentColor" className="shrink-0">
                <path d="M146.26,76.01c.13,11.65-2.31,22.78-7.1,33.41-6.84,15.14-23.23,27.52-38.2,14.34-12.21-10.74-14.47-32.55-32.76-35.74-24.2-2.93-24.78,25.13-40.6,28.3-17.62,3.58-23.47-26.06-23.21-39.52,.26-13.46,3.84-32.38,19.15-32.38,17.62,0,18.81,26.68,41.18,25.24,22.15-1.51,22.54-29.27,37.01-41.16,12.49-10.27,27.18-2.74,34.53,9.62,6.82,11.43,9.81,24.85,9.97,37.88h.02Z"/>
            </svg>
        ),
    },
    {
        id: 'tron',
        label: 'Tron',
        ticker: 'TRX',
        href: '/tron',
        color: '#FF060A',
        live: true,
        icon: (
            <svg width="12" height="13" viewBox="0 0 24 28" fill="currentColor" className="shrink-0">
                <path d="M23.7 6.8L20.3 1.2C20 0.7 19.5 0.4 18.9 0.4H5.1C4.5 0.4 4 0.7 3.7 1.2L0.3 6.8C-0.1 7.5 0 8.3 0.5 8.9L11.4 27.3C11.7 27.7 12.1 28 12.5 28H12.6C13 28 13.4 27.7 13.7 27.3L24.5 8.9C25 8.3 25.1 7.5 23.7 6.8ZM13.5 22.8L13.5 9.8L20.5 8.2L13.5 22.8ZM11.5 9.8L11.5 22.8L4.5 8.2L11.5 9.8ZM12.5 8L5.3 6.3L12.5 2.4L19.7 6.3L12.5 8Z" />
            </svg>
        ),
    },
    {
        id: 'bnbchain',
        label: 'BNB Chain',
        ticker: 'BNB',
        href: '/bnbchain',
        color: '#F3BA2F',
        live: true,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M5.631 3.676 12.001 0l6.367 3.676-2.34 1.358L12 2.716 7.972 5.034l-2.34-1.358Zm12.737 4.636-2.34-1.358L12 9.272 7.972 6.954l-2.34 1.358v2.716l4.026 2.318v4.636L12 19.341l2.341-1.359v-4.636l4.027-2.318V8.312Zm0 7.352v-2.716l-2.34 1.358v2.716l2.34-1.358Zm1.663.96-4.027 2.318v2.717l6.368-3.677V10.63l-2.34 1.358v4.636Zm-2.34-10.63 2.34 1.358v2.716l2.341-1.358V5.994l-2.34-1.358-2.342 1.358ZM9.657 19.926v2.716L12 24l2.341-1.358v-2.716l-2.34 1.358-2.343-1.358Zm-4.027-4.262 2.341 1.358v-2.716l-2.34-1.358v2.716Zm4.027-9.67L12 7.352l2.341-1.358-2.34-1.358-2.343 1.358Zm-5.69 1.358L6.31 5.994 3.968 4.636l-2.34 1.358V8.71l2.34 1.358V7.352Zm0 4.636-2.34-1.358v7.352l6.368 3.677v-2.717l-4.028-2.318v-4.636Z"/>
            </svg>
        ),
    },
    {
        id: 'monad',
        label: 'Monad',
        ticker: 'MON',
        href: '/monad',
        color: '#836EF9',
        live: true,
        icon: (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M3 20V4l4.5 7.5L12 4l4.5 7.5L21 4v16l-4.5-7.5L12 20l-4.5-7.5L3 20z" />
            </svg>
        ),
    },
];

export default function OthersDropdown() {
    const { theme } = useNetworkTheme();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Close on navigation
    useEffect(() => { setOpen(false); }, [pathname]);

    // Derive active "other" chain
    const activeChain = OTHER_CHAINS.find(c => pathname.startsWith(c.href) && c.live);
    const isOtherActive = !!activeChain;

    // Theming
    const borderColor = isOtherActive
        ? `${activeChain!.color}60`
        : 'rgba(255,255,255,0.10)';
    const bgColor = isOtherActive
        ? `${activeChain!.color}12`
        : 'rgba(255,255,255,0.04)';
    const labelColor = isOtherActive
        ? activeChain!.color
        : 'rgba(255,255,255,0.35)';

    const dropdownBg = 'bg-[#0d0d1a]/95 border-white/10';

    return (
        <div ref={ref} className="relative w-full">
            {/* ── Trigger button ────────────────────────────────────────────── */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-200 group"
                style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    color: labelColor,
                }}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="flex items-center gap-2">
                    {isOtherActive ? (
                        <>
                            <span style={{ color: activeChain!.color }}>{activeChain!.icon}</span>
                            <span style={{ color: activeChain!.color }}>{activeChain!.ticker}</span>
                        </>
                    ) : (
                        <>
                            {/* Grid icon */}
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 opacity-60">
                                <rect x="0" y="0" width="6" height="6" rx="1.5" />
                                <rect x="10" y="0" width="6" height="6" rx="1.5" />
                                <rect x="0" y="10" width="6" height="6" rx="1.5" />
                                <rect x="10" y="10" width="6" height="6" rx="1.5" />
                            </svg>
                            <span>Others</span>
                        </>
                    )}
                </span>

                {/* Chevron */}
                <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    stroke="currentColor" strokeWidth="1.8"
                >
                    <path d="M2 3.5L5 6.5L8 3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {/* ── Dropdown panel ────────────────────────────────────────────── */}
            {open && (
                <div
                    className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border backdrop-blur-xl overflow-hidden shadow-2xl ${dropdownBg}`}
                    role="listbox"
                >
                    <div className="p-1.5 space-y-0.5">
                        {OTHER_CHAINS.map(chain => {
                            const isActive = pathname.startsWith(chain.href) && chain.live;

                            if (!chain.live) {
                                return (
                                    <div
                                        key={chain.id}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-not-allowed opacity-40"
                                        role="option"
                                        aria-disabled="true"
                                        aria-selected={false}
                                    >
                                        <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest">
                                            <span className="text-white/40">{chain.icon}</span>
                                            <span className="text-white/40">{chain.label}</span>
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white/30 bg-white/5">
                                            Soon
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={chain.id}
                                    href={chain.href}
                                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150"
                                    style={isActive ? {
                                        background: `${chain.color}14`,
                                        color: chain.color,
                                    } : {}}
                                    role="option"
                                    aria-selected={isActive}
                                >
                                    <span className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-widest">
                                        <span style={{ color: isActive ? chain.color : undefined }}>
                                            {chain.icon}
                                        </span>
                                        <span className={
                                            isActive
                                                ? ''
                                                : 'text-white/50 hover:text-white/80'
                                        }>
                                            {chain.label}
                                        </span>
                                    </span>
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: chain.color }} />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
