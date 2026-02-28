export default function LoadingState() {
    return (
        <div className="min-h-screen bg-[#000E1E] flex items-center justify-center">
            <div className="text-center">
                {/* Animated spinner */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00F0FF] animate-spin"></div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    Analyzing Solana Network
                </h2>
                <p className="text-gray-400">
                    Fetching node data and calculating metrics...
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
