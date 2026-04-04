'use client';

import React from 'react';

interface ComingSoonCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ComingSoonCard({ title, description, children, className = '' }: ComingSoonCardProps) {
  return (
    <div className={`relative group rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* SAMPLE DATA watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <span className="-rotate-12 text-white/[0.04] font-black text-6xl uppercase tracking-widest whitespace-nowrap">
          SAMPLE DATA
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Coming Soon hover overlay */}
      <div className="absolute inset-0 z-20 rounded-xl bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]">
            Coming Soon
          </span>
          <span className="text-white/50 text-xs font-medium">{title}</span>
          {description && (
            <span className="text-white/30 text-[11px] text-center max-w-[240px]">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}
