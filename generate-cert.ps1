# Génération certificat HTTPS pour dev distant

Write-Host "🔐 Génération certificat HTTPS..." -ForegroundColor Cyan

# Générer certificat auto-signé
$cert = New-SelfSignedCertificate `
    -DnsName "localhost", "*.yourdomain.com" `
    -CertStoreLocation "cert:\LocalMachine\My" `
    -NotAfter (Get-Date).AddYears(2) `
    -KeyAlgorithm RSA `
    -KeyLength 2048

# Exporter en PFX
$password = ConvertTo-SecureString -String "DevCert2024!" -Force -AsPlainText
Export-PfxCertificate `
    -Cert $cert `
    -FilePath "cert.pfx" `
    -Password $password

Write-Host "✅ Certificat généré: cert.pfx" -ForegroundColor Green
Write-Host "🔑 Mot de passe: DevCert2024!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Configuration:" -ForegroundColor Cyan
Write-Host "  1. Ajouter dans appsettings.Remote.json:" -ForegroundColor White
Write-Host '     "Certificate": { "Path": "cert.pfx", "Password": "DevCert2024!" }' -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Lancer avec:" -ForegroundColor White
Write-Host "     dotnet run --environment Remote" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Accéder via:" -ForegroundColor White
Write-Host "     https://localhost:5079" -ForegroundColor Gray
