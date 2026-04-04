'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChainId, CHAINS } from '@/lib/chains';

export type Theme = ChainId;

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
        const matchingChain = Object.values(CHAINS).find(c => pathname.startsWith(c.route) && c.route !== '/');
        if (matchingChain) {
            setTheme(matchingChain.id);
        } else if (pathname === '/' || pathname.startsWith('/solana')) {
            setTheme('solana');
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
        const matchingChain = Object.values(CHAINS).find(c => pathname.startsWith(c.route) && c.route !== '/');
        if (matchingChain) {
            newTheme = matchingChain.id;
        } else if (pathname === '/' || pathname.startsWith('/solana') || pathname.startsWith('/lead') || pathname.startsWith('/roadmap')) {
            newTheme = 'solana';
        }

        if (newTheme !== theme) {
            setTheme(newTheme);
        }
        
        localStorage.setItem('network-theme', newTheme);
        
        Object.values(CHAINS).forEach(c => {
            if (c.cssClass) document.documentElement.classList.remove(c.cssClass);
        });
        
        const currentChain = CHAINS[newTheme];
        if (currentChain?.cssClass) {
            document.documentElement.classList.add(currentChain.cssClass);
        }
    }, [pathname, mounted, theme]);

    return (
        <NetworkThemeContext.Provider value={{ theme }}>
            {children}
        </NetworkThemeContext.Provider>
    );
}
