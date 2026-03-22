export default function LoadingState({ fullPage = false }: { fullPage?: boolean }) {
    return (
        <div className={`${fullPage ? 'min-h-screen' : 'py-12'} bg-[#000E1E] flex items-center justify-center`}>
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-[#00F0FF]/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-[#00F0FF] font-mono text-sm uppercase tracking-[0.2em] animate-pulse">
                    Collecting Data...
                </p>
                {/* Animated dots */}
                <div className="flex justify-center space-x-2 mt-4">
                    <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse delay-150"></div>
                </div>
            </div>
        </div>
    );
}
