param(
    [Parameter(Mandatory = $false)]
    [string]$CsvPath = "JIRA_IMPORT_BACKLOG_S1_S3.csv",

    [Parameter(Mandatory = $false)]
    [string]$JiraBaseUrl = $env:JIRA_BASE_URL,

    [Parameter(Mandatory = $false)]
    [string]$JiraEmail = $env:JIRA_EMAIL,

    [Parameter(Mandatory = $false)]
    [string]$JiraApiToken = $env:JIRA_API_TOKEN,

    [Parameter(Mandatory = $false)]
    [string]$ProjectKey = $env:JIRA_PROJECT_KEY,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [switch]$SkipStories
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-NotEmpty {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Valeur obligatoire manquante: $Name"
    }
}

function Build-BasicAuthHeader {
    param(
        [string]$Email,
        [string]$ApiToken
    )

    $raw = "${Email}:${ApiToken}"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($raw)
    $encoded = [Convert]::ToBase64String($bytes)
    return "Basic $encoded"
}

function Invoke-Jira {
    param(
        [ValidateSet('GET', 'POST')]
        [string]$Method,
        [string]$Uri,
        [object]$Body,
        [hashtable]$Headers
    )

    if ($Method -eq 'GET') {
        return Invoke-RestMethod -Method Get -Uri $Uri -Headers $Headers
    }

    $json = $null
    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 20
    }

    return Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -ContentType 'application/json; charset=utf-8' -Body $json
}

function Get-JiraErrorBody {
    param($ErrorRecord)

    try {
        $response = $ErrorRecord.Exception.Response
        if ($null -eq $response) {
            return $ErrorRecord.ToString()
        }

        $stream = $response.GetResponseStream()
        if ($null -eq $stream) {
            return $ErrorRecord.ToString()
        }

        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        if ([string]::IsNullOrWhiteSpace($content)) {
            return $ErrorRecord.ToString()
        }

        return $content
    }
    catch {
        return $ErrorRecord.ToString()
    }
}

function Convert-ToJiraAdfDescription {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        $Text = ''
    }

    $lines = $Text -split "`r?`n"
    $content = @()

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $content += @{
            type = 'paragraph'
            content = @(
                @{
                    type = 'text'
                    text = $line
                }
            )
        }
    }

    if ($content.Count -eq 0) {
        $content = @(
            @{
                type = 'paragraph'
                content = @(
                    @{
                        type = 'text'
                        text = ''
                    }
                )
            }
        )
    }

    return @{
        type = 'doc'
        version = 1
        content = $content
    }
}

function Split-Labels {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return @()
    }

    return $Value.Split(',') |
        ForEach-Object { $_.Trim() } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

function Resolve-FieldIdByName {
    param(
        [array]$Fields,
        [string[]]$CandidateNames
    )

    foreach ($candidate in $CandidateNames) {
        $field = $Fields | Where-Object { $_.name -eq $candidate } | Select-Object -First 1
        if ($null -ne $field) {
            return $field.id
        }
    }

    return $null
}

function Resolve-PriorityName {
    param([string]$Priority)

    if ([string]::IsNullOrWhiteSpace($Priority)) {
        return $null
    }

    return $Priority.Trim()
}

if (-not (Test-Path -LiteralPath $CsvPath)) {
    throw "CSV introuvable: $CsvPath"
}

Write-Host "[INFO] Chargement CSV: $CsvPath"
$rows = Import-Csv -LiteralPath $CsvPath
if ($rows.Count -eq 0) {
    throw 'Le CSV est vide.'
}

$hasJiraCredentials =
    -not [string]::IsNullOrWhiteSpace($JiraBaseUrl) -and
    -not [string]::IsNullOrWhiteSpace($JiraEmail) -and
    -not [string]::IsNullOrWhiteSpace($JiraApiToken) -and
    -not [string]::IsNullOrWhiteSpace($ProjectKey)

$offlineDryRun = $DryRun -and -not $hasJiraCredentials

if (-not $offlineDryRun) {
    Assert-NotEmpty -Name 'JIRA_BASE_URL' -Value $JiraBaseUrl
    Assert-NotEmpty -Name 'JIRA_EMAIL' -Value $JiraEmail
    Assert-NotEmpty -Name 'JIRA_API_TOKEN' -Value $JiraApiToken
    Assert-NotEmpty -Name 'JIRA_PROJECT_KEY' -Value $ProjectKey
}

$headers = $null
$issuesUri = $null
$fieldsUri = $null

if (-not $offlineDryRun) {
    $authHeader = Build-BasicAuthHeader -Email $JiraEmail -ApiToken $JiraApiToken
    $headers = @{
        Authorization = $authHeader
        Accept = 'application/json'
        'Content-Type' = 'application/json'
    }

    $base = $JiraBaseUrl.TrimEnd('/')
    $issuesUri = "$base/rest/api/3/issue"
    $fieldsUri = "$base/rest/api/3/field"
}

if ($offlineDryRun) {
    Write-Warning '[DRY-RUN OFFLINE] Variables Jira absentes: validation locale du CSV uniquement.'
}

