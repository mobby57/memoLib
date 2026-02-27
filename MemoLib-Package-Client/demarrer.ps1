Write-Host "Demarrage MemoLib..." -ForegroundColor Green
cd app
Start-Process "http://localhost:5078/demo.html"
dotnet MemoLib.Api.dll