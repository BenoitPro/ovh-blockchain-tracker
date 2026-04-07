export type ChainId = 'solana' | 'ethereum' | 'avalanche' | 'hyperliquid' | 'sui' | 'tron';

export interface ChainConfig {
  id: ChainId;
  name: string;
  accent: string;
  route: string;
  cssClass: string;
  bgTint: string;
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana',
    accent: '#00F0FF',
    route: '/',
    cssClass: '',
    bgTint: 'rgba(0,240,255,0.12)',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    accent: '#627EEA',
    route: '/ethereum',
    cssClass: 'eth-theme',
    bgTint: 'rgba(98,126,234,0.12)',
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    accent: '#E84142',
    route: '/avalanche',
    cssClass: 'avax-theme',
    bgTint: 'rgba(232,65,66,0.10)',
  },
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    accent: '#00E5BE',
    route: '/hyperliquid',
    cssClass: 'hl-theme',
    bgTint: 'rgba(0,229,190,0.10)',
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    accent: '#4DA2FF',
    route: '/sui',
    cssClass: 'sui-theme',
    bgTint: 'rgba(77,162,255,0.10)',
  },
  tron: {
    id: 'tron',
    name: 'Tron',
    accent: '#FF060A',
    route: '/tron',
    cssClass: 'tron-theme',
    bgTint: 'rgba(255,6,10,0.10)',
  },
};
