---
description: Build the application for production
---

# Build Workflow

This workflow builds the atomic-crm application for production.

## Standard Build

1. **Build the application**
   // turbo
   ```powershell
   npm run build
   ```
   This runs TypeScript compilation and Vite build. Output goes to `dist/`.

## Demo Build

2. **Build in demo mode**
   ```powershell
   npm run build:demo
   ```
   This builds the demo version with fake data.

## Preview Production Build

3. **Preview the production build locally**
   // turbo
   ```powershell
   npm run preview
   ```
   This serves the built files from `dist/` for testing.

## Build Verification

After building, verify:
- Check `dist/` folder exists
- Run `npm run preview` to test the build
- Ensure no TypeScript errors
- Check bundle size in terminal output

## Using Makefile

Alternative using make:
```powershell
make build        # Standard build
make build-demo   # Demo build
make prod-start   # Build and serve locally
```
