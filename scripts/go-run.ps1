param(
    [string]$Project = "MemoLib.Api.csproj",
    [string]$Urls = "http://localhost:8091",
    [switch]$NoKill
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$safeBuildScript = Join-Path $scriptDir "safe-build.ps1"

if (-not (Test-Path $safeBuildScript)) {
    Write-Error "safe-build.ps1 introuvable: $safeBuildScript"
    exit 1
}

Set-Location $repoRoot

function Get-UrlPorts {
    param(
        [string]$UrlsValue
    )

    $ports = New-Object System.Collections.Generic.List[int]

    foreach ($url in ($UrlsValue -split ';')) {
        $trimmed = $url.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            continue
        }

        try {
            $uri = [Uri]$trimmed
            if ($uri.Port -gt 0) {
                $ports.Add($uri.Port)
            }
        } catch {
            Write-Warning "[go-run] URL ignorée (format invalide): $trimmed"
        }
    }

    return $ports.ToArray()
}

function Get-PortOwners {
    param(
        [int]$Port
    )

    $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($null -eq $connections) {
        return @()
    }

    $owners = @()
    foreach ($connection in $connections) {
        if ($null -eq $connection.OwningProcess) {
            continue
        }

        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        $commandLine = $null
        try {
            $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
            $commandLine = $processInfo.CommandLine
        } catch {
        }

        $owners += [PSCustomObject]@{
            ProcessId   = $connection.OwningProcess
            ProcessName = if ($process) { $process.ProcessName } else { 'unknown' }
            CommandLine = $commandLine
        }
    }

    return $owners | Group-Object ProcessId | ForEach-Object { $_.Group[0] }
}

function Ensure-PortsAvailable {
    param(
        [string]$UrlsValue,
        [bool]$AllowKill
    )

    $ports = Get-UrlPorts -UrlsValue $UrlsValue
    foreach ($port in $ports) {
        $owners = Get-PortOwners -Port $port
        if ($owners.Count -eq 0) {
            continue
        }

        if ($AllowKill) {
            foreach ($owner in $owners) {
                try {
                    Stop-Process -Id $owner.ProcessId -Force -ErrorAction Stop
                    if ([string]::IsNullOrWhiteSpace($owner.CommandLine)) {
                        Write-Host "[go-run] Port $port libéré: PID $($owner.ProcessId) ($($owner.ProcessName))"
                    } else {
                        Write-Host "[go-run] Port $port libéré: PID $($owner.ProcessId) ($($owner.ProcessName)) - $($owner.CommandLine)"
                    }
                } catch {
                    Write-Host "[go-run] ❌ Impossible de stopper PID $($owner.ProcessId) sur le port ${port}: $($_.Exception.Message)"
                    exit 2
                }
            }
            Start-Sleep -Milliseconds 500
        } else {
            $details = $owners | ForEach-Object {
                if ([string]::IsNullOrWhiteSpace($_.CommandLine)) {
                    "PID $($_.ProcessId) ($($_.ProcessName))"
                } else {
                    "PID $($_.ProcessId) ($($_.ProcessName)): $($_.CommandLine)"
                }
            }
            Write-Host "[go-run] ❌ Port $port déjà utilisé (mode -NoKill):"
            $details | ForEach-Object { Write-Host "  - $_" }
            Write-Host "[go-run] Arrête le process existant ou relance sans -NoKill."
            exit 2
        }
    }
}

Ensure-PortsAvailable -UrlsValue $Urls -AllowKill (-not $NoKill)

$argsList = @("-ExecutionPolicy", "Bypass", "-File", $safeBuildScript, "-Project", $Project)
if ($NoKill) {
    $argsList += "-NoKill"
}

Write-Host "[go-run] Build sécurisé..."
& powershell @argsList
$buildExitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
if ($buildExitCode -ne 0) {
    Write-Host "[go-run] ❌ Build KO, exécution annulée."
    exit $buildExitCode
}

Write-Host "[go-run] ✅ Build OK, démarrage API..."
dotnet run --no-build --project $Project --urls $Urls
$runExitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }

if ($runExitCode -ne 0) {
    Write-Host "[go-run] ❌ dotnet run terminé avec le code $runExitCode"
}

exit $runExitCode
