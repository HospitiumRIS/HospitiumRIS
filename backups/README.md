# Database Backup Instructions

## Quick Backup

To create a database backup, run:

```powershell
.\backups\create_backup.ps1
```

This will create a timestamped SQL backup file in the `backups` folder.

## Manual Backup (Alternative)

If you prefer to run pg_dump manually:

```powershell
# Set your database password
$env:PGPASSWORD = "your_password"

# Create backup
pg_dump -h localhost -p 5432 -U your_username -d hospitiumris -F p -f backups/hospitiumris_backup.sql

# Clear password
Remove-Item Env:\PGPASSWORD
```

## Restore from Backup

To restore a backup:

```powershell
# Set your database password
$env:PGPASSWORD = "your_password"

# Restore backup
psql -h localhost -p 5432 -U your_username -d hospitiumris -f backups/hospitiumris_backup_YYYYMMDD_HHMMSS.sql

# Clear password
Remove-Item Env:\PGPASSWORD
```

## Backup Files

- Backup files are named: `hospitiumris_backup_YYYYMMDD_HHMMSS.sql`
- The `backups` folder is gitignored to prevent committing database dumps
- Keep backups secure and do not share them publicly

## Requirements

- PostgreSQL client tools must be installed
- `pg_dump` and `psql` must be in your system PATH
- Database credentials must be set in `.env` file

## Automated Backups

Consider setting up automated backups using:
- Windows Task Scheduler (run the PowerShell script daily/weekly)
- Cloud backup services
- Database hosting provider's backup features
