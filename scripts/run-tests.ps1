Write-Host "Waiting for server to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "Testing server connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 10
    Write-Host "Server is ready (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host ""
    
    # Run the automated tests
    & "$PSScriptRoot\test-auto.ps1"
}
catch {
    Write-Host "Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please ensure npm run dev is running in another terminal" -ForegroundColor Yellow
    exit 1
}
