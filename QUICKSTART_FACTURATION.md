# 🚀 SYSTÈME DE FACTURATION - GUIDE DÉMARRAGE RAPIDE

## ⏱️ Configuration en 10 minutes

### Option 1 : Script automatique (RECOMMANDÉ)

```powershell
# Une seule commande !
.\configure-stripe.ps1
```

Le script fait tout automatiquement :
1. ✅ Installe Stripe SDK
2. ✅ Configure clés API (vous les entrez interactivement)
3. ✅ Crée produits dans Stripe
4. ✅ Configure webhook
5. ✅ Démarre serveur

---

### Option 2 : Configuration manuelle

```bash
# 1. Créer compte Stripe
https://dashboard.stripe.com/register

# 2. Installer SDK
npm install stripe @stripe/stripe-js

# 3. Ajouter clés dans .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# 4. Créer produits
npx tsx scripts/sync-stripe-plans.ts

# 5. Copier Price IDs dans .env.local
STRIPE_PRICE_SOLO_MONTHLY=price_...
# ... (6 IDs au total)

# 6. Configurer webhook (dev)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copier whsec_... dans .env.local

# 7. Démarrer
npm run dev
```

---

## 🎯 Pages à tester

| URL | Description |
|-----|-------------|
| `/admin/billing` | Interface facturation tenant |
| `/super-admin/dashboard` | Analytics MRR/ARR |

---

## 💳 Test de paiement

1. Sur `/admin/billing`, cliquer **"S'abonner"** (Plan CABINET)
2. Carte test : `4242 4242 4242 4242`
3. Date : `12/28`, CVV : `123`
4. ✅ Paiement réussi → Abonnement activé

---

## 📊 Ce qui a été créé

### 4 Options implémentées

| Option | Fichiers | Description |
|--------|----------|-------------|
| **A** | 4 fichiers | Page `/admin/billing` + 3 APIs |
| **B** | 2 fichiers | Dashboard SuperAdmin + API stats |
| **C** | 2 fichiers | Service quotas + Middleware enforcement |
| **D** | 5 fichiers | Stripe client + webhook + checkout + portal + script sync |

**Total : 13 nouveaux fichiers + 9 nouvelles tables**

---

## 💰 Modèle économique

| Plan | Mensuel | Annuel | Quotas |
|------|---------|--------|--------|
| **SOLO** | 49€ | 490€ (-16%) | 1 workspace, 50 dossiers |
| **CABINET** ⭐ | 349€ | 3 490€ (-16%) | 10 workspaces, 300 dossiers |
| **ENTERPRISE** | 499€ | 4 990€ (-16%) | ∞ workspaces, 1000 dossiers |

**Objectif court terme : 3 490€/mois MRR (10 × Cabinet)**

---

## 📁 Documentation complète

| Fichier | Contenu |
|---------|---------|
| `CONFIGURATION_STRIPE_COMPLETE.md` | Guide étape par étape (30 min) |
| `IMPLEMENTATION_COMPLETE_A_B_C_D.md` | Détails techniques complets |
| `CHECKLIST_FACTURATION.md` | Checklist développement + tests |
| `configure-stripe.ps1` | Script automatique Windows |

---

## 🆘 Aide rapide

### Problème : Webhook invalide
```bash
# Vérifier secret
stripe listen --print-secret
# Copier dans .env.local
```

### Problème : Price ID not found
```bash
# Re-créer produits
npx tsx scripts/sync-stripe-plans.ts
# Copier nouveaux IDs
```

### Problème : 402 Payment Required non désiré
```sql
-- Vérifier quotas
SELECT * FROM Plan WHERE name = 'ENTERPRISE';
-- maxWorkspaces doit être -1 (illimité)
```

---

## ✅ État actuel

- ✅ **Développement** : 100% complété (Options A→B→C→D)
- ⏳ **Configuration** : Script prêt, nécessite compte Stripe
- ⏳ **Tests** : Carte test fournie (4242...)

**Temps restant pour production : 30-60 minutes**

---

## 🎉 Prêt à lancer !

```bash
# Tout en une commande
.\configure-stripe.ps1

# OU manuellement
npm install stripe @stripe/stripe-js
npx tsx scripts/sync-stripe-plans.ts
npm run dev
```

**Votre plateforme SaaS est prête à générer des revenus !** 💰

