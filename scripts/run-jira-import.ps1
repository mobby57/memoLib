param(
    [Parameter(Mandatory = $false)]
    [string]$CsvPath = ".\JIRA_IMPORT_BACKLOG_S1_S3.csv",

    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-RequiredValue {
    param(
        [string]$Prompt,
        [string]$Current
    )

    if (-not [string]::IsNullOrWhiteSpace($Current)) {
        return $Current
    }

    $value = Read-Host $Prompt
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Valeur obligatoire manquante: $Prompt"
    }

    return $value
}

$jiraBaseUrl = Read-RequiredValue -Prompt 'JIRA_BASE_URL (ex: https://xxx.atlassian.net)' -Current $env:JIRA_BASE_URL
$jiraEmail = Read-RequiredValue -Prompt 'JIRA_EMAIL' -Current $env:JIRA_EMAIL
$jiraApiToken = Read-RequiredValue -Prompt 'JIRA_API_TOKEN' -Current $env:JIRA_API_TOKEN
$jiraProjectKey = Read-RequiredValue -Prompt 'JIRA_PROJECT_KEY (ex: MEMO)' -Current $env:JIRA_PROJECT_KEY

$env:JIRA_BASE_URL = $jiraBaseUrl
$env:JIRA_EMAIL = $jiraEmail
$env:JIRA_API_TOKEN = $jiraApiToken
$env:JIRA_PROJECT_KEY = $jiraProjectKey

$importScript = Join-Path $PSScriptRoot 'import-jira-backlog.ps1'
if (-not (Test-Path -LiteralPath $importScript)) {
    throw "Script introuvable: $importScript"
}

$arguments = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', $importScript,
    '-CsvPath', $CsvPath
)

if ($DryRun) {
    $arguments += '-DryRun'
}

Write-Host "[INFO] Lancement import Jira..."
& powershell @arguments
