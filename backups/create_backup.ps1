# PostgreSQL Database Backup Script
# Run this script to create a backup of your HospitiumRIS database

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "hospitiumris_backup_$timestamp.sql"
$backupPath = Join-Path $PSScriptRoot $backupFile

Write-Host "Creating database backup..." -ForegroundColor Green
Write-Host "Backup file: $backupFile" -ForegroundColor Cyan

# Load environment variables from .env file
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Parse DATABASE_URL
$databaseUrl = $env:DATABASE_URL
if ($databaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    # Set PGPASSWORD environment variable for pg_dump
    $env:PGPASSWORD = $dbPassword
    
    Write-Host "Database: $dbName" -ForegroundColor Yellow
    Write-Host "Host: $dbHost" -ForegroundColor Yellow
    Write-Host "Port: $dbPort" -ForegroundColor Yellow
    
    # Use PostgreSQL 17
    $pgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
    
    if (-not (Test-Path $pgDumpPath)) {
        Write-Host "Error: PostgreSQL 17 pg_dump not found at: $pgDumpPath" -ForegroundColor Red
        Write-Host "Please ensure PostgreSQL 17 is installed" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Using PostgreSQL 17" -ForegroundColor Yellow
    
    # Run pg_dump
    try {
        & $pgDumpPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -F p -f $backupPath
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $backupPath).Length / 1MB
            Write-Host "`nBackup completed successfully!" -ForegroundColor Green
            Write-Host "File: $backupPath" -ForegroundColor Cyan
            Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        } else {
            Write-Host "`nBackup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        Write-Host "`nError creating backup: $_" -ForegroundColor Red
        Write-Host "Make sure PostgreSQL client tools (pg_dump) are installed and in your PATH" -ForegroundColor Yellow
    } finally {
        # Clear password from environment
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "Error: Could not parse DATABASE_URL from .env file" -ForegroundColor Red
    Write-Host "Please ensure DATABASE_URL is set in your .env file" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
