$body = @{
    channel = "EMAIL"
    from = "test@demo.com"
    subject = "Test Pattern Adapter"
    body = "Message de demonstration"
    messageId = "test-001"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/test-multichannel" -Method POST -ContentType "application/json" -Body $body
    Write-Host "SUCCESS:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status: $statusCode" -ForegroundColor Yellow
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Response:" -ForegroundColor Cyan
            $errorBody
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Gray
        }
    }
}
