param(
    [ValidateSet('build','run','deploy','deploy-buildonly','all')]
    [string]$Action = 'all',
    [switch]$NoKill
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$ActionBlock
    )

    Write-Host "[go-menu] ==> $Name"
    $global:LASTEXITCODE = 0
    & $ActionBlock
    $stepSucceeded = $?
    $stepExitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }

    if (-not $stepSucceeded -or $stepExitCode -ne 0) {
        throw "Étape échouée: $Name (code $stepExitCode)"
    }
}

$buildAction = {
    if ($NoKill) { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-build.ps1' -NoKill }
    else { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-build.ps1' }
}

$runAction = {
    if ($NoKill) { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-run.ps1' -NoKill }
    else { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-run.ps1' }
}

$deployAction = {
    if ($NoKill) { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-deploy.ps1' -NoKill }
    else { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-deploy.ps1' }
}

$deployBuildOnlyAction = {
    if ($NoKill) { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-deploy.ps1' -BuildOnly -NoKill }
    else { & powershell -ExecutionPolicy Bypass -File '.\scripts\go-deploy.ps1' -BuildOnly }
}

switch ($Action) {
    'build' {
        Invoke-Step -Name 'Build sécurisé' -ActionBlock $buildAction
    }
    'run' {
        Invoke-Step -Name 'Run sécurisé' -ActionBlock $runAction
    }
    'deploy' {
        Invoke-Step -Name 'Deploy (build + deployer-double)' -ActionBlock $deployAction
    }
    'deploy-buildonly' {
        Invoke-Step -Name 'Deploy BuildOnly' -ActionBlock $deployBuildOnlyAction
    }
    'all' {
        Write-Host '[go-menu] Mode interactif: choisissez une action.'
        Write-Host '  1) Build'
        Write-Host '  2) Run'
        Write-Host '  3) Deploy'
        Write-Host '  4) Deploy BuildOnly'
        $choice = Read-Host 'Votre choix (1-4)'

        switch ($choice) {
            '1' { Invoke-Step -Name 'Build sécurisé' -ActionBlock $buildAction }
            '2' { Invoke-Step -Name 'Run sécurisé' -ActionBlock $runAction }
            '3' { Invoke-Step -Name 'Deploy (build + deployer-double)' -ActionBlock $deployAction }
            '4' { Invoke-Step -Name 'Deploy BuildOnly' -ActionBlock $deployBuildOnlyAction }
            default { throw 'Choix invalide.' }
        }
    }
}

Write-Host '[go-menu] ✅ Terminé.'
