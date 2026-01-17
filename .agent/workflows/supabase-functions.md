---
description: Work with Supabase Edge Functions
---

# Supabase Edge Functions Workflow

This workflow helps you develop and deploy Supabase Edge Functions to your cloud-hosted instance.

**Note:** This project uses cloud-hosted Supabase. Functions are deployed directly to the cloud.

## Creating a New Function

1. **Create a new Edge Function directory**
   
   Manually create a new folder in `supabase/functions/<function_name>/` with an `index.ts` file.

2. **Write your function code**
   
   Example structure:
   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   
   serve(async (req) => {
     // Your function logic here
     return new Response(JSON.stringify({ message: 'Hello' }), {
       headers: { 'Content-Type': 'application/json' }
     })
   })
   ```

## Deploying Functions

3. **Deploy all functions to cloud**
   ```powershell
   npx supabase functions deploy
   ```

4. **Deploy a specific function**
   ```powershell
   npx supabase functions deploy <function_name>
   ```

## Testing Deployed Functions

5. **Test a deployed function**
   ```powershell
   Invoke-WebRequest -Uri 'https://<project-ref>.supabase.co/functions/v1/<function_name>' `
     -Method POST `
     -Headers @{ 'Authorization' = 'Bearer <anon_key>'; 'Content-Type' = 'application/json' } `
     -Body '{"key":"value"}'
   ```

## Viewing Function Logs

To view logs for deployed functions:
```powershell
npx supabase functions logs <function_name>
```

## Current Functions

Your project has these Edge Functions:
- `mergeContacts` - Merges duplicate contacts
- `parse-ovrc-alert` - Parses OvrC alert data
- `postmark` - Handles Postmark email webhooks
- `users` - User management functions
