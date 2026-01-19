<#
.SYNOPSIS
Creates a local database backup for AtomicCRM (Supabase).
Verified working command (Flag-based syntax).

.DESCRIPTION
This script uses pg_dump to create a custom-format backup.
It uses explicit flags (-h, -U, etc.) which is more robust on Windows than connection URIs.

.EXAMPLE
.\scripts\backup-database.ps1
#>

$ErrorActionPreference = "Stop"

# Configuration
$HostName = "aws-1-eu-west-1.pooler.supabase.com"
$Port = "5432"
$User = "postgres.bxosgtiwjkpuguyggicm" 
$Database = "postgres"
$BackupDir = Join-Path $PSScriptRoot "..\backups"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Timestamp for filename
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "supabase_backup_$Timestamp.dump"

Write-Host "=== Starting AtomicCRM Database Backup ===" -ForegroundColor Cyan
Write-Host "Target: $HostName" -ForegroundColor Gray
Write-Host "User:   $User" -ForegroundColor Gray
Write-Host "File:   $BackupFile" -ForegroundColor Gray
Write-Host ""

# Set PGPASSWORD environment variable
$env:PGPASSWORD = "7s56of1Zpc75J0n3"

try {
    Write-Host "Running pg_dump..." -ForegroundColor Yellow
    
    # Execute pg_dump using verified flag syntax
    # -h host, -U user, -p port, -d db, -F c (custom), -b (blobs), -v (verbose), -f file
    pg_dump -h $HostName `
        -U $User `
        -p $Port `
        -d $Database `
        -F c `
        -b `
        -v `
        -f $BackupFile

    if (Test-Path $BackupFile) {
        $FileItem = Get-Item $BackupFile
        if ($FileItem.Length -eq 0) {
            throw "Backup file is empty (0 KB). Verification failed."
        }

        $Size = $FileItem.Length / 1MB
        Write-Host ""
        Write-Host "✅ Backup successful!" -ForegroundColor Green
        Write-Host "Saved to: $BackupFile" -ForegroundColor Green
        Write-Host "Size:     $([math]::Round($Size, 2)) MB" -ForegroundColor Green
    }
    else {
        throw "Backup file was not created at expected path."
    }

}
catch {
    Write-Host ""
    Write-Host "❌ Backup Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Error details: $($_.ErrorDetails)" -ForegroundColor Red
    }
    exit 1
}
finally {
    # Clean up environment variable
    $env:PGPASSWORD = $null
}
