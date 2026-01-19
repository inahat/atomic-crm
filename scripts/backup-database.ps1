<#
.SYNOPSIS
Creates a local database backup for AtomicCRM (Supabase).
Using confirmed working configuration for Free Tier (plain username).

.DESCRIPTION
This script uses pg_dump to create a custom-format backup of the Supabase database.
It requires PostgreSQL client tools (pg_dump) to be installed and in the PATH.

.EXAMPLE
.\scripts\backup-database.ps1
#>

$ErrorActionPreference = "Stop"

# Configuration
$PoolerHost = "aws-1-eu-west-1.pooler.supabase.com"
$Port = "5432"
$User = "postgres" # Plain username works for pg_dump authentication
$Database = "postgres"
$BackupDir = Join-Path $PSScriptRoot "..\backups"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Timestamp for filename
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "atomic_crm_backup_$Timestamp.dump"

Write-Host "=== Starting AtomicCRM Database Backup ===" -ForegroundColor Cyan
Write-Host "Target: $PoolerHost" -ForegroundColor Gray
Write-Host "User:   $User" -ForegroundColor Gray
Write-Host "File:   $BackupFile" -ForegroundColor Gray
Write-Host ""

# Set PGPASSWORD environment variable (securely passed to pg_dump)
# Note: Using the password confirmed to work
$env:PGPASSWORD = "7s56of1Zpc75J0n3"

try {
    Write-Host "Running pg_dump..." -ForegroundColor Yellow
    
    # Execute pg_dump
    # Uses confirmed working connection string format
    pg_dump "postgres://$($User)@$($PoolerHost):$($Port)/$($Database)?sslmode=require" `
        --format=custom `
        --file=$BackupFile `
        --no-owner `
        --no-privileges `
        --verbose

    if (Test-Path $BackupFile) {
        $Size = (Get-Item $BackupFile).Length / 1MB
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
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $_.ErrorDetails
    exit 1
}
finally {
    # Clean up environment variable
    $env:PGPASSWORD = $null
}
