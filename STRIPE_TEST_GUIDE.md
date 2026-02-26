# Stripe Payment Testing Guide - MemoLib

Guide complet pour tester l'intégration Stripe en mode test.

## 🔧 Configuration Test Mode

### Variables d'environnement
```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Dashboard Stripe Test Mode
1. Accéder à https://dashboard.stripe.com/test
2. Vérifier le badge "TEST MODE" en haut à gauche
3. Activer les webhooks pour votre endpoint local

## 💳 Cartes de Test Stripe

### Cartes Succès
| Numéro | Type | Résultat |
|--------|------|----------|
| `4242 4242 4242 4242` | Visa | ✅ Paiement réussi |
| `5555 5555 5555 4444` | Mastercard | ✅ Paiement réussi |
| `3782 822463 10005` | Amex | ✅ Paiement réussi |
| `6011 1111 1111 1117` | Discover | ✅ Paiement réussi |

### Cartes avec Authentification 3D Secure
| Numéro | Comportement |
|--------|--------------|
| `4000 0025 0000 3155` | Authentification requise |
| `4000 0027 6000 3184` | Authentification setup requise |

### Cartes Échec
| Numéro | Type d'échec |
|--------|--------------|
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0000 0000 9995` | ❌ Fonds insuffisants |
| `4000 0000 0000 9987` | ❌ Carte perdue |
| `4000 0000 0000 9979` | ❌ Carte volée |
| `4000 0000 0000 0069` | ❌ Carte expirée |
| `4000 0000 0000 0127` | ❌ CVC incorrect |
| `4000 0000 0000 0119` | ❌ Erreur de traitement |

### Informations Complémentaires (pour toutes les cartes)
- **Date d'expiration** : N'importe quelle date future (ex: 12/28)
- **CVC** : N'importe quel nombre à 3 chiffres (ex: 123)
- **Code postal** : N'importe lequel (ex: 12345)

## 🧪 Scénarios de Test

### 1. Test Paiement Simple (PRO - $9.99/mois)

**Étapes :**
1. Naviguer vers `/billing`
2. Sélectionner le plan PRO
3. Choisir "Monthly" billing
4. Utiliser la carte `4242 4242 4242 4242`
5. Remplir : Exp: 12/28, CVC: 123
6. Cliquer "Pay"
7. Vérifier la redirection vers `/payment/success`

**Résultat attendu :**
- ✅ Payment intent créé
- ✅ Paiement confirmé
- ✅ Abonnement activé
- ✅ Webhook `payment_intent.succeeded` reçu
- ✅ Base de données mise à jour

### 2. Test Échec de Paiement

**Étapes :**
1. Même processus que Test 1
2. Utiliser la carte `4000 0000 0000 0002`
3. Tenter le paiement

**Résultat attendu :**
- ❌ Message d'erreur "Your card was declined"
- ❌ Pas de charge créée
- ❌ Pas d'abonnement activé
- ✅ Webhook `payment_intent.payment_failed` reçu

### 3. Test Authentification 3D Secure

**Étapes :**
1. Utiliser la carte `4000 0025 0000 3155`
2. Une fenêtre d'authentification s'ouvre
3. Cliquer "Authorize Test Payment"

**Résultat attendu :**
- ✅ Challenge 3DS affiché
- ✅ Paiement confirmé après authentification
- ✅ Webhook reçu

### 4. Test Multi-Devise

**Devises à tester :**
- 🇺🇸 USD : $9.99
- 🇪🇺 EUR : €9.20
- 🇬🇧 GBP : £7.90
- 🇯🇵 JPY : ¥1,495

**Étapes pour chaque devise :**
1. Changer la devise sur `/billing`
2. Vérifier le prix converti
3. Effectuer le paiement avec `4242 4242 4242 4242`
4. Vérifier la facture dans la devise sélectionnée

### 5. Test Abonnement Annuel (20% réduction)

**Étapes :**
1. Sélectionner PRO - Yearly
2. Vérifier le prix : $95.90/an (au lieu de $119.88)
3. Badge "Save 20%" visible
4. Compléter le paiement

**Résultat attendu :**
- ✅ Prix annuel correct
- ✅ Économies affichées : $23.98
- ✅ Abonnement créé avec `interval: year`

### 6. Test Upgrade FREE → PRO

**Étapes :**
1. Commencer avec FREE plan
2. Cliquer "Upgrade to PRO"
3. Compléter le paiement
4. Vérifier l'accès aux features PRO

**Résultat attendu :**
- ✅ Subscription history créée (action: UPGRADED)
- ✅ Features PRO activées
- ✅ Badge "PRO" visible

### 7. Test Annulation d'Abonnement

