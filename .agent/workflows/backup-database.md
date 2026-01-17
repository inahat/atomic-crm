---
description: Create manual database backups
---

# Database Backup Workflow

This workflow creates manual backups of your Supabase database since the Free tier doesn't include automated backups.

**Important:** Free tier does NOT have automated backups. You must create backups manually.

## Quick Backup

1. **Create a full database backup**
   ```powershell
   npx supabase db dump -f "backups/backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm').sql" --project-ref bxosgtiwjkpuguyggicm
   ```

## Scheduled Backups (Recommended)

### Option 1: Windows Task Scheduler

Create a PowerShell script to run daily:

```powershell
# Save as: scripts/backup-database.ps1
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

$timestamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
$filename = "$backupDir/atomic-crm-backup-$timestamp.sql"

npx supabase db dump -f $filename --project-ref bxosgtiwjkpuguyggicm

# Keep only last 7 backups
Get-ChildItem $backupDir -Filter "*.sql" | 
    Sort-Object CreationTime -Descending | 
    Select-Object -Skip 7 | 
    Remove-Item
```

Then schedule it in Task Scheduler to run daily.

### Option 2: GitHub Actions (Automated)

Create `.github/workflows/backup-database.yml`:

```yaml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - name: Create backup
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          npx supabase db dump -f backup.sql --project-ref bxosgtiwjkpuguyggicm
      - name: Upload backup
        uses: actions/upload-artifact@v3
        with:
          name: database-backup-${{ github.run_number }}
          path: backup.sql
          retention-days: 7
```

## Restore from Backup

To restore a backup:

```powershell
# Restore from SQL file
psql -h db.bxosgtiwjkpuguyggicm.supabase.co -U postgres -d postgres -f backups/backup-2026-01-17.sql
```

Or use Supabase CLI:
```powershell
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres" --file backups/backup.sql
```

## Best Practices

1. **Backup before major changes** (migrations, schema updates)
2. **Keep backups in multiple locations** (local + cloud storage)
3. **Test restore process** periodically
4. **Consider upgrading to Pro** ($25/mo) for automated daily backups + PITR
