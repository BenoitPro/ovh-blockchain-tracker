'use client';

import Header from '@/components/dashboard/Header';

export default function HyperliquidAnalytics() {
    return (
        <main className="min-h-screen p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
            <Header network="Hyperliquid" subtitle="Network Analytics" />
            <div className="mt-8">
                <div className="bg-[#00E5BE]/5 border border-[#00E5BE]/20 rounded-2xl p-8 backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Analytics in Development</h2>
                    <p className="text-gray-400">
                        Historical tracking and latency metrics will become available once the validator set expands.
                    </p>
                </div>
            </div>
        </main>
    );
}
