$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "hospitiumris_backup_$timestamp.sql"
$backupPath = Join-Path $PSScriptRoot $backupFile

Write-Host "=== HospitiumRIS Database Backup ===" -ForegroundColor Cyan
Write-Host ""

$dbHost = "localhost"
$dbPort = "5432"
$dbUser = "postgres"
$dbName = "hospitiumRis"

Write-Host "Database: $dbName" -ForegroundColor Yellow
Write-Host "Host: $dbHost" -ForegroundColor Yellow
Write-Host ""

$securePassword = Read-Host "Enter database password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$env:PGPASSWORD = $password

$pgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"

if (-not (Test-Path $pgDumpPath)) {
    Write-Host "Error: PostgreSQL 17 not found" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Creating backup..." -ForegroundColor Green

try {
    & $pgDumpPath -h $dbHost -p $dbPort -U $dbUser -d $dbName -F p -f $backupPath
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupPath).Length / 1MB
        Write-Host ""
        Write-Host "Backup completed successfully!" -ForegroundColor Green
        Write-Host "File: $backupPath" -ForegroundColor Cyan
        Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    } else {
        Write-Host "Backup failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
