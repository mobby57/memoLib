# 🔐 Checklist de Déploiement - Sécurité des Secrets

**Avant de déployer en production, vérifier TOUS les éléments!**

---

## ✅ Phase 1: Vérification Locale (5 min)

### 1.1 Vérifier `.gitignore`

```bash
# Ces fichiers doivent être ignorés:
git check-ignore .env.keys
git check-ignore .env.local
git check-ignore .env.backups/

# Output attendu:
# .env.keys
# .env.local
# .env.backups/
```

✅ Si OK, continuer. ❌ Sinon, ajouter à `.gitignore` avant de continuer.

### 1.2 Vérifier qu'il n'y a pas de secrets en clair

```bash
# Chercher dans le code
grep -r "sk_live_" src/   # Stripe test keys
grep -r "pk_live_" src/   # Stripe public keys
grep -r "postgresql://" src/  # DB passwords
grep -r "Bearer " src/    # Tokens

# Output attendu: AUCUN résultat
```

❌ Si des résultats, les supprimer immédiatement!

### 1.3 Vérifier que `.env.vault` est bien chiffré

```bash
# Afficher le contenu du fichier
cat .env.vault | head -10

# Doit montrer des caractères chiffrés, pas des secrets en clair
# ✓ Exemple bon:
# DOTENV_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
# DATABASE_URL=**encrypted**...

# ❌ Exemple mauvais (NE JAMAIS committer!):
# DATABASE_URL=postgresql://user:password@host/db
```

❌ Si secrets en clair, ré-chiffrer immédiatement:

```bash
# Nettoyer et re-chiffrer
rm .env.vault
npx dotenv-vault encrypt
```

### 1.4 Vérifier les logs

```bash
# Chercher si des secrets sont dans les logs
grep -r "DATABASE_URL\|NEXTAUTH_SECRET\|sk_live" logs/
grep -r "Bearer\|Authorization" logs/

# Output attendu: AUCUN résultat
```

### 1.5 Vérifier les variables d'environnement

```bash
# Afficher toutes les vars env (DANGEREUX - attention!)
env | grep -i secret | head

# Vérifier que .env.local est bien `.gitignore`d:
git status
# .env.local ne doit PAS apparaître dans la liste!
```

✅ `.env.local` ne doit **jamais** être listée dans `git status`.

---

## ✅ Phase 2: Vérification Git (3 min)

### 2.1 Vérifier l'historique Git

```bash
# Chercher si des secrets ont été commités avant
git log --all --full-history -- '.env*' | head -20

# Output attendu: AUCUN commit trouvé (ou seulement .env.vault)
```

❌ Si des commits `.env.local` existent, utiliser `git-filter-repo` pour les supprimer:

```bash
# ⚠️ DANGEREUX - à faire AVANT de pousser!
npm install -g git-filter-repo

# Supprimer tous les commits contenant .env.local
git filter-repo --invert-paths --path .env.local
```

### 2.2 Vérifier les différences non-committées

```bash
# Afficher tous les fichiers non-committés
git status

# Ces fichiers doivent être en .gitignore:
# .env.keys ✓
# .env.local ✓
# .env.*.local ✓

# NE PAS voir:
# .env.vault → DOIT être commité (chiffré)
```

### 2.3 Vérifier le dernier push

```bash
# Voir le dernier commit push
git log -1 --stat

# Chercher les fichiers modifiés
git diff HEAD~1 HEAD | grep -i "secret\|password\|key"

# Output attendu: AUCUN match
```

---

## ✅ Phase 3: Vérification Produit (2 min)

### 3.1 Tester localement sans secrets

```bash
# Simuler un environnement de prod (sans .env.local)
rm .env.local  # ATTENTION: C'est juste pour tester!

# L'app doit afficher une erreur de DB (pas un secret exposé!)
npm run dev

# Attendre l'erreur...
# ✓ BON: "Error: ECONNREFUSED - Cannot connect to database"
# ❌ MAUVAIS: "postgresql://user:password@host" → SECRET EXPOSÉ!
```

Puis restaurer `.env.local`:
```bash
npx dotenv-vault decrypt
```

### 3.2 Vérifier les messages d'erreur

```bash
# Chercher dans le code les logs de confidentialité
grep -r "console.log\|console.error" src/ | grep -i "secret\|password\|token" | head -5

# Chaque log doit avoir un masquage!
# ✓ BON: console.error('Failed login:', { email })
# ❌ MAUVAIS: console.error('Token:', process.env.NEXTAUTH_SECRET)
```

### 3.3 Vérifier les erreurs sensibles

Parcourir le code et vérifier que les erreurs ne révèlent pas:
- User IDs
- Database structure
- API endpoints internes
- Secret names

---

## ✅ Phase 4: Vérification Deployment (5 min)

### 4.1 Vérifier les secrets Vercel

```bash
# Afficher les variables d'environnement Vercel
vercel env ls

# Doit afficher les NOMS des secrets, jamais les VALEURS
# ✓ BON:
# DATABASE_URL [encrypted]
# NEXTAUTH_SECRET [encrypted]

# ❌ MAUVAIS:
# DATABASE_URL postgresql://...
# NEXTAUTH_SECRET abc123...
```

### 4.2 Vérifier les secrets Cloudflare

```bash
# Afficher les secrets Cloudflare
wrangler secret list

# Doit afficher seulement les NOMS
# ✓ BON: SECRET_NAME (last updated: 2026-01-21)
# ❌ MAUVAIS: DATABASE_URL = postgresql://...
```

### 4.3 Vérifier les secrets Docker

