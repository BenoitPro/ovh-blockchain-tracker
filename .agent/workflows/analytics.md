---
description: Analyze project metrics and logs
---

# Workflow: Analytics & Performance Analysis

This workflow analyzes Vercel deployment logs, Solana RPC performance, and generates actionable insights.

## Prerequisites
- Vercel CLI installed and authenticated
- Access to Vercel project logs

## Steps

### 1. Fetch Recent Deployment Logs

// turbo
Get logs from the last deployment:
```bash
vercel logs --since 24h
```

### 2. Analyze Build Performance

Check build times and identify bottlenecks:
- Review build duration in Vercel dashboard
- Identify slow dependencies
- Check bundle size

### 3. Monitor Solana RPC Performance

Analyze the performance of Solana RPC calls:
- Check response times in application logs
- Identify timeout errors
- Monitor cache hit rates

### 4. Review Error Logs

Filter for errors and warnings:
```bash
vercel logs --since 24h | grep -i error
```

### 5. Generate Performance Report

Create a markdown report with:
- Deployment frequency (last 7 days)
- Average build time
- Error rate
- Top 5 slowest API routes
- Recommendations for optimization

### 6. Check Core Web Vitals

Use Vercel Analytics or Lighthouse to check:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

### 7. Suggest Optimizations

Based on the analysis, suggest:
- Code splitting opportunities
- Caching improvements
- Database query optimizations
- Image optimization needs

## Output Format

Generate a report in this format:

```markdown
# Analytics Report - [Date]

## Deployment Metrics
- Total deployments: X
- Average build time: Xs
- Success rate: X%

## Performance
- LCP: Xs
- FID: Xms
- CLS: X

## Errors
- Total errors: X
- Top error: [description]

## Recommendations
1. [Action item 1]
2. [Action item 2]
```

## Notes

- Run this workflow weekly for continuous monitoring
- Save reports in `docs/analytics/` for historical tracking
- Use insights to update PROJECT_RULES.md
