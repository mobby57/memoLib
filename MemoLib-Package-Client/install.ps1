Write-Host "Installation MemoLib..." -ForegroundColor Green
try {
    dotnet --version | Out-Null
    Write-Host "OK .NET installe" -ForegroundColor Green
} catch {
    Write-Host "ERREUR .NET 9.0 requis" -ForegroundColor Red
    Write-Host "Telecharger: https://dotnet.microsoft.com/download/dotnet/9.0"
    exit 1
}
cd app
$email = Read-Host "Email Gmail"
$password = Read-Host "Mot de passe application" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
dotnet user-secrets set "EmailMonitor:Username" "$email"
dotnet user-secrets set "EmailMonitor:Password" "$passwordPlain"
Write-Host "Installation terminee!" -ForegroundColor Green
Write-Host "Lancer: ..\demarrer.ps1" -ForegroundColor Cyan