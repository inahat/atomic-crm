---
description: Start the local development environment
---

# Development Workflow

This workflow starts the local development server for atomic-crm.

**Note:** This project uses cloud-hosted Supabase, so no local Supabase setup is needed.

## Steps

1. **Start the development server**
   // turbo
   ```powershell
   npm run dev
   ```

The app will be available at `http://localhost:5173` (or the port shown in terminal).

## Alternative: Demo Mode

To start in demo mode (with fake data, no Supabase connection):
```powershell
npm run dev:demo
```

## Environment Setup

Make sure you have your Supabase credentials configured in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
