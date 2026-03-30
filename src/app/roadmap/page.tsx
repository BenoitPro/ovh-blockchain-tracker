'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';
import BlockchainCubes from '@/components/BlockchainCubes';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function RoadmapPage() {
  const router = useRouter();
  const { theme } = useNetworkTheme();
  const isEth = theme === 'ethereum';
  const accent = isEth ? '#627EEA' : '#00F0FF';

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loggedIn = document.cookie.includes('ovh_ui=1');
    setIsLoggedIn(loggedIn);
    setMounted(true);
    if (!loggedIn) router.replace('/');
  }, [router]);

  if (!mounted || !isLoggedIn) return null;

  return (
    <div className="relative min-h-screen">
      <BlockchainCubes />
      <ParticlesBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black tracking-tight text-white">
              Blockchain Roadmap
            </h1>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: accent, borderColor: `${accent}50`, background: `${accent}12` }}>
              Internal
            </span>
          </div>
          <p className="text-white/40 text-sm">
            OVH infrastructure opportunities across blockchain networks — validators, RPC, and app ecosystems.
          </p>
        </div>

        <RoadmapTable accent={accent} />
        <div className="mt-16"><RoadmapTimeline accent={accent} /></div>
        <div className="mt-16"><ChainAccordions accent={accent} /></div>
      </div>
    </div>
  );
}

// Sub-components — stubs to be replaced in subsequent tasks
function RoadmapTable({ accent }: { accent: string }) {
  return <div style={{ color: accent }}>Table — coming in Task 3</div>;
}
function RoadmapTimeline({ accent }: { accent: string }) {
  return <div style={{ color: accent }}>Timeline — coming in Task 4</div>;
}
function ChainAccordions({ accent }: { accent: string }) {
  return <div style={{ color: accent }}>Accordions — coming in Task 5</div>;
}
