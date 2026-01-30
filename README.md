# 🚀 IA POSTE MANAGER

> **Plateforme SaaS multi-canal pour cabinets d'avocats** — Gestion intelligente des communications clients (Email, WhatsApp, SMS, Voice, Slack, Teams...)

[![CI/CD](https://github.com/mobby57/memoLib/workflows/Production%20CI/CD/badge.svg)](https://github.com/mobby57/memoLib/actions)
[![Coverage](https://img.shields.io/badge/coverage-0%25-red)](https://github.com/mobby57/memoLib)
[![License](https://img.shields.io/badge/license-Proprietary-blue)](./LICENSE)

---

## 📋 Vue d'ensemble

**IA Poste Manager** centralise tous les canaux de communication d'un cabinet d'avocats :

- ✅ **12 canaux** : Email, WhatsApp, SMS, Voice, Slack, Teams, LinkedIn, Twitter, Forms, Documents, Declan, Internal
- ✅ **Traitement IA** : Résumé automatique, catégorisation, détection d'urgence, extraction d'entités
- ✅ **Auto-linking** : Association automatique client/dossier par email/téléphone
- ✅ **Audit RGPD** : Trail immutable, consentements, export/suppression données
- ✅ **Alertes temps réel** : WebSocket, notifications urgentes, escalade

---

## 🏗️ Architecture

```
Canaux externes → Webhooks → MultiChannelService → [IA + Audit + Notifications] → PostgreSQL → Dashboard
```

**Stack technique :**

- **Frontend :** Next.js 14 (App Router), React, TailwindCSS
- **Backend :** Next.js API Routes, Prisma ORM
- **Base de données :** PostgreSQL (Azure/Vercel)
- **IA :** OpenAI GPT-4, Azure OpenAI
- **Déploiement :** Vercel (frontend), Azure (services)
- **CI/CD :** GitHub Actions

---

## 🚀 Démarrage rapide

### Prérequis

```bash
Node.js 20+
PostgreSQL 15+
npm ou pnpm
```

### Installation

```bash
# Cloner le repo
git clone https://github.com/mobby57/memoLib.git
cd memoLib

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Migrer la base de données
npx prisma migrate deploy
npx prisma generate

# Démarrer en dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📡 Configuration des canaux

### Email

```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@memoLib.com
```

### WhatsApp

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_VERIFY_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=123456789
```

### SMS/Voice (Twilio)

```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
```

### Slack

```env
SLACK_BOT_TOKEN=xoxb-xxxxx
SLACK_SIGNING_SECRET=xxxxx
```

### Teams

```env
TEAMS_APP_ID=xxxxx
TEAMS_APP_SECRET=xxxxx
```

---

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Tests E2E
npm run test:e2e

# Tests d'intégration
npm run test:integration
```

---

## 📚 Documentation

- [Architecture système complète](./docs/SYSTEM_ARCHITECTURE_REAL.md)
- [Diagrammes Mermaid](./docs/SYSTEM_DIAGRAMS.md)
- [Guide de test rapide](./docs/QUICK_TEST_GUIDE.md)
- [Plan d'action immédiat](./docs/ACTION_PLAN_IMMEDIATE.md)
- [Système multi-canal](./docs/MULTICHANNEL_SYSTEM.md)
- [CI/CD officielle (schéma cible)](./docs/CI-CD.md)
- [Guide des environnements](./docs/ENVIRONMENT_GUIDE.md)
- [Gestion des doublons et regroupement](./docs/DATA_DEDUPLICATION.md)

### API interne: Dedup Check

Endpoint d’analyse et d’ingestion dédup:

- Chemin: /api/tools/dedup-check (POST)
- Payload:
  - email (optionnel)
  - firstName (requis)
  - lastName (requis)
  - caseTitle (requis en mode commit)
  - docName (requis en mode commit)
  - docContentBase64 (optionnel pour dry-run, requis en mode commit)
  - mode: "dry-run" (défaut) ou "commit"
  - threshold: nombre entre 0 et 1 (défaut 0.8)

Réponse: nom normalisé, similarité, hash document; en mode commit, renvoie `clientId`, `caseId`, `documentId`, `created`.

Exemple:

```bash
curl -X POST http://localhost:3000/api/tools/dedup-check \
	-H 'Content-Type: application/json' \
	-d '{
		"email":"a@example.com",
		"firstName":"Jean",
		"lastName":"Dupont",
		"caseTitle":"Dossier Immigration",
		"docName":"note.txt",
		"docContentBase64":"aGVsbG8=",
		"mode":"dry-run",
		"threshold":0.8
	}'
```

---

## 🔐 Sécurité

- ✅ Validation signature webhooks (HMAC-SHA256, JWT)
- ✅ Secrets dans Azure Key Vault
- ✅ Audit trail immutable (chaînage cryptographique)
- ✅ Conformité RGPD (consentements, export, suppression)
- ✅ Chiffrement E2E des données sensibles

---

## 🚀 Déploiement

### Production (Vercel)

```bash
# Déploiement automatique via GitHub
git push origin main

# Ou déploiement manuel
npx vercel --prod
```

### Azure (optionnel)

```bash
# Via GitHub Actions
# Workflow: .github/workflows/azure-deploy.yml
```

---

## 📊 Monitoring

- **Vercel Dashboard** : Métriques temps réel
- **Logs** : `vercel logs --follow`
- **Health check** : `GET /api/health`
- **Stats canaux** : `GET /api/multichannel/stats`

---

## 🤝 Contribution

Ce projet est **propriétaire**. Contributions internes uniquement.

---

## 📞 Support

- 📧 Email : support@memoLib.com
- 📚 Docs : https://docs.memoLib.com
- 🐛 Issues : https://github.com/mobby57/memoLib/issues

---

## 📄 Licence

Propriétaire © 2026 IA Poste Manager
