# Déploiement MemoLib sur Fly.io
Write-Host "🚀 Déploiement MemoLib sur Fly.io" -ForegroundColor Green

# Vérifier flyctl
if (!(Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ flyctl non installé. Téléchargez depuis https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Red
    exit 1
}

# Login
Write-Host "🔐 Authentification..." -ForegroundColor Yellow
flyctl auth whoami
if ($LASTEXITCODE -ne 0) { flyctl auth login }

# Créer l'app
Write-Host "📦 Configuration..." -ForegroundColor Yellow
flyctl apps create memolib 2>$null

# Base de données
Write-Host "🗄️ Base de données..." -ForegroundColor Yellow
flyctl postgres create --name memolib-db --region cdg --vm-size shared-cpu-1x --volume-size 3
flyctl postgres attach memolib-db --app memolib

# Secrets
Write-Host "🔑 Variables..." -ForegroundColor Yellow
$secret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
flyctl secrets set NEXTAUTH_SECRET=$secret NEXTAUTH_URL="https://memolib.fly.dev"

# Déployer
Write-Host "🚢 Déploiement..." -ForegroundColor Yellow
flyctl deploy

Write-Host "✅ Terminé! 🌐 https://memolib.fly.dev" -ForegroundColor Green