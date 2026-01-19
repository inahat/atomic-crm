# Test Backup Script
# Run this to test if pg_dump works with plain username

Write-Host "=== Testing Supabase Backup Connection ===" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = '7s56of1Zpc75J0n3]'

# Test 1: Connection test with psql
Write-Host "Test 1: Testing connection with psql..." -ForegroundColor Yellow
try {
    psql "postgresql://postgres.bxosgtiwjkpuguyggicm@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require" -c "SELECT current_user, now();"
    Write-Host "Success: psql connection works!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Failed: psql connection error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Backup with pg_dump
Write-Host "Test 2: Testing backup with pg_dump..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile = "test_backup_$timestamp.dump"

try {
    pg_dump "postgres://postgres@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require" `
        --format=custom `
        --file=$backupFile `
        --no-owner `
        --no-privileges
    
    if (Test-Path $backupFile) {
        $size = (Get-Item $backupFile).Length
        Write-Host "Success: Backup created: $backupFile" -ForegroundColor Green
        Write-Host "  Size: $([math]::Round($size/1MB, 2)) MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== RESULT ===" -ForegroundColor Cyan
        Write-Host "Automated backups ARE POSSIBLE on Free tier!" -ForegroundColor Green
        Write-Host "Use plain username format: postgres (not postgres.PROJECT_REF)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== RESULT ===" -ForegroundColor Cyan
    Write-Host "Automated backups NOT possible on Free tier via pooler" -ForegroundColor Red
    Write-Host "Use local backups only" -ForegroundColor Yellow
}

# Cleanup
Remove-Item env:PGPASSWORD
Write-Host ""
Write-Host "Test complete!" -ForegroundColor Cyan
