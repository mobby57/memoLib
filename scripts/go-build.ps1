param(
    [switch]$NoKill
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$safeBuildScript = Join-Path $scriptDir "safe-build.ps1"

if (-not (Test-Path $safeBuildScript)) {
    Write-Error "safe-build.ps1 introuvable: $safeBuildScript"
    exit 1
}

$argsList = @("-ExecutionPolicy", "Bypass", "-File", $safeBuildScript)
if ($NoKill) {
    $argsList += "-NoKill"
}

& powershell @argsList
exit $LASTEXITCODE
