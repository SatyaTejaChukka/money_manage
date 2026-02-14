param(
  [switch]$Loop,
  [int]$IntervalSeconds = 60
)

$ErrorActionPreference = 'Stop'

function Run-Checks {
  Write-Host "[check] Backend tests"
  Push-Location "backend"
  try {
    pytest -q
    python -m compileall -q app tests scripts
  }
  finally {
    Pop-Location
  }

  Write-Host "[check] Frontend lint/build"
  Push-Location "frontend"
  try {
    npm run lint
    npm run build
  }
  finally {
    Pop-Location
  }
}

if (-not $Loop) {
  Run-Checks
  Write-Host "[check] Completed successfully"
  exit 0
}

while ($true) {
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Write-Host "[check][$stamp] Starting loop cycle"

  try {
    Run-Checks
    Write-Host "[check][$stamp] PASS"
  }
  catch {
    Write-Host "[check][$stamp] FAIL: $($_.Exception.Message)"
  }

  Write-Host "[check] Sleeping for $IntervalSeconds second(s)"
  Start-Sleep -Seconds $IntervalSeconds
}
