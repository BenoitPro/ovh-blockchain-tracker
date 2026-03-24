'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type Theme = 'solana' | 'ethereum';

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
        
        // Let path taking precedence on direct loads
        if (pathname === '/' || pathname.startsWith('/solana')) {
            setTheme('solana');
        } else if (pathname.startsWith('/ethereum')) {
            setTheme('ethereum');
        } else if (savedTheme) {
            setTheme(savedTheme);
        }
    }, [pathname]);

    // Update theme when path changes
    useEffect(() => {
        if (!mounted) return;

        let newTheme: Theme = theme;

        // Force Ethereum theme on ethereum specific pages
        if (pathname.startsWith('/ethereum')) {
            newTheme = 'ethereum';
        } 
        // Force Solana theme on solana specific pages or home
        else if (pathname === '/' || pathname.startsWith('/solana')) {
            newTheme = 'solana';
        }
        // If on a global page like /about, do not override CURRENT known theme
        // Let it stay as it is (preserved from last dashboard/page visit)

        if (newTheme !== theme) {
            setTheme(newTheme);
        }
        
        localStorage.setItem('network-theme', newTheme);
        
        if (newTheme === 'ethereum') {
            document.documentElement.classList.add('eth-theme');
        } else {
            document.documentElement.classList.remove('eth-theme');
        }
    }, [pathname, mounted, theme]);

    return (
        <NetworkThemeContext.Provider value={{ theme }}>
            {children}
        </NetworkThemeContext.Provider>
    );
}
