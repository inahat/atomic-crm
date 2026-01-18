# Supabase Database Backup Script
# Run this script to create a backup of your AtomicCRM database

# Configuration
$PGHOST = "db.bxosgtiwjkpuguyggicm.supabase.co"
$PGPORT = "5432"
$PGUSER = "postgres"
$PGDATABASE = "postgres"
$PGPASSWORD = "7s56of1Zpc75J0n3]"

# Create backup directory
$backupDir = "C:\supabase_backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Green
}

# Set environment variables
$env:PGHOST = $PGHOST
$env:PGPORT = $PGPORT
$env:PGUSER = $PGUSER
$env:PGPASSWORD = $PGPASSWORD
$env:PGDATABASE = $PGDATABASE

# Generate filename
$timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$filename = "atomic-crm-backup_$timestamp.sql"
$filepath = Join-Path $backupDir $filename

Write-Host "`nStarting backup..." -ForegroundColor Cyan
Write-Host "Database: $PGHOST" -ForegroundColor Gray
Write-Host "Output: $filepath" -ForegroundColor Gray
Write-Host ""

# Run pg_dump
try {
    pg_dump -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -F p -v -f $filepath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nBackup completed successfully!" -ForegroundColor Green
        
        $fileInfo = Get-Item $filepath
        $sizeInMB = [math]::Round($fileInfo.Length / 1MB, 2)
        
        Write-Host "`nBackup Details:" -ForegroundColor Cyan
        Write-Host "  File: $filename" -ForegroundColor White
        Write-Host "  Size: $sizeInMB MB" -ForegroundColor White
        Write-Host "  Location: $backupDir" -ForegroundColor White
    }
    else {
        Write-Host "`nBackup failed!" -ForegroundColor Red
        Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
}
catch {
    Write-Host "`nError during backup:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nMake sure PostgreSQL client tools are installed" -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
}

# Clear password
$env:PGPASSWORD = $null
