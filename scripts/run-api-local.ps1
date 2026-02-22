param(
    [string]$Urls = 'http://localhost:5078;http://localhost:8080',
    [switch]$KillPorts,
    [switch]$NoBuild,
    [switch]$Background,
    [int]$HealthTimeoutSec = 30
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

if ($KillPorts) {
    $ports = @(5078, 8080)
    foreach ($port in $ports) {
        $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($listener in $listeners) {
            try {
                Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
                Write-Host ("Stopped PID {0} on port {1}" -f $listener.OwningProcess, $port) -ForegroundColor Yellow
            }
            catch {
                Write-Host ("Could not stop PID {0} on port {1}: {2}" -f $listener.OwningProcess, $port, $_.Exception.Message) -ForegroundColor DarkYellow
            }
        }
    }
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'

if ([string]::IsNullOrWhiteSpace($env:JwtSettings__SecretKey)) {
    $env:JwtSettings__SecretKey = 'temporary-dev-secret-key-at-least-32-chars'
}

if (-not $NoBuild) {
    dotnet build -c Debug
    if ($LASTEXITCODE -ne 0) {
        throw 'dotnet build a echoue.'
    }
}

Write-Host "Starting MemoLib.Api with ASPNETCORE_ENVIRONMENT=$($env:ASPNETCORE_ENVIRONMENT)" -ForegroundColor Cyan
Write-Host "URLs: $Urls" -ForegroundColor Cyan

$urlList = $Urls.Split(';', [System.StringSplitOptions]::RemoveEmptyEntries)

if ($Background) {
    $startArgs = @{
        FilePath = 'dotnet'
        ArgumentList = @('run', '--no-launch-profile', '--urls', $Urls)
        WorkingDirectory = $projectDir
        PassThru = $true
    }

    $process = Start-Process @startArgs

    Write-Host "API demarree en arriere-plan (PID: $($process.Id))" -ForegroundColor Green

    $deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
    $healthy = $false

    while ((Get-Date) -lt $deadline -and -not $healthy) {
        if ($process.HasExited) {
            throw "Le process API (PID $($process.Id)) a quitté prématurément avec code $($process.ExitCode)."
        }

        try {
            foreach ($baseUrl in $urlList) {
                $healthUrl = "$($baseUrl.TrimEnd('/'))/health"
                $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 3
                if ($response.status -eq 'healthy') {
                    $healthy = $true
                }
            }
        }
        catch {
        }

        if (-not $healthy) {
            Start-Sleep -Seconds 1
        }
    }

    if (-not $healthy) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
        }
        catch {
        }

        throw "API non healthy après $HealthTimeoutSec secondes."
    }

    foreach ($baseUrl in $urlList) {
        Write-Host "Health OK: $($baseUrl.TrimEnd('/'))/health" -ForegroundColor Green
    }

    Write-Host "Pour arrêter: Stop-Process -Id $($process.Id)" -ForegroundColor Yellow
    exit 0
}

dotnet run --no-launch-profile --urls $Urls
