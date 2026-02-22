$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
$sessionPath = Join-Path $projectDir 'dist\local-preview-session.json'

if (-not (Test-Path $sessionPath)) {
    throw "Session introuvable: $sessionPath"
}

$session = Get-Content -Raw -Path $sessionPath | ConvertFrom-Json

if ($session.pid) {
    try {
        Stop-Process -Id ([int]$session.pid) -Force -ErrorAction Stop
        $stopped = $true
    }
    catch {
        $stopped = $false
    }
}
else {
    $stopped = $false
}

$result = [pscustomobject]@{
    status = if ($stopped) { 'STOPPED' } else { 'ALREADY_STOPPED_OR_MISSING' }
    pid = $session.pid
    baseUrl = $session.baseUrl
}

$result | ConvertTo-Json -Depth 4
