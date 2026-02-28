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
