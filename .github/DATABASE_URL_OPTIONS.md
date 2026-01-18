# Final DATABASE_URL Configurations

## Recommended: Project-Qualified Username

### Option 1: postgres user (project-qualified)
```
postgresql://postgres.bxosgtiwjkpuguyggicm:7s56of1Zpc75J0n3%5D@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

### Option 2: backup_user (project-qualified, recommended)
```
postgresql://backup_user.bxosgtiwjkpuguyggicm:BackupUser2026%21Secure%23Pass@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

## URL Encoding Reference

- `]` → `%5D`
- `!` → `%21`
- `#` → `%23`

## Key Points

1. **Username format:** Must be `username.PROJECT_REF` for pooler
2. **Project Ref:** `bxosgtiwjkpuguyggicm`
3. **Pooler Host:** `aws-1-eu-west-1.pooler.supabase.com`
4. **Port:** `5432` (session pooler)

## Test These in Order

1. Try Option 2 (backup_user with project qualifier) - **Most secure**
2. If that fails, try Option 1 (postgres with project qualifier)
3. Check GitHub Actions output for "AUTH_OK" or "AUTH_FAILED"
