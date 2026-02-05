$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups"
$containerName = "wealth_sync_db"
$dbUser = "postgres"
$dbName = "wealth_sync"
$backupFile = "$backupDir\wealth_sync_backup_$timestamp.sql"

# Create backup directory if it doesn't exist
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup directory: $backupDir" -ForegroundColor Cyan
}

Write-Host "Starting backup of '$dbName' from container '$containerName'..." -ForegroundColor Cyan

try {
    # Execute pg_dump inside the container
    docker exec $containerName pg_dump -U $dbUser -d $dbName -F p -f /tmp/dump.sql
    
    # Copy the dump file from container to host
    docker cp "$containerName`:/tmp/dump.sql" $backupFile
    
    # Clean up inside container
    docker exec $containerName rm /tmp/dump.sql

    Write-Host "Backup successful!" -ForegroundColor Green
    Write-Host "File saved to: $backupFile" -ForegroundColor Green
}
catch {
    Write-Error "Backup failed: $_"
}
