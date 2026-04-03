import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
    network?: 'solana' | 'ethereum' | 'avalanche';
}

export default function ErrorState({ message, onRetry, network = 'solana' }: ErrorStateProps) {
    const isEth = network === 'ethereum';
    const isAvax = network === 'avalanche';
    const bgClass = isEth ? 'bg-white' : isAvax ? 'bg-[#0a0404]' : 'bg-[#000E1E]';
    const textClass = isEth ? 'text-slate-800' : 'text-white';
    const subTextClass = isEth ? 'text-slate-500' : 'text-gray-400';
    const btnClass = isEth 
        ? 'bg-[#627EEA] hover:bg-[#526AD4] text-white' 
        : isAvax 
        ? 'bg-[#E84142] hover:bg-[#D63A3A] text-white' 
        : 'bg-[#00F0FF] hover:bg-[#00D4E6] text-[#000E1E]';

    return (
        <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
            <div className="text-center max-w-md mx-auto px-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
                </div>

                <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>
                    Unable to Load Data
                </h2>
                <p className={`mb-6 ${subTextClass}`}>
                    {message}
                </p>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={`px-6 py-3 rounded-xl font-semibold transition-colors duration-200 ${btnClass}`}
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
}
