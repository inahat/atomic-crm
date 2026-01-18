# GitHub Artifacts Backup Setup

## Overview

Simple automated backups saved to GitHub Artifacts (no external storage needed).

## Required GitHub Secrets

Add these at: `https://github.com/inahat/atomic-crm/settings/secrets/actions`

### 1. Database Connection
```
Name: DATABASE_URL
Value: postgresql://postgres:7s56of1Zpc75J0n3]@db.bxosgtiwjkpuguyggicm.supabase.co:5432/postgres
```

### 2. Encryption Passphrase
```
Name: BACKUP_PASSPHRASE
Value: [choose-a-strong-passphrase-20+-characters]
```

**That's it!** Only 2 secrets needed.

## How It Works

1. **Schedule:** Runs daily at 2 AM UTC
2. **Backup:** Creates encrypted `pg_dump` (custom format)
3. **Storage:** Saves to GitHub Artifacts (90-day retention)
4. **Manual:** Can trigger anytime from GitHub Actions

## Downloading Backups

1. Go to: `https://github.com/inahat/atomic-crm/actions`
2. Click on a "Scheduled DB Backup" workflow run
3. Scroll to "Artifacts" section
4. Download the backup file

## Restoring a Backup

### 1. Decrypt
```bash
openssl enc -aes-256-cbc -d -pbkdf2 -in backup-TIMESTAMP.dump.enc -out backup.dump
# Enter your BACKUP_PASSPHRASE when prompted
```

### 2. Restore
```bash
pg_restore -h db.bxosgtiwjkpuguyggicm.supabase.co -p 5432 -U postgres -d postgres -v backup.dump
```

## Testing

1. **Add the 2 secrets** to GitHub
2. **Manual trigger:**
   - Go to Actions → "Scheduled DB Backup"
   - Click "Run workflow"
3. **Verify:**
   - Check workflow completes
   - Download artifact
   - Test decryption

## Features

- ✅ Automated daily backups
- ✅ AES-256 encryption
- ✅ 90-day retention
- ✅ No external dependencies
- ✅ Free (uses GitHub Actions)

## Limitations

- **Retention:** 90 days maximum (GitHub limit)
- **Storage:** Counts toward GitHub storage quota
- **Access:** Only via GitHub Actions UI

For longer retention, consider upgrading to Supabase Pro ($25/mo) for Point-in-Time Recovery.
