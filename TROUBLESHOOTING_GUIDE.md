# 🔧 Guide de Dépannage - Pipeline MemoLib

## État Actuel (4 février 2026)

### ✅ Services Actifs

- **Backend Flask**: Port 5000 ✅ EN COURS D'EXÉCUTION
- **Frontend Next.js**: Port 3000/3001 ✅ PRÊT À DÉMARRER
- **Python Pipeline**: Module `analysis` ✅ IMPORTABLE

---

## ❌ Problème: Port Déjà Utilisé

### Symptôme

```
Address already in use
```

### Solutions

**Pour le port 5000 (Backend):**

```powershell
# Trouver le processus
Get-NetTCPConnection -LocalPort 5000 | Select-Object -Property OwningProcess

# Tuer le processus (remplacer 1234 par le vrai PID)
Stop-Process -Id 1234 -Force

# Ou utiliser un port différent
python -m flask run --port 5001
```

**Pour le port 3000 (Frontend):**

```powershell
# Next.js auto-escalade au port 3001 si 3000 est occupé
# Mais vous pouvez aussi spécifier:
npm run dev -- -p 3001
```

---

## ❌ Problème: Module Python Non Trouvé

### Symptôme

```
ModuleNotFoundError: No module named 'pandas'
ModuleNotFoundError: No module named 'flask'
```

### Solution

```powershell
# Installer les dépendances manquantes
pip install pandas numpy flask flask-cors apscheduler sentry-sdk

# Ou depuis le fichier requirements
pip install -r requirements-python.txt
```

### Vérifier l'installation

```powershell
python -c "import pandas, flask, apscheduler; print('All OK')"
```

---

## ❌ Problème: Module 'analysis' Non Importable

### Symptôme

```
ModuleNotFoundError: No module named 'analysis'
ModuleNotFoundError: No module named 'analysis.pipelines'
```

### Causes Possibles

1. **PYTHONPATH non configuré**

```powershell
# Vérifier
echo $env:PYTHONPATH

# Configurer (depuis le répertoire racine du projet)
$env:PYTHONPATH = "."
```

2. **Structure du package incomplète**

```powershell
# Vérifier que __init__.py existe dans les répertoires
Test-Path analysis/__init__.py
Test-Path analysis/pipelines/__init__.py
Test-Path analysis/schemas/__init__.py
Test-Path analysis/tests/__init__.py
```

3. **Répertoires de travail incorrects**

```powershell
# S'assurer que vous êtes dans le répertoire racine
Get-Location
# Doit être: C:\Users\moros\Desktop\memolib

# Si pas:
cd C:\Users\moros\Desktop\memolib
```

### Solution Complète

```powershell
cd C:\Users\moros\Desktop\memolib
$env:PYTHONPATH = "."
$env:FLASK_APP = "backend-python/app.py"
python -m flask run --port 5000 --no-reload
```

---

## ❌ Problème: Backend Ne Répond Pas

### Diagnostic

```powershell
# 1. Vérifier que Flask est en cours d'exécution
Get-Process | Where-Object {$_.Name -like "*python*"}

# 2. Tester la connectivité
Test-NetConnection -ComputerName localhost -Port 5000

# 3. Vérifier les logs Flask
# Cherchez les messages d'erreur dans la fenêtre Flask
```

### Solution Step-by-Step

**Étape 1: Arrêter les instances existantes**

```powershell
# Fermer toutes les fenêtres PowerShell avec Flask/Node
# Ou forcer:
Stop-Process -Name python -Force
Stop-Process -Name node -Force
```

**Étape 2: Nettoyer les caches**

```powershell
cd C:\Users\moros\Desktop\memolib
rm -Force -Recurse .next 2>/dev/null
rm -Force -Recurse __pycache__ 2>/dev/null
```

**Étape 3: Redémarrer avec diagnostic**

```powershell
cd C:\Users\moros\Desktop\memolib

# Backend avec verbose output
$env:PYTHONPATH = "."
$env:FLASK_APP = "backend-python/app.py"
python -u backend-python/app.py 2>&1 | Tee-Object flask.log
```

---

## ❌ Problème: Frontend Ne Démarre Pas

### Diagnostic

```powershell
# 1. Vérifier les dépendances npm
cd src\frontend
npm list | Select-String "npm ERR" -A 5

# 2. Vérifier l'espace disque
Get-Volume | Where-Object {$_.DriveLetter -eq "C"} | Select-Object @{N="FreeGB";E={[math]::Round($_.SizeRemaining/1GB)}}
```

### Solution

**Réinstaller les dépendances:**

```powershell
cd src\frontend
rm -Force -Recurse node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

**Ou utiliser yarn:**

```powershell
cd src\frontend
npm install -g yarn
yarn install
yarn dev
```

---

## ❌ Problème: Erreur d'Encodage Unicode

### Symptôme

```
UnicodeDecodeError: 'charmap' codec can't decode byte
```

### Solution

```powershell
# Configurer l'encodage Python
$env:PYTHONIOENCODING = "utf-8"

