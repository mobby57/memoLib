# Test du webhook multi-canal
Write-Host "Test Pattern Adapter Multi-Canal" -ForegroundColor Cyan

$uri = "http://localhost:3001/api/webhooks/test-multichannel"

# Test 1: Email
Write-Host ""
Write-Host "Test 1: Canal EMAIL" -ForegroundColor Yellow
$body1 = @{
    channel = "EMAIL"
    from = "avocat@example.com"
    subject = "Consultation urgente"
    body = "Besoin aide pour dossier client"
    messageId = "msg-demo-001"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body1
    Write-Host "Reponse OK:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Détails: $responseBody" -ForegroundColor Yellow
    }
}

# Test 2: SMS
Write-Host ""
Write-Host "Test 2: Canal SMS" -ForegroundColor Yellow
$body2 = @{
    channel = "SMS"
    MessageSid = "SM123456789"
    From = "+33612345678"
    Body = "Message urgent"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $uri -Method POST -ContentType "application/json" -Body $body2
    Write-Host "Reponse OK:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Détails: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Tests terminés" -ForegroundColor Cyan
