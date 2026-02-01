# MemoLib CESEDA - Démarrage Rapide ⚡

> **Première IA juridique CESEDA qui respecte le serment d'avocat**

## 🎯 Vision

Gérez **3x plus de dossiers CESEDA** sans sacrifier la qualité juridique.

**3 Piliers:**

1. **IA Prédictive CESEDA** - 87% précision, 2 min vs 3h recherche
2. **Alertes Délais** - Zéro OQTF manquée (SMS/Email/WhatsApp)
3. **Génération Documents IA** - Pre-draft en 30 sec, avocat valide

## 🚀 Installation (5 minutes)

### Prérequis

- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/mobby57/memoLib.git
cd memoLib

# 2. Installer toutes les dépendances
# Via VS Code: Run Task "Install: All Dependencies"
# Ou manuellement:
cd src/frontend && npm install --legacy-peer-deps
cd ../.. && pip install -r requirements.txt

# 3. Configurer les variables d'environnement
cp .env.example .env.local

# Éditer .env.local avec vos clés:
# - DATABASE_URL="postgresql://..."
# - NEXTAUTH_SECRET="..."
# - AZURE_AD_CLIENT_ID="..."
# - OPENAI_API_KEY="sk-..."

# 4. Migrer la base de données
cd src/frontend
npx prisma migrate dev

# 5. Démarrer tout
# Via VS Code: Run Task "Full Stack: Start All"
# Ou manuellement:
npm run dev &                    # Frontend sur http://localhost:3000
cd ../..
FLASK_APP=backend-python/app.py python -m flask run --debug --port 5000 &  # Backend Flask
```

## 📂 Structure Simplifiée

```
memoLib/
├── src/frontend/          # Next.js 16 (App Router)
│   ├── app/
│   │   ├── page.tsx       # Homepage principale
│   │   ├── ceseda/        # 🎯 Landing page CESEDA
│   │   └── api/           # Routes API (auth, webhooks, AI)
│   └── lib/               # Services, hooks, utils
├── backend-python/        # Flask backend (dev)
│   └── app.py             # Endpoints IA, CESEDA, emails
├── src/backend/           # FastAPI backend (alternative)
├── prisma/                # Schema DB
└── docs/                  # Documentation détaillée
```

## 🔑 Variables Essentielles

**Minimum pour démarrer:**

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/memolib"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Production (CESEDA complet):**

```env
# Azure AD (SSO avocats)
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."
AZURE_AD_TENANT_ID="..."

# IA
OPENAI_API_KEY="sk-..."  # GPT-4 pour génération documents

# Alertes
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+..."

# Microsoft Graph (emails)
GRAPH_CLIENT_ID="..."
GRAPH_CLIENT_SECRET="..."
```

## 📊 Commandes Utiles

```bash
# Démarrer frontend seul
npm run dev                     # → http://localhost:3000

# Démarrer backend seul
python -m flask run --debug     # → http://localhost:5000

# Tests
npm test                        # Frontend
pytest                          # Backend

# Build production
npm run build
npm run start
```

## 🧪 Vérifier Installation

```bash
# Frontend
curl http://localhost:3000

# Backend Flask
curl http://localhost:5000/api/health
# Devrait retourner: {"status": "healthy", "service": "memoLib Flask API"}

# Base de données
npx prisma studio              # Interface DB graphique → http://localhost:5555
```

## 🚢 Déploiement Production

**Option 1: Vercel (Recommandé - 10 min)**

```bash
npm i -g vercel
vercel --prod
# Configurer variables env dans dashboard Vercel
```

**Option 2: Railway (Ultra-rapide - 8 min)**

```bash
railway login
railway init
railway up
```

**Option 3: Azure (Enterprise - 15 min)**

```bash
az webapp up --name memolib-ceseda --runtime "NODE:18-lts"
```

Voir [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md) pour détails complets.

## 📚 Documentation Complète

- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Variables Env:** [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)
- **Vision Marketing:** [VISION_MARKETING.md](VISION_MARKETING.md)
- **Plan Nettoyage:** [CLEANUP_PLAN.md](CLEANUP_PLAN.md)
- **Guide Déploiement:** [DEPLOY_SIMPLE.md](DEPLOY_SIMPLE.md)

## 🎯 Pages Clés

- **Homepage:** http://localhost:3000 (à mettre à jour vers CESEDA focus)
- **Landing CESEDA:** http://localhost:3000/ceseda ✨ (nouvelle page optimisée)
- **API Health:** http://localhost:5000/api/health

## 🐛 Problèmes Courants

**TypeScript build lent?**

```bash
# Déjà optimisé avec 16GB RAM allocation
NODE_OPTIONS=--max-old-space-size=16384 npx tsc --noEmit
```

**Prisma schema errors?**

```bash
npx prisma generate
npx prisma migrate dev
```

**Backend Flask ne démarre pas?**

```bash
export FLASK_APP=backend-python/app.py
export FLASK_ENV=development
python -m flask run --debug --port 5000
```

## 📞 Support

- **Issues:** https://github.com/mobby57/memoLib/issues
- **Email:** support@memolib.fr
- **Docs API:** http://localhost:3000/api/docs

---

**Fait avec ❤️ pour les avocats CESEDA | Hébergé en France 🇫🇷**
