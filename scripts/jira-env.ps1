param(
    [Parameter(Mandatory = $false)]
    [string]$BaseUrl = 'https://sarraboudjellal57.atlassian.net',

    [Parameter(Mandatory = $false)]
    [string]$Email = 'sarraboudjellal57@gmail.com',

    [Parameter(Mandatory = $false)]
    [switch]$NoPrompt
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$env:JIRA_BASE_URL = $BaseUrl
$env:JIRA_EMAIL = $Email

if (-not $NoPrompt) {
    $token = Read-Host 'Colle JIRA_API_TOKEN (masque ton écran)'
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw 'JIRA_API_TOKEN vide.'
    }
    $env:JIRA_API_TOKEN = $token
}

$hasBase = -not [string]::IsNullOrWhiteSpace($env:JIRA_BASE_URL)
$hasEmail = -not [string]::IsNullOrWhiteSpace($env:JIRA_EMAIL)
$hasToken = -not [string]::IsNullOrWhiteSpace($env:JIRA_API_TOKEN)

Write-Host "HAS_BASE=$hasBase"
Write-Host "HAS_EMAIL=$hasEmail"
Write-Host "HAS_TOKEN=$hasToken"

if (-not $hasToken) {
    Write-Warning 'Token absent: relance sans -NoPrompt ou définis $env:JIRA_API_TOKEN manuellement.'
    exit 1
}

Write-Host 'Jira env chargé pour cette session.'
