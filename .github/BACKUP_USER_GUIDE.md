# Backup System - User Guide

## Overview

The AtomicCRM backup system allows you to download database backups through the web interface.

## Accessing Backups

1. **Navigate to Backups Page**
   - Go to `/admin/backups` in your application
   - You'll see a list of available backups

2. **Download a Backup**
   - Click the "Download" button next to any backup
   - The SQL file will download to your computer

3. **Delete Old Backups**
   - Click the trash icon to remove old backups
   - Only the last 7 backups are kept automatically

## Creating Backups

### Method 1: Local PowerShell Script (Recommended)

Run the backup script on your local machine:

```powershell
.\scripts\backup-database.ps1
```

Then upload to Supabase Storage:
1. Go to Supabase Dashboard → Storage → backups bucket
2. Upload the SQL file

### Method 2: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database
2. Scroll to "Database backups"
3. Click "Download backup"
4. Upload to Supabase Storage (optional, for web access)

## Backup Schedule

- **Manual:** Create backups before major changes
- **Recommended:** Weekly backups
- **Before:** Deployments, schema changes, data imports

## Restoring a Backup

To restore a backup:

```powershell
psql -h db.bxosgtiwjkpuguyggicm.supabase.co -p 5432 -U postgres -d postgres -f "backup-file.sql"
```

## Storage

- **Location:** Supabase Storage (`backups` bucket)
- **Retention:** Last 7 backups
- **Access:** Admin users only
- **Security:** Private, authenticated access required

## Troubleshooting

**Can't see backups?**
- Make sure you're logged in as an admin
- Check that backups exist in Supabase Storage

**Download fails?**
- Check your internet connection
- Verify you have permission to access the backups bucket

**Need automated backups?**
- Consider upgrading to Supabase Pro ($25/mo)
- Includes automated daily backups and PITR
