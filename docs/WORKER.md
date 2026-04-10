# 🚀 Background Worker Setup

## Overview

The background worker collects Solana node data every hour and caches the results to provide fast API responses (<100ms) instead of computing metrics in real-time.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Cron Job  │─────▶│    Worker    │─────▶│ cache.json  │
│  (Hourly)   │      │ (scripts/)   │      │   (data/)   │
└─────────────┘      └──────────────┘      └─────────────┘
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │  API Route   │
                                            │ (reads cache)│
                                            └──────────────┘
```

## Manual Execution

Run the worker manually:

```bash
npm run worker
```

This will:
1. Fetch 100 Solana nodes from the mainnet
2. Analyze each node's IP to determine hosting provider (OVH, AWS, Hetzner, etc.)
3. Calculate metrics (market share, revenue estimates, geo distribution)
4. Save results to `data/cache.json`

**Expected duration**: ~2-3 minutes (100 nodes × 1.5s delay = 150s)

## Automated Execution (Cron)

### Option 1: System Cron (macOS/Linux)

Edit your crontab:

```bash
crontab -e
```

Add this line to run every hour:

```cron
0 * * * * cd /Users/benoit/App\ track\ OVH\ footprint\ solana/ovh-solana-tracker && npm run worker >> logs/worker.log 2>&1
```

### Option 2: PM2 (Recommended for Production)

Install PM2:

```bash
npm install -g pm2
```

Create a PM2 ecosystem file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: 'ovh-solana-worker',
    script: 'npm',
    args: 'run worker',
    cron_restart: '0 * * * *', // Every hour
    autorestart: false,
    watch: false
  }]
};
```

Start the worker:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Vercel Cron (for deployed apps)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/worker",
    "schedule": "0 * * * *"
  }]
}
```

Then create `/api/worker/route.ts` that calls the worker logic.

## API Rate Limits

We use **ip-api.com** (free tier):
- **Limit**: 45 requests/minute
- **Delay**: 1.5 seconds between requests
- **Daily capacity**: ~2,880 requests/day
- **Hourly runs**: 100 nodes × 24 hours = 2,400 requests/day ✅

### Upgrading for More Nodes

To analyze more than 100 nodes:

1. **Paid ip-api.com** ($13/month):
   - 1,000 requests/minute
   - Reduce delay to 100ms
   - Analyze 500+ nodes in ~1 minute

2. **MaxMind GeoIP2** (one-time $50):
   - Local database (no API calls)
   - Unlimited lookups
   - Update monthly

3. **IPinfo.io** ($99/month):
   - 250,000 requests/month
   - ASN + geolocation data
   - Better accuracy

## Monitoring

Check worker logs:

```bash
# If using cron
tail -f logs/worker.log

# If using PM2
pm2 logs ovh-solana-worker
```

## Cache Structure

The `data/cache.json` file contains:

```json
{
  "data": {
    "totalNodes": 100,
    "ovhNodes": 5,
    "marketShare": 5.0,
    "estimatedRevenue": 750,
    "geoDistribution": { "US": 45, "DE": 20, ... },
    "providerDistribution": { "ovh": 5, "aws": 30, ... },
    "topValidators": [...]
  },
  "timestamp": 1706567890123,
  "nodeCount": 100
}
```

## Troubleshooting

### Rate Limit Errors (429)

If you see `429 Rate limit exceeded`:
- Increase delay in `src/lib/solana/filterOVH.ts` (line 18)
- Reduce `NODE_LIMIT` in `scripts/worker.ts` (line 21)

### No Cache File

If `data/cache.json` doesn't exist:
- Run `npm run worker` manually once
- Check file permissions on `data/` directory

### Stale Data

The API returns stale data if cache is >1 hour old:
- Check cron job is running: `crontab -l`
- Verify worker completed successfully
- Check logs for errors

## Development

Watch mode (re-runs on file changes):

```bash
npm run worker:watch
```

This is useful for testing changes to the worker logic.
