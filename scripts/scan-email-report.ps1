param(
    [string]$BaseUrl = 'http://localhost:5078',
    [string]$ApiEmail = 'admin@memolib.local',
    [string]$ApiPassword = 'AdminPass123!',
    [switch]$UnreadOnly,
    [int]$DaysBack = 7,
    [int]$PreviewLines = 50,
    [string]$CsvPath = '',
    [string]$JsonPath = '',
    [switch]$AppendHistory,
    [string]$HistoryCsvPath = '',
    [string]$HistoryJsonlPath = ''
)

$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

Write-Host '== MemoLib Scan Report ==' -ForegroundColor Cyan
Write-Host ("BaseUrl: {0}" -f $BaseUrl) -ForegroundColor DarkCyan
Write-Host ("Login: {0}" -f $ApiEmail) -ForegroundColor DarkCyan
Write-Host ("UnreadOnly: {0} | DaysBack: {1}" -f $UnreadOnly.IsPresent, $DaysBack) -ForegroundColor DarkCyan

$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -TimeoutSec 10
if ($health.status -ne 'healthy') {
    throw 'API non healthy.'
}

$loginBody = @{ email = $ApiEmail; password = $ApiPassword } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -TimeoutSec 20
$token = $login.token
if ([string]::IsNullOrWhiteSpace($token)) {
    throw 'Token absent après login.'
}

$headers = @{ Authorization = "Bearer $token" }
$uri = "$BaseUrl/api/email-scan/manual?unreadOnly=$($UnreadOnly.IsPresent)&daysBack=$DaysBack"
$scan = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -TimeoutSec 240

Write-Host ''
Write-Host '== Résumé Scan ==' -ForegroundColor Green
Write-Host ("message: {0}" -f $scan.message)
Write-Host ("totalEmails: {0} | ingested: {1} | duplicates: {2}" -f $scan.totalEmails, $scan.ingested, $scan.duplicates)
Write-Host ("withPhone: {0} | withAddress: {1} | withAttachments: {2} | clientsCreated: {3} | requiresAttention: {4}" -f `
    $scan.exploitation.withPhone,
    $scan.exploitation.withAddress,
    $scan.exploitation.withAttachments,
    $scan.exploitation.clientsCreated,
    $scan.exploitation.requiresAttention)

Write-Host ''
Write-Host '== Champs capturés ==' -ForegroundColor Yellow
$scan.fieldsCaptured | ForEach-Object { Write-Host ("- {0}" -f $_) }

Write-Host ''
Write-Host '== Aperçu ligne par ligne ==' -ForegroundColor Magenta
$rows = @($scan.linesPreview | Select-Object -First $PreviewLines)
if ($rows.Count -eq 0) {
    Write-Host 'Aucune ligne dans le preview.' -ForegroundColor DarkYellow
}
else {
    $rows |
        Select-Object status, occurredAt, from, to, subject, messageId, hasAttachments, bodyLength, extractedPhone, extractedAddress, clientCreated, requiresAttention, eventId |
        Format-Table -AutoSize |
        Out-String -Width 320 |
        Write-Output
}

$reportDir = Join-Path $PSScriptRoot 'reports'
if (-not (Test-Path $reportDir)) {
    New-Item -Path $reportDir -ItemType Directory -Force | Out-Null
}

if ([string]::IsNullOrWhiteSpace($JsonPath)) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $JsonPath = Join-Path $reportDir ("scan-report-{0}.json" -f $stamp)
}

$scan | ConvertTo-Json -Depth 15 | Out-File -FilePath $JsonPath -Encoding utf8
Write-Host ''
Write-Host ('JSON exporté: {0}' -f $JsonPath) -ForegroundColor Cyan

$csvRows = @($scan.linesPreview)
if ($csvRows.Count -gt 0) {
    if ([string]::IsNullOrWhiteSpace($CsvPath)) {
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $CsvPath = Join-Path $reportDir ("scan-report-{0}.csv" -f $stamp)
    }

    $csvExport = $csvRows | ForEach-Object {
        [pscustomobject]@{
            status = $_.status
            occurredAt = $_.occurredAt
            from = $_.from
            to = $_.to
            cc = $_.cc
            bcc = $_.bcc
            replyTo = $_.replyTo
            subject = $_.subject
            messageId = $_.messageId
            checksum = $_.checksum
            hasAttachments = $_.hasAttachments
            attachmentNames = (@($_.attachmentNames) -join '; ')
            bodyLength = $_.bodyLength
            extractedPhone = $_.extractedPhone
            extractedAddress = $_.extractedAddress
            normalizedSenderName = $_.normalizedSenderName
            clientCreated = $_.clientCreated
            requiresAttention = $_.requiresAttention
            eventId = $_.eventId
        }
    }

    $csvExport | Export-Csv -Path $CsvPath -NoTypeInformation -Encoding UTF8
    Write-Host ''
    Write-Host ('CSV exporté: {0}' -f $CsvPath) -ForegroundColor Cyan

    if ($AppendHistory) {
        if ([string]::IsNullOrWhiteSpace($HistoryCsvPath)) {
            $HistoryCsvPath = Join-Path $reportDir 'scan-history.csv'
        }

        if (Test-Path $HistoryCsvPath) {
            $csvExport | Export-Csv -Path $HistoryCsvPath -NoTypeInformation -Encoding UTF8 -Append
        }
        else {
            $csvExport | Export-Csv -Path $HistoryCsvPath -NoTypeInformation -Encoding UTF8
        }

        if ([string]::IsNullOrWhiteSpace($HistoryJsonlPath)) {
            $HistoryJsonlPath = Join-Path $reportDir 'scan-history.jsonl'
        }

        foreach ($row in $csvRows) {
            $line = [pscustomobject]@{
                scannedAt = (Get-Date).ToString('o')
                unreadOnly = $UnreadOnly.IsPresent
                daysBack = $DaysBack
                status = $row.status
                occurredAt = $row.occurredAt
                from = $row.from
                to = $row.to
                cc = $row.cc
                bcc = $row.bcc
                replyTo = $row.replyTo
                subject = $row.subject
                messageId = $row.messageId
                checksum = $row.checksum
                hasAttachments = $row.hasAttachments
                attachmentNames = @($row.attachmentNames)
                bodyLength = $row.bodyLength
                extractedPhone = $row.extractedPhone
                extractedAddress = $row.extractedAddress
                normalizedSenderName = $row.normalizedSenderName
                clientCreated = $row.clientCreated
                requiresAttention = $row.requiresAttention
                eventId = $row.eventId
            } | ConvertTo-Json -Depth 10 -Compress

            Add-Content -Path $HistoryJsonlPath -Value $line -Encoding UTF8
        }

        Write-Host ('History CSV append: {0}' -f $HistoryCsvPath) -ForegroundColor Green
        Write-Host ('History JSONL append: {0}' -f $HistoryJsonlPath) -ForegroundColor Green
    }
}
else {
    Write-Host ''
    Write-Host 'CSV non généré (aucune ligne dans linesPreview).' -ForegroundColor DarkYellow
}

Write-Host '== Fini ==' -ForegroundColor Green
