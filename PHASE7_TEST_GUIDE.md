# 🧪 Phase 7 : Tests Système d'Abonnement Stripe

## ✅ Fonctionnalités Implémentées

### 1. Base de Données
- ✅ Models `BillingSubscription` et `BillingPayment`
- ✅ Enums `SubscriptionPlan`, `SubscriptionStatus`, `PaymentStatus`
- ✅ Migration appliquée: `20260206225231_add_billing_subscriptions_and_payments`

### 2. Page Pricing (`/pricing`)
- ✅ 3 Plans affichés: Free (0€), Pro (29€), Enterprise (99€)
- ✅ Toggle mensuel/annuel (2 mois offerts en annuel)
- ✅ Boutons d'action pour checkout Stripe
- ✅ FAQ et avantages par plan

### 3. API Stripe
- ✅ `/api/billing/checkout` - Créer session Stripe
- ✅ `/api/billing/subscription` - Récupérer abonnement utilisateur
- ✅ `/api/billing/cancel` - Annuler abonnement
- ✅ `/api/billing/portal` - Ouvrir portail Stripe
- ✅ `/api/webhooks/stripe` - Gérer événements Stripe

### 4. Webhooks Stripe
- ✅ `checkout.session.completed` - Abonnement créé
- ✅ `customer.subscription.created/updated` - Mise à jour statut
- ✅ `customer.subscription.deleted` - Annulation
- ✅ `invoice.payment_succeeded` - Paiement réussi
- ✅ `invoice.payment_failed` - Paiement échoué

### 5. Dashboard Facturation (`/dashboard/billing`)
- ✅ Affichage plan actuel et statut
- ✅ Limites (clients, dossiers, stockage)
- ✅ Historique des paiements
- ✅ Boutons "Annuler" et "Gérer l'abonnement"

### 6. Système de Permissions
- ✅ `getUserSubscription()` - Récupérer abonnement
- ✅ `checkFeatureAccess()` - Vérifier accès fonctionnalité
- ✅ `checkUsageLimits()` - Compter usage vs limites
- ✅ `canCreateClient()` / `canCreateDossier()` - Validation

---

## 📋 Plan de Tests

### Test 1: Page Pricing
```bash
# Ouvrir dans le navigateur
http://localhost:3000/pricing
```

**Vérifications:**
- [ ] Page s'affiche correctement
- [ ] 3 plans visibles (Free, Pro, Enterprise)
- [ ] Toggle mensuel/annuel fonctionne
- [ ] Prix affichés correctement (0€, 29€, 99€)
- [ ] Badge "Recommandé" sur plan Pro
- [ ] Boutons "Commencer gratuitement" / "Essai gratuit 14 jours"
- [ ] FAQ visible en bas de page

### Test 2: API Checkout Stripe (Mode Test)
```bash
# Se connecter avec un compte utilisateur
# Cliquer sur "Essai gratuit 14 jours" pour plan Pro
```

**Vérifications:**
- [ ] Redirection vers Stripe Checkout
- [ ] Session Stripe créée avec bon price ID
- [ ] Email pré-rempli
- [ ] "14-day free trial" affiché
- [ ] Retour URL configuré vers `/dashboard/billing`

### Test 3: Webhook Stripe (Simulation Locale)
```bash
# En local, utiliser Stripe CLI pour tester les webhooks:
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

**Vérifications:**
- [ ] Webhook reçu et validé
- [ ] Signature vérifiée
- [ ] Abonnement créé en DB
- [ ] Status = TRIALING
- [ ] Limites plan appliquées

### Test 4: Dashboard Facturation
```bash
# Après abonnement créé
http://localhost:3000/dashboard/billing
```

**Vérifications:**
- [ ] Plan actuel affiché
- [ ] Status: ACTIVE ou TRIALING
- [ ] Limites affichées (50 clients, 500 dossiers, 50 Go)
- [ ] Date prochain renouvellement
- [ ] Bouton "Annuler l'abonnement" visible
- [ ] Bouton "Gérer l'abonnement" redirige vers Stripe Portal

### Test 5: Permissions & Limites
```typescript
// Dans votre code métier (exemple: création client)
import { canCreateClient } from '@/lib/subscription-permissions';

