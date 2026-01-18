# Manual Backup Guide

## Quick Manual Backup

Yes! You can create a manual backup right now. Here are your options:

### Option 1: Using Supabase CLI (Recommended)

```powershell
# Install CLI (first time only)
npm install -g supabase

# Create backup
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres" -f "backup-$(Get-Date -Format 'yyyy-MM-dd').sql"
```

**Get your password:** https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database

### Option 2: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database
2. Scroll down to "Database backups"
3. Click "Download backup"
4. Save the file

### Option 3: Using pg_dump (if you have PostgreSQL)

```powershell
$env:PGPASSWORD="[YOUR-PASSWORD]"
pg_dump -h db.bxosgtiwjkpuguyggicm.supabase.co -p 5432 -U postgres -d postgres -f backup.sql
```

## Where to Store Backups

- `backups/` folder in your project (gitignored)
- Google Drive / Dropbox
- External hard drive
- **Never in public GitHub repos!**

## Backup Schedule

For Free tier, backup:
- Before major changes
- Weekly
- Before deployments

## Need Help?

Run `/backup-database` to see the full workflow guide.
