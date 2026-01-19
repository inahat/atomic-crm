# Local Backup Quick Reference

## Free Tier: Local pg_dump Only

Supabase Free tier does **not** have UI backup downloads. Use `pg_dump` locally:

### Bash/Linux/Mac
```bash
PGPASSWORD='7s56of1Zpc75J0n3]' pg_dump \
  "postgres://postgres@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require" \
  --format=custom \
  --file=backup_$(date +%Y%m%d).dump \
  --no-owner \
  --no-privileges
```

### PowerShell/Windows
```powershell
$env:PGPASSWORD='7s56of1Zpc75J0n3]'
pg_dump "postgres://postgres@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require" `
  --format=custom `
  --file="backup_$(Get-Date -Format 'yyyyMMdd').dump" `
  --no-owner `
  --no-privileges
```

### Or Use the Script
```powershell
.\scripts\backup-database.ps1
```

## Requirements
- PostgreSQL client tools installed
- Run from your local machine (not CI/GitHub Actions)

## Restore
```bash
pg_restore -h aws-1-eu-west-1.pooler.supabase.com -p 5432 -U postgres -d postgres -v backup_20260119.dump
```

## Backup Schedule
- **Weekly:** Minimum recommended
- **Before deployments:** Always
- **Before schema changes:** Critical
- **After data imports:** Good practice
