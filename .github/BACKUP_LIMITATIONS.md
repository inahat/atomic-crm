# Database Backup Limitations (Free Tier)

## ⚠️ Automated Backups Not Available

**Automated GitHub Actions backups are not feasible on Supabase Free tier** due to network compatibility issues:

- **Issue:** Supabase databases use IPv6 addresses
- **Problem:** GitHub Actions runners only support IPv4
- **Result:** Connection fails with "Network is unreachable"

### Solutions

1. **Upgrade to Pro Plan** ($25/mo)
   - Includes Point-in-Time Recovery (PITR)
   - IPv4 Add-On available
   - Automated daily backups
   - [Upgrade here](https://supabase.com/dashboard/org/_/billing)

2. **Use Manual Backups** (Free, recommended for Free tier)
   - See instructions below

## 📦 Manual Backup Methods

### Option 1: Local Backup (Recommended)

Run this command locally on your machine:

```powershell
# Install Supabase CLI (first time only)
npm install -g supabase

# Create backup
supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres" -f "backup-$(Get-Date -Format 'yyyy-MM-dd').sql"
```

**Get your database password:**
https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database

### Option 2: Supabase Dashboard

1. Go to [Database Settings](https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database)
2. Scroll to "Backups" section
3. Click "Download backup"

**Note:** Free tier only keeps backups for 7 days

### Option 3: pg_dump (Advanced)

If you have PostgreSQL installed:

```powershell
$env:PGPASSWORD="[YOUR-PASSWORD]"
pg_dump -h db.bxosgtiwjkpuguyggicm.supabase.co -p 5432 -U postgres -d postgres --no-owner --no-acl -f backup.sql
```

## 🔄 Backup Schedule Recommendation

For Free tier, we recommend:

- **Weekly manual backups** before major changes
- **Before deployments** or schema migrations
- **After important data imports**

Store backups in:
- Local secure location
- Private cloud storage (Google Drive, Dropbox, etc.)
- **Never commit to public repositories!**

## 📝 Restore Process

See [RESTORE_TESTING.md](./RESTORE_TESTING.md) for restore instructions.

## 💡 Alternative: Upgrade to Pro

If automated backups are critical:
- **Pro Plan:** $25/month
- **Includes:** PITR, automated backups, IPv4 support
- **Upgrade:** https://supabase.com/dashboard/org/_/billing

---

**Summary:** Automated GitHub Actions backups require Supabase Pro plan. For Free tier, use manual backups as needed.