# Redémarrer Flask
python -m flask run --port 5000
```

---

## ❌ Problème: Erreur Sentry

### Symptôme

```
⚠️ Sentry DSN not configured
```

### Explication

C'est normal ! Sentry est optionnel et nécessite une clé d'accès.

### Configuration (Optionnelle)

```powershell
# Définir le DSN Sentry
$env:SENTRY_DSN = "https://your-sentry-dsn@sentry.io/12345"

# Redémarrer Flask
python -m flask run --port 5000
```

---

## ⚠️ Problème: APScheduler Ne Démarre Pas

### Symptôme

```
APScheduler not initialized
Error: Scheduler already running
```

### Diagnostic

```powershell
# Vérifier la configuration
python -c "from apscheduler.schedulers.background import BackgroundScheduler; print('APScheduler OK')"
```

### Solution

```powershell
# APScheduler démarre automatiquement avec Flask
# S'il échoue, vérifier backend-python/app.py ligne ~60

# Les erreurs APScheduler ne bloquent pas le démarrage du serveur
# Le backend continue de fonctionner
```

---

## ✅ Vérification Complète de Santé

Utilisez ce script pour tester chaque composant:

```powershell
# Test 1: Python
Write-Host "Test 1: Python" -ForegroundColor Cyan
python --version

# Test 2: Node.js
Write-Host "Test 2: Node.js" -ForegroundColor Cyan
node --version

# Test 3: Module analysis
Write-Host "Test 3: Module analysis" -ForegroundColor Cyan
python -c "from analysis.pipelines.pipeline import AnalysisPipeline; print('✅ Pipeline module OK')"

# Test 4: Backend health (si en cours d'exécution)
Write-Host "Test 4: Backend Health" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/analysis/health" -TimeoutSec 2
    Write-Host "✅ Backend responding: $($response.StatusCode)"
} catch {
    Write-Host "⚠️ Backend not available (may still be starting...)"
}

# Test 5: Frontend (si en cours d'exécution)
Write-Host "Test 5: Frontend" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2
    Write-Host "✅ Frontend responding: $($response.StatusCode)"
} catch {
    Write-Host "⚠️ Frontend not available (may still be starting...)"
}
```

---

## 🆘 Si Rien Ne Marche

### Option 1: Réinitialisation Douce

```powershell
cd C:\Users\moros\Desktop\memolib

# Arrêter tous les services
Stop-Process -Name python -Force 2>/dev/null
Stop-Process -Name node -Force 2>/dev/null

# Attendre
Start-Sleep -Seconds 2

# Redémarrer
.\start-pipeline.ps1
```

### Option 2: Réinitialisation Complète

```powershell
cd C:\Users\moros\Desktop\memolib

# 1. Arrêter les services
Stop-Process -Name python -Force 2>/dev/null
Stop-Process -Name node -Force 2>/dev/null

# 2. Nettoyer les caches
rm -Force -Recurse .next 2>/dev/null
rm -Force -Recurse __pycache__ 2>/dev/null
rm -Force -Recurse .pytest_cache 2>/dev/null

# 3. Réinstaller les dépendances
pip install -q --upgrade pip
pip install -r requirements-python.txt

cd src\frontend
rm -Force -Recurse node_modules package-lock.json
npm install --legacy-peer-deps

# 4. Redémarrer
cd C:\Users\moros\Desktop\memolib
.\start-pipeline.ps1
```

### Option 3: Démarrage Manuel Isolé

```powershell
# Terminal 1 - Backend
cd C:\Users\moros\Desktop\memolib
$env:PYTHONPATH = "."
$env:FLASK_APP = "backend-python/app.py"
python -u -m flask run --port 5000

# Terminal 2 - Frontend
cd C:\Users\moros\Desktop\memolib\src\frontend
npm run dev
```

---

## 📊 Logs Importants À Vérifier

### Backend Flask

```
⚠️  Sentry DSN not configured       # Normal si pas configuré
✅ APScheduler initialized          # Doit être présent
✅ Pipeline module loaded           # Doit être présent
Running on http://127.0.0.1:5000   # Doit être présent
```

### Frontend Next.js

```
▲ Next.js 16.2.0
- Local: http://localhost:3000
- Environments: .env.local
```

---

## 📞 Commandes Utiles

```powershell
# Vérifier les ports écoutants
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Vérifier les processus Python/Node
tasklist | findstr python
tasklist | findstr node

# Tuer un processus
taskkill /PID <PID> /F

# Voir la configuration Flask
$env:FLASK_APP
$env:FLASK_ENV
$env:PYTHONPATH
```

---

## 📝 Logs de Référence

### Démarrage Réussi du Backend

```
⚠️  Sentry DSN not configured
✅ APScheduler initialized (4-hour interval for analysis pipeline)
 * Serving Flask app 'backend-python/app.py'
 * Debug mode: off
WARNING: This is a development server. Do not use it for production deployment.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

### Démarrage Réussi du Frontend

```
▲ Next.js 16.2.0

- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.1s
✓ Compiled client and server successfully
```

---

**Dernière Mise à Jour**: 4 février 2026
**Version**: 2.0
**Support**: Consulter `SERVICES_STARTUP_GUIDE.md` pour plus d'informations
