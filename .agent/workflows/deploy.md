---
description: Deploy to Vercel production
---

# Workflow: Deploy to Vercel Production

This workflow handles the complete deployment process to Vercel, including pre-deployment checks and post-deployment verification.

## Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- Logged in to Vercel (`vercel login`)
- All environment variables configured in Vercel dashboard

## Steps

### 1. Pre-deployment Checks

Run linting:
```bash
npm run lint
```

### 2. Local Build Test

Test the production build locally:
```bash
npm run build
```

### 3. Review PROJECT_RULES.md Checklist

Ensure all items from the commit checklist are satisfied:
- [ ] Tests pass (or N/A)
- [ ] No `any`, `console.log`, `TODO`
- [ ] Types are correct
- [ ] `.env.example` updated if needed

### 4. Deploy to Vercel

// turbo
Deploy to production:
```bash
vercel --prod
```

### 5. Post-Deployment Verification

// turbo
Check deployment status:
```bash
vercel ls
```

### 6. Manual Verification

Open the deployed URL and verify:
- [ ] Homepage loads correctly
- [ ] KPI cards display data
- [ ] World map renders
- [ ] Charts are visible
- [ ] No console errors in browser

### 7. Monitor Logs

If issues arise, check logs:
```bash
vercel logs <deployment-url>
```

## Rollback (if needed)

If deployment fails, rollback to previous version:
```bash
vercel rollback
```

## Notes

- Always test locally before deploying
- Monitor Vercel dashboard for build errors
- Check Core Web Vitals after deployment
