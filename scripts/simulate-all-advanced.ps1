param(
    [string]$BaseUrl = 'http://localhost:8080',
    [string]$Email = '',
    [string]$Password = 'StrongPass123!'
)

$ErrorActionPreference = 'Stop'

function Add-CheckResult {
    param(
        [System.Collections.Generic.List[object]]$List,
        [string]$Name,
        [bool]$Success,
        [string]$Detail
    )

    $List.Add([pscustomobject]@{
        Name = $Name
        Success = $Success
        Detail = $Detail
    })
}

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = "advanced.demo.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@memolib.local"
}

$checks = [System.Collections.Generic.List[object]]::new()

try {
    Write-Host '== Simulation avancee MemoLib ==' -ForegroundColor Cyan
    Write-Host "BaseUrl: $BaseUrl"
    Write-Host "Email demo: $Email"

    # 0) Health
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET
    $healthOk = ($health.status -eq 'healthy')
    Add-CheckResult -List $checks -Name 'Health' -Success $healthOk -Detail "status=$($health.status)"

    # 1) Register
    $registerBody = @{
        email = $Email
        password = $Password
        name = 'Advanced Demo User'
        role = 'AVOCAT'
        plan = 'CABINET'
    } | ConvertTo-Json

    $registerStatus = 0
    try {
        $register = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $registerBody
        $registerStatus = $register.StatusCode
    }
    catch {
        $registerStatus = $_.Exception.Response.StatusCode.value__
    }
    Add-CheckResult -List $checks -Name 'Register' -Success (($registerStatus -eq 200) -or ($registerStatus -eq 409)) -Detail "status=$registerStatus"

    # 2) Duplicate register
    $dupStatus = 0
    try {
        Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType 'application/json' -Body $registerBody | Out-Null
        $dupStatus = 200
    }
    catch {
        $dupStatus = $_.Exception.Response.StatusCode.value__
    }
    Add-CheckResult -List $checks -Name 'Register duplicate' -Success ($dupStatus -eq 409) -Detail "status=$dupStatus"

    # 3) Login
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body $loginBody
    $token = $login.token
    $tokenOk = -not [string]::IsNullOrWhiteSpace($token)
    $loginDetail = if ($tokenOk) { 'token=present' } else { 'token=missing' }
    Add-CheckResult -List $checks -Name 'Login' -Success $tokenOk -Detail $loginDetail

    if (-not $tokenOk) {
        throw 'Token absent, simulation stoppee.'
    }

    $authHeaders = @{ Authorization = "Bearer $token" }
    $authJsonHeaders = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }

    # 4) Ingestion x2 + duplicate
    $ext1 = "adv-mail-1-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
    $ext2 = "adv-mail-2-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"

    $mail1 = @{
        externalId = $ext1
        from = 'client1@example.com'
        subject = 'Incident production A'
        body = 'Machine arretee depuis 10h, intervention requise.'
        occurredAt = (Get-Date).AddHours(-2).ToUniversalTime().ToString('o')
    } | ConvertTo-Json

    $mail2 = @{
        externalId = $ext2
        from = 'client2@example.com'
        subject = 'Incident production B'
        body = 'Redemarrage effectue, verification en cours.'
        occurredAt = (Get-Date).AddHours(-1).ToUniversalTime().ToString('o')
    } | ConvertTo-Json

    $ing1 = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ingest/email" -Method POST -Headers $authJsonHeaders -Body $mail1
    $ingDupBody = $mail1
    $ingDup = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ingest/email" -Method POST -Headers $authJsonHeaders -Body $ingDupBody
    $ing2 = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/ingest/email" -Method POST -Headers $authJsonHeaders -Body $mail2

    $ingOk = ($ing1.StatusCode -eq 200) -and ($ing2.StatusCode -eq 200)
    $dupOk = ($ingDup.Content -eq 'Duplicate ignored.')
    Add-CheckResult -List $checks -Name 'Ingestion' -Success $ingOk -Detail "status1=$($ing1.StatusCode), status2=$($ing2.StatusCode)"
    Add-CheckResult -List $checks -Name 'Deduplication' -Success $dupOk -Detail "response=$($ingDup.Content)"

    # 5) Search text + date
    $searchText = Invoke-RestMethod -Uri "$BaseUrl/api/search/events" -Method POST -Headers $authJsonHeaders -Body (@{ text = 'Incident production' } | ConvertTo-Json)
    $searchDate = Invoke-RestMethod -Uri "$BaseUrl/api/search/events" -Method POST -Headers $authJsonHeaders -Body (@{ from = (Get-Date).AddDays(-1).ToUniversalTime().ToString('o') } | ConvertTo-Json)

    $found1 = $searchText | Where-Object { $_.externalId -eq $ext1 } | Select-Object -First 1
    $found2 = $searchText | Where-Object { $_.externalId -eq $ext2 } | Select-Object -First 1
    $searchOk = ($null -ne $found1) -and ($null -ne $found2) -and (($searchDate | Measure-Object).Count -ge 2)
    Add-CheckResult -List $checks -Name 'Search' -Success $searchOk -Detail "textHits=$(($searchText | Measure-Object).Count), dateHits=$(($searchDate | Measure-Object).Count)"

    # 6) Case + timeline
    $caseId = Invoke-RestMethod -Uri "$BaseUrl/api/cases" -Method POST -Headers $authJsonHeaders -Body (@{ title = 'Dossier simulation avancee' } | ConvertTo-Json)
    $attach1 = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/cases/$caseId/events/$($found1.id)" -Method POST -Headers $authHeaders
    $attach2 = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/cases/$caseId/events/$($found2.id)" -Method POST -Headers $authHeaders
    $timeline = Invoke-RestMethod -Uri "$BaseUrl/api/cases/$caseId/timeline" -Method GET -Headers $authHeaders

    $caseOk = ([string]$caseId).Length -gt 0 -and ($attach1.StatusCode -eq 200) -and ($attach2.StatusCode -eq 200) -and (($timeline | Measure-Object).Count -ge 2)
    Add-CheckResult -List $checks -Name 'Cases and timeline' -Success $caseOk -Detail "caseId=$caseId, timelineCount=$(($timeline | Measure-Object).Count)"

    # 7) Client module
    $clientCreate = Invoke-RestMethod -Uri "$BaseUrl/api/client" -Method POST -Headers $authJsonHeaders -Body (@{
        name = 'Societe Demo'
        email = "contact.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@societe-demo.com"
        phoneNumber = '+33100000000'
        address = 'Paris'
    } | ConvertTo-Json)

    $clientGet = Invoke-RestMethod -Uri "$BaseUrl/api/client/$($clientCreate.id)" -Method GET -Headers $authHeaders
    $clientList = Invoke-RestMethod -Uri "$BaseUrl/api/client" -Method GET -Headers $authHeaders
    $clientOk = ($null -ne $clientCreate.id) -and ($clientGet.id -eq $clientCreate.id) -and (($clientList | Measure-Object).Count -ge 1)
    Add-CheckResult -List $checks -Name 'Client module' -Success $clientOk -Detail "clientId=$($clientCreate.id), listCount=$(($clientList | Measure-Object).Count)"

    # 8) Export + Stats
    $exportText = Invoke-RestMethod -Uri "$BaseUrl/api/export/events-text" -Method GET -Headers $authHeaders
    $statsDay = Invoke-RestMethod -Uri "$BaseUrl/api/stats/events-per-day" -Method GET -Headers $authHeaders
    $statsType = Invoke-RestMethod -Uri "$BaseUrl/api/stats/events-by-type" -Method GET -Headers $authHeaders
    $statsAvg = Invoke-RestMethod -Uri "$BaseUrl/api/stats/average-severity" -Method GET -Headers $authHeaders
    $statsTop = Invoke-RestMethod -Uri "$BaseUrl/api/stats/top-sources" -Method GET -Headers $authHeaders

    $exportStatsOk = (($exportText | Measure-Object).Count -ge 1) -and (($statsDay | Measure-Object).Count -ge 1) -and ($null -ne $statsAvg.AverageSeverity) -and (($statsTop | Measure-Object).Count -ge 1)
    Add-CheckResult -List $checks -Name 'Export and stats' -Success $exportStatsOk -Detail "export=$(($exportText | Measure-Object).Count), perDay=$(($statsDay | Measure-Object).Count), byType=$(($statsType | Measure-Object).Count)"

    # 9) Embeddings + Semantic (both controllers)
    $embGen = Invoke-RestMethod -Uri "$BaseUrl/api/embeddings/generate-all" -Method POST -Headers $authHeaders
    $embSearch = Invoke-RestMethod -Uri "$BaseUrl/api/embeddings/search" -Method POST -Headers $authJsonHeaders -Body (@{ query = 'incident production'; limit = 5 } | ConvertTo-Json)

    $semGen = Invoke-RestMethod -Uri "$BaseUrl/api/semantic/generate-embeddings" -Method POST -Headers $authHeaders
    $semSearch = Invoke-RestMethod -Uri "$BaseUrl/api/semantic/search" -Method POST -Headers $authJsonHeaders -Body (@{ query = 'incident production' } | ConvertTo-Json)

    $semanticOk = ($null -ne $embGen.GeneratedCount) -and (($embSearch | Measure-Object).Count -ge 1) -and ($null -ne $semGen.GeneratedCount) -and (($semSearch | Measure-Object).Count -ge 1)
    Add-CheckResult -List $checks -Name 'Embeddings and semantic' -Success $semanticOk -Detail "embSearch=$(($embSearch | Measure-Object).Count), semSearch=$(($semSearch | Measure-Object).Count)"

    # 10) Audit
    $audit = Invoke-RestMethod -Uri "$BaseUrl/api/audit" -Method GET -Headers $authHeaders
    $auditCount = ($audit | Measure-Object).Count
    $hasCaseCreated = (($audit | Where-Object { $_.action -eq 'CaseCreated' } | Measure-Object).Count -ge 1)
    $hasEventAttached = (($audit | Where-Object { $_.action -eq 'EventAttached' } | Measure-Object).Count -ge 2)
    $hasEventIngested = (($audit | Where-Object { $_.action -eq 'EventIngested' } | Measure-Object).Count -ge 2)

    $auditOk = ($auditCount -ge 1) -and $hasCaseCreated -and $hasEventAttached -and $hasEventIngested
    Add-CheckResult -List $checks -Name 'Audit trail' -Success $auditOk -Detail "count=$auditCount"

    $allOk = (($checks | Where-Object { -not $_.Success } | Measure-Object).Count -eq 0)

    $result = [pscustomobject]@{
        Status = if ($allOk) { 'PASS' } else { 'FAIL' }
        BaseUrl = $BaseUrl
        DemoEmail = $Email
        Checks = $checks
    }

    $result | ConvertTo-Json -Depth 6

    if (-not $allOk) {
        exit 1
    }
}
catch {
    $result = [pscustomobject]@{
        Status = 'FAIL'
        BaseUrl = $BaseUrl
        DemoEmail = $Email
        Error = $_.Exception.Message
        Checks = $checks
    }

    $result | ConvertTo-Json -Depth 6
    exit 1
}
