# 🎬 QUICK START - MemoLib Services (4 février 2026)

## ✅ État Actuel

```
Backend Flask:  ✅ EN COURS D'EXÉCUTION (port 5000)
Frontend Next:  ⏳ PRÊT À DÉMARRER (port 3000)
Pipeline:       ✅ IMPORTABLE (30K+ units/sec)
```

## 🚀 DÉMARRER MAINTENANT

### Fenêtre 1: Backend (DÉJÀ EN COURS)

```
✅ Flask backend écoute sur http://localhost:5000
✅ Endpoints: /health, /execute, /test-rules, /stats
```

### Fenêtre 2: Frontend (À DÉMARRER)

```powershell
cd C:\Users\moros\Desktop\memolib\src\frontend
npm run dev
```

Puis accédez à: **http://localhost:3000**

---

## 🧪 Tests Rapides

```powershell
# 1. Vérifier le backend
$response = Invoke-WebRequest http://localhost:5000/analysis/health
$response.StatusCode  # Doit afficher: 200

# 2. Tester une analyse
python -m analysis.load_test

# 3. Tests unitaires
pytest analysis/tests/test_rules_engine.py -v
```

---

## 📚 Documents Principaux

| Document                    | But                      |
| --------------------------- | ------------------------ |
| `SERVICES_STARTUP_GUIDE.md` | 📖 Guide complet         |
| `TROUBLESHOOTING_GUIDE.md`  | 🔧 Dépannage             |
| `start-pipeline.ps1`        | 🚀 Démarrage automatique |

---

## 📞 Aide Rapide

**Problème**: Port déjà utilisé
**Solution**: Voir `TROUBLESHOOTING_GUIDE.md` → "Port Déjà Utilisé"

**Problème**: Module Python non trouvé
**Solution**: Voir `TROUBLESHOOTING_GUIDE.md` → "Module 'analysis' Non Importable"

---

**Status**: ✅ READY
**Temps d'Exécution**: ~30 secondes pour démarrer
**Version**: 2.0 (Services optimisés et stabilisés)
