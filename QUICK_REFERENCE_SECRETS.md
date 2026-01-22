# 📌 QUICK REFERENCE - Configuration Secrets (Affichette)

## 🚀 4 Commandes pour Démarrer

### ① Préparation
```powershell
# Copier template + remplir avec vos vraies valeurs
Copy-Item ".env.local.example" ".env.local"
code .env.local  # ← Remplir ici!
```

### ② Chiffrer (Vault)
```powershell
.\scripts\setup-secrets.ps1 -Phase phase2
# Génère: .env.vault (safe), .env.keys (sauvegarder!)
```

### ③ Vercel
```powershell
npx vercel auth login
.\scripts\setup-secrets.ps1 -Phase phase3
```

### ④ GitHub
```powershell
.\scripts\setup-secrets.ps1 -Phase phase5
# Ou manuellement: gh secret set VAR_NAME --body value
```

---

## 📊 Architecture des Secrets (Visualisé)

```
┌─────────────────────────────────────────┐
│          Ta Application                 │
├─────────────────────────────────────────┤
│                                         │
│  Local Dev         Production            │
│  ───────────────   ──────────────────   │
│  .env.local        Vercel Environment   │
│       ↓                    ↓            │
│  .env.vault────────┬──────┐             │
│  (chiffré)         │      │             │
│       ↑            ↓      ↓             │
│  .env.keys    Vercel  Cloudflare        │
│  (secret!)     Vars    Workers          │
│                                         │
│               CI/CD (GitHub)            │
│                   ↓                     │
│              GitHub Secrets             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔑 Variables Essentielles (Copier-Coller)

### Pour `.env.local`

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/iapostemanage

# Auth
NEXTAUTH_SECRET=aXvSqRtWyZpMkLnJhGfDsA9bC8eE7qP2x1oV5mN3rT4uI6  # ← Générer: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Stripe (TEST)
STRIPE_SECRET_KEY=sk_test_XxXxXxXxXxXx
STRIPE_PUBLISHABLE_KEY=pk_test_XxXxXxXxXxXx

# Ollama (Local IA)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Email
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxx

# GitHub
GITHUB_APP_ID=123456
GITHUB_WEBHOOK_SECRET=whsec_xxxxx
```

### Pour Vercel (Production)

```
DATABASE_URL          = production-db-url
NEXTAUTH_SECRET       = different-secret-value  (≠ dev)
NEXTAUTH_URL          = https://app.prod.com
STRIPE_SECRET_KEY     = sk_live_XxXxXxXxXxXx    (LIVE!)
STRIPE_PUBLISHABLE_KEY= pk_live_XxXxXxXxXxXx
```

---

## 🛡️ Checklist Sécurité (5 min)

| Item | ✅ Action | Status |
|------|----------|--------|
| 1️⃣  | `.env.local` complété | [ ] |
| 2️⃣  | `.env.keys` sauvegardé | [ ] |
| 3️⃣  | `.env.*` dans `.gitignore` | [ ] |
| 4️⃣  | `git status` montre 0 `.env` | [ ] |
| 5️⃣  | Vercel env vars vérifiées | [ ] |
| 6️⃣  | GitHub secrets vérifiés | [ ] |
| 7️⃣  | 2FA activé partout | [ ] |
| 8️⃣  | Test login fonctionne | [ ] |

---

## ⚠️ NE PAS FAIRE

```powershell
❌ git add .env.local
❌ git add .env.keys
❌ git add credentials.json
❌ git add *.pem

❌ Envoyer .env.keys par email
❌ Envoyer .env.keys sur Slack
❌ Committer .env.keys

❌ Utiliser le même secret en dev et prod
❌ Partager .env.keys en clair
❌ Oublier de changer les secrets tous les 90j
```

---

## ✅ FAIRE

```powershell
✅ Committer .env.vault (chiffré, safe)
✅ Sauvegarder .env.keys en lieu sûr
✅ Utiliser sk_test_ en dev, sk_live_ en prod
✅ Générer NEXTAUTH_SECRET aléatoire
✅ Activer 2FA sur Vercel, GitHub, Stripe
✅ Tester avec des vraies valeurs
✅ Rotation tous les 90 jours
✅ Audit mensuel
```

---

## 🆘 Problèmes Courants & Solutions

### ❌ Erreur: "NEXTAUTH_SECRET not found"
```powershell
# Solution:
# 1. Vérifier que .env.local existe
# 2. Vérifier que NEXTAUTH_SECRET est présent
# 3. Redémarrer le serveur
npm run dev  # Force reload
```

### ❌ Erreur: "DATABASE_URL connection failed"
```powershell
# Solution:
# 1. Vérifier DATABASE_URL dans .env.local
# 2. Vérifier que PostgreSQL tourne (ou Neon accessible)
# 3. Tester la connexion: npx prisma db push
```

### ❌ Erreur: "Stripe key invalid"
```powershell
# Solution:
# 1. Vérifier sk_test_ ou sk_live_ dans .env.local
# 2. Vérifier que c'est la bonne clé pour l'environnement
# 3. Copier-coller depuis Stripe dashboard (pas de typo)
```

### ❌ Vercel ne redéploie pas après secret change
```powershell
# Solution:
# 1. Attendre 2-3 minutes (propagation)
# 2. Ou forcer manuellement: npx vercel deploy
# 3. Ou via dashboard Vercel: Redeploy
```

### ❌ GitHub secrets ne sont pas visibles
```powershell
# Solution:
# 1. Vérifier permission (admin du repo)
# 2. Vérifier qu'on est connecté: gh auth status
# 3. Re-login: gh auth login
```

---

## 📅 Maintenance Rapide

### Chaque Semaine
```powershell
# Aucune action requise
# Juste surveiller les erreurs d'auth
```

### Chaque Mois
```powershell
# Vérifier que tout fonctionne
.\scripts\setup-secrets.ps1 -Phase check
```

### Tous les 90 Jours
```powershell
# Rotation des secrets
.\scripts\setup-secrets.ps1 -Phase rotate
```

---

## 📚 Lecture Complète (pour plus de détails)

| Document | Longueur | Quand Lire |
|----------|----------|-----------|
| **INDEX_SECRETS.md** | 5 min | Navigation complète |
| **GUIDE_RAPIDE_SECRETS.md** | 15 min | Setup rapide |
| **ROADMAP_SECRETS_COMPLET.md** | 1 heure | Référence complète |

---

## 🎯 Próximas Étapes Immédiatement

```
1️⃣  Ouvrir: .env.local.example
2️⃣  Créer: .env.local (copie)
3️⃣  Remplir: Vraies valeurs (Database, Stripe, etc.)
4️⃣  Lancer: .\scripts\setup-secrets.ps1 -Phase complete
5️⃣  Tester: npm run dev
6️⃣  ✅ Prêt!
```

---

**Besoin d'aide rapide?** Voir **INDEX_SECRETS.md** pour la navigation  
**Besoin d'un setup rapide?** Lancer **GUIDE_RAPIDE_SECRETS.md**  
**Besoin de tous les détails?** Lancer **ROADMAP_SECRETS_COMPLET.md**  

🚀 **Let's Go!**
