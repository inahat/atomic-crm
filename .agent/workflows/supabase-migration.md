---
description: Create and apply Supabase database migrations
---

# Supabase Migration Workflow

This workflow helps you create and apply database migrations to your cloud-hosted Supabase instance.

**Note:** This project uses cloud-hosted Supabase, so migrations are applied directly to the remote database.

## Creating a New Migration

1. **Create a new migration file manually**
   
   Create a new SQL file in `supabase/migrations/` with the format:
   ```
   YYYYMMDDHHMMSS_<migration_name>.sql
   ```
   
   Example: `20260117120000_add_contracts_table.sql`

2. **Write your SQL migration**
   
   Add your SQL statements to the migration file. Example:
   ```sql
   -- Add new column to contracts table
   ALTER TABLE contracts ADD COLUMN status TEXT DEFAULT 'draft';
   ```

## Deploying Migrations to Cloud

3. **Push migrations to cloud Supabase**
   ```powershell
   npx supabase db push
   ```
   
   This applies all pending migrations to your cloud database.

## Checking Migration Status

To see which migrations have been applied:
```powershell
npx supabase migration list
```

## Important Notes

- ⚠️ **Always test SQL in Supabase SQL Editor first** before creating a migration
- ⚠️ **Migrations are applied directly to production** - be careful!
- Consider backing up data before running destructive migrations
