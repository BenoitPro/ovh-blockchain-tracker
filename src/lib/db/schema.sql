-- SQLite Schema for OVH Solana Tracker Historical Metrics
-- This table stores daily snapshots of market share metrics

CREATE TABLE IF NOT EXISTS metrics_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL UNIQUE,  -- Unix timestamp in milliseconds
    total_nodes INTEGER NOT NULL,
    ovh_nodes INTEGER NOT NULL,
    market_share REAL NOT NULL,         -- Percentage (0-100)
    estimated_revenue INTEGER NOT NULL, -- Monthly revenue in EUR
    geo_distribution TEXT NOT NULL,     -- JSON object: {"France": 10, "Germany": 5, ...}
    provider_distribution TEXT NOT NULL, -- JSON object: {"ovh": 15, "aws": 50, ...}
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for fast date range queries
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp DESC);

-- Index for market share analysis
CREATE INDEX IF NOT EXISTS idx_metrics_market_share ON metrics_history(market_share);

-- Ethereum Node Snapshots
-- Each row is one manual crawl snapshot
CREATE TABLE IF NOT EXISTS ethereum_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    total_nodes INTEGER NOT NULL,
    provider_distribution TEXT NOT NULL,  -- JSON: {ovh: 200, aws: 1400, ...}
    geo_distribution TEXT NOT NULL,       -- JSON: {FR: 500, DE: 800, ...}
    provider_breakdown TEXT NOT NULL,     -- JSON: ProviderBreakdownEntry[]
    crawl_duration_min INTEGER,           -- crawl duration in minutes
    created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_eth_snapshots_timestamp ON ethereum_snapshots(timestamp DESC);
