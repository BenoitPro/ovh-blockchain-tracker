'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { theme } = useNetworkTheme();
    const isEth = theme === 'ethereum';

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    return (
        <>
            <Sidebar isOpen={isOpen} onClose={close} />

            {/* Overlay — mobile only, behind sidebar */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            <div className="ml-0 lg:ml-60">
                {/* Hamburger button — mobile only */}
                <button
                    className={`fixed top-4 left-4 z-40 lg:hidden flex flex-col gap-[5px] p-2.5 rounded-xl backdrop-blur-xl border transition-all duration-200 active:scale-95 ${
                        isEth
                            ? 'bg-white/80 border-[#627EEA]/20 shadow-sm'
                            : 'bg-black/60 border-white/10'
                    }`}
                    onClick={open}
                    aria-label="Open navigation menu"
                >
                    <span className={`w-5 h-[2px] rounded-full transition-colors ${isEth ? 'bg-slate-700' : 'bg-white/80'}`} />
                    <span className={`w-5 h-[2px] rounded-full transition-colors ${isEth ? 'bg-slate-700' : 'bg-white/80'}`} />
                    <span className={`w-3.5 h-[2px] rounded-full transition-colors ${isEth ? 'bg-slate-700' : 'bg-white/80'}`} />
                </button>

                {/* Top padding on mobile to clear the hamburger button (56px) */}
                <div className="pt-14 lg:pt-0">
                    {children}
                </div>
            </div>
        </>
    );
}
