#!/usr/bin/env pwsh
# Script de deploiement securise - IA Poste Manager
# Version PowerShell qui NE contient PAS les cles dans l'archive

Write-Host @"
================================================================
    DEPLOIEMENT SECURISE - IA POSTE MANAGER
    Archive sans cles secretes (securite maximale)
================================================================
"@ -ForegroundColor Cyan

# 1. Generation cles
Write-Host "`n=== 1. Generation Nouvelles Cles ===" -ForegroundColor Yellow
$jwtKey = python -c "import secrets; print(secrets.token_hex(32))"
$secretKey = python -c "import secrets; print(secrets.token_hex(32))"

$keysContent = @"
# CLES DE PRODUCTION - A GARDER SECRET
# Ne pas commiter sur Git !

JWT_SECRET_KEY=$jwtKey
SECRET_KEY=$secretKey
"@

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$keysFile = "CONFIG_KEYS_$timestamp.txt"
$keysContent | Out-File -FilePath $keysFile -Encoding UTF8

Write-Host "[OK] Cles generees dans: $keysFile" -ForegroundColor Green
Write-Host "`n[IMPORTANT] Vos cles de production :" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "JWT_SECRET_KEY=$jwtKey" -ForegroundColor White
Write-Host "SECRET_KEY=$secretKey" -ForegroundColor White
Write-Host "----------------------------------------`n" -ForegroundColor Yellow
Write-Host "GARDEZ CE FICHIER EN LIEU SUR !" -ForegroundColor Red
Read-Host "Appuyez sur ENTREE pour continuer"

# 2. Creation dossier securise
Write-Host "`n=== 2. Creation Archive Securisee ===" -ForegroundColor Yellow
$deployDir = "deploy_secure_$timestamp"
if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
New-Item -ItemType Directory -Path $deployDir | Out-Null

# 3. Copie fichiers
Write-Host "-> Copie code source..." -ForegroundColor Cyan
Copy-Item -Path "src" -Destination "$deployDir/src" -Recurse -Force
Copy-Item -Path "wsgi_pythonanywhere.py" -Destination "$deployDir/" -Force
Copy-Item -Path "requirements.txt" -Destination "$deployDir/" -Force
if (Test-Path "schema.prisma") { Copy-Item -Path "schema.prisma" -Destination "$deployDir/" -Force }
if (Test-Path "alembic.ini") { Copy-Item -Path "alembic.ini" -Destination "$deployDir/" -Force }
Write-Host "[OK] Fichiers copies" -ForegroundColor Green

# 4. Creation .env.template (sans secrets)
Write-Host "-> Creation .env.template..." -ForegroundColor Cyan
$envTemplate = @"
# IA Poste Manager - Configuration Production
# IMPORTANT: Remplacer les valeurs ci-dessous par vos vraies cles

# FastAPI Configuration
FLASK_ENV=production
FLASK_DEBUG=False

# SECURITY - OBLIGATOIRE
# Generer avec: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=REMPLACER_PAR_VOTRE_SECRET_KEY_ICI
JWT_SECRET_KEY=REMPLACER_PAR_VOTRE_JWT_SECRET_KEY_ICI
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30

# OpenAI API (optionnel)
OPENAI_API_KEY=sk-votre-cle-openai-ici

# Database
DATABASE_URL=sqlite:///./data/iapostemanage.db

# API Configuration
API_PREFIX=/api
PORT=8000

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL_LLM=llama3

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
"@

$envTemplate | Out-File -FilePath "$deployDir/.env.template" -Encoding UTF8
Write-Host "[OK] .env.template cree" -ForegroundColor Green

# 5. Creation install.sh
Write-Host "-> Creation install.sh..." -ForegroundColor Cyan
$installScript = @'
#!/bin/bash
# Installation SECURISEE - IA Poste Manager

set -e

echo "========================================================"
echo "  Installation IA Poste Manager (Mode Securise)"
echo "========================================================"

# 1. Creer virtualenv
echo ""
echo "-> Creation virtualenv..."
mkvirtualenv iapostemanage --python=python3.10

# 2. Aller dans projet
cd ~/iapostemanage

# 3. Installer dependances
echo "-> Installation dependances..."
pip install -r requirements.txt
pip install asgiref

# 4. Creer dossier data
echo "-> Creation dossier data..."
mkdir -p data

