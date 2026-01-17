# Database Restore Testing Guide

## Overview

This guide shows you how to test restoring your database backup to ensure your backup strategy works correctly.

## ⚠️ Important Safety Notes

- **NEVER restore to production without a backup first!**
- Test restores on a separate test project or local instance
- Restoring will **OVERWRITE ALL DATA** in the target database

## Option 1: Test Restore Locally (Recommended)

### Prerequisites
- Docker Desktop installed
- Supabase CLI installed

### Steps

1. **Start local Supabase instance**
   ```powershell
   npx supabase start
   ```

2. **Restore backup to local instance**
   ```powershell
   # Get your local database URL (shown after supabase start)
   $LOCAL_DB_URL = "postgresql://postgres:postgres@localhost:54322/postgres"
   
   # Restore the backup
   psql $LOCAL_DB_URL -f backups/atomic-crm-backup-2026-01-17-1041.sql
   ```

3. **Verify the restore**
   ```powershell
   # Connect to local database
   psql $LOCAL_DB_URL
   
   # Check tables exist
   \dt
   
   # Check row counts
   SELECT 'contacts' as table_name, COUNT(*) as rows FROM contacts
   UNION ALL
   SELECT 'companies', COUNT(*) FROM companies
   UNION ALL
   SELECT 'deals', COUNT(*) FROM deals;
   
   # Exit
   \q
   ```

4. **Stop local instance when done**
   ```powershell
   npx supabase stop
   ```

## Option 2: Test Restore to Development Branch

### Prerequisites
- Supabase Pro plan (for branches feature)

### Steps

1. **Create a development branch**
   ```powershell
   npx supabase branches create test-restore --project-ref bxosgtiwjkpuguyggicm
   ```

2. **Get branch database URL**
   ```powershell
   npx supabase branches get test-restore --project-ref bxosgtiwjkpuguyggicm
   ```

3. **Restore backup to branch**
   ```powershell
   psql "postgresql://postgres:[PASSWORD]@[BRANCH-HOST]:5432/postgres" -f backups/atomic-crm-backup-2026-01-17-1041.sql
   ```

4. **Verify and delete branch**
   ```powershell
   # After verification
   npx supabase branches delete test-restore --project-ref bxosgtiwjkpuguyggicm
   ```

## Option 3: Manual Verification (Quick Check)

### Check Backup File Integrity

1. **View backup file size**
   ```powershell
   Get-ChildItem backups/*.sql | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}} | Sort-Object Name -Descending
   ```

2. **Check backup contains data**
   ```powershell
   # Search for table creation statements
   Select-String -Path "backups/atomic-crm-backup-*.sql" -Pattern "CREATE TABLE" | Select-Object -First 10
   
   # Search for data insert statements
   Select-String -Path "backups/atomic-crm-backup-*.sql" -Pattern "INSERT INTO" | Select-Object -First 10
   ```

3. **Count SQL statements**
   ```powershell
   $backup = Get-Content "backups/atomic-crm-backup-2026-01-17-1041.sql" -Raw
   $createTables = ([regex]::Matches($backup, "CREATE TABLE")).Count
   $inserts = ([regex]::Matches($backup, "INSERT INTO")).Count
   
   Write-Host "CREATE TABLE statements: $createTables"
   Write-Host "INSERT INTO statements: $inserts"
   ```

## Automated Restore Test Script

Save this as `scripts/test-restore.ps1`:

```powershell
# Test Restore Script
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

Write-Host "🧪 Testing database restore..." -ForegroundColor Cyan

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Check file size
$fileSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "📦 Backup file size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green

# Check for critical content
$content = Get-Content $BackupFile -Raw
$hasSchema = $content -match "CREATE TABLE"
$hasData = $content -match "INSERT INTO"

if ($hasSchema) {
    Write-Host "✅ Schema found in backup" -ForegroundColor Green
} else {
    Write-Host "⚠️  No schema found in backup" -ForegroundColor Yellow
}

if ($hasData) {
    Write-Host "✅ Data found in backup" -ForegroundColor Green
} else {
    Write-Host "⚠️  No data found in backup" -ForegroundColor Yellow
}

# Count statements
$createCount = ([regex]::Matches($content, "CREATE TABLE")).Count
$insertCount = ([regex]::Matches($content, "INSERT INTO")).Count

Write-Host "`n📊 Backup Statistics:" -ForegroundColor Cyan
Write-Host "   Tables: $createCount"
Write-Host "   Insert statements: $insertCount"

Write-Host "`n✅ Backup file appears valid!" -ForegroundColor Green
Write-Host "`n💡 To test full restore, run:" -ForegroundColor Yellow
Write-Host "   npx supabase start" -ForegroundColor White
Write-Host "   psql postgresql://postgres:postgres@localhost:54322/postgres -f $BackupFile" -ForegroundColor White
```

## Usage

```powershell
# Test the most recent backup
.\scripts\test-restore.ps1 -BackupFile "backups/atomic-crm-backup-2026-01-17-1041.sql"
```

## Recommended Testing Schedule

- ✅ **After first backup:** Test restore locally
- ✅ **Monthly:** Full restore test to local instance
- ✅ **Before major changes:** Verify latest backup is restorable
- ✅ **After schema migrations:** Test backup includes new schema

## Troubleshooting

### "psql: command not found"
Install PostgreSQL client tools or use Docker:
```powershell
docker run --rm -v ${PWD}/backups:/backups postgres:17 psql postgresql://host.docker.internal:54322/postgres -f /backups/backup.sql
```

### "permission denied"
Ensure you're using the correct database credentials and the database allows connections.

### "relation already exists"
The database isn't empty. Either:
- Use a fresh database
- Drop existing tables first (dangerous!)
- Use `--clean` flag with pg_restore

## Next Steps

After successful restore testing:
1. ✅ Document the restore process
2. ✅ Schedule regular restore tests
3. ✅ Consider upgrading to Supabase Pro for automated backups
4. ✅ Store backups in multiple locations (GitHub + local + cloud storage)
