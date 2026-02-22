param(
    [string]$Owner = 'mobby57',
    [string]$Repo = 'memoLib',
    [string]$Tag = '',
    [string]$Title = '',
    [string]$Notes = 'Release locale auto-générée depuis go-demo.',
    [switch]$Prerelease
)

$ErrorActionPreference = 'Stop'

if (-not $env:GITHUB_TOKEN) {
    throw 'Variable GITHUB_TOKEN absente. Définis un token GitHub avec scope repo.'
}

$projectDir = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $projectDir 'dist'
$latestZip = Join-Path $distDir 'memolib-local-demo-latest.zip'
$latestSha = Join-Path $distDir 'memolib-local-demo-latest.sha256.txt'

if (-not (Test-Path $latestZip)) {
    throw "Fichier introuvable: $latestZip. Exécute d'abord scripts/go-demo.ps1"
}

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = 'v' + (Get-Date -Format 'yyyy.MM.dd')
}

if ([string]::IsNullOrWhiteSpace($Title)) {
    $Title = "MemoLib Local Demo $Tag"
}

function Sanitize-ReleaseText {
    param([string]$Value)

    if ($null -eq $Value) {
        return $null
    }

    $chars = $Value.ToCharArray() | Where-Object {
        $code = [int][char]$_
        ($code -ge 32) -or $_ -eq "`r" -or $_ -eq "`n" -or $_ -eq "`t"
    }

    return (-join $chars)
}

$Title = Sanitize-ReleaseText -Value $Title
$Notes = Sanitize-ReleaseText -Value $Notes

$headers = @{
    Authorization = "Bearer $($env:GITHUB_TOKEN)"
    Accept = 'application/vnd.github+json'
    'User-Agent' = 'MemoLib-Release-Script'
    'X-GitHub-Api-Version' = '2022-11-28'
}

$createReleaseUrl = "https://api.github.com/repos/$Owner/$Repo/releases"
$releaseByTagUrl = "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag"
$releaseBody = @{
    tag_name = $Tag
    name = $Title
    body = $Notes
    draft = $false
    prerelease = [bool]$Prerelease
    generate_release_notes = $false
} | ConvertTo-Json -Depth 4

$release = $null

try {
    $release = Invoke-RestMethod -Method GET -Uri $releaseByTagUrl -Headers $headers
    Write-Host "Release existante trouvée pour tag: $Tag (mise à jour)"

    $updateReleaseUrl = "https://api.github.com/repos/$Owner/$Repo/releases/$($release.id)"
    $updateBody = @{
        tag_name = $Tag
        name = $Title
        body = $Notes
        draft = $false
        prerelease = [bool]$Prerelease
    } | ConvertTo-Json -Depth 4

    $release = Invoke-RestMethod -Method PATCH -Uri $updateReleaseUrl -Headers $headers -ContentType 'application/json' -Body $updateBody
}
catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($statusCode -eq 404) {
        Write-Host "Création release GitHub: $Tag"
        $release = Invoke-RestMethod -Method POST -Uri $createReleaseUrl -Headers $headers -ContentType 'application/json' -Body $releaseBody
    }
    else {
        throw
    }
}

$uploadBase = ($release.upload_url -split '\{')[0]

function Remove-ExistingAssetIfAny {
    param(
        [pscustomobject]$Release,
        [string]$FileName,
        [hashtable]$Headers,
        [string]$Owner,
        [string]$Repo
    )

    $existing = $Release.assets | Where-Object { $_.name -eq $FileName } | Select-Object -First 1
    if ($existing) {
        $deleteUrl = "https://api.github.com/repos/$Owner/$Repo/releases/assets/$($existing.id)"
        Write-Host "Suppression asset existant: $FileName"
        Invoke-RestMethod -Method DELETE -Uri $deleteUrl -Headers $Headers | Out-Null
    }
}

function Upload-Asset {
    param(
        [string]$UploadBase,
        [string]$FilePath,
        [string]$ContentType,
        [hashtable]$Headers
    )

    $fileName = [System.IO.Path]::GetFileName($FilePath)
    $uploadUrl = "${UploadBase}?name=$([uri]::EscapeDataString($fileName))"

    Write-Host "Upload asset: $fileName"
    Invoke-RestMethod -Method POST -Uri $uploadUrl -Headers $Headers -ContentType $ContentType -InFile $FilePath | Out-Null
}

Remove-ExistingAssetIfAny -Release $release -FileName ([System.IO.Path]::GetFileName($latestZip)) -Headers $headers -Owner $Owner -Repo $Repo
Upload-Asset -UploadBase $uploadBase -FilePath $latestZip -ContentType 'application/zip' -Headers $headers

if (Test-Path $latestSha) {
    Remove-ExistingAssetIfAny -Release $release -FileName ([System.IO.Path]::GetFileName($latestSha)) -Headers $headers -Owner $Owner -Repo $Repo
    Upload-Asset -UploadBase $uploadBase -FilePath $latestSha -ContentType 'text/plain' -Headers $headers
}

$result = [pscustomobject]@{
    Status = 'PUBLISHED'
    Tag = $Tag
    ReleaseUrl = $release.html_url
    Zip = $latestZip
    Sha256 = if (Test-Path $latestSha) { $latestSha } else { $null }
}

$result | ConvertTo-Json -Depth 4
