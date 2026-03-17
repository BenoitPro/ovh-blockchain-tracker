import Image from 'next/image';
import ChainToggle from '@/components/ChainToggle';

export default function Header() {
    return (
        <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-xl z-20">
            <div className="container mx-auto px-4 py-4 md:py-5">
                <div className="flex flex-col items-center justify-center space-y-2 md:space-y-3">
                    {/* OVHcloud Logo */}
                    <a
                        href="https://www.ovhcloud.com/en/lp/powering-blockchain-ethos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block cursor-pointer"
                    >
                        <div className="relative z-10 transition-transform duration-700 group-hover:scale-110">
                            <Image
                                src="/ovhcloud-logo.png"
                                alt="OVHcloud"
                                width={400}
                                height={100}
                                className="h-10 md:h-14 lg:h-16 w-auto brightness-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                priority
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-radial from-[#00F0FF]/40 via-[#6B4FBB]/20 to-transparent blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 -z-10 scale-[2]"></div>
                    </a>

                    {/* Title */}
                    <div className="text-center">
                        <h1 className="text-xs md:text-sm lg:text-base font-medium text-white/70 tracking-[0.2em] md:tracking-[0.4em] uppercase">
                            Solana Infrastructure{' '}
                            <span className="bg-gradient-to-r from-[#00F0FF] via-[#6B4FBB] to-[#00F0FF] bg-clip-text text-transparent animate-glow font-black drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                                Monitor
                            </span>
                        </h1>
                    </div>

                    {/* Chain Toggle + Explorer link */}
                    <div className="flex items-center gap-6 pt-1">
                        <ChainToggle />
                        <a
                            href="/nodes"
                            className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40 hover:text-[#00F0FF] transition-colors relative group"
                        >
                            Explorer
                            <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-[#00F0FF] group-hover:w-full transition-all duration-300"></span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Animated gradient bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-[#6B4FBB]/40 to-transparent animate-pulse"></div>
            </div>

            {/* Global background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#00296B]/30 via-transparent to-transparent pointer-events-none -z-10"></div>
        </header>
    );
}