# 5. Instructions configuration
echo ""
echo "========================================================"
echo "  CONFIGURATION MANUELLE REQUISE"
echo "========================================================"
echo ""
echo "1. Copier template vers .env:"
echo "   cp .env.template .env"
echo ""
echo "2. Editer .env:"
echo "   nano .env"
echo ""
echo "3. Remplacer:"
echo "   - SECRET_KEY=... (avec votre cle)"
echo "   - JWT_SECRET_KEY=... (avec votre cle)"
echo "   - OPENAI_API_KEY=... (optionnel)"
echo ""
echo "4. Generer cles:"
echo "   python -c 'import secrets; print(secrets.token_hex(32))'"
echo ""
echo "5. Initialiser database:"
echo "   python -c 'from src.backend.database import init_db; init_db()'"
echo ""
echo "6. Tester:"
echo "   python -c 'from src.backend.main_fastapi import app; print(\"OK\")'"
echo ""
echo "========================================================"
echo "Installation base terminee !"
echo "Suivre instructions ci-dessus pour finaliser."
echo "========================================================"
'@

$installScript | Out-File -FilePath "$deployDir/install.sh" -Encoding UTF8
Write-Host "[OK] install.sh cree" -ForegroundColor Green

# 6. Creation README
Write-Host "-> Creation README..." -ForegroundColor Cyan
$readme = @"
# ARCHIVE SECURISEE - IA Poste Manager

Cette archive NE CONTIENT PAS les cles secretes pour la securite.

## Installation Rapide

1. Extraire l'archive
2. Lancer: bash install.sh
3. Configurer .env avec vos cles (voir CONFIG_KEYS_$timestamp.txt en local)
4. Initialiser database
5. Configurer WSGI (voir GUIDE_DEPLOIEMENT_FINAL.md)

## Securite

- Cles generees localement
- Jamais incluses dans l'archive
- Configuration manuelle sur PythonAnywhere
- Plus securise

Voir GUIDE_DEPLOIEMENT_FINAL.md pour details complets.
"@

$readme | Out-File -FilePath "$deployDir/README.md" -Encoding UTF8
Write-Host "[OK] README.md cree" -ForegroundColor Green

# 7. Creation archive ZIP
Write-Host "`n=== 3. Creation Archive ZIP ===" -ForegroundColor Yellow
$archiveName = "iapostemanage_secure_$timestamp.zip"
Compress-Archive -Path "$deployDir/*" -DestinationPath $archiveName -Force
Write-Host "[OK] Archive creee: $archiveName" -ForegroundColor Green

$archiveInfo = Get-Item $archiveName
$sizeMB = [math]::Round($archiveInfo.Length / 1MB, 2)

# 8. Recapitulatif
Write-Host @"

================================================================
             ARCHIVE SECURISEE CREEE
================================================================

ARCHIVE PRINCIPALE (a uploader sur PythonAnywhere):
  -> $archiveName
  -> Taille: $sizeMB MB

FICHIER LOCAL (a GARDER SECRET, NE PAS UPLOADER):
  -> $keysFile
  -> Contient vos cles JWT_SECRET_KEY et SECRET_KEY

SECURITE:
  [OK] Cles secretes NON incluses dans l'archive
  [OK] Template .env fourni
  [OK] Instructions configuration incluses
  [OK] Guide installation inclus

================================================================

PROCHAINES ETAPES:

1. UPLOADER SUR PYTHONANYWHERE:
   -> $archiveName

2. GARDER EN LOCAL (NE JAMAIS UPLOADER):
   -> $keysFile

3. SUR PYTHONANYWHERE (apres extraction):
   -> bash install.sh
   -> cp .env.template .env
   -> nano .env (copier vos cles depuis $keysFile)
   -> python -c "from src.backend.database import init_db; init_db()"

4. CONFIGURER WSGI:
   -> Voir GUIDE_DEPLOIEMENT_FINAL.md

================================================================

VOS CLES DE PRODUCTION:
"@ -ForegroundColor Green

Write-Host "JWT_SECRET_KEY=$jwtKey" -ForegroundColor Yellow
Write-Host "SECRET_KEY=$secretKey" -ForegroundColor Yellow

Write-Host @"

================================================================

Conservez ces cles en lieu sur !
Ne les partagez jamais et ne les committez pas sur Git !

Fichier ouvert: $keysFile

"@ -ForegroundColor Cyan

# Ouvrir le dossier
Invoke-Item .

Write-Host "Deploiement securise pret !" -ForegroundColor Green
