# 🧪 Tests E2E Playwright - Système d'Accessibilité

## 📋 Vue d'ensemble

Suite complète de tests End-to-End avec Playwright pour valider le système d'accessibilité universelle.

**3 fichiers de tests créés :**
1. `accessibility.spec.js` - Tests du système d'accessibilité (10 tests)
2. `voice-transcription.spec.js` - Tests de transcription vocale (13 tests)
3. `user-journeys.spec.js` - Parcours utilisateurs complets (6 journeys)

**Total : 29 tests E2E**

---

## 🚀 Installation

```bash
cd frontend-react
npm install --save-dev @playwright/test playwright
npx playwright install chromium
```

---

## ▶️ Exécution des Tests

### Tous les tests
```bash
npm run test:e2e
```

### Mode UI (interactif)
```bash
npm run test:e2e:ui
```

### Mode Debug
```bash
npm run test:e2e:debug
```

### Test spécifique
```bash
npx playwright test accessibility.spec.js
npx playwright test voice-transcription.spec.js
npx playwright test user-journeys.spec.js
```

### Voir le rapport
```bash
npm run test:e2e:report
```

---

## 📁 Structure des Tests

### 1. `accessibility.spec.js` (10 tests)

Tests du centre d'accessibilité :

✅ **Test 01** - Navigation vers la page Accessibilité
✅ **Test 02** - Activation du profil Aveugle (TTS)
✅ **Test 03** - Activation du profil Sourd (Transcriptions)
✅ **Test 04** - Paramètres TTS (Vitesse et Volume)
✅ **Test 05** - Tailles de police
✅ **Test 06** - Mode Haut Contraste
✅ **Test 07** - Raccourcis clavier affichés
✅ **Test 08** - Test du bouton TTS
✅ **Test 09** - API Accessibility Settings
✅ **Test 10** - API Keyboard Shortcuts

### 2. `voice-transcription.spec.js` (13 tests)

Tests de la transcription vocale :

✅ **Test 01** - Navigation vers Transcription vocale
✅ **Test 02** - Interface de transcription présente
✅ **Test 03** - Paramètres d'accessibilité intégrés
✅ **Test 04** - Toggle TTS dans VoiceTranscription
✅ **Test 05** - Toggle Haut Contraste dans VoiceTranscription
✅ **Test 06** - Zone de transcription visuelle présente
✅ **Test 07** - Instructions d'utilisation visibles
✅ **Test 08** - Bouton d'enregistrement désactivé initialement
✅ **Test 09** - API Voice Start (mock)
✅ **Test 10** - API Transcripts récents
✅ **Test 11** - Simulation d'annonce vocale
✅ **Test 12** - Responsive design - Mobile
✅ **Test 13** - Responsive design - Tablet

### 3. `user-journeys.spec.js` (6 tests)

Parcours utilisateurs complets :

✅ **Journey 01** - Utilisateur aveugle - Setup complet
✅ **Journey 02** - Utilisateur sourd - Transcription visuelle
✅ **Journey 03** - Utilisateur muet - Alternatives textuelles
✅ **Journey 04** - Utilisateur mobilité réduite - Navigation clavier
✅ **Journey 05** - Test complet APIs
✅ **Journey 06** - Workflow complet avec enregistrement (simulation)

---

## 🎯 Ce qui est testé

### Interface Utilisateur
- ✅ Navigation entre les pages
- ✅ Affichage des éléments UI
- ✅ Activation des profils
- ✅ Modification des paramètres
- ✅ Toggles (TTS, contraste)
- ✅ Responsive design (mobile, tablet)

### APIs Backend
- ✅ GET `/api/accessibility/settings`
- ✅ POST `/api/accessibility/settings`
- ✅ GET `/api/accessibility/keyboard-shortcuts`
- ✅ POST `/api/accessibility/profile`
- ✅ POST `/api/accessibility/announce`
- ✅ GET `/api/accessibility/transcripts`
- ✅ POST `/api/voice/start`

### Parcours Utilisateur
- ✅ Setup profil aveugle complet
- ✅ Setup profil sourd complet
- ✅ Setup profil muet complet
- ✅ Navigation clavier (mobilité réduite)
- ✅ Workflow enregistrement vocal
- ✅ Intégration multi-pages

---

## ⚙️ Configuration

### `playwright.config.js`

