# 📋 Changelog

## [2.0.0] - 2026-01-30 - Background Worker System

### 🎉 Major Features

#### Background Worker Architecture
- **Implemented hourly data collection** via background worker script
- **Cache-first API** reads from `data/cache.json` instead of computing in real-time
- **Response time improvement**: From 30-60s to <100ms (300-600x faster)
- **Reliability improvement**: No more rate limit errors for end users

#### Enhanced Rate Limiting
- **Switched IP API provider**: From ipapi.co to ip-api.com
  - Old: ~150 requests/day (too restrictive)
  - New: 45 requests/minute (2,880 requests/day)
- **Intelligent RateLimiter class** with exponential backoff
  - Automatically retries on 429 errors
  - Configurable delay and retry count
  - Graceful degradation on failures

#### Improved Data Collection
- **Increased node analysis**: From 50 to 100 nodes per run
- **Better ASN extraction**: Regex-based parsing from ip-api.com response
- **Persistent caching**: Results stored in JSON file with timestamp
- **Stale data handling**: API returns old data with warning if cache is outdated

### 📁 New Files

```
scripts/
  └── worker.ts                    # Background worker for data collection

src/lib/
  ├── cache/
  │   └── storage.ts               # Cache read/write utilities
  └── utils/
      └── rateLimiter.ts           # Smart rate limiting with retry logic

data/
  └── cache.json                   # Cached metrics (auto-generated)

logs/
  └── worker.log                   # Worker execution logs

docs/
  └── WORKER.md                    # Comprehensive worker documentation

ecosystem.config.js                # PM2 configuration for automation
```

### 🔧 Modified Files

#### `src/app/api/solana/route.ts`
- Removed in-memory cache (5-minute TTL)
- Added file-based cache reading with `readCache()`
- Implemented stale data fallback
- Added cache metadata (timestamp, stale flag)

#### `src/lib/solana/filterOVH.ts`
- Replaced ipapi.co with ip-api.com
- Integrated RateLimiter for all IP lookups
- Increased delay from 150ms to 1500ms (respects 45 req/min limit)
- Improved ASN extraction with regex
- Removed manual `setTimeout` delays (handled by RateLimiter)

#### `src/types/index.ts`
- Added `stale?: boolean` to APIResponse
- Added `timestamp?: number` to APIResponse

#### `package.json`
- Added `tsx` dev dependency for TypeScript execution
- Added `worker` script: `tsx scripts/worker.ts`
- Added `worker:watch` script for development

### 📊 Results

**First successful worker run (100 nodes analyzed)**:
- **OVH Nodes Found**: 3
- **Market Share**: 3.00%
- **Estimated Revenue**: €450/month
- **Locations**: 
  - France (Strasbourg): 1 node
  - United Kingdom (London): 2 nodes
- **Provider Distribution**:
  - OVH: 3 nodes
  - AWS: 1 node
  - Hetzner: 1 node
  - Others: 95 nodes

### 🐛 Bug Fixes

- **Fixed rate limit errors**: Switched to more generous API provider
- **Fixed cache invalidation**: Now uses file-based cache instead of in-memory
- **Fixed inconsistent results**: Worker ensures data is collected systematically

### 📚 Documentation

- Created `docs/WORKER.md` with setup instructions
- Updated `README.md` with new architecture diagram
- Added PM2 ecosystem configuration
- Documented cron job setup options

### ⚡ Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API Response Time | 30-60s | <100ms | **300-600x faster** |
| Rate Limit Errors | Frequent | None | **100% reduction** |
| Nodes Analyzed | 50 | 100 | **2x more data** |
| Daily API Calls | ~7,200 | ~2,400 | **66% reduction** |
| User Experience | Poor | Excellent | **Instant loading** |

### 🔄 Migration Guide

#### For Developers

1. Install new dependencies:
   ```bash
   npm install
   ```

2. Run worker once to generate cache:
   ```bash
   npm run worker
   ```

3. Start dev server as usual:
   ```bash
   npm run dev
   ```

#### For Production

1. Set up automated worker execution (choose one):
   - **Cron**: `crontab -e` and add hourly job
   - **PM2**: `pm2 start ecosystem.config.js`
   - **Vercel Cron**: Add to `vercel.json`

2. Monitor logs:
   ```bash
   tail -f logs/worker.log
   ```

### 🚀 Future Enhancements

- [ ] Add Prometheus metrics for monitoring
- [ ] Implement webhook notifications on worker completion
- [ ] Add support for multiple blockchain networks (Ethereum, Polygon)
- [ ] Create admin dashboard to trigger manual worker runs
- [ ] Implement incremental updates (only check new nodes)
- [ ] Add historical data tracking (trend analysis)
- [ ] Upgrade to paid API tier for 500+ nodes analysis

### ⚠️ Breaking Changes

- **API Response Format**: Added `cached`, `stale`, and `timestamp` fields
- **Cache Location**: Moved from in-memory to `data/cache.json`
- **IP API Provider**: Changed from ipapi.co to ip-api.com (affects ASN format)

### 🙏 Acknowledgments

- Solana Foundation for the RPC API
- ip-api.com for generous free tier
- OVHcloud for the infrastructure

---

## [1.0.0] - 2026-01-29 - Initial Release

### Features

- Real-time Solana node fetching
- OVH ASN filtering
- Market share calculation
- Geo distribution analysis
- Premium dark mode UI
- Recharts visualizations

### Known Issues

- Slow API response times (30-60s)
- Frequent rate limit errors
- Limited to 50 nodes
- Inconsistent results due to API quotas
