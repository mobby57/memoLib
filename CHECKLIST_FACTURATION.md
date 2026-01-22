# ✅ CHECKLIST COMPLÈTE - SYSTÈME DE FACTURATION

**Date:** 21 janvier 2026  
**Version:** 1.0

---

## 🎯 DÉVELOPPEMENT (100% COMPLÉTÉ)

### ✅ Option A - Interface Admin Facturation
- [x] Page tenant `/admin/billing` (280 lignes)
- [x] API `/api/billing/plans` (45 lignes)
- [x] API `/api/billing/subscription` (50 lignes)
- [x] API `/api/billing/quotas` (80 lignes)
- [x] Affichage abonnement actuel
- [x] Barres de progression quotas (colorées selon %)
- [x] Comparaison 3 plans (SOLO, CABINET, ENTERPRISE)
- [x] Boutons "S'abonner" / "Changer de plan"

### ✅ Option B - Dashboard SuperAdmin
- [x] Page `/super-admin/dashboard` (250+ lignes)
- [x] API `/api/super-admin/stats` (90 lignes, modifiée)
- [x] 4 KPIs : MRR, ARR, Tenants actifs, Croissance
- [x] Répartition par plan (3 cartes)
- [x] Projections financières (3 490€ → 20K€ → 150K€)
- [x] Mix optimal recommandé
- [x] Barre progression objectif court terme

### ✅ Option C - Quota Enforcement
- [x] Service `src/lib/billing/quota-service.ts` (200+ lignes)
- [x] Middleware `src/middleware/quota-check.ts` (100+ lignes)
- [x] Fonction `checkQuota()` (5 types ressources)
- [x] Fonction `enforceQuota()` (avec QuotaEvent)
- [x] Fonction `incrementUsage()` / `decrementUsage()`
- [x] Niveaux d'alerte : normal, warning, critical, exceeded
- [x] Réponse 402 si quota dépassé
- [x] Headers X-Quota-* pour frontend

### ✅ Option D - Intégration Stripe
- [x] Client `src/lib/billing/stripe-client.ts` (180+ lignes)
- [x] Webhook `/api/webhooks/stripe` (250+ lignes)
- [x] API `/api/billing/checkout` (60+ lignes)
- [x] API `/api/billing/portal` (50+ lignes)
- [x] Script `scripts/sync-stripe-plans.ts` (80 lignes)
- [x] Gestion 6 événements webhook
- [x] Création factures automatique (INV-YYYY-XXXX)
- [x] Conversion centimes → euros
- [x] Vérification signature webhook

### ✅ Base de données
- [x] Migration Prisma réussie (9 nouvelles tables)
- [x] Table Plan (3 plans seedés)
- [x] Table Subscription
- [x] Table Invoice
- [x] Table UsageRecord
- [x] Table TenantUsageMetrics
- [x] Table QuotaEvent
- [x] Table AuditLogEntry
- [x] Table ConsentRecord
- [x] Table DataSubjectRequest

### ✅ Documentation
- [x] CONFIGURATION_STRIPE_COMPLETE.md
- [x] configure-stripe.ps1 (script automatique)
- [x] IMPLEMENTATION_COMPLETE_A_B_C_D.md
- [x] .env.local.example (mis à jour)

---

## ⏳ CONFIGURATION (À FAIRE)

### 1️⃣ Compte Stripe
- [ ] Créer compte sur https://dashboard.stripe.com/register
- [ ] Activer mode Test (toggle en haut à droite)
- [ ] Vérifier compte (email)

### 2️⃣ Clés API
- [ ] Dashboard → Développeurs → Clés API
- [ ] Copier clé secrète (`sk_test_...`)
- [ ] Copier clé publiable (`pk_test_...`)
- [ ] Ajouter dans `.env.local` :
  ```env
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  ```

### 3️⃣ Installation SDK
- [ ] Exécuter : `npm install stripe @stripe/stripe-js`
- [ ] Vérifier : `package.json` contient `stripe` et `@stripe/stripe-js`

### 4️⃣ Création produits Stripe
- [ ] **Option automatique (recommandée)** :
  - [ ] Exécuter : `npx tsx scripts/sync-stripe-plans.ts`
  - [ ] Noter les 6 Price IDs affichés
  
- [ ] **Option manuelle** :
  - [ ] Dashboard → Produits → Ajouter produit
  - [ ] Créer Plan SOLO (49€/mois, 490€/an)
  - [ ] Créer Plan CABINET (349€/mois, 3490€/an)
  - [ ] Créer Plan ENTERPRISE (499€/mois, 4990€/an)
  - [ ] Noter les 6 Price IDs

