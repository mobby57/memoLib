param(
    [string]$Owner = 'mobby57',
    [string]$Repo = 'memoLib',
    [string]$SourceTag,
    [string]$StableTag = 'stable',
    [string]$Title = ''
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($SourceTag)) {
    throw 'SourceTag requis (ex: v2026.02.21).'
}

if (-not $env:GITHUB_TOKEN) {
    throw 'Variable GITHUB_TOKEN absente.'
}

$projectDir = Split-Path -Parent $PSScriptRoot

$headers = @{
    Authorization = "Bearer $($env:GITHUB_TOKEN)"
    Accept = 'application/vnd.github+json'
    'User-Agent' = 'MemoLib-Promote-Stable'
    'X-GitHub-Api-Version' = '2022-11-28'
}

$sourceUrl = "https://api.github.com/repos/$Owner/$Repo/releases/tags/$SourceTag"
$sourceRelease = Invoke-RestMethod -Method GET -Uri $sourceUrl -Headers $headers

$effectiveTitle = if ([string]::IsNullOrWhiteSpace($Title)) {
    "MemoLib Local Demo $StableTag (promoted from $SourceTag)"
} else {
    $Title
}

$notes = if ([string]::IsNullOrWhiteSpace($sourceRelease.body)) {
    "Promoted from $SourceTag"
} else {
    $sourceRelease.body
}

$publishScript = Join-Path $projectDir 'scripts\publish-github-release.ps1'

$publishParams = @{
    Owner = $Owner
    Repo = $Repo
    Tag = $StableTag
    Title = $effectiveTitle
    Notes = $notes
}

try {
    & $publishScript @publishParams
}
catch {
    $fallbackNotes = "Promoted from $SourceTag`nSource release: $($sourceRelease.html_url)"
    $publishParams.Notes = $fallbackNotes
    & $publishScript @publishParams
}

[pscustomobject]@{
    Status = 'PROMOTED'
    SourceTag = $SourceTag
    StableTag = $StableTag
    SourceReleaseUrl = $sourceRelease.html_url
} | ConvertTo-Json -Depth 4