const canCreate = await canCreateClient(userId);
if (!canCreate) {
  throw new Error('Limite de clients atteinte. Passez à un plan supérieur.');
}
```

**Vérifications:**
- [ ] Utilisateur FREE: max 5 clients
- [ ] Utilisateur PRO: max 50 clients
- [ ] Utilisateur ENTERPRISE: clients illimités
- [ ] Message d'erreur si limite atteinte

### Test 6: Annulation Abonnement
```bash
# Depuis dashboard billing, cliquer "Annuler l'abonnement"
```

**Vérifications:**
- [ ] Confirmation demandée
- [ ] Appel API `/api/billing/cancel`
- [ ] Stripe subscription updated (cancel_at_period_end: true)
- [ ] DB updated (cancelAtPeriodEnd: true)
- [ ] Message "Se termine le [date]" affiché

### Test 7: Paiement Réussi (Webhook)
```bash
stripe trigger invoice.payment_succeeded
```

**Vérifications:**
- [ ] Webhook reçu
- [ ] `BillingPayment` créé en DB
- [ ] status = SUCCEEDED
- [ ] Montant, devise, last4 enregistrés
- [ ] Historique paiements affiché sur dashboard

### Test 8: Paiement Échoué (Webhook)
```bash
stripe trigger invoice.payment_failed
```

**Vérifications:**
- [ ] Webhook reçu
- [ ] `BillingPayment` créé avec status = FAILED
- [ ] Subscription status = PAST_DUE
- [ ] Email notification envoyé (à implémenter)

---

## 🔐 Variables d'Environnement Requises

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Clé secrète Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_... # Clé publique Stripe (frontend)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret webhook Stripe

# Stripe Price IDs (à créer dans Dashboard Stripe)
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_... # Price ID Pro (29€/mois)
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=price_... # Price ID Enterprise (99€/mois)

# Auth (déjà configuré)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Database (déjà configuré)
DATABASE_URL=postgresql://...
```

---

## 🚀 Commandes Utiles

### Démarrer serveur dev
```bash
cd src/frontend
npm run dev
```

### Tester webhooks localement
```bash
# Installer Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### Générer Prisma Client
```bash
npx prisma generate
```

### Voir DB en temps réel
```bash
npx prisma studio
```

---

## 📊 Tableau de Bord Stripe

### Créer les Products/Prices
1. Aller sur https://dashboard.stripe.com/test/products
2. Créer 2 products:
   - **Pro**: 29€/mois recurring
   - **Enterprise**: 99€/mois recurring
3. Copier les Price IDs dans `.env.local`

### Configurer Webhook Endpoint (Production)
1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Ajouter endpoint: `https://memolib.fly.dev/api/webhooks/stripe`
3. Sélectionner events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier Signing Secret dans `STRIPE_WEBHOOK_SECRET`

---

## ✅ Checklist Déploiement Production

- [ ] Créer Products/Prices dans Stripe Production
- [ ] Configurer Webhook endpoint production
- [ ] Ajouter env vars sur Fly.io: `flyctl secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...`
- [ ] Tester checkout en mode live
- [ ] Vérifier webhooks reçus
- [ ] Tester abonnement, paiement, annulation
- [ ] Configurer Stripe Billing Portal settings
- [ ] Activer emails Stripe (invoices, receipts)

---

## 🎯 Prochaines Améliorations

1. **Emails Transactionnels**:
   - Welcome email après inscription
   - Invoice emails (Stripe auto)
   - Trial ending reminders
   - Payment failed notifications

2. **Analytics**:
   - Conversion rates par plan
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - LTV (Lifetime Value)

3. **Coupons & Promotions**:
   - Stripe coupons support
   - Referral program
   - Seasonal offers

4. **Multi-Currency**:
   - EUR, USD, GBP
   - Auto-detect user location

5. **Team Management**:
   - Invite users to organization
   - Shared subscription
   - Usage tracking per team member

---

**Status: ✅ PHASE 7 COMPLETE - SYSTÈME D'ABONNEMENT PRÊT**
