param(
    [string]$Project = "MemoLib.Api.csproj",
    [switch]$NoKill,
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$safeBuildScript = Join-Path $scriptDir "safe-build.ps1"
$deployerScript = Join-Path $repoRoot "deployer-double.ps1"

if (-not (Test-Path $safeBuildScript)) {
    Write-Error "safe-build.ps1 introuvable: $safeBuildScript"
    exit 1
}

Set-Location $repoRoot

$argsList = @("-ExecutionPolicy", "Bypass", "-File", $safeBuildScript, "-Project", $Project)
if ($NoKill) {
    $argsList += "-NoKill"
}

Write-Host "[go-deploy] Build sécurisé..."
& powershell @argsList
if ($LASTEXITCODE -ne 0) {
    Write-Host "[go-deploy] ❌ Build KO, déploiement annulé."
    exit $LASTEXITCODE
}

if ($BuildOnly) {
    Write-Host "[go-deploy] ✅ Build OK (mode BuildOnly)."
    exit 0
}

if (-not (Test-Path $deployerScript)) {
    Write-Error "deployer-double.ps1 introuvable: $deployerScript"
    exit 1
}

Write-Host "[go-deploy] ✅ Build OK, lancement de deployer-double.ps1..."
& powershell -ExecutionPolicy Bypass -File $deployerScript
exit $LASTEXITCODE
