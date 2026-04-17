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
    {
        id: 'celestia',
        label: 'Celestia',
        ticker: 'TIA',
        href: '/celestia',
        color: '#7B2FBE',
        live: true,
        icon: (
            <svg width="13" height="13" viewBox="0 0 31 31" fill="currentColor" className="shrink-0">
                <path fillRule="evenodd" clipRule="evenodd" d="M29.6 15.86c0 .1-.13.12-.17.03l-.05-.11c-.03-.07-.02-.15.02-.21l.05-.07c.06-.08.15-.07.15.02 0 .12 0 .24-.01.35m-.68-1.87c-.1.19-.38.2-.49.02l-.05-.08c-.43-.65-.92-1.29-1.46-1.9-.13-.16-.02-.4.18-.4h.01c1.27 0 1.93.31 2.14.7.17.32.12.88-.33 1.67m-.28 6.64c-.07.17-.14.35-.21.52l-.04.07c-.46.9-1.25 1.6-2.3 2.1-.23.11-.49-.1-.42-.35.35-1.24.61-2.59.78-4.01.03-.26.16-.51.36-.68.43-.37.84-.75 1.21-1.11l.01-.01c.18-.18.49-.1.57.14.36 1.21.38 2.35.05 3.33m-2.85 4.49c-.11.11-.22.23-.33.34-.19.19-.39.38-.59.56-.13.11-.32-.03-.25-.18l.06-.13c.09-.19.17-.38.24-.58l.01-.01c.19-.05.39-.11.59-.17.15-.05.27.13.16.25m-2.09-1.12c-.42.06-.87.1-1.33.12-1.14.04-2.34-.06-3.57-.28-.15-.03-.18-.23-.01-.3.27-.14.54-.27.81-.42 1.89-1 3.65-2.09 5.19-3.21.12-.08.27.01.25.15-.21 1.28-.52 2.49-.89 3.59-.06.19-.22.32-.42.35m-.43 1.71c-1.01 1.99-2.26 3.12-3.46 3.09-1.31-.02-2.62-1.39-3.59-3.75l-.01-.01c-.06-.15.01-.32.16-.38l.03-.02c.06-.03.13-.03.2-.01 1.81.51 3.6.77 5.27.77l.54-.01c.21-.01.42-.02.62-.03.19-.02.32.18.23.35m-5.98 3.78c-.6.08-1.21.12-1.83.12-2.75 0-5.39-.78-7.65-2.24-.16-.1-.09-.34.09-.35h.1c.57-.04 1.2-.12 1.89-.25 1.45-.28 3.07-.76 4.76-1.41.15-.06.32.01.38.15l.01.01c.65 1.59 1.46 2.8 2.37 3.56.15.13.07.37-.12.4m-8.19-9.93c1.25-1.02 2.71-2.03 4.32-2.99.03 2.05.26 4.02.66 5.8-.6-.25-1.19-.53-1.78-.84-1.14-.59-2.21-1.26-3.2-1.97m-3.88 5.5c-.3-.56.08-1.87 2.04-3.88l.01-.01c.2-.21.18-.55-.05-.73-.08-.06-.16-.12-.23-.19-.19-.16-.48-.14-.66.02l-.08.08c-.98 1-.66 1.93-1.04 2.77-.09.24-.42.26-.56.04-1.52-2.29-2.33-4.98-2.33-7.81 0-1.01.1-2 .31-2.96.03-.14.24-.15.27-.01.29.97.77 1.97 1.43 2.99.89 1.37 2.06 2.68 3.45 3.88.48.41.98.81 1.5 1.19 1.06.78 2.21 1.5 3.44 2.13.54.28 1.07.56 1.61.8.3.14.64.15.95.03.26-.1.51-.2.77-.31.28-.12.43-.42.36-.72l-.02-.08c-.43-1.8-.66-3.82-.69-5.94l-.01.01c0-.03 0-.05-.01-.08 0-.12 0-.23-.01-.35 0-.04 0-.1 0-.13v-.05l.01-.01c0-.13.01-.27.01-.4.01-.36.02-.72.04-1.08 0 0 0 0 0-.01.13-2.55.57-4.95 1.26-6.97.06-.19-.04-.39-.23-.45-.18-.06-.36-.13-.54-.18-.18-.06-.38.04-.44.22-.75 2.19-1.21 4.79-1.33 7.55-.01.35-.22.67-.52.85-1.63.97-3.12 1.99-4.42 3.03-.27.21-.65.21-.92-.01-1.3-1.12-2.39-2.35-3.22-3.61-1.62-2.49-2-4.83-1.08-6.6l.01-.01c.12-.2.24-.39.37-.58 1.06-1.4 3.03-2.21 5.64-2.31h.5c1.6 0 3.33.26 5.08.77h.01l.12.03.09.03h.01c.4.12.81.25 1.22.4h.01l.03.01.32.12.07.03.07.04c.85.33 1.71.72 2.55 1.16 1.63.85 3.13 1.84 4.43 2.93-2.48.57-5.37 1.67-8.27 3.15-.13.07-.22.2-.23.35-.01.18-.02.54-.03.83 0 .18.19.3.35.22l.01-.01c2.87-1.51 5.74-2.64 8.2-3.23.46-.11.76-.55.69-1.02-.04-.33-.1-.65-.15-.97-.07-.4-.29-.75-.61-1-.61-.88-1.87-1.68-3.23-2.39-.92-.48-1.85-.9-2.78-1.17-.2-.07-.28-.31-.18-.5.96-1.72 2.1-2.68 3.22-2.68h.03c1.31.02 2.62 1.39 3.59 3.75.49 1.19.87 2.57 1.13 4.07l-.01-.01c.11.64.2 1.3.27 1.97l.01.01v.01c.11 1.14.16 2.32.13 3.53-.01.76-.05 1.52-.12 2.25-1.76 1.42-4.18 2.83-6.56 4.1-.78.42-1.57.8-2.34 1.16l-.04.02-.16.07h-.01c-.64.29-1.28.56-1.9.8l-.01.01h-.02l-.03.01-.3.12-.07.03-.12.04h-.01c-1.5.48-2.85.84-3.98 1.07-2.82.54-4.14.12-4.45-.44M7.22 3.9c2.38-1.71 5.23-2.63 8.22-2.63.79 0 1.57.06 2.33.19.2.03.27.3.11.42-.74.58-1.43 1.44-2.04 2.55-.15.27-.47.4-.76.32-2.02-.57-4-1.84-5.83-1.77-.68.02-1.32.09-1.92.2-.17.03-.26-.19-.12-.29m19.45 1.26c.09.08.18.17.26.26 1.37 1.37 2.41 2.96 3.12 4.7.07.18-.08.36-.26.33-.41-.07-.86-.11-1.37-.1-.35.01-.65-.24-.72-.59-.27-1.54-.67-2.97-1.18-4.21l-.09-.21c-.07-.15.09-.29.24-.18m5.35 7.06c-.61-2.9-2.05-5.56-4.19-7.71C24.91 1.61 21.04 0 16.9 0 12.77 0 8.89 1.61 5.97 4.52c-.71.71-1.34 1.48-1.89 2.29-.16.22-.31.45-.44.69C2.21 9.87 1.45 12.6 1.45 15.44c0 4.13 1.61 8 4.52 10.92 2.92 2.92 6.8 4.52 10.92 4.52 4.13 0 8-1.61 10.92-4.52 1.38-1.38 2.46-2.97 3.22-4.7.09-.19.17-.39.24-.59.69-1.77 1.06-3.67 1.06-5.63 0-1.08-.11-2.14-.33-3.17l-.01-.04"/>
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
