# 🔐 Rotation des secrets — avant mise en production

**Date de l'audit** : 2026-10-03
**Contexte** : audit pré-vente (premier client sur `memolib.space`).
**Bonne nouvelle** : aucun fichier `.env` secret n'est tracké par git ni présent
dans l'historique git (vérifié via `git ls-files` et `git log --all --diff-filter=A`).
Seul `.env.example` (template sans secret) est versionné.
**Risque** : des secrets réels (dont une clé **Stripe LIVE**) sont présents **en clair
sur le disque local**. Par précaution, ils doivent être considérés comme à renouveler
avant d'ouvrir le service à un client payant.

---

## 1. Inventaire des secrets détectés sur disque

| Fichier | Clé | Type | Criticité |
|---------|-----|------|-----------|
| `.env.local` | `STRIPE_SECRET_KEY` | **Stripe LIVE** (`sk_live_…`) | 🔴 Critique |
| `.env.local` | `STRIPE_WEBHOOK_SECRET` | `whsec_…` | 🔴 Critique |
| `.env.local` | `IMAP_PASSWORD` | mot de passe app Gmail | 🟠 Élevé |
| `.env.local`, `.env.production` | `GOOGLE_CLIENT_SECRET` | OAuth Google (`GOCSPX-…`) | 🟠 Élevé |
| `.env`, `.env.local`, `.env.production` | `CLERK_SECRET_KEY` | Clerk **TEST** (`sk_test_…`) | 🟡 Moyen (test) |
| `.env.development`, `.env.production`, `.env.test` | `ENCRYPTION_MASTER_KEY` | clé de chiffrement AES-256 | 🟠 Élevé |
| multiples | `NEXTAUTH_SECRET`, `DATABASE_URL` | secrets de session / DB | 🟡 Moyen |

---

## 2. Secrets auto-générables (regénérés le 2026-10-03)

> Générés par `node scripts/rotate-secrets-guide.mjs`.
> **Ne pas committer.** À coller dans le gestionnaire de secrets du déploiement
> (variables Vercel / Railway). Regénérer de nouvelles valeurs au moment réel de
> la rotation plutôt que de réutiliser celles-ci si ce document est partagé.

- `NEXTAUTH_SECRET` — nouvelle valeur base64 (32 octets)
- `ENCRYPTION_MASTER_KEY` — nouvelle valeur hex 64 car. (32 octets, AES-256)
- `CRON_SECRET` — nouvelle valeur hex
- `EMAIL_WEBHOOK_SECRET` — nouvelle valeur hex

⚠️ **Attention `ENCRYPTION_MASTER_KEY`** : si des données ont déjà été chiffrées en
production avec l'ancienne clé, la remplacer rend ces données illisibles. Avant de
tourner cette clé, prévoir une migration (déchiffrer avec l'ancienne, rechiffrer
avec la nouvelle). Pour un premier déploiement sans données réelles, aucun risque.

---

## 3. Secrets à renouveler chez le fournisseur (manuel)

- [ ] **Stripe — clé secrète** `sk_live_…`
  - https://dashboard.stripe.com/apikeys → *Roll key*
  - Une clé LIVE était en clair dans `.env.local` → la considérer comme compromise.
- [ ] **Stripe — webhook signing secret** `whsec_…`
  - https://dashboard.stripe.com/webhooks → révéler / *roll*
- [ ] **Google OAuth — client secret** `GOCSPX-…`
  - https://console.cloud.google.com/apis/credentials → *reset secret*
- [ ] **Gmail — mot de passe d'application IMAP**
  - https://myaccount.google.com/apppasswords → révoquer + recréer
- [ ] **Clerk — passer en instance PRODUCTION**
  - https://dashboard.clerk.com → créer une instance *production*
  - Remplacer `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
    par les clés `pk_live_…` / `sk_live_…`
- [ ] **Neon / `DATABASE_URL`** (si la base contient déjà des accès partagés)
  - https://console.neon.tech → régénérer le mot de passe de rôle

---

## 4. Après rotation

1. Stocker chaque valeur **uniquement** dans le gestionnaire de secrets du
   déploiement (variables d'environnement Vercel / Railway).
2. Retirer les valeurs réelles des `.env.local` / `.env.production` locaux.
3. Confirmer que `.env*` est bien gitignoré (c'est le cas) et ne jamais committer
   de valeur réelle.
4. Redéployer pour que l'application prenne les nouveaux secrets.

---

## 5. Fichiers `.env` à nettoyer sur le disque local

Fichiers redondants / de travail repérés à la racine, à supprimer **après** avoir
mis les secrets dans le gestionnaire de déploiement (vérifier le contenu avant) :

- `.env.local.backup` — backup de secrets, à supprimer
- `.env.vercel.candidat`, `.env.licorne`, `.env.msconseils` — variantes de travail
- `.env.security`, `.env.infrastructure`, `.env.legal-integrations` — à vérifier/supprimer
- `config/*.env`, `client_config.env`, `.env_pythonanywhere` — hors périmètre, à vérifier

> Garder uniquement : `.env.example` (versionné), et un `.env.local` minimal
> pour le dev local **sans clés LIVE** (utiliser des clés `test` en dev).
