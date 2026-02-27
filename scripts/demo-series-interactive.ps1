param(
    [string]$BaseUrl = 'http://localhost:5078',
    [string]$DemoEmail = 'sarraboudjellal57@gmail.com',
    [string]$DemoPassword = 'SecurePass123!',
    [ValidateSet('Standard', 'Client')]
    [string]$Profile = 'Standard',
    [switch]$OpenUi,
    [switch]$AutoStartApi,
    [switch]$RunAll,
    [switch]$ListOnly
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

$global:SeriesResults = New-Object System.Collections.Generic.List[object]

function Write-Section {
    param([string]$Title)
    Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function Add-Result {
    param(
        [string]$Step,
        [string]$Status,
        [string]$Message
    )

    $global:SeriesResults.Add([pscustomobject]@{
        Step = $Step
        Status = $Status
        Message = $Message
        Timestamp = (Get-Date).ToString('s')
    }) | Out-Null
}

function Get-StepPath {
    param([string]$FileName)
    return Join-Path $scriptDir $FileName
}

function Test-ApiHealth {
    try {
        $healthUrl = "$($BaseUrl.TrimEnd('/'))/health"
        $res = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 6
        return ($res.StatusCode -eq 200)
    } catch {
        return $false
    }
}

function Ensure-ApiReady {
    if (Test-ApiHealth) {
        Write-Host "✅ API déjà opérationnelle" -ForegroundColor Green
        return $true
    }

    Write-Host "⚠️  API non disponible. Démarrage automatique..." -ForegroundColor Yellow
    
    $ensureScript = Get-StepPath 'ensure-all-services.ps1'
    if (Test-Path $ensureScript) {
        & powershell -ExecutionPolicy Bypass -File $ensureScript -BaseUrl $BaseUrl
        $code = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
        if ($code -eq 0) {
            Write-Host "✅ Tous les services sont prêts" -ForegroundColor Green
            return $true
        }
    }
    
    Write-Host "❌ Impossible de démarrer les services" -ForegroundColor Red
    return $false
}

function Ensure-DemoToken {
    try {
        $loginBody = @{ email = $DemoEmail; password = $DemoPassword } | ConvertTo-Json
        $auth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 10
        if ($auth.token) { return $auth.token }
    } catch {}

    try {
        $registerBody = @{ email = $DemoEmail; password = $DemoPassword; name = 'Demo Series User'; role = 'AVOCAT'; plan = 'CABINET' } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -ContentType 'application/json' -Body $registerBody -TimeoutSec 10
    } catch {}

    try {
        $loginBody = @{ email = $DemoEmail; password = $DemoPassword } | ConvertTo-Json
        $auth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 10
        if ($auth.token) { return $auth.token }
    } catch {}

    return $null
}

function Invoke-ApiStepCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Token,
        [object]$Body
    )

    $headers = @{}
    if (-not [string]::IsNullOrWhiteSpace($Token)) {
        $headers['Authorization'] = "Bearer $Token"
    }

    if ($null -ne $Body) {
        return Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 10) -TimeoutSec 15
    }

    return Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method $Method -Headers $headers -TimeoutSec 15
}

