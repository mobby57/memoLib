param(
    [string]$BaseUrl = 'http://localhost:8091'
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$resultRaw = & (Join-Path $PSScriptRoot 'auto-local-flow.ps1') -BaseUrl $BaseUrl | Out-String
$exitCode = $LASTEXITCODE

$trimmed = $resultRaw.Trim()
if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
    $trimmed
}

if ($exitCode -ne 0) {
    exit $exitCode
}

try {
    $result = $trimmed | ConvertFrom-Json
    if ($result.Status -ne 'PASS') {
        exit 1
    }
}
catch {
}

exit 0