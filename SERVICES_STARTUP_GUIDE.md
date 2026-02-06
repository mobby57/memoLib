# 🚀 Guide de Démarrage des Services MemoLib

## Status Actuel (4 février 2026)

### ✅ Services Démarrés

| Service              | Port | Statut    | Commande                            |
| -------------------- | ---- | --------- | ----------------------------------- |
| **Backend Flask**    | 5000 | ✅ Actif  | `python -m flask run --port 5000`   |
| **Frontend Next.js** | 3000 | ✅ Actif  | `npm run dev` (dans `src/frontend`) |
| **Python Pipeline**  | N/A  | ✅ Chargé | Module `analysis` importable        |

### 📊 Vérification de Santé

```powershell
# Test du backend Flask
Invoke-WebRequest -Uri "http://localhost:5000/analysis/health"

# Test du frontend Next.js
Invoke-WebRequest -Uri "http://localhost:3000"
```

## 🎯 Endpoints Disponibles

### Backend (Flask - Port 5000)

| Endpoint               | Méthode | Description                    | Réponse                |
| ---------------------- | ------- | ------------------------------ | ---------------------- |
| `/analysis/health`     | GET     | Vérification de santé          | `{ status: "ok" }`     |
| `/analysis/execute`    | POST    | Exécuter le pipeline complet   | Métrique de traitement |
| `/analysis/test-rules` | POST    | Tester les règles sur un texte | Priorité + deadlines   |
| `/analysis/stats`      | GET     | Statistiques du pipeline       | Compteurs              |

### Frontend (Next.js - Port 3000)

| Route                      | Méthode | Description                    |
| -------------------------- | ------- | ------------------------------ |
| `/api/analysis/execute`    | POST    | Orchestre pipeline via backend |
| `/api/analysis/test-rules` | POST    | Teste règles via backend       |
| `/`                        | GET     | Dashboard principal            |

## 🧪 Tests Rapides

### 1. Backend Health Check

```powershell
# Depuis une autre fenêtre PowerShell
curl http://localhost:5000/analysis/health
```

### 2. Test des Règles (Backend)

```powershell
$body = @{
    content = "Email du 10 janvier 2024 concernant OQTF avec appel avant 30 jours"
    actor_email = "test@justice.fr"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/analysis/test-rules" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### 3. Exécuter le Pipeline Complet

```powershell
python -m analysis.load_test
```

### 4. Tests Unitaires

```powershell
pytest analysis/tests/test_rules_engine.py -v
```

## 📋 Vérification des Dépendances

Si les services ne démarrent pas, installez les dépendances :

```powershell
# Python
cd c:\Users\moros\Desktop\memolib
pip install -r requirements-python.txt
# ou
pip install pandas numpy flask flask-cors apscheduler sentry-sdk

# Node.js (Frontend)
cd src\frontend
npm install --legacy-peer-deps
```

## 🔍 Résolution des Problèmes

### Port Déjà Utilisé

```powershell
# Trouver le processus qui utilise le port
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Tuer le processus (remplacer PID par le numéro)
Stop-Process -Id <PID> -Force
```

### Erreur "Module Not Found"

```powershell
# S'assurer que PYTHONPATH est défini
$env:PYTHONPATH = "."; python -m flask run --port 5000
```

### Next.js: Port 3000 Déjà Utilisé

Next.js utilisera automatiquement le port 3001 si 3000 est occupé.

```
Frontend: http://localhost:3001
```

## 📊 Architecture des Services

```
┌─────────────────────────────────────────┐
│      Frontend (Next.js - Port 3000)     │
│  http://localhost:3000                  │
└──────────────────┬──────────────────────┘
                   │ HTTP Calls
                   ▼
┌─────────────────────────────────────────┐
│   API Routes (src/frontend/app/api)    │
│  /api/analysis/execute                 │
│  /api/analysis/test-rules               │
└──────────────────┬──────────────────────┘
                   │ Proxy to
                   ▼
┌─────────────────────────────────────────┐
│     Backend (Flask - Port 5000)         │
│  http://localhost:5000                  │
│  /analysis/execute                      │
│  /analysis/test-rules                   │
│  /analysis/health                       │
│  /analysis/stats                        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Python Pipeline Module                │
│   (analysis/ package)                   │
│  - Rules Engine (4 règles juridiques)  │
│  - Duplicate Detection                  │
│  - Deadline Extraction                  │
│  - Event Generation                     │
└─────────────────────────────────────────┘
```

## 🎮 Commandes de Contrôle

### Démarrage Automatique

```powershell
cd c:\Users\moros\Desktop\memolib
.\start-pipeline.ps1
```

### Démarrage Manuel

**Terminal 1 - Backend Flask:**

```powershell
cd c:\Users\moros\Desktop\memolib
$env:PYTHONPATH = "."
$env:FLASK_APP = "backend-python/app.py"
python -m flask run --port 5000 --no-reload
```

**Terminal 2 - Frontend Next.js:**

```powershell
cd c:\Users\moros\Desktop\memolib\src\frontend
npm run dev
```

## ✅ Checklist de Lancement

- [ ] Backend Flask répond sur port 5000
- [ ] Frontend Next.js actif sur port 3000 (ou 3001)
- [ ] Health check `/analysis/health` retourne `{ status: "ok" }`
- [ ] Tests unitaires passent: `pytest analysis/tests/test_rules_engine.py -v`
- [ ] Load test exécutable: `python -m analysis.load_test`
- [ ] API Frontend accessible: `Invoke-WebRequest http://localhost:3000`

## 📞 Support

Pour chaque service problématique:

1. **Backend Flask**: Vérifier `backend-python/app.py` et les imports `analysis.*`
2. **Frontend Next.js**: Vérifier `src/frontend/app/api/analysis/`
3. **Python Module**: Vérifier `analysis/__init__.py` et structure des packages

---

**Dernière Mise à Jour**: 4 février 2026
**État**: ✅ Services Opérationnels
**Performance**: 30,927 units/sec (Load Test)
