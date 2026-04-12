import Header from '@/components/dashboard/Header';
import ParticlesBackground from '@/components/ParticlesBackground';
import HyperliquidValidatorExplorer from '@/components/nodes/HyperliquidValidatorExplorer';

export default function HyperliquidNodes() {
    return (
        <div className="relative min-h-screen">
            <ParticlesBackground />
            <main className="relative z-10 p-4 lg:p-8 xl:p-10 mb-20 max-w-[1600px] mx-auto">
                <Header network="Hyperliquid" subtitle="Validator Explorer — Infrastructure Prospecting" />
                <div className="mt-8">
                    <HyperliquidValidatorExplorer />
                </div>
            </main>
        </div>
    );
}
