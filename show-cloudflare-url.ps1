# Afficher l'URL du tunnel Cloudflare
# Ce script cherche l'URL dans les logs

Write-Host ""
Write-Host "RECHERCHE DE L'URL CLOUDFLARE TUNNEL" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Le tunnel Cloudflare devrait etre actif dans une fenetre separee." -ForegroundColor Yellow
Write-Host ""
Write-Host "L'URL publique ressemble a:" -ForegroundColor White
Write-Host "  https://xxx-yyy-zzz.trycloudflare.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour la trouver:" -ForegroundColor Yellow
Write-Host "  1. Cherchez la fenetre PowerShell avec 'CLOUDFLARE TUNNEL'" -ForegroundColor White
Write-Host "  2. L'URL s'affiche apres 'Your quick Tunnel has been created!'" -ForegroundColor White
Write-Host "  3. Format: https://xxxxx.trycloudflare.com" -ForegroundColor White
Write-Host ""

Write-Host "SERVICES LOCAUX:" -ForegroundColor Green
Write-Host "  Dashboard:  http://localhost:3000/lawyer" -ForegroundColor White
Write-Host "  Monitoring: http://localhost:3000/lawyer/monitoring" -ForegroundColor White
Write-Host "  Emails:     http://localhost:3000/lawyer/emails" -ForegroundColor White
Write-Host ""

Write-Host "ACCES PUBLIC:" -ForegroundColor Green
Write-Host "  URL: Verifiez la fenetre Cloudflare Tunnel" -ForegroundColor Yellow
Write-Host "  Format: https://xxxxx.trycloudflare.com/lawyer/monitoring" -ForegroundColor Cyan
Write-Host ""

Write-Host "Note: Le tunnel reste actif tant que la fenetre est ouverte" -ForegroundColor Yellow
Write-Host ""