**Étapes :**
1. Avec un abonnement PRO actif
2. Cliquer "Cancel Subscription"
3. Confirmer l'annulation

**Résultat attendu :**
- ✅ `cancelAtPeriodEnd: true`
- ✅ Message "Your subscription will end on [date]"
- ✅ Accès PRO maintenu jusqu'à la fin de période
- ✅ Webhook `customer.subscription.updated` reçu

### 8. Test Moyens de Paiement Multiples

**Étapes :**
1. Ajouter carte 1 : Visa `4242...`
2. Ajouter carte 2 : Mastercard `5555...`
3. Lister les méthodes de paiement
4. Supprimer carte 1

**Résultat attendu :**
- ✅ 2 cartes listées avec brand/last4
- ✅ Carte supprimée disparaît
- ✅ Carte par défaut indiquée

### 9. Test Webhooks

**Événements à vérifier :**

```bash
# Terminal 1 : Démarrer le serveur Next.js
npm run dev

# Terminal 2 : Écouter les webhooks Stripe
stripe listen --forward-to localhost:3000/api/payments/webhook
```

**Événements à tester :**
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

**Vérifier dans les logs :**
```bash
# Webhook reçu et traité
POST /api/payments/webhook 200
Event: payment_intent.succeeded
Payment ID: pi_xxx saved to database
```

### 10. Test Factures

**Étapes :**
1. Créer un abonnement PRO
2. Attendre la génération de facture (instantané en test)
3. Naviguer vers `/billing`
4. Section "Invoice History"
5. Télécharger le PDF

**Résultat attendu :**
- ✅ Facture listée avec date, montant, statut
- ✅ PDF téléchargeable
- ✅ Statut "Paid" affiché en vert

## 🔍 Vérification Base de Données

Après chaque test, vérifier Prisma Studio :

```bash
npx prisma studio
```

**Tables à inspecter :**
1. `StripeCustomer` : 1 entrée par utilisateur
2. `PaymentIntent` : 1 par tentative de paiement
3. `Subscription` : 1 par abonnement créé
4. `Invoice` : 1 par facture générée
5. `SubscriptionHistory` : 1 par changement (upgrade/downgrade/cancel)

## 📊 Dashboard Stripe - Vérifications

### Paiements
1. Aller à "Payments" dans le dashboard
2. Vérifier les paiements réussis/échoués
3. Cliquer sur un paiement pour voir les détails

### Abonnements
1. Aller à "Subscriptions"
2. Vérifier les abonnements actifs
3. Statuts : active, trialing, canceled, past_due

### Customers
1. Aller à "Customers"
2. Vérifier la création des clients
3. Voir l'historique des paiements par client

### Webhooks
1. Aller à "Developers" → "Webhooks"
2. Voir les événements envoyés
3. Vérifier les réponses (200 = succès)

## 🚀 Tests End-to-End Automatisés

### Installation Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

### Script de Test E2E
```bash
# Créer dans __tests__/e2e/payment-flow.spec.ts
npm run test:e2e
```

### Commandes de Test
```bash
# Tests unitaires
npm test

# Tests E2E
npm run test:e2e

# Tests avec couverture
npm run test:coverage
```

## ✅ Checklist Finale

Avant de passer en production :

- [ ] Tous les tests de cartes passent
- [ ] Webhooks fonctionnent (7+ événements)
- [ ] Multi-devise fonctionne (25 devises)
- [ ] Authentification 3DS testée
- [ ] Annulation d'abonnement fonctionne
- [ ] Factures générées et téléchargeables
- [ ] Base de données synchronisée
- [ ] Logs sans erreurs
- [ ] Dashboard Stripe correct
- [ ] Tests E2E automatisés passent

## 🔒 Passage en Production

### 1. Changer les clés API
```bash
# Production keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

### 2. Créer les produits en live
1. Dashboard Stripe → Products
2. Créer PRO Monthly ($9.99)
3. Créer PRO Yearly ($95.90)
4. Créer ENTERPRISE Monthly ($99.99)
5. Copier les price IDs dans `lib/stripe/config.ts`

### 3. Configurer les webhooks live
1. Créer endpoint : `https://memolib.com/api/payments/webhook`
2. Sélectionner tous les événements
3. Copier le signing secret

### 4. Tests de vérification
- [ ] 1 transaction réelle de $0.50
- [ ] Vérifier la charge sur votre compte bancaire
- [ ] Annuler immédiatement
- [ ] Vérifier le remboursement

## 📞 Support

En cas de problème :
- Documentation Stripe : https://stripe.com/docs
- Test cards : https://stripe.com/docs/testing
- Dashboard : https://dashboard.stripe.com
- Support : support@stripe.com

---

**Phase 10 - 90% Complete** ✅
