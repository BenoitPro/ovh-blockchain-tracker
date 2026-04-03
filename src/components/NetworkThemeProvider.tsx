'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type Theme = 'solana' | 'ethereum' | 'avalanche' | 'hyperliquid';

interface NetworkThemeContextType {
    theme: Theme;
}

const NetworkThemeContext = createContext<NetworkThemeContextType>({ theme: 'solana' });

export const useNetworkTheme = () => useContext(NetworkThemeContext);

export default function NetworkThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [theme, setTheme] = useState<Theme>('solana');
    const [mounted, setMounted] = useState(false);

    // Initial mount hydration
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('network-theme') as Theme | null;
        
        // Let path take precedence on direct loads
        if (pathname === '/' || pathname.startsWith('/solana')) {
            setTheme('solana');
        } else if (pathname.startsWith('/ethereum')) {
            setTheme('ethereum');
        } else if (pathname.startsWith('/avalanche')) {
            setTheme('avalanche');
        } else if (pathname.startsWith('/hyperliquid')) {
            setTheme('hyperliquid');
        } else if (pathname.startsWith('/lead') || pathname.startsWith('/roadmap')) {
            setTheme('solana');
        } else if (savedTheme) {
            setTheme(savedTheme);
        }
    }, [pathname]);

    // Update theme when path changes
    useEffect(() => {
        if (!mounted) return;

        let newTheme: Theme = theme;

        // Force theme based on current section
        if (pathname.startsWith('/ethereum')) {
            newTheme = 'ethereum';
        } else if (pathname.startsWith('/avalanche')) {
            newTheme = 'avalanche';
        } else if (pathname.startsWith('/hyperliquid')) {
            newTheme = 'hyperliquid';
        } else if (pathname === '/' || pathname.startsWith('/solana') || pathname.startsWith('/lead') || pathname.startsWith('/roadmap')) {
            newTheme = 'solana';
        }
        // If on a global page like /about, do not override CURRENT known theme
        // Let it stay as it is (preserved from last dashboard/page visit)

        if (newTheme !== theme) {
            setTheme(newTheme);
        }
        
        localStorage.setItem('network-theme', newTheme);
        
        document.documentElement.classList.remove('eth-theme', 'avax-theme', 'hl-theme');
        if (newTheme === 'ethereum') {
            document.documentElement.classList.add('eth-theme');
        } else if (newTheme === 'avalanche') {
            document.documentElement.classList.add('avax-theme');
        } else if (newTheme === 'hyperliquid') {
            document.documentElement.classList.add('hl-theme');
        }
    }, [pathname, mounted, theme]);

    return (
        <NetworkThemeContext.Provider value={{ theme }}>
            {children}
        </NetworkThemeContext.Provider>
    );
}
