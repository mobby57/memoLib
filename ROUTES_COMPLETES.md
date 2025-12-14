# 📋 Routes Complètes - SecureVault v2.2

## 🔐 Authentification

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/login` | GET | Page de connexion | ✅ |
| `/api/login` | POST | Connexion utilisateur | ✅ |
| `/logout` | GET | Déconnexion | ✅ |
| `/api/verify-password` | POST | Vérifier mot de passe | ✅ |

## 🏠 Pages Principales

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/` | GET | Navigation principale | ✅ |
| `/setup` | GET | Configuration initiale | ✅ |
| `/dashboard` | GET | Dashboard | ✅ |
| `/nav` | GET | Navigation | ✅ |

## ✉️ Emails - Pages

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/send` | GET | Page envoi simple | ✅ |
| `/simple` | GET | Page envoi simple | ✅ |
| `/composer` | GET | Compositeur IA | ✅ |
| `/compose` | GET | Composition | ✅ |
| `/generator` | GET | Générateur | ✅ |
| `/history` | GET | Historique emails | ✅ |
| `/editor` | GET | Éditeur rich text | ✅ |
| `/smart` | GET | Compositeur smart | ✅ |

## 📧 Emails - API

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/send-email` | POST | **Envoyer email** | ✅ |
| `/api/email/send` | POST | Envoyer email (alt) | ✅ |
| `/api/email/history` | GET | Historique emails | ✅ |
| `/api/email-history` | GET | Historique emails (alt) | ✅ |
| `/api/emails/draft` | POST | Sauvegarder brouillon | ✅ |

## 🤖 IA - Génération

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/generate-email` | POST | Générer email simple | ✅ |
| `/api/generate-content` | POST | **Générer contenu IA** | ✅ |
| `/api/generate-smart-email` | POST | Générer email smart | ✅ |
| `/api/ai/generate` | POST | Générer avec IA | ✅ |

## 📋 Templates

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/templates` | GET | Page templates | ✅ |
| `/api/templates` | GET | Liste templates | ✅ |
| `/api/templates` | POST | Créer template | ✅ |
| `/api/templates/<id>` | DELETE | Supprimer template | ✅ |
| `/api/templates/search` | GET | Rechercher templates | ✅ |

## ⚙️ Configuration

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/save-gmail` | POST | **Sauvegarder Gmail** | ✅ |
| `/api/save-openai` | POST | Sauvegarder OpenAI | ✅ |
| `/api/check-credentials` | GET | Vérifier credentials | ✅ |
| `/api/delete-credentials` | POST | Supprimer credentials | ✅ |
| `/api/export-backup` | POST | Exporter backup | ✅ |

## 👥 Utilisateurs & Admin

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/admin` | GET | Page admin | ✅ |
| `/api/admin/users` | GET | Liste utilisateurs | ✅ |
| `/api/admin/users` | POST | Créer utilisateur | ✅ |
| `/api/admin/analytics` | GET | Analytics admin | ✅ |
| `/api/user/profile` | GET | Profil utilisateur | ✅ |

## 📊 Analytics & Stats

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/stats` | GET | Statistiques | ✅ |
| `/api/audit/logs` | GET | Logs audit | ✅ |
| `/metrics` | GET | Métriques Prometheus | ✅ |

## 🎤 Vocal & Accessibilité

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/agent` | GET | Agent vocal | ✅ |
| `/api/text-to-speech` | POST | Synthèse vocale | ✅ |
| `/api/speech-to-text` | POST | Reconnaissance vocale | ✅ |
| `/api/voice/speak` | POST | Parler (TTS) | ⚠️ |
| `/api/transcribe-audio` | POST | Transcrire audio | ✅ |

## 📁 Documents

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/analyze-documents` | POST | Analyser documents | ✅ |

## 📇 Destinataires

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/destinataires` | GET | Liste destinataires | ✅ |
| `/api/destinataires` | POST | Ajouter destinataire | ✅ |
| `/api/destinataires/<id>` | PUT | Modifier destinataire | ✅ |
| `/api/destinataires/<id>` | DELETE | Supprimer destinataire | ✅ |
| `/api/contacts` | GET | Liste contacts | ✅ |

