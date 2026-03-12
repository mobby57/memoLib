# 🎯 Stratégie Tampermonkey pour MemoLib

## 🏗️ Vision Architecturale

### Principe : Séparation des Préoccupations

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMOLIB CORE                              │
│  (.NET Backend + wwwroot/demo.html)                          │
│  ✅ Production-ready                                         │
│  ✅ Authentification JWT                                     │
│  ✅ API complète                                             │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
                            │ API REST
                            │
┌─────────────────────────────────────────────────────────────┐
│              EXTENSIONS TAMPERMONKEY                         │
│  (Scripts intelligents pour améliorer l'UX)                  │
│  ✅ Démos automatiques                                       │
│  ✅ Intégrations externes                                    │
│  ✅ Raccourcis productivité                                  │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Scripts Tampermonkey à Créer

### 1. **Demo Automation** (EXISTANT ✅)
**Fichier:** `tampermonkey-demo.user.js`
**Usage:** Démo commerciale automatique
**Valeur:** Présentation client en 1 clic

### 2. **Gmail Integration** (NOUVEAU 🆕)
**Fichier:** `tampermonkey-gmail-to-memolib.user.js`
**Usage:** Bouton "Envoyer à MemoLib" dans Gmail
**Valeur:** Ingestion email depuis Gmail directement

```javascript
// @match        https://mail.google.com/*
// Ajoute un bouton dans l'interface Gmail
// Envoie l'email sélectionné vers MemoLib API
```

### 3. **Client Portal Enhancer** (NOUVEAU 🆕)
**Fichier:** `tampermonkey-client-portal-ux.user.js`
**Usage:** Améliore l'UX du portail client
**Valeur:** Raccourcis clavier, auto-save, tooltips

```javascript
// @match        http://localhost:5078/demo.html
// Ajoute raccourcis clavier (Ctrl+S = save)
// Auto-save brouillons
// Tooltips contextuels
```

### 4. **Calendar Sync** (NOUVEAU 🆕)
**Fichier:** `tampermonkey-calendar-sync.user.js`
**Usage:** Sync avec Google Calendar
**Valeur:** Export événements MemoLib → Google Cal

```javascript
// @match        http://localhost:5078/demo.html
// Bouton "Sync Calendar"
// Crée événements Google Cal via API
```

### 5. **Document OCR Helper** (NOUVEAU 🆕)
**Fichier:** `tampermonkey-ocr-helper.user.js`
**Usage:** OCR local avec Tesseract.js
**Valeur:** Extraction texte PDF côté client

```javascript
// @require      https://cdn.jsdelivr.net/npm/tesseract.js
// Drag & drop PDF → OCR → Envoie texte à MemoLib
```

### 6. **Productivity Shortcuts** (NOUVEAU 🆕)
**Fichier:** `tampermonkey-shortcuts.user.js`
**Usage:** Raccourcis clavier avancés
**Valeur:** Navigation rapide

```javascript
// Ctrl+N = Nouveau dossier
// Ctrl+F = Recherche
// Ctrl+E = Nouveau email
// Esc = Fermer modal
```

## ❌ Ce Qu'il NE FAUT PAS Faire

### Anti-Patterns à Éviter

1. **❌ Réécrire le Core dans Tampermonkey**
   - Ne pas recréer l'authentification
   - Ne pas dupliquer la logique métier
   - Ne pas remplacer l'API

2. **❌ Dépendance Critique**
   - MemoLib doit fonctionner SANS Tampermonkey
   - Scripts = bonus, pas requis

3. **❌ Sécurité Compromise**
   - Ne jamais stocker tokens dans scripts
   - Ne pas bypasser l'authentification
   - Respecter CORS et CSP

## 🎯 Architecture Recommandée

### Structure Projet

```
MemoLib.Api/
├── wwwroot/
│   └── demo.html              # Interface principale
├── tampermonkey/              # 🆕 Nouveau dossier
│   ├── README.md              # Guide installation
│   ├── 1-demo-automation.user.js
│   ├── 2-gmail-integration.user.js
│   ├── 3-client-portal-ux.user.js
│   ├── 4-calendar-sync.user.js
│   ├── 5-ocr-helper.user.js
│   └── 6-shortcuts.user.js
└── docs/
    └── TAMPERMONKEY_STRATEGY.md  # Ce fichier
```

### Workflow Développement

```bash
# 1. Développer le Core (.NET)
dotnet run

# 2. Tester sans Tampermonkey
# → Doit fonctionner à 100%

# 3. Ajouter scripts Tampermonkey
# → Améliore l'expérience

# 4. Distribuer
# → Core = obligatoire
# → Scripts = optionnels
```

## 🚀 Plan d'Implémentation

### Phase 1 : Fondations (Semaine 1)
- [x] Script démo existant (déjà fait)
- [ ] Créer dossier `tampermonkey/`
- [ ] Documentation installation
- [ ] Template de base pour nouveaux scripts

### Phase 2 : Intégrations (Semaine 2)
- [ ] Gmail integration
- [ ] Calendar sync
- [ ] OCR helper

### Phase 3 : Productivité (Semaine 3)
- [ ] Shortcuts avancés
- [ ] Client portal UX
- [ ] Auto-save brouillons

### Phase 4 : Distribution (Semaine 4)
- [ ] Package scripts
- [ ] Guide utilisateur
- [ ] Vidéo démo

## 📊 Matrice de Décision

| Fonctionnalité | Core .NET | Tampermonkey | Justification |
|----------------|-----------|--------------|---------------|
| Authentification | ✅ | ❌ | Sécurité critique |
| API REST | ✅ | ❌ | Backend obligatoire |
| Interface base | ✅ | ❌ | Doit fonctionner seul |
| Démo auto | ❌ | ✅ | Bonus commercial |
| Gmail sync | ❌ | ✅ | Intégration externe |
| Raccourcis | ❌ | ✅ | UX enhancement |
| OCR local | ❌ | ✅ | Feature optionnelle |
| Calendar sync | ❌ | ✅ | Intégration externe |

## 🎓 Bonnes Pratiques

### 1. Versioning
```javascript
// ==UserScript==
// @name         MemoLib - Gmail Integration
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/.../script.user.js
// ==/UserScript==
```

### 2. Configuration
```javascript
// Configuration centralisée
const CONFIG = {
    API_BASE: 'http://localhost:5078',
    TIMEOUT: 5000,
    DEBUG: true
};
```

### 3. Error Handling
```javascript
async function sendToMemoLib(email) {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/api/ingest/email`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(email)
        });
        if (!response.ok) throw new Error('API Error');
        showNotification('✅ Email envoyé à MemoLib');
    } catch (error) {
        console.error('MemoLib Error:', error);
        showNotification('❌ Erreur: ' + error.message);
    }
}
```

### 4. UI Non-Intrusive
```javascript
// Ajouter bouton sans casser l'UI existante
function addButton() {
    const btn = document.createElement('button');
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;';
    btn.textContent = '📧 MemoLib';
    document.body.appendChild(btn);
}
```

## 🔐 Sécurité

### Règles Strictes

1. **Tokens JWT**
   ```javascript
   // ✅ BON : Récupérer depuis localStorage
   const token = localStorage.getItem('memolib_token');
   
   // ❌ MAUVAIS : Hardcoder
   const token = 'eyJhbGciOiJIUzI1NiIs...';
   ```

2. **HTTPS Only**
   ```javascript
   // @match        https://mail.google.com/*
   // @match        https://localhost:5078/*  (dev)
   // @match        https://memolib.com/*     (prod)
   ```

3. **Permissions Minimales**
   ```javascript
   // @grant        GM_xmlhttpRequest  // Seulement si nécessaire
   // @grant        GM_notification    // Seulement si nécessaire
   ```

## 📈 Métriques de Succès

### KPIs

- **Adoption:** % utilisateurs avec scripts installés
- **Usage:** Nombre d'actions via Tampermonkey/jour
- **Satisfaction:** NPS des utilisateurs avec scripts
- **Performance:** Temps gagné par utilisateur/jour

### Objectifs

- 30% utilisateurs adoptent au moins 1 script
- 50 actions/jour via Gmail integration
- +2 points NPS avec scripts
- 15 min gagnées/jour/utilisateur

## 🎯 Conclusion

### Décision Architecturale

**OUI aux scripts Tampermonkey, MAIS:**

1. ✅ Core MemoLib reste autonome
2. ✅ Scripts = extensions optionnelles
3. ✅ Focus sur intégrations externes
4. ✅ Amélioration UX, pas remplacement
5. ✅ Distribution séparée

### Prochaines Actions

```bash
# 1. Créer structure
mkdir tampermonkey
cd tampermonkey

# 2. Créer template
cp ../tampermonkey-demo.user.js 1-demo-automation.user.js

# 3. Développer nouveaux scripts
# (voir liste ci-dessus)

# 4. Documenter
echo "# Installation" > README.md

# 5. Tester
# Installer dans Tampermonkey et valider
```

---

**Philosophie:** Tampermonkey = **Couteau Suisse** pour power users, pas une béquille pour un frontend incomplet.
