param(
    [string]$HistoryJsonlPath = '',
    [int]$WindowMinutes = 60,
    [int]$RefreshSeconds = 5,
    [int]$TopSenders = 5,
    [switch]$Once
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($HistoryJsonlPath)) {
    $HistoryJsonlPath = Join-Path $PSScriptRoot 'reports\scan-history.jsonl'
}

function Get-HistoryRows {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return @()
    }

    $lines = Get-Content -Path $Path -ErrorAction SilentlyContinue
    $rows = @()

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try {
            $rows += ($line | ConvertFrom-Json)
        }
        catch {
        }
    }

    return $rows
}

function Render-Dashboard {
    param(
        [object[]]$Rows,
        [int]$Window,
        [int]$Top
    )

    $now = Get-Date
    $windowStart = $now.AddMinutes(-1 * $Window)

    $recent = @($Rows | Where-Object {
        try {
            (Get-Date $_.scannedAt) -ge $windowStart
        }
        catch {
            $false
        }
    })

    $total = $recent.Count
    $ingested = @($recent | Where-Object { $_.status -eq 'ingested' }).Count
    $duplicate = @($recent | Where-Object { $_.status -eq 'duplicate' }).Count
    $withAttachments = @($recent | Where-Object { $_.hasAttachments -eq $true }).Count
    $attention = @($recent | Where-Object { $_.requiresAttention -eq $true }).Count

    $byMinute = @(
        $recent |
            ForEach-Object {
                $parsed = Get-Date $_.scannedAt
                [pscustomobject]@{
                    minute = $parsed.ToString('yyyy-MM-dd HH:mm')
                    status = [string]$_.status
                }
            } |
            Group-Object minute, status |
            ForEach-Object {
                [pscustomobject]@{
                    minute = ($_.Group | Select-Object -First 1).minute
                    status = ($_.Group | Select-Object -First 1).status
                    count = $_.Count
                }
            } |
            Sort-Object minute, status
    )

    $topSenders = @(
        $recent |
            Group-Object from |
            Sort-Object Count -Descending |
            Select-Object -First $Top |
            ForEach-Object {
                [pscustomobject]@{
                    from = $_.Name
                    count = $_.Count
                }
            }
    )

    if (-not $Once) {
        Clear-Host
    }
    Write-Host '=== MemoLib Scan Live Dashboard ===' -ForegroundColor Cyan
    Write-Host ("Now: {0}" -f $now.ToString('yyyy-MM-dd HH:mm:ss')) -ForegroundColor DarkCyan
    Write-Host ("File: {0}" -f $HistoryJsonlPath) -ForegroundColor DarkCyan
    Write-Host ("Window: last {0} minutes" -f $Window) -ForegroundColor DarkCyan
    Write-Host ''

    Write-Host ("Total rows: {0} | Ingested: {1} | Duplicates: {2} | Attachments: {3} | RequiresAttention: {4}" -f 
        $total, $ingested, $duplicate, $withAttachments, $attention) -ForegroundColor Green

    Write-Host ''
    Write-Host 'Top senders:' -ForegroundColor Yellow
    if ($topSenders.Count -eq 0) {
        Write-Host '  (no data)'
    }
    else {
        $topSenders | Format-Table -AutoSize | Out-String -Width 240 | Write-Output
    }

    Write-Host 'Per-minute status:' -ForegroundColor Yellow
    if ($byMinute.Count -eq 0) {
        Write-Host '  (no data in selected window)'
    }
    else {
        $byMinute | Format-Table -AutoSize | Out-String -Width 240 | Write-Output
    }
}

if (-not (Test-Path $HistoryJsonlPath)) {
    Write-Host ("History file not found: {0}" -f $HistoryJsonlPath) -ForegroundColor Red
    exit 1
}

if ($Once) {
    $rows = Get-HistoryRows -Path $HistoryJsonlPath
    Render-Dashboard -Rows $rows -Window $WindowMinutes -Top $TopSenders
    exit 0
}

while ($true) {
    $rows = Get-HistoryRows -Path $HistoryJsonlPath
    Render-Dashboard -Rows $rows -Window $WindowMinutes -Top $TopSenders
    Start-Sleep -Seconds $RefreshSeconds
}
