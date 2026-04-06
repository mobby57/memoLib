param(
    [string]$TargetEmail = 'sarraboudjellal57@gmail.com',
    [string]$WebUrl = 'http://localhost:3000/fr',
    [switch]$SkipDevServer,
    [switch]$SkipOpenBrowser
)

$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Title)
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function Run-Npm {
    param(
        [string]$ScriptName,
        [string]$ErrorMessage
    )

    & npm run $ScriptName
    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

function Get-EnvValue {
    param(
        [string]$FilePath,
        [string]$Key
    )

    if (-not (Test-Path $FilePath)) {
        return ''
    }

    $line = Get-Content $FilePath | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $line) {
        return ''
    }

    return ($line -replace "^$Key=", '').Trim()
}

Write-Section 'Precheck configuration demo client'

# Premier check: si token/credentials manquent, on va lancer le flow OAuth
& npm run demo:client:sarrab:check
$firstCheckCode = $LASTEXITCODE

$envFilePath = '.\.env.local'
$hasCredentials = Test-Path '.\credentials.json'
$hasToken = Test-Path '.\token.json'
$refreshToken = Get-EnvValue -FilePath $envFilePath -Key 'GMAIL_REFRESH_TOKEN'
$defaultTenant = Get-EnvValue -FilePath $envFilePath -Key 'DEFAULT_TENANT_ID'

if ([string]::IsNullOrWhiteSpace($defaultTenant)) {
    throw 'DEFAULT_TENANT_ID est vide dans .env.local. Renseignez-le avant toute étape OAuth/demo.'
}

if ($firstCheckCode -ne 0) {
    if ($hasCredentials -and -not $hasToken -and [string]::IsNullOrWhiteSpace($refreshToken)) {
        Write-Section 'Configuration Gmail OAuth'
        Write-Host 'Precheck incomplet et aucun token Gmail detecte. Lancement de l authentification OAuth.' -ForegroundColor Yellow
        Run-Npm -ScriptName 'gmail:auth' -ErrorMessage 'Echec de la phase gmail:auth.'
    } else {
        Write-Section 'OAuth Gmail'
        Write-Host 'OAuth deja configure ou credentials absents: pas de relance automatique de gmail:auth.' -ForegroundColor Yellow
    }
}

Write-Section 'Validation finale'
Run-Npm -ScriptName 'demo:client:sarrab:check' -ErrorMessage 'La configuration est encore incomplete apres OAuth.'

if ([string]::IsNullOrWhiteSpace($defaultTenant)) {
    throw 'DEFAULT_TENANT_ID est vide dans .env.local. Renseignez-le avant de lancer la demo integree.'
}

Write-Section 'Lancement demo client'
$runArgs = @('-ExecutionPolicy', 'Bypass', '-File', '.\scripts\demo-client-sarrab.ps1', '-TargetEmail', $TargetEmail, '-WebUrl', $WebUrl)
if ($SkipDevServer) {
    $runArgs += '-SkipDevServer'
}
if ($SkipOpenBrowser) {
    $runArgs += '-SkipOpenBrowser'
}

& powershell @runArgs
if ($LASTEXITCODE -ne 0) {
    throw 'La demo client n a pas pu demarrer.'
}

Write-Host "`nWorkflow complet termine pour le compte cible: $TargetEmail" -ForegroundColor Green
