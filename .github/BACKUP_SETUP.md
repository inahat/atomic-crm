# Automated Database Backup - Final Setup

## Required GitHub Secrets

Add at: `https://github.com/inahat/atomic-crm/settings/secrets/actions`

### Database Connection (RECOMMENDED)

**Use project-qualified username format:**

```
Name: DATABASE_URL
Value: postgresql://backup_user.bxosgtiwjkpuguyggicm:BackupUser2026%21Secure%23Pass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Alternative (postgres user):**
```
postgresql://postgres.bxosgtiwjkpuguyggicm:7s56of1Zpc75J0n3%5D@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

**Key points:**
- Username must be `username.PROJECT_REF` for pooler
- Special characters must be URL-encoded (`!` → `%21`, `#` → `%23`, `]` → `%5D`)

### Supabase Storage (S3)
```
Name: S3_ENDPOINT
Value: https://bxosgtiwjkpuguyggicm.supabase.co

Name: S3_BUCKET
Value: backups

Name: S3_REGION
Value: eu-west-1
```

### S3 Access Keys
Get your service role key from: https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/api

```
Name: S3_ACCESS_KEY_ID
Value: [your-service-role-key]

Name: S3_SECRET_ACCESS_KEY
Value: [your-service-role-key]
```

### Encryption
```
Name: BACKUP_PASSPHRASE
Value: [choose-strong-passphrase-20+-chars]
```

**Save your passphrase securely!**

## How It Works

1. Runs daily at 3 AM UTC
2. Creates encrypted pg_dump
3. Uploads to Supabase Storage
4. Saves to GitHub Artifacts (30 days)
5. Keeps 14 latest backups in Storage

## Download Backups

- **GitHub:** Actions → Workflow run → Artifacts
- **Web App:** `/admin/backups` page
- **Supabase:** Dashboard → Storage → backups bucket

## Decrypt & Restore

```bash
# Decrypt
openssl enc -d -aes-256-cbc -pbkdf2 -in backup-TIMESTAMP.dump.enc -out backup.dump -pass pass:"YOUR_PASSPHRASE"

# Restore
pg_restore -d postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres -v backup.dump
```

## Test Now

1. Add all secrets above
2. Go to Actions → "Scheduled DB Backup" → "Run workflow"
3. Check for encrypted backup in artifacts and Storage
