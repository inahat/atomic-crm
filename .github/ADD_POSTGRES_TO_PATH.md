# How to Add PostgreSQL to PATH on Windows

## Quick Method (Current Session Only)

Run this in PowerShell (replace the path with your actual PostgreSQL bin directory):

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

Then test:
```powershell
pg_dump --version
```

## Permanent Method (Recommended)

### Option 1: Via System Settings (GUI)

1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find and select "Path"
5. Click "Edit"
6. Click "New"
7. Add your PostgreSQL bin path (e.g., `C:\Program Files\PostgreSQL\16\bin`)
8. Click "OK" on all dialogs
9. **Restart PowerShell** for changes to take effect

### Option 2: Via PowerShell (Admin Required)

```powershell
# Run PowerShell as Administrator, then:
$pgPath = "C:\Program Files\PostgreSQL\16\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$pgPath", [EnvironmentVariableTarget]::Machine)
```

## Find Your PostgreSQL Installation

Common locations:
- `C:\Program Files\PostgreSQL\16\bin`
- `C:\Program Files\PostgreSQL\15\bin`
- `C:\Program Files (x86)\PostgreSQL\16\bin`

Or search:
```powershell
Get-ChildItem -Path "C:\Program Files" -Recurse -Filter "pg_dump.exe" -ErrorAction SilentlyContinue
```

## After Adding to PATH

1. **Close and reopen PowerShell**
2. Test: `pg_dump --version`
3. Run the backup test: `.\scripts\test-backup.ps1`
