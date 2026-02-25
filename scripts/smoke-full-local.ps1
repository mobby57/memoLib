$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

$candidatePorts = 8111..8130
$selectedPort = $null

foreach ($port in $candidatePorts) {
    $inUse = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $inUse) {
        $selectedPort = $port
        break
    }
}

if (-not $selectedPort) {
    throw 'Aucun port libre trouvé entre 8111 et 8130.'
}

$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = "http://localhost:$selectedPort"
$env:JwtSettings__SecretKey = 'MEMOLIB_LOCAL_DEV_SECRET_2026_32_CHARS_MIN'
$env:ConnectionStrings__Default = 'Data Source=memolib.smoke.full.db'
$env:DisableHttpsRedirection = 'true'

$apiProcess = $null

function Get-ApiMessage {
    param([string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return ''
    }

    try {
        $obj = $Content | ConvertFrom-Json
        if ($obj -and $obj.message) {
            return [string]$obj.message
        }
    }
    catch {
    }

    return $Content
}

try {
    $apiProcess = Start-Process -FilePath 'dotnet' -ArgumentList '.\bin\Release\net9.0\MemoLib.Api.dll' -PassThru

    $baseUrl = "http://localhost:$selectedPort"

    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $health = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/health" -Method GET -TimeoutSec 2
            if ($health.StatusCode -eq 200) {
                $ready = $true
                break
            }
        }
        catch {
        }

        Start-Sleep -Milliseconds 500
    }

    if (-not $ready) {
        throw "API non joignable sur $baseUrl après attente de démarrage."
    }

    $registerEmail = "smoke.user.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@memolib.local"
    $registerBody = @{
        email = $registerEmail
        password = 'StrongPass123!'
        name = 'Smoke User'
        role = 'AVOCAT'
        plan = 'CABINET'
    } | ConvertTo-Json

    $register = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $registerBody

    $loginBody = @{ email = $registerEmail; password = 'StrongPass123!' } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body $loginBody
    $token = $login.token

    if (-not $token) {
        throw 'Échec login admin: token JWT absent.'
    }

    $headers = @{ Authorization = "Bearer $token" }

    $ext1 = "full-mail-1-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    $ext2 = "full-mail-2-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"

    $ing1Body = @{
        externalId = $ext1
        from = 'client@test.com'
        subject = 'Incident production'
        body = 'Machine arretee depuis 10h'
        occurredAt = '2026-02-10T08:30:00Z'
    } | ConvertTo-Json

    $ing2Body = @{
        externalId = $ext2
        from = 'client@test.com'
        subject = 'Incident resolu'
        body = 'Machine redemarree a 14h'
        occurredAt = '2026-02-10T14:00:00Z'
    } | ConvertTo-Json

    $ing1 = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/ingest/email" -Method POST -ContentType 'application/json' -Headers $headers -Body $ing1Body
    $ingDup = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/ingest/email" -Method POST -ContentType 'application/json' -Headers $headers -Body $ing1Body
    $ing2 = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/ingest/email" -Method POST -ContentType 'application/json' -Headers $headers -Body $ing2Body

    $ing1Message = Get-ApiMessage -Content $ing1.Content
    $ingDupMessage = Get-ApiMessage -Content $ingDup.Content
    $ing2Message = Get-ApiMessage -Content $ing2.Content

    $caseId = Invoke-RestMethod -Uri "$baseUrl/api/cases" -Method POST -ContentType 'application/json' -Headers $headers -Body (@{ title = 'Incident machine production' } | ConvertTo-Json)

    $search1 = Invoke-RestMethod -Uri "$baseUrl/api/search/events" -Method POST -ContentType 'application/json' -Headers $headers -Body (@{ text = 'Incident production' } | ConvertTo-Json)
    $search2 = Invoke-RestMethod -Uri "$baseUrl/api/search/events" -Method POST -ContentType 'application/json' -Headers $headers -Body (@{ text = 'Incident resolu' } | ConvertTo-Json)

    $event1 = $search1 | Where-Object { $_.externalId -eq $ext1 } | Select-Object -First 1
    $event2 = $search2 | Where-Object { $_.externalId -eq $ext2 } | Select-Object -First 1

    if (-not $event1 -or -not $event2) {
        throw 'Échec search: events ingérés introuvables.'
    }

    $attach1 = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/cases/$caseId/events/$($event1.id)" -Method POST -Headers $headers
    $attach2 = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/cases/$caseId/events/$($event2.id)" -Method POST -Headers $headers

    $timeline = Invoke-RestMethod -Uri "$baseUrl/api/cases/$caseId/timeline" -Method GET -Headers $headers
    $auditResponse = Invoke-RestMethod -Uri "$baseUrl/api/audit/user-actions?limit=200" -Method GET -Headers $headers
    $audit = @()
    if ($auditResponse -and $auditResponse.actions) {
        $audit = @($auditResponse.actions)
    }

    $timelineCount = ($timeline | Measure-Object).Count
    $timelineOrdered = $false
    if ($timelineCount -ge 2) {
        $timelineOrdered = ([DateTime]$timeline[0].occurredAt -le [DateTime]$timeline[1].occurredAt)
    }

    $auditCaseCreated = (($audit | Where-Object { $_.action -eq 'CaseCreated' -or $_.Action -eq 'CaseCreated' } | Measure-Object).Count -ge 1)
    $auditEventAttached = (($audit | Where-Object { $_.action -eq 'EventAttached' -or $_.Action -eq 'EventAttached' } | Measure-Object).Count -ge 2)
    $auditEventIngested = (($audit | Where-Object { $_.action -eq 'EventIngested' -or $_.Action -eq 'EventIngested' } | Measure-Object).Count -ge 2)

    $registerOk = ($register.email -eq $registerEmail) -and ($register.name -eq 'Smoke User')

    $duplicateOk =
        ($ingDupMessage -eq 'Duplicate ignored.') -or
        ($ingDupMessage -eq 'Duplicate detected (same ExternalId)')

    $ok =
        $registerOk -and
        ($ing1Message -eq 'Event stored.') -and
        $duplicateOk -and
        ($ing2Message -eq 'Event stored.') -and
        ([string]$caseId).Length -gt 0 -and
        ($attach1.Content -eq 'Linked.') -and
        ($attach2.Content -eq 'Linked.') -and
        ($timelineCount -eq 2) -and
        $timelineOrdered -and
        $auditCaseCreated -and
        $auditEventAttached -and
        $auditEventIngested

    $result = [pscustomobject]@{
        Status = if ($ok) { 'PASS' } else { 'FAIL' }
        BaseUrl = $baseUrl
        RegisteredEmail = $register.email
        RegisteredName = $register.name
        Ingest1 = $ing1Message
        IngestDuplicate = $ingDupMessage
        Ingest2 = $ing2Message
        CaseId = [string]$caseId
        Attach1 = $attach1.Content
        Attach2 = $attach2.Content
        TimelineCount = $timelineCount
        TimelineOrdered = $timelineOrdered
        AuditCaseCreated = $auditCaseCreated
        AuditEventAttached = $auditEventAttached
        AuditEventIngested = $auditEventIngested
    }

    $result | ConvertTo-Json -Depth 4

    if (-not $ok) {
        exit 1
    }
}
finally {
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
