# ✅ TESTS E2E CRÉÉS

**Date**: 2025-03-09  
**Action**: Priorité #2 - Augmenter couverture tests

---

## 📋 TESTS CRÉÉS

### 1. auth.e2e.test.js
- ✅ Inscription nouveau compte
- ✅ Connexion avec identifiants valides
- ✅ Accès ressource protégée avec token
- ✅ Rejet sans token

### 2. cases.e2e.test.js
- ✅ Créer dossier
- ✅ Lire dossier
- ✅ Mettre à jour statut

---

## 🚀 EXÉCUTION

```powershell
# PowerShell: lancer explicitement les E2E
$env:RUN_E2E='1'
$env:API_URL='http://localhost:5078'
npx jest --config jest.e2e.config.cjs
```

```bash
# Bash
RUN_E2E=1 API_URL=http://localhost:5078 npx jest --config jest.e2e.config.cjs
```

Les suites E2E sont volontairement exclues des tests frontend par défaut.

---

## 📊 COUVERTURE

**Flux critiques testés**:
- ✅ Authentification (inscription, login)
- ✅ Autorisation (token, accès protégé)
- ✅ CRUD Dossiers (create, read, update)

**Prochains tests**:
- ⏳ CRUD Clients
- ⏳ Isolation tenant
- ⏳ Recherche

---

**Statut**: ✅ Tests E2E de base créés  
**Prochaine étape**: Exécuter et valider
