param(
    [int]$Port = 3000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$baseUrl = "http://localhost:$Port"

Set-Location $repoRoot

Write-Host "[start-all] Starting MemoLib on $baseUrl..." -ForegroundColor Cyan

$process = Start-Process `
    -FilePath 'npm.cmd' `
    -ArgumentList 'run', 'dev', '--', '--port', $Port `
    -WorkingDirectory $repoRoot `
    -PassThru

for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "[start-all] MemoLib is ready at $baseUrl (PID $($process.Id))." -ForegroundColor Green
            exit 0
        }
    } catch {
        if ($process.HasExited) {
            throw "Next.js stopped before becoming ready (exit code $($process.ExitCode))."
        }
    }

    Start-Sleep -Seconds 2
}

throw "MemoLib did not become ready at $baseUrl/api/health within 60 seconds."
