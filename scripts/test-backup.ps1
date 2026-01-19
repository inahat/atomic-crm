# Test Backup Script
# Run this to test if pg_dump works with plain username

Write-Host "Testing pg_dump with plain username..." -ForegroundColor Cyan

$env:PGPASSWORD = '7s56of1Zpc75J0n3]'
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
        Write-Host "`n✓ SUCCESS! Backup created: $backupFile" -ForegroundColor Green
        Write-Host "  Size: $([math]::Round($size/1MB, 2)) MB" -ForegroundColor Green
        Write-Host "`nThis means automated backups WILL work!" -ForegroundColor Yellow
        Write-Host "We just need to use plain username (postgres) not project-qualified (postgres.PROJECT_REF)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "`n✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nThis confirms automated backups won't work on Free tier" -ForegroundColor Yellow
}

# Cleanup
Remove-Item env:PGPASSWORD