### 5️⃣ Price IDs dans .env
- [ ] Ajouter dans `.env.local` :
  ```env
  STRIPE_PRICE_SOLO_MONTHLY=price_xxx
  STRIPE_PRICE_SOLO_YEARLY=price_xxx
  STRIPE_PRICE_CABINET_MONTHLY=price_xxx
  STRIPE_PRICE_CABINET_YEARLY=price_xxx
  STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
  STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx
  ```

### 6️⃣ Webhook Configuration

**Option A : Développement local (Stripe CLI)**
- [ ] Installer Stripe CLI : https://stripe.com/docs/stripe-cli
- [ ] Exécuter : `stripe login`
- [ ] Terminal 1 : `npm run dev`
- [ ] Terminal 2 : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Copier webhook secret (`whsec_...`) affiché
- [ ] Ajouter dans `.env.local` :
  ```env
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

**Option B : Production (Dashboard Stripe)**
- [ ] Dashboard → Développeurs → Webhooks
- [ ] Cliquer "Ajouter un endpoint"
- [ ] URL : `https://votre-domaine.com/api/webhooks/stripe`
- [ ] Sélectionner événements :
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `checkout.session.completed`
- [ ] Copier webhook secret
- [ ] Ajouter dans `.env.local`

### 7️⃣ Mise à jour code checkout (si pas déjà fait)
- [ ] Ouvrir `src/app/api/billing/checkout/route.ts`
- [ ] Vérifier que le code utilise `process.env.STRIPE_PRICE_*`
- [ ] Si non, remplacer les placeholders par le nouveau code (voir doc)

---

## 🧪 TESTS (À FAIRE)

### Test 1 : Page Billing
- [ ] Démarrer serveur : `npm run dev`
- [ ] Ouvrir : http://localhost:3000/admin/billing
- [ ] Vérifier :
  - [ ] Abonnement actuel affiché (si existant)
  - [ ] 5 barres quotas visibles (workspaces, dossiers, clients, users, storage)
  - [ ] 3 plans affichés (SOLO, CABINET, ENTERPRISE)
  - [ ] Boutons "S'abonner" présents

### Test 2 : Dashboard SuperAdmin
- [ ] Se connecter en tant que SUPER_ADMIN
- [ ] Ouvrir : http://localhost:3000/super-admin/dashboard
- [ ] Vérifier :
  - [ ] 4 KPIs affichés (MRR, ARR, Tenants, Croissance)
  - [ ] 3 cartes plans (SOLO, CABINET, ENTERPRISE)
  - [ ] Section projections visible
  - [ ] Section mix optimal visible

### Test 3 : Checkout Stripe (Paiement test)
- [ ] Sur `/admin/billing`, cliquer "S'abonner" (plan CABINET)
- [ ] Redirection vers Stripe Checkout
- [ ] Entrer carte test : `4242 4242 4242 4242`
- [ ] Date : 12/28, CVV : 123
- [ ] Email : test@example.com
- [ ] Compléter paiement
- [ ] Vérifier :
  - [ ] Retour sur `/admin/billing?success=true`
  - [ ] Plan CABINET activé
  - [ ] Quotas mis à jour (10 workspaces max, etc.)

### Test 4 : Webhook (Événement Stripe)

**Si Stripe CLI :**
- [ ] Terminal 3 : `stripe trigger invoice.paid`
- [ ] Vérifier terminal 2 : webhook reçu
- [ ] Vérifier console Next.js : traitement OK
- [ ] Prisma Studio : facture créée (table Invoice)

**Si Dashboard Stripe :**
- [ ] Effectuer paiement test (Test 3)
- [ ] Vérifier console Next.js : webhooks reçus
- [ ] Prisma Studio : vérifier tables Subscription + Invoice

### Test 5 : Quota Enforcement
- [ ] Créer workspace via API : `POST /api/workspaces`
- [ ] Si plan SOLO (max 1) et déjà 1 workspace :
  - [ ] Retourne 402 Payment Required
  - [ ] Message : "Quota dépassé (1/1 workspaces)"
  - [ ] Header `X-Quota-Exceeded: true`

### Test 6 : Portail Client Stripe
- [ ] Créer bouton dans UI qui appelle `/api/billing/portal`
- [ ] Cliquer sur bouton
- [ ] Vérifier :
  - [ ] Redirection vers Stripe billing portal
  - [ ] Possibilité changer carte
  - [ ] Possibilité voir factures
  - [ ] Possibilité annuler abonnement

