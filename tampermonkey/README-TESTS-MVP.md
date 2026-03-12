# 🧪 Guide Tests MVP - Scripts Tampermonkey

**Date**: 27 février 2026  
**Version**: 2.0  
**Services testés**: 10

---

## 📋 SERVICES TESTÉS

### ✅ Services Actifs (10)

1. **🔐 Authentification** (Auth)
   - Register
   - Login
   - JWT Token

2. **📁 Cases** (Dossiers)
   - Create Case
   - Get Cases
   - Update Status
   - Get Timeline

3. **👥 Clients**
   - Create Client
   - Get Clients
   - Get Client Detail

4. **📧 Emails**
   - Create Template
   - Get Templates
   - Manual Scan

5. **🔔 Notifications**
   - Get Notifications
   - Get Unread Count

6. **📊 Dashboard & Stats**
   - Get Dashboard
   - Get Stats
   - Get Alerts

7. **🔍 Search**
   - Text Search
   - Semantic Search

8. **📅 Calendar**
   - Create Event
   - Get Events

9. **💰 Billing**
   - Get Time Entries
   - Get Invoices

10. **🔗 Webhooks**
    - Get Webhooks
    - Create Webhook

---

## 🚀 INSTALLATION

### Étape 1: Installer Tampermonkey

#### Chrome / Edge
```
1. Aller sur: https://www.tampermonkey.net/
2. Cliquer sur "Download" pour Chrome/Edge
3. Installer l'extension
```

#### Firefox
```
1. Aller sur: https://addons.mozilla.org/firefox/addon/tampermonkey/
2. Cliquer sur "Add to Firefox"
```

### Étape 2: Installer le Script

```
1. Ouvrir Tampermonkey Dashboard (icône dans la barre)
2. Cliquer sur l'onglet "Utilities"
3. Coller l'URL du script OU
4. Aller dans "+" (Create new script)
5. Copier-coller le contenu de memolib-mvp-complete-test.user.js
6. Ctrl+S pour sauvegarder
```

### Étape 3: Activer le Script

```
1. Le script s'active automatiquement sur:
   - http://localhost:5078/*
   - http://127.0.0.1:5078/*
2. Vérifier que le script est activé (toggle ON)
```

---

## 🎯 UTILISATION

### Lancement Automatique

```bash
# 1. Démarrer l'API
cd MemoLib.Api
dotnet run

# 2. Ouvrir le navigateur
start http://localhost:5078

# 3. Le bouton "🚀 Lancer Tests MVP" apparaît en bas à droite
# 4. Cliquer sur le bouton
# 5. Les tests s'exécutent automatiquement
```

### Résultats

Le script affiche:
- ✅ **Console**: Logs détaillés de chaque test
- 📊 **Panel**: Résumé visuel des résultats
- 🔔 **Notifications**: Alertes de progression

---

## 📊 INTERPRÉTATION DES RÉSULTATS

### Codes de Statut

| Code | Signification | Action |
|------|---------------|--------|
| 200 | ✅ OK | Test réussi |
| 201 | ✅ Created | Ressource créée |
| 202 | ✅ Accepted | Traitement en cours |
| 400 | ❌ Bad Request | Vérifier les données |
| 401 | ❌ Unauthorized | Problème d'authentification |
| 404 | ❌ Not Found | Ressource inexistante |
| 500 | ❌ Server Error | Erreur serveur |

### Taux de Réussite

| Taux | Verdict | Action |
|------|---------|--------|
| 100% | 🟢 Excellent | Tous les services fonctionnent |
| 80-99% | 🟡 Bon | Quelques services à vérifier |
| 50-79% | 🟠 Moyen | Plusieurs problèmes |
| <50% | 🔴 Critique | Révision nécessaire |

---

## 🔧 CONFIGURATION

### Modifier l'URL de l'API

```javascript
// Dans le script, ligne 18
const API_BASE = 'http://localhost:5078/api';

// Changer pour:
const API_BASE = 'https://votre-api.com/api';
```

### Ajouter des Tests

```javascript
async function testMonService() {
    log('🎯 Test Service: Mon Service', 'info');

    try {
        const res = await apiCall('/mon-endpoint');
        recordTest('MonService', 'Test 1', res.status === 200, `Status: ${res.status}`);
    } catch (e) {
        recordTest('MonService', 'Test 1', false, e.message);
    }
}

// Ajouter dans runAllTests()
await testMonService();
```

---

## 🐛 DÉPANNAGE

### Problème: Script ne se charge pas

```
Solution:
1. Vérifier que Tampermonkey est activé
2. Vérifier l'URL (doit être localhost:5078)
3. Rafraîchir la page (F5)
4. Vérifier la console (F12) pour erreurs
```

### Problème: Tests échouent tous

