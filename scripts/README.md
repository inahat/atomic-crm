# Database Backup Scripts

This directory contains scripts for backing up the AtomicCRM database.

## Quick Start

### Prerequisites

Install PostgreSQL client tools:
- Download from: https://www.postgresql.org/download/windows/
- Or use the installer and select only "Command Line Tools"

### Run Backup

```powershell
.\scripts\backup-database.ps1
```

This will:
- Create a backup in `C:\supabase_backups\`
- Generate a timestamped SQL file
- Show backup size and location

### Backups Location

All backups are stored in: `C:\supabase_backups\`

Example: `atomic-crm-backup_20260118_093000.sql`

## Restore

To restore a backup:

```powershell
psql -h db.bxosgtiwjkpuguyggicm.supabase.co -p 5432 -U postgres -d postgres -f "C:\supabase_backups\atomic-crm-backup_YYYYMMDD_HHMMSS.sql"
```

## Automation (Optional)

To automate backups using Windows Task Scheduler:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily/weekly)
4. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\Users\stuan\atomic-crm\scripts\backup-database.ps1"`
5. Save and test

## Security

⚠️ **Important:**
- Never commit backup files to Git
- Store backups securely
- Consider encrypting sensitive backups
- Rotate old backups regularly
