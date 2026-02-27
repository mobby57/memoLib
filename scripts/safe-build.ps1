param(
    [string]$Project = "MemoLib.Api.csproj",
    [switch]$NoKill
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "[safe-build] Repo: $repoRoot"
Write-Host "[safe-build] Projet: $Project"

if (-not $NoKill) {
    Write-Host "[safe-build] Recherche de processus verrouillants..."

    $killed = @()

    $appProcesses = Get-Process -Name "MemoLib.Api" -ErrorAction SilentlyContinue
    foreach ($process in $appProcesses) {
        try {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
            $killed += "MemoLib.Api ($($process.Id))"
        } catch {
            Write-Warning "Impossible de stopper MemoLib.Api ($($process.Id)): $($_.Exception.Message)"
        }
    }

    $dotnetProcesses = Get-CimInstance Win32_Process -Filter "Name = 'dotnet.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match 'MemoLib\.Api' }

    foreach ($process in $dotnetProcesses) {
        try {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
            $killed += "dotnet ($($process.ProcessId))"
        } catch {
            Write-Warning "Impossible de stopper dotnet ($($process.ProcessId)): $($_.Exception.Message)"
        }
    }

    try {
        taskkill /F /T /IM "MemoLib.Api.exe" *> $null
    } catch {
    }

    if ($killed.Count -gt 0) {
        Write-Host "[safe-build] Processus stoppés:"
        $killed | ForEach-Object { Write-Host " - $_" }
        Start-Sleep -Seconds 1
    } else {
        Write-Host "[safe-build] Aucun processus verrouillant trouvé."
    }
}

Write-Host "[safe-build] Build en cours..."
dotnet build $Project
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0 -and -not $NoKill) {
    Write-Host "[safe-build] Première tentative KO, nouvelle tentative après nettoyage..."
    try {
        taskkill /F /T /IM "MemoLib.Api.exe" *> $null
    } catch {
    }
    Start-Sleep -Seconds 2
    dotnet build $Project
    $exitCode = $LASTEXITCODE
}

if ($exitCode -eq 0) {
    Write-Host "[safe-build] ✅ Build OK"
} else {
    Write-Host "[safe-build] ❌ Build KO (code $exitCode)"
}

exit $exitCode