```
Solution:
1. Vérifier que l'API est démarrée (dotnet run)
2. Vérifier l'URL de l'API dans le script
3. Vérifier les logs de l'API
4. Tester manuellement un endpoint avec curl
```

### Problème: Authentification échoue

```
Solution:
1. Vérifier que la base de données existe
2. Créer un utilisateur manuellement:
   POST /api/auth/register
   {
     "email": "test@example.com",
     "password": "Test123!",
     "role": "Owner"
   }
3. Vérifier les logs de l'API
```

### Problème: CORS Error

```
Solution:
1. Vérifier appsettings.json:
   "Cors": {
     "AllowedOrigins": ["http://localhost:5078"]
   }
2. Redémarrer l'API
```

---

## 📈 MÉTRIQUES ATTENDUES

### MVP Minimum (Phase 1)

| Service | Tests | Taux Attendu |
|---------|-------|--------------|
| Auth | 2 | 100% |
| Cases | 4 | 100% |
| Clients | 3 | 100% |
| Emails | 3 | 80% (scan peut échouer) |
| Notifications | 2 | 100% |
| **TOTAL** | **14** | **≥90%** |

### MVP Complet (Phase 2)

| Service | Tests | Taux Attendu |
|---------|-------|--------------|
| Auth | 2 | 100% |
| Cases | 4 | 100% |
| Clients | 3 | 100% |
| Emails | 3 | 80% |
| Notifications | 2 | 100% |
| Dashboard | 3 | 100% |
| Search | 2 | 80% |
| Calendar | 2 | 100% |
| Billing | 2 | 100% |
| Webhooks | 2 | 100% |
| **TOTAL** | **25** | **≥85%** |

---

## 🎯 SCÉNARIOS DE TEST

### Scénario 1: Nouveau Utilisateur

```
1. Register → Login
2. Create Client
3. Create Case
4. Get Dashboard
5. Get Notifications

Résultat attendu: 5/5 tests réussis
```

### Scénario 2: Workflow Complet

```
1. Login
2. Create Client
3. Create Case (lié au client)
4. Update Case Status → IN_PROGRESS
5. Create Calendar Event
6. Get Timeline
7. Update Case Status → CLOSED

Résultat attendu: 7/7 tests réussis
```

### Scénario 3: Communication

```
1. Login
2. Create Email Template
3. Manual Email Scan
4. Get Notifications
5. Create Webhook

Résultat attendu: 5/5 tests réussis
```

---

## 📊 RAPPORT DE TEST

### Format Console

```
[MemoLib MVP] 🔐 Test Service: Authentification
[MemoLib MVP] ✅ Auth - Register
[MemoLib MVP] ✅ Auth - Login
[MemoLib MVP] 📁 Test Service: Cases
[MemoLib MVP] ✅ Cases - Create Case
[MemoLib MVP] ✅ Cases - Get Cases
...
[MemoLib MVP] 📊 RÉSULTATS DES TESTS MVP
[MemoLib MVP] Total: 25 | Passed: 23 | Failed: 2
[MemoLib MVP] Taux de réussite: 92.00%
```

### Format Panel

```
┌─────────────────────────────────┐
│ 🚀 MemoLib MVP - Tests          │
│ 23/25 tests réussis (92%)       │
├─────────────────────────────────┤
│ Auth                            │
│ ✅ 2 | ❌ 0 | 100%              │
│ • ✅ Register                   │
│ • ✅ Login                      │
├─────────────────────────────────┤
│ Cases                           │
│ ✅ 4 | ❌ 0 | 100%              │
│ • ✅ Create Case                │
│ • ✅ Get Cases                  │
│ • ✅ Update Status              │
│ • ✅ Get Timeline               │
└─────────────────────────────────┘
```

---

## 🚀 COMMANDES RAPIDES

### Lancer Tests Complets

```bash
# Terminal 1: API
cd MemoLib.Api
dotnet run

# Terminal 2: Ouvrir navigateur
start http://localhost:5078

# Cliquer sur "🚀 Lancer Tests MVP"
```

### Tests Manuels (Alternative)

```bash
# Utiliser les fichiers .http
code test-all-features.http

# Ou curl
curl -X POST http://localhost:5078/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"Owner"}'
```

---

## 📝 CHECKLIST PRÉ-TEST

- [ ] API démarrée (dotnet run)
- [ ] Base de données créée (memolib.db existe)
- [ ] Tampermonkey installé
- [ ] Script activé
- [ ] Navigateur sur http://localhost:5078
- [ ] Console ouverte (F12) pour voir les logs

---

## 🎉 SUCCÈS!

Si tous les tests passent:
- ✅ Tous les services MVP fonctionnent
- ✅ L'API est prête pour la production
- ✅ Vous pouvez déployer en toute confiance

---

**Dernière mise à jour**: 27 février 2026  
**Auteur**: MemoLib Team
