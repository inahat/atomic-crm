# Database Backup Limitations (Free Tier)

## ⚠️ Automated GitHub Actions Backups: NOT POSSIBLE

After extensive testing, **automated GitHub Actions backups are not feasible on Supabase Free tier**.

### What We Tried

1. ✗ Direct connection (`db.PROJECT.supabase.co:5432`) - IPv6 network unreachable
2. ✗ Connection pooler transaction mode (port 6543) - Authentication failed
3. ✗ Connection pooler session mode (port 5432) - Authentication failed
4. ✗ Various CLI flags and configurations - All failed

### Why It Doesn't Work

- **GitHub Actions:** Only supports IPv4
- **Supabase Free Tier:** Uses IPv6 addresses
- **Result:** "Network unreachable" or "Tenant or user not found" errors

### The Solution: Upgrade or Manual Backups

## ✅ Working Solutions

### Option 1: Manual Backups (Free)

**Easiest: Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database
2. Scroll to "Database backups"
3. Click "Download backup"

**Using CLI locally:**
```powershell
supabase db dump --db-url "postgresql://postgres:[PASSWORD]@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres" -f "backup.sql"
```

**Schedule:** Weekly before major changes, before deployments

### Option 2: Local Automation (Free)

Use Windows Task Scheduler to run backups automatically from your PC:

1. Create `backup.ps1`:
```powershell
$password = "YOUR-DB-PASSWORD"
$date = Get-Date -Format "yyyy-MM-dd"
supabase db dump --db-url "postgresql://postgres:$password@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres" -f "backups/backup-$date.sql"
```

2. Schedule in Task Scheduler (daily/weekly)

**Pros:** Free, reliable, automated  
**Cons:** Requires your PC to be running

### Option 3: Upgrade to Pro ($25/month)

**Includes:**
- ✅ Automated daily backups
- ✅ Point-in-Time Recovery (PITR)
- ✅ IPv4 Add-On for GitHub Actions
- ✅ 7-day backup retention (vs 7 days on Free)

[Upgrade here](https://supabase.com/dashboard/org/_/billing)

## Recommendation

**For Free Tier:** Use **manual backups** from Supabase Dashboard (easiest) or set up **local automation** with Task Scheduler.

**For Production:** **Upgrade to Pro** - $25/mo is worth it for peace of mind and automated backups.

## Files

- Manual backup guide: `.github/MANUAL_BACKUP.md`
- Restore guide: `.github/RESTORE_TESTING.md`
- Workflow reference: `.agent/workflows/backup-database.md`

---

**Note:** The GitHub Actions workflow in `.github/workflows/backup-database.yml` is kept for reference but will not work on Free tier.
