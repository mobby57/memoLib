param(
    [int]$TimeoutSec = 120,
    [int]$PollIntervalSec = 3,
    [string]$NgrokInspectorUrl = "http://127.0.0.1:4040/api/requests/http",
    [switch]$FailOnTimeout
)

$ErrorActionPreference = "Stop"

function Get-Requests {
    param([string]$InspectorUrl)

    $response = Invoke-RestMethod -Uri $InspectorUrl -TimeoutSec 10
    if ($null -eq $response -or $null -eq $response.requests) {
        return @()
    }

    return @($response.requests)
}

function Get-RequestDetail {
    param(
        [string]$InspectorUrl,
        [string]$RequestId
    )

    if ([string]::IsNullOrWhiteSpace($RequestId)) {
        return $null
    }

    $detailUrl = "$InspectorUrl/$RequestId"
    try {
        return Invoke-RestMethod -Uri $detailUrl -TimeoutSec 10
    } catch {
        return $null
    }
}

function Get-RequestId {
    param([object]$Request)

    if ($null -eq $Request) {
        return $null
    }

    if ($Request.PSObject.Properties.Name -contains "id") {
        return [string]$Request.id
    }

    if ($Request.PSObject.Properties.Name -contains "ID") {
        return [string]$Request.ID
    }

    return $null
}

function Is-SmsWebhook {
    param([object]$Request)

    if ($null -eq $Request) {
        return $false
    }

    $uri = ""
    if ($Request.PSObject.Properties.Name -contains "uri") {
        $uri = [string]$Request.uri
    }

    return $uri -like "*/api/messaging/sms/webhook*"
}

Write-Host "[watch-twilio-sms] Vérification de l'inspecteur ngrok..."
$baselineRequests = @()
try {
    $baselineRequests = Get-Requests -InspectorUrl $NgrokInspectorUrl
} catch {
    Write-Host "[watch-twilio-sms] ❌ Impossible d'atteindre l'inspecteur ngrok ($NgrokInspectorUrl): $($_.Exception.Message)"
    exit 2
}
$knownIds = New-Object System.Collections.Generic.HashSet[string]

foreach ($request in $baselineRequests) {
    $requestId = Get-RequestId -Request $request
    if (-not [string]::IsNullOrWhiteSpace($requestId)) {
        [void]$knownIds.Add($requestId)
    }
}

Write-Host "[watch-twilio-sms] En attente d'un nouveau webhook SMS (timeout ${TimeoutSec}s)..."
$deadline = (Get-Date).AddSeconds($TimeoutSec)

while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $PollIntervalSec

    try {
        $requests = Get-Requests -InspectorUrl $NgrokInspectorUrl
    } catch {
        Write-Host "[watch-twilio-sms] ⚠️ Erreur lecture inspecteur ngrok, nouvelle tentative..."
        continue
    }
    $newSmsRequest = $null
    $newSmsRequestId = $null

    foreach ($request in $requests) {
        $requestId = Get-RequestId -Request $request
        if (-not [string]::IsNullOrWhiteSpace($requestId) -and $knownIds.Contains($requestId)) {
            continue
        }

        if (-not [string]::IsNullOrWhiteSpace($requestId)) {
            [void]$knownIds.Add($requestId)
        }

        if (Is-SmsWebhook -Request $request) {
            $newSmsRequest = $request
            $newSmsRequestId = $requestId
            break
        }
    }

    if ($null -ne $newSmsRequest) {
        $detail = Get-RequestDetail -InspectorUrl $NgrokInspectorUrl -RequestId $newSmsRequestId

        $status = "NA"
        if ($null -ne $detail -and $detail.PSObject.Properties.Name -contains "response" -and $null -ne $detail.response) {
            if ($detail.response.PSObject.Properties.Name -contains "status_code") {
                $status = [string]$detail.response.status_code
            }
        } elseif ($newSmsRequest.PSObject.Properties.Name -contains "status") {
            $status = [string]$newSmsRequest.status
        }

        $method = if ($newSmsRequest.PSObject.Properties.Name -contains "method") { [string]$newSmsRequest.method } else { "NA" }
        $uri = if ($newSmsRequest.PSObject.Properties.Name -contains "uri") { [string]$newSmsRequest.uri } else { "NA" }
        $time = if ($newSmsRequest.PSObject.Properties.Name -contains "start") { [string]$newSmsRequest.start } else { (Get-Date).ToString("o") }

        $from = ""
        $to = ""
        if ($null -ne $detail -and $detail.PSObject.Properties.Name -contains "request" -and $null -ne $detail.request) {
            $raw = ""
            if ($detail.request.PSObject.Properties.Name -contains "raw") {
                $raw = [string]$detail.request.raw
            }

            if (-not [string]::IsNullOrWhiteSpace($raw)) {
                $decoded = ""
                try {
                    $decoded = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($raw))
                } catch {
                    $decoded = $raw
                }

                if ($decoded -match 'From=([^&\r\n]+)') {
                    $from = [Uri]::UnescapeDataString($matches[1])
                }
                if ($decoded -match 'To=([^&\r\n]+)') {
                    $to = [Uri]::UnescapeDataString($matches[1])
                }
            }
        }

        Write-Host "[watch-twilio-sms] Requête détectée: $time | $method | $status | $uri | From=$from | To=$to"

        switch ($status) {
            "200" { Write-Host "[watch-twilio-sms] ✅ Webhook SMS accepté (ingestion probable OK)." }
            "201" { Write-Host "[watch-twilio-sms] ✅ Webhook SMS accepté (ingestion probable OK)." }
            "401" { Write-Host "[watch-twilio-sms] ❌ Signature Twilio invalide (vérifier Twilio:AuthToken / URL webhook)." }
            "400" { Write-Host "[watch-twilio-sms] ❌ Requête invalide côté API (payload/host/config)." }
            default { Write-Host "[watch-twilio-sms] ⚠️ Statut webhook: $status" }
        }

        exit 0
    }
}

Write-Host "[watch-twilio-sms] ⏰ Aucun nouveau webhook SMS détecté dans la fenêtre de ${TimeoutSec}s."
if ($FailOnTimeout) {
    exit 1
}

exit 0
