'use client';

import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function HyperliquidUseCases() {
    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
        <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
            <Header network="Hyperliquid" subtitle="Use Cases & Case Studies" />
            <div className="mt-8">
                <div className="bg-[#00E5BE]/5 border border-[#00E5BE]/20 rounded-2xl p-8 backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Use Cases in Development</h2>
                    <p className="text-gray-400">
                        We are currently gathering case studies of institutional traders and market makers operating on Hyperliquid nodes via OVHcloud.
                    </p>
                </div>
            </div>
        </main>
        </div>
    );
}
