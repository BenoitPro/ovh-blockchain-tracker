import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS, ChainConfig } from '@/lib/chains';

export function useChain(): ChainConfig {
    const { theme } = useNetworkTheme();
    return CHAINS[theme as keyof typeof CHAINS] ?? CHAINS.solana;
}
