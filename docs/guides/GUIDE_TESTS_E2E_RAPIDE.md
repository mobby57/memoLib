# 🚀 Guide Rapide - Tests E2E Playwright

## ⚡ Démarrage Ultra-Rapide

### Option 1 : Tout-en-un (Recommandé)

1. **Double-cliquez sur :** `START_ALL_FOR_TESTS.bat`
   - Lance backend + frontend automatiquement
   - Attend 15 secondes

2. **Puis double-cliquez sur :** `RUN_TESTS_E2E.bat`
   - Vérifie que tout tourne
   - Lance les 29 tests
   - Ouvre le rapport automatiquement

---

### Option 2 : Manuel

#### Étape 1 : Démarrer les serveurs

**Terminal 1 - Backend :**
```bash
cd C:\Users\moros\Desktop\iaPostemanage
python src\web\app.py
```

**Terminal 2 - Frontend :**
```bash
cd frontend-react
npm run dev
```

#### Étape 2 : Lancer les tests

**Terminal 3 :**
```bash
cd frontend-react
npm run test:e2e
```

---

## 📊 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm run test:e2e` | Lance tous les tests |
| `npm run test:e2e:ui` | Mode UI interactif |
| `npm run test:e2e:debug` | Mode debug |
| `npm run test:e2e:report` | Voir le rapport |

---

## 🎯 Tests Spécifiques

```bash
# Tests d'accessibilité seulement
npx playwright test accessibility.spec.js

# Tests de transcription vocale seulement
npx playwright test voice-transcription.spec.js

# Tests de parcours utilisateurs seulement
npx playwright test user-journeys.spec.js

# Un seul test
npx playwright test -g "Navigation vers la page Accessibilité"
```

---

## ✅ Vérification Pré-Tests

Avant de lancer, vérifiez :

```bash
# Backend OK ?
curl http://localhost:5000

# Frontend OK ?
curl http://localhost:5173
```

---

## 📈 Résultats Attendus

```
Running 29 tests using 1 worker

✓  [chromium] › accessibility.spec.js:18:7 (1s)
✓  [chromium] › accessibility.spec.js:35:7 (2s)
✓  [chromium] › accessibility.spec.js:52:7 (1s)
... (26 autres tests)

  29 passed (2.5m)
```

---

## 🐛 Problèmes Courants

### "Backend non démarré"
```bash
# Vérifier si Python tourne
Get-Process python

# Redémarrer
python src\web\app.py
```

### "Frontend non démarré"
```bash
# Vérifier le port
Test-NetConnection localhost -Port 5173

# Redémarrer
cd frontend-react
npm run dev
```

### "Tests échouent tous"
```bash
# Voir en mode debug
npm run test:e2e:debug

# Voir en mode UI
npm run test:e2e:ui
```

---

## 📸 Screenshots & Videos

En cas d'échec :
- **Screenshots :** `frontend-react/test-results/`
- **Videos :** `frontend-react/test-results/`
- **Traces :** `frontend-react/test-results/`

---

## 🎬 Mode UI (Recommandé pour débugger)

```bash
npm run test:e2e:ui
```

Interface graphique avec :
- ▶️ Exécution test par test
- 👁️ Voir le navigateur en action
- 🔍 Inspecter chaque étape
- 📸 Screenshots automatiques

---

## 💡 Tips

1. **Mode headless** (plus rapide) :
   ```bash
   npx playwright test --headed=false
   ```

2. **Voir navigateur** (pour débugger) :
   ```bash
   npx playwright test --headed
   ```

3. **Un seul worker** (déjà configuré) :
   - Évite les conflits entre tests
   - Plus stable

4. **Timeouts augmentés** :
   - 5000ms pour les éléments
   - 120s pour le serveur
   - Adapté aux machines lentes

---

## 📝 Exemple de Rapport

Après les tests, un rapport HTML s'ouvre automatiquement :

```
Test Results
============
✓ Passed: 27
✗ Failed: 2
⊘ Skipped: 0
────────────────
Total: 29 tests
Duration: 2m 34s
```

Cliquez sur un test pour voir :
- Screenshots
- Video de l'exécution
- Logs détaillés
- Stack trace (si erreur)

---

## 🔄 CI/CD

Pour intégrer dans un pipeline :

```yaml
- name: Run E2E Tests
  run: |
    cd frontend-react
    npx playwright install --with-deps
    npm run test:e2e
```

---

## 📞 Besoin d'Aide ?

1. Voir le rapport : `npm run test:e2e:report`
2. Mode debug : `npm run test:e2e:debug`
3. Mode UI : `npm run test:e2e:ui`
4. Documentation : `TESTS_E2E_PLAYWRIGHT.md`

---

**Version :** 1.0  
**Dernière mise à jour :** 11 décembre 2025