function Invoke-QuickApiStep {
    $stepName = 'Demo rapide API'
    Write-Section $stepName

    $token = Ensure-DemoToken
    if ([string]::IsNullOrWhiteSpace($token)) {
        Add-Result -Step $stepName -Status 'FAILED' -Message 'Token démo indisponible'
        Write-Host "❌ Token démo indisponible" -ForegroundColor Red
        return
    }

    try {
        $mail = @{ from='client.quick@memolib.local'; subject='Demo rapide API'; body='Email de validation quick demo'; externalId="SERIES-QUICK-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"; occurredAt=(Get-Date).ToUniversalTime().ToString('o') }
        $null = Invoke-ApiStepCall -Method 'POST' -Endpoint '/api/ingest/email' -Token $token -Body $mail
        $search = Invoke-ApiStepCall -Method 'POST' -Endpoint '/api/search/events' -Token $token -Body @{ text = 'validation quick demo' }
        try {
            $cases = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/cases' -Token $token -Body $null
        } catch {
            $cases = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/cases/filter' -Token $token -Body $null
        }
        $searchCount = if ($search -is [array]) { $search.Count } elseif ($null -eq $search) { 0 } else { 1 }
        $casesCount = if ($cases -is [array]) { $cases.Count } elseif ($null -eq $cases) { 0 } else { 1 }
        $msg = "ingest=OK, search=$searchCount, cases=$casesCount"
        Add-Result -Step $stepName -Status 'OK' -Message $msg
        Write-Host "✅ $stepName ($msg)" -ForegroundColor Green
    } catch {
        Add-Result -Step $stepName -Status 'FAILED' -Message $_.Exception.Message
        Write-Host "❌ $($stepName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Invoke-CompleteE2EStep {
    $stepName = 'Demo complète E2E'
    Write-Section $stepName
    $token = Ensure-DemoToken
    if ([string]::IsNullOrWhiteSpace($token)) { Add-Result -Step $stepName -Status 'FAILED' -Message 'Token démo indisponible'; return }

    try {
        $clientEmail = "series.client.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@memolib.local"
        $null = Invoke-ApiStepCall -Method 'POST' -Endpoint '/api/client' -Token $token -Body @{ name='Client Serie Demo'; email=$clientEmail; phoneNumber='+33603983709'; address='10 rue Demo, Paris' }
        $null = Invoke-ApiStepCall -Method 'POST' -Endpoint '/api/ingest/email' -Token $token -Body @{ from=$clientEmail; subject='Demande de consultation E2E'; body='Contenu de démonstration E2E'; externalId="SERIES-E2E-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"; occurredAt=(Get-Date).ToUniversalTime().ToString('o') }
        $stats = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/stats/events-per-day' -Token $token -Body $null
        $audit = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/audit/user-actions?limit=20' -Token $token -Body $null
        $statsCount = if ($stats -is [array]) { $stats.Count } elseif ($null -eq $stats) { 0 } else { 1 }
        $auditCount = if ($audit -is [array]) { $audit.Count } elseif ($null -eq $audit) { 0 } else { 1 }
        $msg = "client=OK, ingest=OK, stats=$statsCount, audit=$auditCount"
        Add-Result -Step $stepName -Status 'OK' -Message $msg
        Write-Host "✅ $stepName ($msg)" -ForegroundColor Green
    } catch {
        Add-Result -Step $stepName -Status 'FAILED' -Message $_.Exception.Message
        Write-Host "❌ $($stepName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Invoke-ClientAuditStep {
    $stepName = 'Scénario client-mail + audit'
    Write-Section $stepName
    $token = Ensure-DemoToken
    if ([string]::IsNullOrWhiteSpace($token)) { Add-Result -Step $stepName -Status 'FAILED' -Message 'Token démo indisponible'; return }

    try {
        try {
            $cases = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/cases' -Token $token -Body $null
        } catch {
            $cases = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/cases/filter' -Token $token -Body $null
        }
        $caseCount = if ($cases -is [array]) { $cases.Count } elseif ($null -eq $cases) { 0 } else { 1 }
        $timelineCount = 0
        if ($caseCount -gt 0) {
            $firstCase = if ($cases -is [array]) { $cases[0] } else { $cases }
            if ($firstCase.id) {
                $timeline = Invoke-ApiStepCall -Method 'GET' -Endpoint "/api/cases/$($firstCase.id)/timeline" -Token $token -Body $null
                $timelineCount = if ($timeline -is [array]) { $timeline.Count } elseif ($null -eq $timeline) { 0 } else { 1 }
            }
        }
        $audit = Invoke-ApiStepCall -Method 'GET' -Endpoint '/api/audit/user-actions?limit=20' -Token $token -Body $null
        $auditCount = if ($audit -is [array]) { $audit.Count } elseif ($null -eq $audit) { 0 } else { 1 }
        $msg = "cases=$caseCount, timeline=$timelineCount, audit=$auditCount"
        Add-Result -Step $stepName -Status 'OK' -Message $msg
        Write-Host "✅ $stepName ($msg)" -ForegroundColor Green
    } catch {
        Add-Result -Step $stepName -Status 'FAILED' -Message $_.Exception.Message
        Write-Host "❌ $($stepName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Invoke-SmsForwardedStep {
    $stepName = 'SMS forwarded (passerelle 06)'
    Write-Section $stepName
    $scriptPath = Get-StepPath 'test-forwarded-sms.ps1'
    if (-not (Test-Path $scriptPath)) {
        Add-Result -Step $stepName -Status 'SKIPPED' -Message 'Script test-forwarded-sms.ps1 introuvable'
        return
    }

    & powershell -ExecutionPolicy Bypass -File $scriptPath -BaseUrl $BaseUrl
    $code = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
    if ($code -eq 0) { Add-Result -Step $stepName -Status 'OK' -Message 'Exécution réussie'; Write-Host "✅ $stepName" -ForegroundColor Green }
    else { Add-Result -Step $stepName -Status 'FAILED' -Message "Code sortie=$code"; Write-Host "❌ $stepName (code=$code)" -ForegroundColor Red }
}

function Invoke-VonageSimulatedStep {
    $stepName = 'Simulation webhook Vonage'
    Write-Section $stepName

    try {
        $keyLine = dotnet user-secrets list 2>$null | Select-String '^Vonage:InboundWebhookKey\s*=' | Select-Object -First 1
        if (-not $keyLine) {
            Add-Result -Step $stepName -Status 'SKIPPED' -Message 'Secret Vonage:InboundWebhookKey absent'
            Write-Host "⚠️ Secret Vonage:InboundWebhookKey absent" -ForegroundColor Yellow
            return
        }

        $key = ($keyLine.ToString().Split('=',2)[1]).Trim()
        $msgId = 'SERIES-VONAGE-' + [guid]::NewGuid().ToString('N')
        $url = "$BaseUrl/api/messaging/sms/vonage/webhook?key=$([uri]::EscapeDataString($key))&msisdn=%2B33603983709&to=%2B19564490871&text=Demo+Series&messageId=$msgId"
        $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 10

        if ($response.StatusCode -eq 200) {
            Add-Result -Step $stepName -Status 'OK' -Message 'Webhook simulé accepté'
            Write-Host "✅ $stepName" -ForegroundColor Green
        } else {
            Add-Result -Step $stepName -Status 'FAILED' -Message "Status=$($response.StatusCode)"
            Write-Host "❌ $stepName status=$($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Add-Result -Step $stepName -Status 'FAILED' -Message $_.Exception.Message
        Write-Host "❌ $($stepName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Invoke-InboxCheckStep {
    $stepName = 'Vérification inbox authentifiée'
    Write-Section $stepName

    $token = Ensure-DemoToken
    if ([string]::IsNullOrWhiteSpace($token)) {
        Add-Result -Step $stepName -Status 'FAILED' -Message 'Token démo indisponible'
        Write-Host "❌ Token démo indisponible" -ForegroundColor Red
        return
    }

    try {
        $headers = @{ Authorization = "Bearer $token" }
        $latest = Invoke-WebRequest -Uri "$BaseUrl/api/messaging/sms/inbox/latest" -Headers $headers -UseBasicParsing -TimeoutSec 10
        $inbox = Invoke-WebRequest -Uri "$BaseUrl/api/messaging/sms/inbox?limit=3" -Headers $headers -UseBasicParsing -TimeoutSec 10
        $msg = "latest=$($latest.StatusCode), inbox=$($inbox.StatusCode)"
        Add-Result -Step $stepName -Status 'OK' -Message $msg
        Write-Host "✅ $stepName ($msg)" -ForegroundColor Green
    } catch {
        Add-Result -Step $stepName -Status 'FAILED' -Message $_.Exception.Message
        Write-Host "❌ $($stepName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-Summary {
    Write-Section 'Résumé de la série'
    if ($global:SeriesResults.Count -eq 0) {
        Write-Host 'Aucune étape exécutée.' -ForegroundColor Yellow
        return
    }

    $global:SeriesResults | Format-Table Step, Status, Message -AutoSize
    $ok = ($global:SeriesResults | Where-Object { $_.Status -eq 'OK' }).Count
    $failed = ($global:SeriesResults | Where-Object { $_.Status -eq 'FAILED' }).Count
    $skipped = ($global:SeriesResults | Where-Object { $_.Status -eq 'SKIPPED' }).Count
    Write-Host "OK=$ok | FAILED=$failed | SKIPPED=$skipped" -ForegroundColor Cyan
}

$steps = @(
    [pscustomobject]@{ Key = '1'; Label = 'Demo rapide API'; FunctionName = 'Invoke-QuickApiStep' },
    [pscustomobject]@{ Key = '2'; Label = 'Demo complète E2E'; FunctionName = 'Invoke-CompleteE2EStep' },
    [pscustomobject]@{ Key = '3'; Label = 'Scénario client-mail + audit'; FunctionName = 'Invoke-ClientAuditStep' },
    [pscustomobject]@{ Key = '4'; Label = 'SMS forwarded (passerelle)'; FunctionName = 'Invoke-SmsForwardedStep' },
    [pscustomobject]@{ Key = '5'; Label = 'Webhook Vonage simulé'; FunctionName = 'Invoke-VonageSimulatedStep' },
    [pscustomobject]@{ Key = '6'; Label = 'Inbox SMS authentifiée'; FunctionName = 'Invoke-InboxCheckStep' }
)

$executionSteps = if ($Profile -eq 'Client') {
    @('1','2','3','6','4','5') | ForEach-Object {
        $stepKey = $_
        $steps | Where-Object { $_.Key -eq $stepKey } | Select-Object -First 1
    }
} else {
    $steps
}
$executionSteps = @($executionSteps | Where-Object { $null -ne $_ })

function Show-ProfileIntro {
    if ($Profile -ne 'Client') { return }
    Write-Host "`n🎯 Mode Client activé" -ForegroundColor Yellow
    Write-Host "- Parcours orienté valeur métier" -ForegroundColor White
    Write-Host "- Démonstration guidée des fonctions clés" -ForegroundColor White
    Write-Host "- Compte démo: $DemoEmail" -ForegroundColor White
}

function Show-Menu {
    Write-Host "`n=====================================================" -ForegroundColor Cyan
    Write-Host " MemoLib - Série de démo interactive" -ForegroundColor Cyan
    Write-Host " BaseUrl: $BaseUrl" -ForegroundColor Gray
    Write-Host " Profil: $Profile" -ForegroundColor Gray
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "A) Exécuter toute la série" -ForegroundColor Yellow
    foreach ($step in $steps) {
        Write-Host ("{0}) {1}" -f $step.Key, $step.Label) -ForegroundColor White
    }
    Write-Host "O) Ouvrir interface web" -ForegroundColor White
    Write-Host "R) Afficher le résumé" -ForegroundColor White
    Write-Host "Q) Quitter" -ForegroundColor White
}

function Invoke-OneStep {
    param([object]$Step)

    if (-not (Test-ApiHealth)) {
        Write-Host "⚠️ API indisponible avant l'étape '$($Step.Label)', tentative de redémarrage..." -ForegroundColor Yellow
        if (-not (Ensure-ApiReady)) {
            Add-Result -Step $Step.Label -Status 'FAILED' -Message "API indisponible"
            Write-Host "❌ Impossible de redémarrer l'API pour l'étape '$($Step.Label)'" -ForegroundColor Red
            return
        }
    }

    & $Step.FunctionName
}

if ($ListOnly) {
    Show-ProfileIntro
    Show-Menu
    exit 0
}

if (-not (Ensure-ApiReady)) {
    exit 1
}

Show-ProfileIntro
if ($OpenUi -or $Profile -eq 'Client') {
    Start-Process "$($BaseUrl.TrimEnd('/'))/demo.html" | Out-Null
}

if ($RunAll) {
    foreach ($step in $executionSteps) {
        Invoke-OneStep -Step $step
    }
    Show-Summary
    exit 0
}

while ($true) {
    Show-Menu
    $choice = (Read-Host 'Choix').Trim().ToUpperInvariant()

    if ($choice -eq 'Q') { break }

    if ($choice -eq 'A') {
        foreach ($step in $executionSteps) {
            $confirm = Read-Host "Exécuter: $($step.Label) ? (Y/N)"
            if ($confirm -match '^[Yy]') {
                Invoke-OneStep -Step $step
            } else {
                Add-Result -Step $step.Label -Status 'SKIPPED' -Message 'Ignoré par utilisateur'
            }
        }
        continue
    }

    if ($choice -eq 'O') {
        Start-Process "$($BaseUrl.TrimEnd('/'))/demo.html" | Out-Null
        continue
    }

    if ($choice -eq 'R') {
        Show-Summary
        continue
    }

    $target = $steps | Where-Object { $_.Key -eq $choice } | Select-Object -First 1
    if ($null -eq $target) {
        Write-Host 'Choix invalide.' -ForegroundColor Yellow
        continue
    }

    Invoke-OneStep -Step $target
}

Show-Summary
exit 0
