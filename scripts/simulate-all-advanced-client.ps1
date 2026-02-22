param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$Email = '',
    [string]$Password = 'StrongPass123!'
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
$coreScript = Join-Path $projectDir 'scripts\simulate-all-advanced.ps1'

if (-not (Test-Path $coreScript)) {
    throw "Script introuvable: $coreScript"
}

Write-Host ''
Write-Host '=========================================================' -ForegroundColor Cyan
Write-Host 'MemoLib - Demonstration avancee (version client)' -ForegroundColor Cyan
Write-Host '=========================================================' -ForegroundColor Cyan
Write-Host "Service cible: $BaseUrl"
Write-Host ''

$args = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $coreScript,
    '-BaseUrl', $BaseUrl,
    '-Password', $Password
)

if (-not [string]::IsNullOrWhiteSpace($Email)) {
    $args += @('-Email', $Email)
}

$output = powershell @args | Out-String

$jsonStart = $output.IndexOf('{')
if ($jsonStart -lt 0) {
    throw "Impossible de lire le resultat du script avance. Sortie brute:`n$output"
}

$jsonText = $output.Substring($jsonStart)
$result = $jsonText | ConvertFrom-Json

$mapping = @{
    'Health' = 'Service disponible'
    'Register' = 'Creation de compte'
    'Register duplicate' = 'Protection doublon compte'
    'Login' = 'Connexion securisee'
    'Ingestion' = 'Reception des emails'
    'Deduplication' = 'Anti-doublon emails'
    'Search' = 'Recherche instantanee'
    'Cases and timeline' = 'Dossiers et timeline'
    'Client module' = 'Fiche client'
    'Export and stats' = 'Export et indicateurs'
    'Embeddings and semantic' = 'Recherche intelligente'
    'Audit trail' = 'Traçabilite des actions'
}

Write-Host ''
Write-Host 'Resultats de la demonstration:' -ForegroundColor Yellow
Write-Host ''

$failed = 0
foreach ($check in $result.Checks) {
    $label = if ($mapping.ContainsKey($check.Name)) { $mapping[$check.Name] } else { $check.Name }
    if ($check.Success) {
        Write-Host "  [OK] $label" -ForegroundColor Green
    }
    else {
        Write-Host "  [KO] $label" -ForegroundColor Red
        $failed++
    }
}

Write-Host ''
if ($result.Status -eq 'PASS' -and $failed -eq 0) {
    Write-Host 'Conclusion: demonstration COMPLETE et convaincante.' -ForegroundColor Green
    Write-Host "Compte demo utilise: $($result.DemoEmail)"
    Write-Host "Statut global: $($result.Status)"
    exit 0
}
else {
    Write-Host 'Conclusion: certains points sont a corriger avant presentation.' -ForegroundColor Red
    Write-Host "Statut global: $($result.Status)"
    exit 1
}
