# 🚀 MemoLib — Mode SaaS pour Avocat Solo

## Vue d'ensemble

Ce document décrit les modifications apportées pour rendre MemoLib utilisable par un **avocat solo sans compétence technique**.

## Fichiers créés/modifiés

### 1. IA Cloud (OpenAI/Mistral/Anthropic)

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/ai/cloud-providers.ts` | **CRÉÉ** | Client multi-provider (OpenAI, Mistral, Anthropic) avec fallback chain |
| `src/lib/ai/hybrid-client.ts` | **MODIFIÉ** | Intégration des cloud providers dans le fallback (Ollama → Cloud → erreur) |
| `src/lib/billing/cost-guard.ts` | **MODIFIÉ** | Ajout des coûts OpenAI/Mistral/Anthropic |
| `src/app/api/ai/health/route.ts` | **MODIFIÉ** | Endpoint santé qui reporte tous les providers |
| `.env.example` | **MODIFIÉ** | Variables pour les clés API cloud |

**Chaîne de fallback IA :**
```
Cache → Ollama (gratuit, local) → Cloud AI (payant, budget contrôlé) → Regex (dégradé)
```

**Configuration minimale :** Une seule variable d'environnement suffit :
```env
MISTRAL_API_KEY=votre-cle
```

### 2. Inscription SaaS Auto-Provisioning

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/lib/services/saas-provisioning.ts` | **CRÉÉ** | Service d'auto-provisioning complet |
| `src/app/api/saas/signup/route.ts` | **CRÉÉ** | API endpoint d'inscription |
| `src/components/saas/SaasSignupForm.tsx` | **CRÉÉ** | Formulaire 3 étapes (plan → info → confirmation) |
| `src/app/[locale]/signup/page.tsx` | **CRÉÉ** | Page d'inscription dédiée |
| `src/proxy.legacy.ts` | **MODIFIÉ** | Routes /signup et /api/saas en accès public |

**Flow utilisateur :**
```
Choix plan → Formulaire (nom, email, cabinet) → Confirmation → Stripe Checkout → Dashboard
```

**Ce qui est auto-provisionné :**
- Tenant (cabinet)
- User (avocat, rôle AVOCAT)
- TenantSettings (IA cloud activée par défaut, limites selon plan)
- Subscription (trial 14 jours)
- Client Stripe + Checkout session

### 3. Landing Page (exit beta)

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/app/[locale]/landing/page.tsx` | **MODIFIÉ** | CTA direct vers inscription (plus de waitlist beta) |

### 4. Script de déploiement simplifié

| Fichier | Action | Description |
|---------|--------|-------------|
| `scripts/deploy-simple.ts` | **CRÉÉ** | Guide interactif pour auto-configurer MemoLib |

## Configuration pour un avocat solo

### Option A : SaaS hébergé (recommandé)
L'avocat va sur `/signup`, choisit un plan, remplit le formulaire → c'est prêt.

### Option B : Self-hosted simplifié
```bash
git clone https://github.com/mobby57/memoLib.git
cd memoLib
npm install
npx ts-node scripts/deploy-simple.ts
```

## Variables d'environnement minimales

Pour un déploiement fonctionnel avec IA (5 variables) :
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="auto-généré"
NEXTAUTH_URL="https://mon-cabinet.vercel.app"
MISTRAL_API_KEY="ma-cle"
CRON_SECRET="auto-généré"
```

## Prochaines étapes recommandées

1. [ ] Tester le flow signup complet en local
2. [ ] Configurer Stripe en mode test avec les price IDs
3. [ ] Ajouter `/signup` dans la navigation principale
4. [ ] Configurer le webhook Stripe pour `activateAfterPayment()`
5. [ ] Créer les plans en DB (seed) avec les bons noms
6. [ ] Documentation vidéo "Premiers pas" (3 min)