Si utilisation de Docker:
```bash
# Ne jamais inclure de secrets dans docker-compose
cat docker-compose.yml | grep -i "password\|secret\|token"

# Output attendu: AUCUN résultat (tout via env)
```

### 4.4 Vérifier la configuration CI/CD

```bash
# Vérifier les secrets GitHub Actions
cat .github/workflows/*.yml | grep -i "secrets\."

# Doit utiliser: ${{ secrets.DATABASE_URL }}
# NE JAMAIS: ${{ secrets.DATABASE_URL | echo }}
```

---

## ✅ Phase 5: Sécurité Cloudflare/Vercel (2 min)

### 5.1 Vérifier CORS & headers

```bash
# Vérifier que les headers sécurisés sont en place
curl -I https://iapostemanager.vercel.app

# Doit afficher:
# X-Content-Type-Options: nosniff ✓
# X-Frame-Options: DENY ✓
# Strict-Transport-Security: max-age=... ✓
```

### 5.2 Vérifier SSL/TLS

```bash
# Vérifier certificat SSL
nslookup iapostemanage.vercel.app

# Doit avoir HTTPS (pas HTTP)
# ✓ https://iapostemanager.vercel.app
# ❌ http://iapostemanage.vercel.app
```

---

## ✅ Phase 6: Audit Trail (1 min)

### 6.1 Documenter la configuration

```bash
# Créer un rapport de déploiement
cat > docs/DEPLOYMENT_REPORT_$(date +%Y-%m-%d).md << EOF
# Rapport de Déploiement Sécurité

**Date**: $(date)
**Responsable**: $(git config user.name)
**Commit**: $(git rev-parse --short HEAD)

## Vérifications de Sécurité

- [x] .env.keys dans .gitignore
- [x] .env.local dans .gitignore
- [x] Aucun secret en clair dans le code
- [x] .env.vault bien chiffré
- [x] Historique Git nettoyé
- [x] Vercel secrets configurés
- [x] Cloudflare secrets configurés
- [x] SSL/TLS activé
- [x] Headers sécurisés en place

## Secrets Déployés

- DATABASE_URL: ✓
- NEXTAUTH_SECRET: ✓
- STRIPE_SECRET_KEY: ✓
- AZURE_AD_CLIENT_SECRET: ✓

## Status: ✅ SÛRE À DÉPLOYER
EOF
```

### 6.2 Enregistrer les accès

Dans `.ops/DEPLOYMENT_LOG.md`:
```markdown
| Date | Action | Admin | Commit | Status |
|------|--------|-------|--------|--------|
| 2026-01-21 | Deploy Prod | [name] | abc1234 | ✅ Success |
```

---

## 📊 Checklist Finale (Imprimer!)

```
PRÉ-DÉPLOIEMENT - SÉCURITÉ DES SECRETS
═════════════════════════════════════════════════════════════

PHASE 1: Vérification Locale (5 min)
  ☐ git check-ignore: .env.keys, .env.local OK
  ☐ Grep: Aucun secret en clair dans src/
  ☐ .env.vault: Bien chiffré (pas de password visibles)
  ☐ Logs: Aucun secret exposé
  ☐ Env vars: .env.local pas dans git status

PHASE 2: Vérification Git (3 min)
  ☐ git log --all: Aucun .env.local commité
  ☐ git status: Seulement fichiers attendus
  ☐ git diff HEAD: Aucun secret révélé
  ☐ git filter-repo: Exécuté si nécessaire

PHASE 3: Vérification Produit (2 min)
  ☐ Test sans .env.local: Erreur de BD (OK), pas de secret
  ☐ Erreurs: Pas de révélation de structure/secrets
  ☐ Logs: Masquage des données sensibles
  ☐ Code: Pas de console.log(secrets)

PHASE 4: Vérification Deployment (5 min)
  ☐ Vercel: vercel env ls → Seulement NOMS
  ☐ Cloudflare: wrangler secret list → Seulement NOMS
  ☐ Docker: docker-compose.yml → Pas de secrets
  ☐ CI/CD: .github/workflows → secrets.VAR OK

PHASE 5: Sécurité (2 min)
  ☐ CORS: Headers sécurisés en place
  ☐ SSL/TLS: HTTPS activé, certificat valide
  ☐ Rate limiting: Configured
  ☐ CSRF: Protection active

PHASE 6: Audit (1 min)
  ☐ Rapport déploiement: Créé et signé
  ☐ Log d'accès: Mise à jour
  ☐ 1Password: Clés sauvegardées
  ☐ Notification équipe: Envoyée

═════════════════════════════════════════════════════════════
SCORE FINAL: _____/18 items checked

✅ Si 18/18: DÉPLOIEMENT APPROUVÉ!
❌ Si < 18/18: NE PAS DÉPLOYER - Résoudre les items manquants!

═════════════════════════════════════════════════════════════
Date: ________________    Responsable: ____________________
```

---

## 🚨 En cas de problème

**Problème détecté?** Ne pas déployer!

1. **STOP immédiatement le déploiement**
2. **Escalader** → `security@iapostemanage.com`
3. **Documenter** → Quelle vérification a échoué?
4. **Corriger** → Suivre les guides respectifs
5. **Re-valider** → Refaire toutes les étapes

---

## 📞 Support Urgent

| Niveau | Contact | Délai |
|--------|---------|-------|
| **Critique** | security@iapostemanage.com | < 30 min |
| **High** | dpo@iapostemanage.com | < 2h |
| **Normal** | #ops-secrets Slack | < 24h |

---

**Créé**: 21 janvier 2026  
**Dernière révision**: En continu  
**Responsable**: Security Team + DPO

---

**Bon déploiement!** 🚀
