param(
    [string]$Owner = 'mobby57',
    [string]$Repo = 'memoLib',
    [string]$Tag = '',
    [string]$StableTag = 'stable',
    [string]$Title = '',
    [string]$Notes = 'Release locale auto-générée depuis go-all.',
    [string]$JwtSecret = '',
    [switch]$SkipMigrations,
    [switch]$Prerelease,
    [switch]$PublishStable,
    [switch]$PromoteStableFromDaily,
    [switch]$SkipPublish
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

if (-not $SkipMigrations) {
    Write-Host '==> GO-ALL: application migrations EF'

    if ([string]::IsNullOrWhiteSpace($env:JwtSettings__SecretKey)) {
        if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
            $env:JwtSettings__SecretKey = 'MEMOLIB_LOCAL_DEV_SECRET_2026_32_CHARS_MIN'
        }
        else {
            $env:JwtSettings__SecretKey = $JwtSecret
        }
    }

    dotnet ef database update
    if ($LASTEXITCODE -ne 0) {
        throw 'Application des migrations EF échouée.'
    }
}

Write-Host '==> GO-ALL: build + smoke + package + zip'
powershell -ExecutionPolicy Bypass -File .\scripts\go-demo.ps1

if ($LASTEXITCODE -ne 0) {
    throw 'go-demo a échoué.'
}

if ($SkipPublish) {
    $result = [pscustomobject]@{
        Status = 'READY_LOCAL_ONLY'
        Published = $false
        Zip = (Join-Path $projectDir 'dist\memolib-local-demo-latest.zip')
    }

    $result | ConvertTo-Json -Depth 4
    exit 0
}

Write-Host '==> GO-ALL: publication GitHub Release'
$effectiveTag = if ([string]::IsNullOrWhiteSpace($Tag)) {
    'v' + (Get-Date -Format 'yyyy.MM.dd')
}
else {
    $Tag
}

$publishArgs = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', '.\scripts\publish-github-release.ps1',
    '-Owner', $Owner,
    '-Repo', $Repo,
    '-Tag', $effectiveTag
)

if (-not [string]::IsNullOrWhiteSpace($Title)) {
    $publishArgs += @('-Title', $Title)
}

if (-not [string]::IsNullOrWhiteSpace($Notes)) {
    $publishArgs += @('-Notes', $Notes)
}

if ($Prerelease) {
    $publishArgs += '-Prerelease'
}

powershell @publishArgs

if ($LASTEXITCODE -ne 0) {
    throw 'Publication GitHub échouée.'
}

if ($PublishStable) {
    Write-Host '==> GO-ALL: publication canal stable'

    $stableTitle = if ([string]::IsNullOrWhiteSpace($Title)) {
        "MemoLib Local Demo $StableTag"
    }
    else {
        "$Title ($StableTag)"
    }

    $stableArgs = @(
        '-ExecutionPolicy', 'Bypass',
        '-File', '.\scripts\publish-github-release.ps1',
        '-Owner', $Owner,
        '-Repo', $Repo,
        '-Tag', $StableTag,
        '-Title', $stableTitle,
        '-Notes', $Notes
    )

    if ($Prerelease) {
        $stableArgs += '-Prerelease'
    }

    powershell @stableArgs

    if ($LASTEXITCODE -ne 0) {
        throw 'Publication canal stable échouée.'
    }
}

if ($PromoteStableFromDaily) {
    Write-Host '==> GO-ALL: promotion notes du tag source vers stable'

    $promoteArgs = @(
        '-ExecutionPolicy', 'Bypass',
        '-File', '.\scripts\promote-stable.ps1',
        '-Owner', $Owner,
        '-Repo', $Repo,
        '-SourceTag', $effectiveTag,
        '-StableTag', $StableTag
    )

    powershell @promoteArgs

    if ($LASTEXITCODE -ne 0) {
        throw 'Promotion vers stable échouée.'
    }
}
