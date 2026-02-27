param(
    [string]$Urls = "http://localhost:5078",
    [ValidateSet("none", "twilio")]
    [string]$Watch = "none",
    [int]$WatchTimeoutSec = 300,
    [int]$HealthTimeoutSec = 45
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$goRunScript = Join-Path $scriptDir "go-run.ps1"
$watchTwilioScript = Join-Path $scriptDir "watch-twilio-sms.ps1"

if (-not (Test-Path $goRunScript)) {
    Write-Error "go-run.ps1 introuvable: $goRunScript"
    exit 1
}

$runArgs = @(
    "-ExecutionPolicy", "Bypass",
    "-File", $goRunScript,
    "-Urls", $Urls
)

Write-Host "[go-stable] Démarrage API..."
$detachedCommand = 'start "" powershell -ExecutionPolicy Bypass -File "{0}" -Urls "{1}"' -f $goRunScript, $Urls
Start-Process -FilePath "cmd.exe" -ArgumentList "/c $detachedCommand" -WindowStyle Hidden | Out-Null
Write-Host "[go-stable] Process API lancé en mode détaché."

$healthUrl = "$($Urls.TrimEnd('/'))/health"
$deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
$apiReady = $false

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2

    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            break
        }
    } catch {
    }
}

if (-not $apiReady) {
    Write-Host "[go-stable] ❌ API non disponible sur $healthUrl dans la fenêtre ${HealthTimeoutSec}s."
    exit 2
}

Write-Host "[go-stable] ✅ API OK: $healthUrl"

if ($Watch -eq "twilio") {
    if (-not (Test-Path $watchTwilioScript)) {
        Write-Host "[go-stable] ⚠️ watch-twilio-sms.ps1 introuvable, watcher ignoré."
        exit 0
    }

    Write-Host "[go-stable] Lancement watcher Twilio (timeout ${WatchTimeoutSec}s, non bloquant en cas de silence)..."
    & powershell -ExecutionPolicy Bypass -File $watchTwilioScript -TimeoutSec $WatchTimeoutSec -PollIntervalSec 2
    $watchExitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }

    if ($watchExitCode -eq 2) {
        Write-Host "[go-stable] ❌ Watcher erreur inspecteur/ngrok."
        exit 2
    }

    Write-Host "[go-stable] ✅ Watcher terminé (code=$watchExitCode)."
    exit 0
}

Write-Host "[go-stable] ✅ API lancée. Mode watch=none, fin du script."
exit 0
