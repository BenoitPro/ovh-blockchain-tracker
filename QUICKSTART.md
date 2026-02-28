# 🚀 Quick Start Guide

## Get Up and Running in 3 Minutes

### Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

### Step 2: Collect Initial Data (2-3 minutes)

```bash
npm run worker
```

You'll see:
```
🚀 [Worker] Starting Solana data collection...
📡 [Worker] Fetching 100 Solana nodes...
✅ [Worker] Fetched 100 nodes
🔍 [Worker] Analyzing provider distribution...
✅ [Worker] Found 3 OVH nodes
💾 [Worker] Saving to cache...
✅ [Worker] Data collection completed successfully!
```

### Step 3: Start the Dashboard (10 seconds)

```bash
npm run dev
```

Open http://localhost:3000 and you'll see:

✅ **3 OVH Nodes** actively running
✅ **3.00% Market Share** of analyzed nodes
✅ **€450/month** estimated revenue
✅ **France & UK** geographical distribution

## 🎯 What You Get

### Real Data, Not Mockups
- **3 actual OVH nodes** detected on Solana mainnet
- Located in **Strasbourg (France)** and **London (UK)**
- ASN verification via **AS16276** (OVHcloud)

### Lightning-Fast Performance
- **<100ms** API response time
- **No rate limit errors** for users
- **Cached data** updated hourly

### Production-Ready
- **Background worker** for automated updates
- **Graceful error handling** with stale data fallback
- **Comprehensive logging** for monitoring

## 📊 Dashboard Features

### KPI Cards
- Total nodes analyzed
- OVH nodes count
- Market share percentage
- Estimated monthly revenue

### Donut Chart
- Visual comparison: OVH vs AWS vs Hetzner vs Others
- Interactive tooltips
- Color-coded segments

### Geo Distribution
- Country-level breakdown
- Percentage distribution
- Visual bar chart

### Top Validators Table
- Public key
- Location (city, country)
- ASN verification

## 🔄 Keeping Data Fresh

### Option 1: Manual Updates
```bash
npm run worker
```

### Option 2: Automated (Cron)
```bash
crontab -e
```
Add:
```cron
0 * * * * cd /path/to/project && npm run worker >> logs/worker.log 2>&1
```

### Option 3: PM2 (Recommended)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

## 🐛 Troubleshooting

### "No data showing"
```bash
# Run worker manually
npm run worker

# Check cache exists
ls -lh data/cache.json
```

### "Rate limit errors"
This is normal during worker execution. The system handles it automatically with:
- 1.5 second delay between requests
- 3 automatic retries
- Exponential backoff

### "Stale data warning"
```bash
# Check when cache was last updated
cat data/cache.json | jq '.timestamp'

# Run worker to refresh
npm run worker
```

## 📈 Next Steps

1. ✅ **Set up automated updates** (cron or PM2)
2. ✅ **Monitor logs** to ensure hourly execution
3. 📊 **Analyze trends** over time
4. 🚀 **Scale up** to 500+ nodes (requires paid API)

## 💡 Pro Tips

### Development Mode
```bash
# Auto-reload worker on file changes
npm run worker:watch
```

### Check API Response
```bash
curl http://localhost:3000/api/solana | jq
```

### View Logs
```bash
tail -f logs/worker.log
```

### Monitor PM2
```bash
pm2 status
pm2 logs ovh-solana-worker
```

## 🎓 Learn More

- [Full Documentation](README.md)
- [Worker Setup Guide](docs/WORKER.md)
- [Changelog](CHANGELOG.md)
- [Deployment Guide](DEPLOYMENT.md)

---

**That's it!** You now have a production-ready OVHcloud Solana infrastructure tracker with real data. 🎉
