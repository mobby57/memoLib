Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 PUSH VERS GITHUB - iaPosteManager" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Git est installé
try {
    git --version | Out-Null
    Write-Host "✅ Git détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé!" -ForegroundColor Red
    Write-Host "Téléchargez-le sur: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour continuer"
    exit 1
}

# Créer .gitignore
Write-Host "📝 Création du .gitignore..." -ForegroundColor Yellow

$gitignore = @"
# Python
__pycache__/
*.py[cod]
*.so
.Python
venv/
ENV/
*.egg-info/

# Node
node_modules/

# Environment
.env
.env.*
email-provisioning.env
config/email-config.env

# Database
*.db
*.sqlite
data/

# Logs
logs/
*.log

# Backups
backups/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Tests
playwright-report/
test-results/

# Secrets
*.pem
*.key
id_rsa*
"@

$gitignore | Out-File -FilePath ".gitignore" -Encoding UTF8

# Initialiser Git si nécessaire
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initialisation du repository Git..." -ForegroundColor Yellow
    git init
    git config user.name "mooby865"
    $email = Read-Host "Entrez votre email GitHub"
    git config user.email $email
} else {
    Write-Host "✅ Repository Git déjà initialisé" -ForegroundColor Green
}

# Ajouter les fichiers
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m "Initial commit: iaPosteManager v3.6 - Production Ready with AI Email Generation"

# Vérifier si le remote existe
try {
    git remote get-url origin | Out-Null
    Write-Host "✅ Remote GitHub déjà configuré" -ForegroundColor Green
} catch {
    Write-Host "🔗 Ajout du remote GitHub..." -ForegroundColor Yellow
    git remote add origin https://github.com/mooby865/iapostemanager.git
}

# Renommer la branche en main
git branch -M main

# Push vers GitHub
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Si demandé, utilisez votre Personal Access Token comme mot de passe" -ForegroundColor Yellow
Write-Host "   (Créez-en un sur: https://github.com/settings/tokens)" -ForegroundColor Yellow
Write-Host ""

try {
    git push -u origin main
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ PROJET POUSSÉ SUR GITHUB!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Voir sur: https://github.com/mooby865/iapostemanager" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Configurer les secrets GitHub pour CI/CD" -ForegroundColor White
    Write-Host "2. Créer un token Docker Hub" -ForegroundColor White
    Write-Host "3. Le pipeline se déclenchera automatiquement!" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors du push!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions possibles:" -ForegroundColor Yellow
    Write-Host "1. Créez le repository sur GitHub: https://github.com/new" -ForegroundColor White
    Write-Host "   Nom: iapostemanager" -ForegroundColor White
    Write-Host "   Ne pas initialiser avec README" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Générez un Personal Access Token:" -ForegroundColor White
    Write-Host "   https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   Cochez: repo, workflow" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Utilisez le token comme mot de passe lors du push" -ForegroundColor White
}

Write-Host ""
Read-Host "Appuyez sur Entrée pour continuer"