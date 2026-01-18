# Backup User Credentials

## Dedicated Backup User Created

A dedicated `backup_user` role has been created with minimal privileges for backups.

### Credentials

```
Username: backup_user
Password: BackupUser2026!Secure#Pass
```

### DATABASE_URL for GitHub Secret

```
postgresql://backup_user:BackupUser2026!Secure#Pass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### Permissions

- `CONNECT` on database `postgres`
- `USAGE` on schema `public`
- `SELECT` on all tables (current and future)
- `SELECT` on all sequences (for pg_dump)

### Update GitHub Secret

1. Go to: https://github.com/inahat/atomic-crm/settings/secrets/actions
2. Update `DATABASE_URL` secret with the value above
3. Run the backup workflow

### Security Notes

- This user has **read-only** access
- Cannot modify or delete data
- Specifically designed for backup operations
- Password is strong and unique

## Alternative: Use postgres user

If you prefer to use the main `postgres` user, the DATABASE_URL should be:

```
postgresql://postgres.bxosgtiwjkpuguyggicm:7s56of1Zpc75J0n3%5D@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

Note: Username must be `postgres.PROJECT_REF` for the pooler.
