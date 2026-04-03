import Header from '@/components/dashboard/Header';

export default function HyperliquidNodes() {
    return (
        <main className="min-h-screen p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
            <Header network="Hyperliquid" subtitle="Node Explorer" />
            <div className="mt-8">
                <div className="bg-[#00E5BE]/5 border border-[#00E5BE]/20 rounded-2xl p-8 backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Explorer in Development</h2>
                    <p className="text-gray-400">
                        Hyperliquid currently operates with a small set of 24 validator nodes. 
                        A full explorer will be deployed as the network decentralizes further and expands its validator set.
                    </p>
                </div>
            </div>
        </main>
    );
}
