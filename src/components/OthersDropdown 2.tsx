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
            <svg width="12" height="14" viewBox="0 0 25 33" fill="currentColor" className="shrink-0">
                <path d="M12.5 0C12.5 0 4.5 8.5 4.5 18C4.5 22.9706 8.02944 27 12.5 27C16.9706 27 20.5 22.9706 20.5 18C20.5 8.5 12.5 0Z" />
                <circle cx="12.5" cy="28.5" r="4" />
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
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
