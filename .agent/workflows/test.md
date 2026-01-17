---
description: Run the test suite
---

# Testing Workflow

This workflow runs the test suite using Vitest.

## Steps

1. **Run tests in watch mode**
   // turbo
   ```powershell
   npm test
   ```

2. **Run tests in CI mode (single run)**
   ```powershell
   $env:CI=1; npm test
   ```

## Type Checking

To run TypeScript type checking:
// turbo
```powershell
npm run typecheck
```

## Linting

To check code quality:
```powershell
npm run lint
npm run prettier
```

To auto-fix issues:
```powershell
npm run lint:apply
npm run prettier:apply
```
