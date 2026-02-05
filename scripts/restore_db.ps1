param (
    [Parameter(Mandatory = $true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$containerName = "wealth_sync_db"
$dbUser = "postgres"
$dbName = "wealth_sync"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

Write-Host "WARNING: This will OVERWRITE the current database '$dbName'." -ForegroundColor Yellow
$confirmation = Read-Host "Are you sure you want to continue? (y/n)"

if ($confirmation -ne 'y') {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
    exit
}

Write-Host "Starting restore process..." -ForegroundColor Cyan

try {
    # Copy backup file to container
    docker cp $BackupFile "$containerName`:/tmp/restore.sql"

    # Terminate existing connections
    Write-Host "Terminating existing connections..."
    docker exec $containerName psql -U $dbUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$dbName' AND pid <> pg_backend_pid();" | Out-Null

    # Drop and recreate database
    Write-Host "Recreating database..."
    docker exec $containerName psql -U $dbUser -d postgres -c "DROP DATABASE IF EXISTS $dbName;"
    docker exec $containerName psql -U $dbUser -d postgres -c "CREATE DATABASE $dbName;"

    # Import data
    Write-Host "Importing data..."
    docker exec $containerName psql -U $dbUser -d $dbName -f /tmp/restore.sql

    # Cleanup
    docker exec $containerName rm /tmp/restore.sql

    Write-Host "Restore completed successfully!" -ForegroundColor Green
}
catch {
    Write-Error "Restore failed: $_"
}
