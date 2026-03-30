-- SQLite Schema for OVH Blockchain Tracker Historical Metrics
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

-- Leads table for internal CRM
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT NOT NULL,
    legal_form TEXT NOT NULL,
    country TEXT NOT NULL,
    photo TEXT,                  -- base64 data URL
    donotphone INTEGER DEFAULT 0,
    donotbulkemail INTEGER DEFAULT 0,
    target_owner TEXT,
    evaluation TEXT,
    description TEXT,
    mobile_phone TEXT,
    job_title TEXT,
    interested_by TEXT,
    products_solutions TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
