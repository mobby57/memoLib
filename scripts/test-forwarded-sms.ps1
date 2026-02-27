param(
    [string]$BaseUrl = "http://localhost:5078",
    [string]$From = "+33603983709",
    [string]$To = "+33603983706",
    [string]$Body = "Test passerelle SMS 06 -> MemoLib",
    [string]$UserId = "00000000-0000-0000-0000-000000000001"
)

$ErrorActionPreference = "Stop"

$keyLine = dotnet user-secrets list 2>$null | Select-String "^Messaging:ForwardingApiKey\s*=" | Select-Object -First 1
if ($null -eq $keyLine) {
    Write-Error "Secret manquant: Messaging:ForwardingApiKey"
}

$forwardKey = ($keyLine.ToString().Split('=', 2)[1]).Trim()
$uri = "$BaseUrl/api/messaging/sms/forwarded"

$payload = @{
    from = $From
    to = $To
    body = $Body
    messageSid = "MANUAL-" + [Guid]::NewGuid().ToString("N")
    userId = $UserId
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri $uri -Method Post -UseBasicParsing -Headers @{ "X-MemoLib-Forward-Key" = $forwardKey } -ContentType "application/json" -Body $payload

Write-Host "STATUS=$($response.StatusCode)"
Write-Host $response.Content
