param(
    [string]$BaseUrl = '',
    [string]$Email = '',
    [string]$Password = 'StrongPass123!'
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $sessionPath = Join-Path $projectDir 'dist\local-preview-session.json'
    if (Test-Path $sessionPath) {
        try {
            $session = Get-Content -Raw -Path $sessionPath | ConvertFrom-Json
            if ($session.baseUrl) {
                $BaseUrl = [string]$session.baseUrl
            }
        }
        catch {
        }
    }
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:8091'
}

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = "auto.user.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@memolib.local"
}

$registerBody = @{
    email = $Email
    password = $Password
    name = 'Auto User'
    role = 'AVOCAT'
    plan = 'CABINET'
} | ConvertTo-Json

$registerStatus = 0
$duplicateStatus = 0
$loginStatus = 0
$ingestStatus = 0
$searchHits = 0
$searchFound = $false
$auditCount = 0
$tokenPresent = $false
$caseId = ''
$attachStatus = 0
$timelineCount = 0

try {
    $reg = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $registerBody
    $registerStatus = $reg.StatusCode

    try {
        Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $registerBody | Out-Null
        $duplicateStatus = 200
    }
    catch {
        $duplicateStatus = $_.Exception.Response.StatusCode.value__
    }

    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $loginResp = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body $loginBody
    $loginStatus = $loginResp.StatusCode
    $loginObj = $loginResp.Content | ConvertFrom-Json

    $token = $loginObj.token
    $tokenPresent = -not [string]::IsNullOrWhiteSpace($token)
    $headers = @{ Authorization = "Bearer $token" }

    $ext = "auto-mail-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    $ingestBody = @{
        externalId = $ext
        from = 'client@test.com'
        subject = 'Auto incident'
        body = 'Incident test local auto'
        occurredAt = '2026-02-21T10:00:00Z'
    } | ConvertTo-Json

    $ingestResp = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ingest/email" -Method POST -ContentType 'application/json' -Headers $headers -Body $ingestBody
    $ingestStatus = $ingestResp.StatusCode

    $searchBody = @{ text = 'Auto incident' } | ConvertTo-Json
    $search = Invoke-RestMethod -Uri "$BaseUrl/api/search/events" -Method POST -ContentType 'application/json' -Headers $headers -Body $searchBody
    $searchHits = ($search | Measure-Object).Count
    $searchFound = (($search | Where-Object { $_.externalId -eq $ext } | Measure-Object).Count -ge 1)

    $caseBody = @{ title = 'Auto case validation' } | ConvertTo-Json
    $caseId = Invoke-RestMethod -Uri "$BaseUrl/api/cases" -Method POST -ContentType 'application/json' -Headers $headers -Body $caseBody

    $eventFound = $search | Where-Object { $_.externalId -eq $ext } | Select-Object -First 1
    if ($eventFound) {
        $attachResp = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/cases/$caseId/events/$($eventFound.id)" -Method POST -Headers $headers
        $attachStatus = $attachResp.StatusCode
    }

    $timeline = Invoke-RestMethod -Uri "$BaseUrl/api/cases/$caseId/timeline" -Method GET -Headers $headers
    $timelineCount = ($timeline | Measure-Object).Count

    $audit = Invoke-RestMethod -Uri "$BaseUrl/api/audit" -Method GET -Headers $headers
    $auditCount = ($audit | Measure-Object).Count
}
catch {
    Write-Host "Erreur auto-flow: $($_.Exception.Message)"
    throw
}

$ok =
    ($registerStatus -eq 200) -and
    ($duplicateStatus -eq 409) -and
    ($loginStatus -eq 200) -and
    $tokenPresent -and
    ($ingestStatus -eq 200) -and
    $searchFound -and
    ($searchHits -ge 1) -and
    ([string]$caseId).Length -gt 0 -and
    ($attachStatus -eq 200) -and
    ($timelineCount -ge 1) -and
    ($auditCount -ge 1)

$result = [pscustomobject]@{
    Status = if ($ok) { 'PASS' } else { 'FAIL' }
    BaseUrl = $BaseUrl
    Email = $Email
    RegisterStatus = $registerStatus
    DuplicateStatus = $duplicateStatus
    LoginStatus = $loginStatus
    TokenPresent = $tokenPresent
    IngestStatus = $ingestStatus
    SearchHits = $searchHits
    SearchFound = $searchFound
    CaseId = [string]$caseId
    AttachStatus = $attachStatus
    TimelineCount = $timelineCount
    AuditCount = $auditCount
}

$result | ConvertTo-Json -Depth 4

if (-not $ok) {
    exit 1
}
