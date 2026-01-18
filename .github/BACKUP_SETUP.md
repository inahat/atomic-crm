# Database Backup Setup Instructions

## ✅ Step 1: GitHub Actions Workflow Created

The automated backup workflow has been created at `.github/workflows/backup-database.yml`

**Features:**
- 🕐 Runs daily at 2 AM UTC
- 💾 Keeps backups for 7 days
- 🔄 Can be triggered manually from GitHub UI
- 📦 Compressed SQL dumps

## 🔧 Step 2: Configure Database Password

You need to add your Supabase database password as a GitHub secret:

### Get Your Database Password

1. Go to [Supabase Database Settings](https://supabase.com/dashboard/project/bxosgtiwjkpuguyggicm/settings/database)
2. Scroll to "Database Password"
3. Click "Reset Database Password" if you don't have it saved
4. Copy the password (you'll only see it once!)

### Add Secret to GitHub

1. Go to your GitHub repository: https://github.com/inahat/atomic-crm
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SUPABASE_DB_PASSWORD`
5. Value: Paste your database password
6. Click **Add secret**

## ✅ Step 3: Test the Workflow

Once the secret is configured:

1. Go to **Actions** tab in your GitHub repo
2. Click **Database Backup** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for it to complete (~1-2 minutes)
5. Download the backup artifact to verify

## 📅 Automated Schedule

After setup, backups will run automatically:
- **Daily at 2 AM UTC** (3 AM CET / 4 AM CEST)
- **Retention: 7 days** (older backups auto-deleted)
- **Location:** GitHub Actions Artifacts

## 🔍 Viewing Backups

1. Go to **Actions** tab
2. Click on any successful **Database Backup** run
3. Scroll to **Artifacts** section
4. Download `database-backup-XXX.sql`

## ⚠️ Important Notes

- Free GitHub accounts get **500 MB artifact storage** and **2,000 minutes/month**
- Each backup is ~5-50 MB (depending on data size)
- Backups are automatically deleted after 7 days
- You can manually trigger backups anytime from GitHub UI

## Next Steps

After configuring the secret, I'll:
1. Create a manual backup right now
2. Show you how to test the restore process