```javascript
{
  testDir: './tests/e2e',
  workers: 1,  // Séquentiel pour éviter conflits
  baseURL: 'http://localhost:5173',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120000
  }
}
```

### Prérequis

**Backend doit tourner sur :** `http://localhost:5000`
**Frontend doit tourner sur :** `http://localhost:5173`

---

## 🔧 Avant de lancer les tests

### 1. Démarrer le backend
```bash
# Terminal 1
cd C:\Users\moros\Desktop\iaPostemanage
python src\web\app.py
```

### 2. Démarrer le frontend
```bash
# Terminal 2
cd frontend-react
npm run dev
```

### 3. Lancer les tests
```bash
# Terminal 3
cd frontend-react
npm run test:e2e
```

---

## 📊 Rapport de Tests

Playwright génère automatiquement :
- **Console output** : Résultats en temps réel
- **HTML Report** : Rapport détaillé avec screenshots
- **Videos** : Enregistrement des tests qui échouent
- **Traces** : Debug traces pour analyse

**Voir le rapport :**
```bash
npm run test:e2e:report
```

---

## 🐛 Debug

### Mode Debug interactif
```bash
npx playwright test --debug
```

### Mode UI (recommandé)
```bash
npm run test:e2e:ui
```

### Test un seul fichier
```bash
npx playwright test accessibility.spec.js --debug
```

### Screenshots automatiques
Les screenshots sont pris automatiquement en cas d'échec dans `test-results/`

---

## 📝 Exemples de Tests

### Test d'activation de profil
```javascript
test('Activation du profil Aveugle', async ({ page }) => {
  await page.goto('/accessibility');
  await page.click('button:has-text("Aveugle")');
  await expect(page.locator('text=Profil appliqué')).toBeVisible();
});
```

### Test API
```javascript
test('API Settings', async ({ request }) => {
  const response = await request.get(
    'http://localhost:5000/api/accessibility/settings'
  );
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.success).toBe(true);
});
```

### Test navigation clavier
```javascript
test('Navigation clavier', async ({ page }) => {
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/accessibility');
});
```

---

## ✅ Checklist Avant Tests

- [ ] Backend Flask en cours d'exécution (port 5000)
- [ ] Frontend Vite en cours d'exécution (port 5173)
- [ ] Playwright installé (`npm install`)
- [ ] Navigateur Chromium installé (`npx playwright install chromium`)
- [ ] Credentials de test configurés (si authentification)

---

## 🎭 Credentials de Test

Les tests utilisent des credentials mockés :

```javascript
// Aveugle
email: 'blind.user@test.com'
password: 'password123'

// Sourd
email: 'deaf.user@test.com'
password: 'password123'

// Muet
email: 'mute.user@test.com'
password: 'password123'

// Mobilité réduite
email: 'motor.user@test.com'
password: 'password123'

// Générique
email: 'test@example.com'
password: 'password123'
```

**Note :** Adapter selon votre système d'authentification réel.

---

## 📈 Statistiques

- **Total tests :** 29
- **Couverture :** 
  - Pages : 3/3 (Accessibility, VoiceTranscription, Login)
  - APIs : 7/8 routes d'accessibilité
  - Profils : 4/4 (Aveugle, Sourd, Muet, Moteur)
- **Temps d'exécution estimé :** ~5-10 minutes

---

## 🚨 Notes Importantes

1. **Tests séquentiels** : Les tests s'exécutent un par un (workers: 1) pour éviter les conflits
2. **Microphone** : Les tests d'enregistrement sont simulés (pas de vrai micro)
3. **TTS** : La synthèse vocale est désactivée pendant les tests (speak: false)
4. **Timeouts** : Augmentés à 5000ms pour les éléments lents
5. **Screenshots** : Pris automatiquement en cas d'échec

---

## 🔄 CI/CD Integration

Pour intégrer dans votre CI/CD :

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-python@v4
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          cd frontend-react && npm install
          
      - name: Start backend
        run: python src/web/app.py &
        
      - name: Install Playwright
        run: cd frontend-react && npx playwright install --with-deps
        
      - name: Run tests
        run: cd frontend-react && npm run test:e2e
        
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend-react/playwright-report/
```

---

## 📚 Documentation Playwright

- [Documentation officielle](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Version :** 1.0.0  
**Date :** 11 décembre 2025  
**Auteur :** IAPosteManager Team
