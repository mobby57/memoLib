Write-Host "Starting API and running tests..." -ForegroundColor Cyan

# Start API in background
$apiJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\moros\Desktop\memolib\MemoLib.Api"
    dotnet run
}

Write-Host "Waiting for API to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run tests
Write-Host ""
& "c:\Users\moros\Desktop\memolib\MemoLib.Api\test-gateway-simple.ps1"

# Cleanup
Write-Host ""
Write-Host "Stopping API..." -ForegroundColor Yellow
Stop-Job -Job $apiJob
Remove-Job -Job $apiJob
