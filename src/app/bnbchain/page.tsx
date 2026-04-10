import BNBChainDashboard from '@/components/dashboard/BNBChainDashboard';
import { BNBChainAPIResponse } from '@/types/bnbchain';

/**
 * BNB Chain dashboard page — server component.
 *
 * Fetches live data from /api/bnbchain (backed by the Turso cache populated
 * by the cron at /api/cron/bnb-refresh).
 *
 * Gracefully handles:
 *   - 503: cache not yet populated (cron hasn't run)
 *   - Network / parsing errors
 */
export default async function BNBChainPage() {
    let apiResponse: BNBChainAPIResponse | null = null;
    let fetchError: string | null = null;

    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const res = await fetch(`${baseUrl}/api/bnbchain`, {
            cache: 'no-store',
        });

        if (res.status === 503) {
            fetchError = 'not-ready';
        } else if (!res.ok) {
            fetchError = `HTTP ${res.status}`;
        } else {
            apiResponse = (await res.json()) as BNBChainAPIResponse;
            if (!apiResponse.success || !apiResponse.data) {
                fetchError = apiResponse.error ?? 'Unknown error';
                apiResponse = null;
            }
        }
    } catch (err) {
        fetchError = err instanceof Error ? err.message : 'Network error';
    }

    // ── No data yet — graceful fallback ───────────────────────────────────────
    if (!apiResponse?.data) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-8">
                <div
                    className="max-w-lg w-full rounded-2xl p-8 border text-center"
                    style={{
                        background: 'linear-gradient(135deg, rgba(243, 186, 47, 0.05), rgba(0,0,0,0.4))',
                        borderColor: 'rgba(243, 186, 47, 0.2)',
                    }}
                >
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{
                            background: 'rgba(243, 186, 47, 0.1)',
                            border: '1px solid rgba(243, 186, 47, 0.3)',
                        }}
                    >
                        <svg
                            className="w-6 h-6"
                            style={{ color: '#F3BA2F' }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Data collection in progress</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        {fetchError === 'not-ready'
                            ? 'BNB Chain node data is being indexed for the first time. Check back shortly — it usually takes less than a minute.'
                            : `Unable to load BNB Chain data (${fetchError ?? 'unknown error'}). Please try again in a few moments.`}
                    </p>
                    <a
                        href="/bnbchain"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-black hover:scale-105"
                        style={{ background: '#F3BA2F' }}
                    >
                        Retry
                    </a>
                </div>
            </div>
        );
    }

    const cachedAt = apiResponse.timestamp ?? 0;

    return (
        <BNBChainDashboard
            metrics={apiResponse.data}
            cachedAt={cachedAt}
            isStale={apiResponse.stale}
        />
    );
}