## 🔄 Workflows & Automation

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/automation` | GET | Page automation | ✅ |
| `/api/workflows` | GET | Liste workflows | ✅ |
| `/api/schedule-email` | POST | Programmer email | ✅ |
| `/api/schedule/email` | POST | Programmer email (alt) | ⚠️ |
| `/api/scheduled-emails` | GET | Emails programmés | ✅ |
| `/api/create-campaign` | POST | Créer campagne | ✅ |

## 🔒 Sécurité

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/security` | GET | Page sécurité | ✅ |
| `/api/2fa/setup` | POST | Setup 2FA | ⚠️ |

## 🔧 Système

| Route | Méthode | Description | Status |
|-------|---------|-------------|--------|
| `/api/health` | GET | Health check | ✅ |
| `/api/session/validate` | GET | Valider session | ✅ |
| `/favicon.ico` | GET | Favicon | ✅ |

## 📊 Résumé

### Total Routes: **73**

#### Par Catégorie
- 🔐 Authentification: 4
- 🏠 Pages: 4
- ✉️ Emails Pages: 8
- 📧 Emails API: 5
- 🤖 IA: 4
- 📋 Templates: 5
- ⚙️ Configuration: 5
- 👥 Admin: 4
- 📊 Stats: 3
- 🎤 Vocal: 5
- 📁 Documents: 1
- 📇 Destinataires: 5
- 🔄 Automation: 6
- 🔒 Sécurité: 2
- 🔧 Système: 3

#### Par Méthode
- GET: 35
- POST: 37
- PUT: 1
- DELETE: 2

#### Par Status
- ✅ Fonctionnel: 70
- ⚠️ Optionnel: 3

## 🎯 Routes Principales (Usage Quotidien)

### Workflow Standard
```
1. /login → Connexion
2. / → Navigation
3. /composer → Générer email
4. /api/generate-content → IA génère
5. /api/send-email → Envoyer
6. /history → Voir historique
```

### Configuration
```
1. /api/save-gmail → Config Gmail
2. /api/save-openai → Config OpenAI
3. /api/check-credentials → Vérifier
```

### Templates
```
1. /templates → Page templates
2. /api/templates (GET) → Liste
3. /api/templates (POST) → Créer
4. /api/templates/<id> (DELETE) → Supprimer
```

## 🔑 Routes Critiques

### Authentification
- `/api/login` - **Stocke MASTER_PASSWORD_CACHE**
- `/logout` - **Efface MASTER_PASSWORD_CACHE**

### Envoi Email
- `/api/send-email` - **Utilise MASTER_PASSWORD_CACHE**

### Configuration
- `/api/save-gmail` - **Chiffre credentials avec mot de passe maître**

## ⚠️ Routes Dupliquées

| Route 1 | Route 2 | Action |
|---------|---------|--------|
| `/send` | `/simple` | Même page | ✅ OK |
| `/api/send-email` | `/api/email/send` | Même fonction | ⚠️ Unifier |
| `/api/email-history` | `/api/email/history` | Même fonction | ⚠️ Unifier |
| `/api/schedule-email` | `/api/schedule/email` | Même fonction | ⚠️ Unifier |

## 🚀 Routes à Tester

### Priorité 1 (Critique)
- [x] `/api/login`
- [x] `/api/send-email`
- [ ] `/api/save-gmail`
- [ ] `/api/generate-content`

### Priorité 2 (Important)
- [ ] `/api/templates`
- [ ] `/api/email-history`
- [ ] `/composer`
- [ ] `/history`

### Priorité 3 (Optionnel)
- [ ] `/api/2fa/setup`
- [ ] `/api/voice/speak`
- [ ] `/api/analyze-documents`
- [ ] `/automation`

## 📝 Notes

**Routes fonctionnelles:** Toutes les routes principales sont opérationnelles
**Routes optionnelles:** Nécessitent ENHANCED_FEATURES = True
**Routes dupliquées:** À nettoyer pour simplifier l'API
**Cache mémoire:** MASTER_PASSWORD_CACHE utilisé par login et send-email
