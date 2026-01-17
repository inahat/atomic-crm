---
description: Deploy the application to production
---

# Deployment Workflow

This workflow deploys the atomic-crm application to production (GitHub Pages) and Supabase.

## Pre-Deployment Checks

1. **Run tests**
   ```powershell
   npm test
   ```

2. **Type check**
   ```powershell
   npm run typecheck
   ```

3. **Lint code**
   ```powershell
   npm run lint
   npm run prettier
   ```

## Build and Deploy

4. **Build the application**
   ```powershell
   npm run build
   ```

5. **Deploy database migrations and functions**
   ```powershell
   npx supabase db push
   npx supabase functions deploy
   ```

6. **Deploy to GitHub Pages**
   ```powershell
   npm run ghpages:deploy
   ```

## Using Makefile (Alternative)

You can also use the makefile for a streamlined deployment:
```powershell
make prod-deploy
```

This runs: build → supabase-deploy → ghpages:deploy

## Verify Deployment

After deployment, verify:
- Check GitHub Pages URL is working
- Test Supabase functions are responding
- Verify database migrations applied correctly
