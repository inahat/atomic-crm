# Automated Database Backup Setup

## Overview

Automated daily backups using GitHub Actions with:
- ✅ Encrypted backups (AES-256-CBC)
- ✅ Upload to Supabase Storage
- ✅ GitHub Artifacts (30-day retention)
- ✅ Automatic cleanup (keeps 14 latest)

## Required GitHub Secrets

Add these secrets to your repository at:
`https://github.com/inahat/atomic-crm/settings/secrets/actions`

### Database Connection (choose one method)

**Option 1: Connection String (Recommended)**
```
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres
```

**Option 2: Individual Parameters**
```
PGHOST = db.bxosgtiwjkpuguyggicm.supabase.co
PGPORT = 5432
PGUSER = postgres
PGPASSWORD = [YOUR_DB_PASSWORD]
PGDATABASE = postgres
```

### Supabase Storage (S3-Compatible)

```
S3_ENDPOINT = https://bxosgtiwjkpuguyggicm.supabase.co
S3_BUCKET = backups
S3_ACCESS_KEY_ID = [GET_FROM_SUPABASE]
S3_SECRET_ACCESS_KEY = [GET_FROM_SUPABASE]
S3_REGION = eu-west-1
```

**How to get S3 keys:**
1. Go to Supabase Dashboard → Settings → API
2. Copy your `service_role` key as `S3_SECRET_ACCESS_KEY`
3. Use your project reference as `S3_ACCESS_KEY_ID`

### Encryption

```
BACKUP_PASSPHRASE = [CHOOSE_A_STRONG_PASSPHRASE]
```

**Important:** Save this passphrase securely! You'll need it to decrypt backups.

## How It Works

1. **Schedule:** Runs daily at 2 AM UTC
2. **Backup:** Creates encrypted `pg_dump` (custom format)
3. **Upload:** Sends to Supabase Storage bucket
4. **Artifact:** Saves copy to GitHub Artifacts (30 days)
5. **Cleanup:** Deletes old backups (keeps 14 latest)

## Manual Trigger

Run backup manually:
1. Go to Actions → "Scheduled DB Backup"
2. Click "Run workflow"
3. Select branch and run

## Downloading Backups

### From Web App
- Navigate to `/admin/backups`
- Click download on any backup

### From GitHub
- Go to Actions → Completed workflow run
- Download artifact from "Artifacts" section

### From Supabase Dashboard
- Go to Storage → `backups` bucket
- Download encrypted file

## Restoring a Backup

### 1. Decrypt the backup
```bash
openssl enc -aes-256-cbc -d -pbkdf2 -in backup-TIMESTAMP.dump.enc -out backup.dump
# Enter your BACKUP_PASSPHRASE when prompted
```

### 2. Restore to database
```bash
pg_restore -h db.bxosgtiwjkpuguyggicm.supabase.co -p 5432 -U postgres -d postgres -v backup.dump
```

## Troubleshooting

**Workflow fails with "BACKUP_PASSPHRASE must be set"**
- Add the `BACKUP_PASSPHRASE` secret to GitHub

**Upload to S3 fails**
- Verify `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`
- Check that the `backups` bucket exists in Supabase Storage

**pg_dump fails**
- Verify database credentials
- Check `DATABASE_URL` or individual `PG*` secrets

## Security Notes

- ⚠️ Never commit secrets to Git
- ✅ All backups are encrypted with AES-256
- ✅ GitHub masks secrets in logs
- ✅ Use strong passphrase (20+ characters recommended)
- ✅ Store passphrase in password manager

## Files

- `scripts/backup.sh` - Backup script
- `.github/workflows/backup-database.yml` - GitHub Actions workflow
- `app/admin/backups/page.tsx` - Web UI for downloads
