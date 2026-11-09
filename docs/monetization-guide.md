# 💰 Guide de Monétisation — MemoLib

## Pipeline complet : visiteur → client payant

```
Landing /landing → Pricing /pricing → Signup /signup → Stripe Checkout → Dashboard
                                         ↓
                              POST /api/saas/signup
                              (crée Tenant + User + Subscription trial)
                                         ↓
                              Stripe Checkout Session
                              (14j trial, carte enregistrée)
                                         ↓
                              Webhook: checkout.session.completed
                              (activateAfterPayment → tenant confirmé)
                                         ↓
                              14 jours plus tard → 1er prélèvement
```

## Configuration Stripe (5 minutes)

### 1. Créer les produits sur Stripe Dashboard

Aller sur https://dashboard.stripe.com/products et créer :

| Produit | Prix mensuel | Prix annuel | ID Env Var |
|---------|-------------|-------------|------------|
| MemoLib Solo | 29€/mois | 276€/an | `STRIPE_PRICE_SOLO_MONTHLY` / `_YEARLY` |
| MemoLib Cabinet | 79€/mois | 756€/an | `STRIPE_PRICE_CABINET_MONTHLY` / `_YEARLY` |
| MemoLib Enterprise | 199€/mois | 1908€/an | `STRIPE_PRICE_ENTERPRISE_MONTHLY` / `_YEARLY` |

Pour chaque produit :
- Type : **Recurring**
- Currency : **EUR**
- Trial : configuré côté code (14 jours), pas sur Stripe

### 2. Configurer les variables d'environnement

```env
# Stripe API Keys (Dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Webhook secret (Dashboard → Developers → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Price IDs (copiés depuis chaque produit créé ci-dessus)
STRIPE_PRICE_SOLO_MONTHLY=price_1Xxxxx
STRIPE_PRICE_SOLO_YEARLY=price_1Xxxxx
STRIPE_PRICE_CABINET_MONTHLY=price_1Xxxxx
STRIPE_PRICE_CABINET_YEARLY=price_1Xxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1Xxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1Xxxxx
```

### 3. Configurer le Webhook Stripe

Dashboard → Developers → Webhooks → Add endpoint

- **URL** : `https://votre-domaine.vercel.app/api/webhooks/stripe`
- **Events** :
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

### 4. Test en mode sandbox

```env
# Utiliser les clés de test d'abord
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

Carte de test : `4242 4242 4242 4242` (exp: future, CVC: any)

## Revenus attendus (projections)

| Scénario | Clients | MRR | ARR |
|----------|---------|-----|-----|
| 10 Solo | 10 | 290€ | 3 480€ |
| 20 Solo + 5 Cabinet | 25 | 975€ | 11 700€ |
| 50 Solo + 15 Cabinet + 3 Enterprise | 68 | 2 247€ | 34 764€ |
| 100 Solo + 30 Cabinet + 10 Enterprise | 140 | 7 260€ | 87 120€ |

## Coûts IA par client

| Plan | Budget IA/mois | Coût réel estimé | Marge |
|------|---------------|-----------------|-------|
| Solo (29€) | 5€ max | ~1-2€ (Mistral) | 93% |
| Cabinet (79€) | 15€ max | ~3-5€ | 93% |
| Enterprise (199€) | 40€ max | ~8-15€ | 92% |

Le cost-guard bloque automatiquement les appels IA quand le budget est atteint.

## Métriques à suivre

- **MRR** (Monthly Recurring Revenue) — via Stripe Dashboard
- **Churn rate** — cancellations / total active
- **Trial → Paid conversion** — via webhook tracking
- **ARPU** (Average Revenue Per User)
- **CAC** (Customer Acquisition Cost)

## Prochaines étapes pour maximiser le revenu

1. [ ] Landing page SEO optimisée ("logiciel avocat", "gestion cabinet")
2. [ ] Google Ads sur les termes juridiques
3. [ ] Programme de parrainage (1 mois offert)
4. [ ] Offre spéciale CNB (Barreau)
5. [ ] Version Demo en libre-service (/demo)
6. [ ] Témoignages clients (social proof)
