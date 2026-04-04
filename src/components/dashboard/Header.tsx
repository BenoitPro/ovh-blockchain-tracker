import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import { CHAINS } from '@/lib/chains';

interface HeaderProps {
    network?: string;
    subtitle?: string;
}

export default function Header({ network, subtitle }: HeaderProps) {
    const { theme } = useNetworkTheme();
    const currentChain = CHAINS[theme] || CHAINS.solana;
    
    const displayNetwork = network || currentChain.name;
    const displaySubtitle = subtitle || 'Infrastructure Monitor';

    return (
        <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl z-20 mb-8 rounded-2xl">
            <div className="px-6 py-4 md:py-6">
                <div className="flex flex-col items-start justify-center">
                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl md:text-2xl font-black text-white capitalize flex items-center gap-2">
                            {displayNetwork}
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--chain-accent)', boxShadow: '0 0 10px var(--chain-accent)' }} />
                        </h1>
                        <p className="text-xs md:text-sm font-medium text-white/50 tracking-[0.2em] uppercase">
                            {displaySubtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Animated gradient bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--chain-accent)_60%,transparent),transparent)]">
                <div className="h-full w-full bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--chain-accent)_80%,transparent),transparent)] animate-pulse"></div>
            </div>
        </header>
    );
}
