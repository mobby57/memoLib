# Gestion des secrets sensibles

Ce document liste les secrets indispensables, la manière de les récupérer et les bonnes pratiques pour rester conforme (RGPD, sécurité juridique) sur IA Poste Manager.

## 1. Secrets critiques à configurer

| Variable | Description | Console / emplacement | Notes de sécurité |
| -------- | ----------- | --------------------- | ----------------- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | Neon / Cloud SQL / Postgres | Ne jamais exposer publiquement ; rotate régulièrement |
| `NEXTAUTH_SECRET` | Clé de chiffrement des sessions NextAuth | Générer via `openssl rand -hex 32` | Partager via coffre, pas en clair |
| `AZURE_AD_CLIENT_SECRET` | Secret principal de l’application Azure AD | Azure Portal → App registration | Stocker dans Key Vault + rotation automatique |
| `STRIPE_SECRET_KEY` | Clé API privée Stripe (dev/production) | Dashboard Stripe (API keys) | Utiliser les clés test en dev, live en prod; activer rotation |
| `OLLAMA_API_KEY` (si utilisé) | Authentification vers Ollama local ou distante | Interface Ollama | Ne communiquer qu’aux services IA autorisés |
| `GUILD` (exemples) | Gmail, GitHub, PISTE, Cloudflare | Consoles respectives (Google Cloud, GitHub, PISTE, Cloudflare) | Chiffrement dès la sortie de la console |


## 2. Où retrouver chaque secret

- `Stripe`: Developer → API keys → `Reveal live key` (copier une seule fois). Les prix (price IDs) se créent dans Products.
- `Azure AD`: App registrations → `Client secrets` → `New client secret`. Copier la valeur immédiatement.
- `Google OAuth`: APIs & Services → Credentials → OAuth 2.0 Client ID. `GMAIL_REDIRECT_URI` doit pointer vers `/api/auth/callback/google`.
- `GitHub App`: Settings > Developer settings > GitHub Apps → Generate private key (`github-app-key.pem`).
- `PISTE`: portail Legifrance → Sandbox/Prod credentials. `PISTE_ENVIRONMENT` contrôle l’envoi.
- `Cloudflare D1 / KV`: Wrangler → `d1 create` / `wrangler kv:namespace create`. Copier `database_id` ou `namespace id`.
- `Upstash Redis`: Dashboard → REST URL & Token.

Chaque console propose un moyen de révoquer/rotater ses secrets. Ajoute la procédure dans la doc de l’équipe (ex: `docs/ROTATION_SECRETS.md`) si nécessaire.

## 3. Bonnes pratiques de stockage

1. **Coffre de secrets central** (Azure Key Vault, HashiCorp Vault, 1Password, Doppler, etc.). Y stocker : `AZURE_AD_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `GITHUB_CLIENT_SECRET`, `PISTE_SANDBOX_CLIENT_SECRET`, `SMTP_PASS`, etc.

2. **Chiffrement des secrets locaux avec dotenv-vault** ✅ **IMPLÉMENTÉ**
   - Exécuter: `.\scripts\setup-encrypted-secrets.ps1`
   - Génère `.env.vault` (chiffré, à committer)
   - Génère `.env.keys` (clé master, ⚠️ NE PAS committer)
   - Déchiffrer: `npx dotenv-vault decrypt --key <clé>`
   - Documentation complète: [ENCRYPTED_SECRETS_GUIDE.md](./ENCRYPTED_SECRETS_GUIDE.md)

3. **Environnements CI/CD** : copier les noms (ex: `NEXTAUTH_SECRET`) dans GitHub Actions secrets ou Vercel env vars via l'interface, jamais en clair dans le repo.

4. **Rotation des secrets** : Azure + Stripe, tous les 90 jours au minimum.
   - Automation: `.\scripts\rotate-secrets.ps1`
   - Génère rapport avec nouvelle clé
   - Utiliser webhooks/alertes pour valider post-rotation

5. **Audit / logging** : consigner les créations/révocations dans le tableau des opérations (ex: `docs/OPERATIONS_LOG.md`)

## 4. Procédure rapide pour un nouveau développeur

1. Cloner le repo, copier l’exemple : `cp .env.local.example .env.local`.
2. Récupérer les secrets depuis le coffre personnel de l’équipe ou demander sur le canal `#ops-secrets`.
3. Coller les valeurs sensibles dans `.env.local` localement (pas de push!).
4. Lancer `npm run dev` ou `npm run build`.
5. Si un secret manque, référer au tableau ci-dessus pour retrouver l’interface de génération.

## 5. Sauvegarde & chiffrement des backups

- `BACKUP_DIR` contient les dumps chiffrés (cf. `scripts/backup/*.ps1`). Remplir `ENCRYPTION_MASTER_KEY` pour que les scripts puissent chiffrer.
- Les exports de base (Neon, D1) doivent être téléchargés uniquement via les consoles respectives et stockés sur un disque protégé (crypté BitLocker, VeraCrypt, etc.).

## 6. Contacts et support

- Support sécurité: `security@iapostemanager.com`.
- Responsable RGPD: `dpo@iapostemanager.com`.
- En cas de fuite, alerter immédiatement via la procédure `docs/INCIDENT_RESPONSE.md`.