$allFields = @()
if (-not $offlineDryRun) {
    Write-Host "[INFO] Récupération metadata des champs Jira"
    $allFields = Invoke-Jira -Method GET -Uri $fieldsUri -Headers $headers
}

$epicNameFieldId = Resolve-FieldIdByName -Fields $allFields -CandidateNames @('Epic Name')
$epicLinkFieldId = Resolve-FieldIdByName -Fields $allFields -CandidateNames @('Epic Link')
$storyPointsFieldId = Resolve-FieldIdByName -Fields $allFields -CandidateNames @('Story point estimate', 'Story Points')

if ($null -eq $epicNameFieldId) {
    Write-Warning "Champ 'Epic Name' non trouvé. La création d'Epic peut échouer selon la configuration Jira."
}

if ($null -eq $epicLinkFieldId) {
    Write-Warning "Champ 'Epic Link' non trouvé. Les stories ne seront pas reliées automatiquement aux epics."
}

$epicRows = $rows | Where-Object { $_.'Issue Type' -eq 'Epic' }
$storyRows = $rows | Where-Object { $_.'Issue Type' -ne 'Epic' }

$epicMap = @{}

foreach ($row in $epicRows) {
    $summary = $row.Summary
    if ([string]::IsNullOrWhiteSpace($summary)) {
        Write-Warning '[SKIP] Epic sans Summary.'
        continue
    }

    $fieldsPayload = @{
        summary = $summary
        issuetype = @{ name = 'Epic' }
        description = (Convert-ToJiraAdfDescription -Text $row.Description)
        labels = (Split-Labels -Value $row.Labels)
    }

    if (-not [string]::IsNullOrWhiteSpace($ProjectKey)) {
        $fieldsPayload.project = @{ key = $ProjectKey }
    }

    if ($epicNameFieldId) {
        $fieldsPayload[$epicNameFieldId] = if ([string]::IsNullOrWhiteSpace($row.'Epic Name')) { $summary } else { $row.'Epic Name' }
    }

    $priorityName = Resolve-PriorityName -Priority $row.Priority
    if ($priorityName) {
        $fieldsPayload.priority = @{ name = $priorityName }
    }

    $payload = @{ fields = $fieldsPayload }

    if ($DryRun) {
        Write-Host "[DRY-RUN] Epic: $summary"
        if (-not [string]::IsNullOrWhiteSpace($row.'Epic Name')) {
            $epicMap[$row.'Epic Name'] = "DRY-$summary"
        }
        continue
    }

    try {
        $created = Invoke-Jira -Method POST -Uri $issuesUri -Body $payload -Headers $headers
        $epicKey = $created.key
        Write-Host "[OK] Epic créé: $epicKey - $summary"

        if (-not [string]::IsNullOrWhiteSpace($row.'Epic Name')) {
            $epicMap[$row.'Epic Name'] = $epicKey
        }
    }
    catch {
        Write-Warning "[ERROR] Création epic échouée: $summary"
        Write-Warning (Get-JiraErrorBody -ErrorRecord $_)
    }
}

if ($SkipStories) {
    Write-Host '[INFO] SkipStories activé: fin après création des epics.'
    exit 0
}

foreach ($row in $storyRows) {
    $summary = $row.Summary
    if ([string]::IsNullOrWhiteSpace($summary)) {
        Write-Warning '[SKIP] Story sans Summary.'
        continue
    }

    $issueType = if ([string]::IsNullOrWhiteSpace($row.'Issue Type')) { 'Story' } else { $row.'Issue Type' }

    $fieldsPayload = @{
        summary = $summary
        issuetype = @{ name = $issueType }
        description = (Convert-ToJiraAdfDescription -Text $row.Description)
        labels = (Split-Labels -Value $row.Labels)
    }

    if (-not [string]::IsNullOrWhiteSpace($ProjectKey)) {
        $fieldsPayload.project = @{ key = $ProjectKey }
    }

    $priorityName = Resolve-PriorityName -Priority $row.Priority
    if ($priorityName) {
        $fieldsPayload.priority = @{ name = $priorityName }
    }

    if ($storyPointsFieldId -and -not [string]::IsNullOrWhiteSpace($row.'Story Points')) {
        $storyPointValue = 0
        if ([double]::TryParse($row.'Story Points', [ref]$storyPointValue)) {
            $fieldsPayload[$storyPointsFieldId] = $storyPointValue
        }
    }

    $epicName = $row.'Epic Link'
    if ($epicLinkFieldId -and -not [string]::IsNullOrWhiteSpace($epicName) -and $epicMap.ContainsKey($epicName)) {
        $fieldsPayload[$epicLinkFieldId] = $epicMap[$epicName]
    }

    $payload = @{ fields = $fieldsPayload }

    if ($DryRun) {
        Write-Host "[DRY-RUN] ${issueType}: $summary"
        continue
    }

    try {
        $created = Invoke-Jira -Method POST -Uri $issuesUri -Body $payload -Headers $headers
        Write-Host "[OK] $issueType créé: $($created.key) - $summary"
    }
    catch {
        Write-Warning "[ERROR] Création $issueType échouée: $summary"
        Write-Warning (Get-JiraErrorBody -ErrorRecord $_)
    }
}

Write-Host '[DONE] Import Jira terminé.'