### Test 7 : MRR/ARR Dashboard
- [ ] Après paiement test, ouvrir SuperAdmin dashboard
- [ ] Vérifier :
  - [ ] MRR = 349€ (si 1 Cabinet)
  - [ ] ARR = 4 188€ (349 × 12)
  - [ ] Plan CABINET : 1 abonnement actif
  - [ ] % MRR CABINET = 100%

---

## 🚀 DÉPLOIEMENT (FUTUR)

### Production Stripe
- [ ] Activer compte Stripe (KYC/vérification identité)
- [ ] Passer en mode Live (toggle Dashboard)
- [ ] Créer produits en mode Live (refaire sync script)
- [ ] Configurer webhook production (URL publique)
- [ ] Remplacer clés Test par clés Live :
  ```env
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_live_...
  ```

### Base de données
- [ ] Migrer de SQLite vers PostgreSQL (production)
- [ ] Configurer backups automatiques
- [ ] Configurer read replicas (si haute disponibilité)

### Frontend
- [ ] Build production : `npm run build`
- [ ] Tester build local : `npm start`
- [ ] Déployer sur Vercel/Cloudflare Pages/autre

### Monitoring
- [ ] Configurer Stripe webhooks monitoring
- [ ] Alertes paiements échoués (email/Slack)
- [ ] Dashboard analytics (MRR trends, churn, etc.)

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs à suivre (Dashboard SuperAdmin)
- [ ] **MRR** : Objectif court terme 3 490€ (10 × Cabinet)
- [ ] **ARR** : Objectif 41 880€ (MRR × 12)
- [ ] **Taux croissance** : Objectif +15%/mois
- [ ] **Taux conversion** : Essais → Abonnements payants
- [ ] **Churn rate** : % annulations (objectif <5%)

### Quotas à surveiller
- [ ] % moyen utilisation quotas (objectif 60-80%)
- [ ] Nombre alertes quota par jour
- [ ] Temps moyen avant upgrade (jours)

### Performances techniques
- [ ] Temps traitement webhook (<500ms)
- [ ] Disponibilité API (>99.9%)
- [ ] Latence page billing (<200ms)

---

## 🎯 RÉSUMÉ ÉTAT ACTUEL

### ✅ COMPLÉTÉ (100%)
- Développement backend complet (Option A, B, C, D)
- Base de données migrée et seedée
- Documentation complète
- Scripts d'automatisation

### ⏳ EN ATTENTE (Configuration)
- Installation SDK Stripe
- Création compte + clés API
- Configuration webhook
- Tests de validation

### ⏱️ TEMPS ESTIMÉ CONFIGURATION
- **Minimum** : 30 minutes (mode automatique avec script)
- **Maximum** : 1 heure (mode manuel avec tests)

---

## 💡 AIDE RAPIDE

### Problèmes fréquents

**"npm ERR! peer dependencies"**
```bash
npm install --legacy-peer-deps stripe @stripe/stripe-js
```

**"Webhook signature invalid"**
- Vérifier que `STRIPE_WEBHOOK_SECRET` dans `.env.local` est correct
- Vérifier que Stripe CLI est bien démarré (`stripe listen`)

**"Price ID not found"**
- Vérifier que les Price IDs dans `.env.local` sont corrects
- Re-exécuter `npx tsx scripts/sync-stripe-plans.ts`

**"402 Payment Required" non désiré**
- Vérifier que `plan.maxWorkspaces` n'est pas -1 pour Enterprise
- Vérifier `tenant.currentWorkspaces` dans la base

### Commandes utiles

```bash
# Démarrer serveur
npm run dev

# Prisma Studio (visualiser DB)
npx prisma studio

# Stripe CLI (webhooks locaux)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Tester événement
stripe trigger invoice.paid

# Logs webhook
stripe logs tail

# Build production
npm run build
npm start
```

---

## 🎉 PRÊT À GÉNÉRER DES REVENUS !

Une fois la configuration Stripe terminée, votre plateforme sera **100% opérationnelle** et prête à :

✅ Accepter paiements  
✅ Gérer abonnements  
✅ Appliquer quotas automatiquement  
✅ Générer factures mensuelles  
✅ Tracker MRR/ARR en temps réel  

**Objectif court terme : 3 490€/mois MRR (10 cabinets Plan CABINET)**

