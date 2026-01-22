# 🎯 Onboarding - Accès aux Secrets Chiffrés

**Pour**: Nouveau développeur / Contributeur  
**Durée**: 5-10 minutes  
**Pré-requis**: Node.js, Git, 1Password account

---

## ✅ Checklist Onboarding

### Étape 1: Cloner le repo (2 min)

```bash
git clone https://github.com/yourusername/iaPostemanage.git
cd iaPostemanage
npm install
```

### Étape 2: Demander la clé master (Slack)

Dans le channel `#ops-secrets` ou direct message au DPO:

> @dpo: Onboarding dev [your_name]. Besoin de la clé DOTENV_KEY pour déchiffrer les secrets.

**Attendre** la réponse avec la clé (format: 32 caractères alphanumériques).

**Ne JAMAIS** demander la clé par email! 🔐

### Étape 3: Créer `.env.keys`

Une fois la clé reçue, créer le fichier `.env.keys` **localement**:

```bash
# Sur Windows (PowerShell)
echo "DOTENV_KEY=<clé_reçue>" > .env.keys

# Sur Mac/Linux (Bash)
echo "DOTENV_KEY=<clé_reçue>" > .env.keys
```

**Exemple** (copier votre vraie clé reçue):
```bash
echo "DOTENV_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456" > .env.keys
```

**⚠️ IMPORTANT**:
- `.env.keys` est automatiquement dans `.gitignore` ✓
- NE PAS committer ce fichier!
- C'est uniquement local sur votre ordi

### Étape 4: Déchiffrer les secrets

```bash
# Déchiffrer (auto-utilise .env.keys)
npx dotenv-vault decrypt

# Vérifier que ça marche
cat .env.local | head -3
# Output:
# DATABASE_URL=postgresql://...
# NEXTAUTH_SECRET=abc123...
# STRIPE_SECRET_KEY=sk_live_...
```

Si vous voyez les secrets affichés → ✅ Succès!

### Étape 5: Vérifier les dépendances

```bash
# Vérifier npm packages
npm list --depth=0

# Vérifier les ports (3000, 8000, 11434)
npm run dev
```

Vous devriez voir:
```
▲ Next.js 16.1.1 (Turbopack)
✓ dev server running on localhost:3000
```

### Étape 6: Tester la base de données

```bash
# Sync Prisma
npx prisma db push

# Vérifier la connexion
npx prisma studio
```

Devrait ouvrir une interface graphique sur `localhost:5555` → ✅

### Étape 7: Démarrer localement

```bash
npm run dev
```

Ouvrir `http://localhost:3000` dans le navigateur.

**Vous devriez voir** la page de login ✅

---

## 🆘 Troubleshooting

### Problème: "DOTENV_KEY not found"

```bash
# Vérifier que .env.keys existe
ls -la .env.keys

# Si absent, créer:
echo "DOTENV_KEY=<votre_clé>" > .env.keys
```

### Problème: "Decryption failed"

Possible causes:
1. **Clé incorrecte** → Copier exactement (pas d'espaces)
2. **Mauvais format** → Doit être 32 caractères
3. **Ancienne clé** → Demander la clé ACTUELLE (peut avoir été rotatée)

```bash
# Vérifier la clé
cat .env.keys
# Output: DOTENV_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

### Problème: "DATABASE_URL not in .env.local"

Possible causes:
1. Secrets non yet déchiffrés
2. `.env.local` absent

```bash
# Re-déchiffrer
npx dotenv-vault decrypt --force

# Vérifier
cat .env.local | grep DATABASE_URL
```

### Problème: "Port 3000 already in use"

```bash
# Port different
npm run dev -- -p 3001

# Ou tuer le processus
# Windows: taskkill /PID <pid> /F
# Mac/Linux: kill -9 <pid>
```

### Problème: Prisma sync errors

```bash
# Reset DB (dev only!)
npx prisma migrate reset --force

# Re-sync
npx prisma db push
```

---

## 📚 Ressources Rapides

| Besoin | Lien |
|--------|------|
| **Gestion secrets** | [ENCRYPTED_SECRETS_GUIDE.md](./ENCRYPTED_SECRETS_GUIDE.md) |
| **Secrets actuels** | `.env.local` (après décryption) |
| **Architecture** | [README.md](../README.md) |
| **API routes** | [src/app/api/](../src/app/api/) |
| **Support technique** | `#engineering` Slack |
| **Incidents** | `security@iapostemanage.com` |

---

## 🎓 Commandes Essentielles

```bash
# Démarrage
npm run dev                    # Dev server (localhost:3000)
npm run build                  # Build prod
npx prisma db push            # Sync schema
npx prisma studio             # GUI base de données

# Secrets
npx dotenv-vault decrypt      # Déchiffrer
npx dotenv-vault encrypt      # Chiffrer (admin only)
npx dotenv-vault status       # Vérifier état

# Tests
npm test                       # Jest tests
npm run test:watch            # Watch mode

# Nettoyage
rm -rf node_modules .next     # Full clean
npm install && npm run build   # Rebuild tout
```

---

## 📝 Template de demande Slack

Pour demander accès:

```
@dpo Bonjour, je suis [prénom] [nom], nouveau dev sur IA Poste Manager.

J'ai cloné le repo et installé les dépendances. Besoin de la clé DOTENV_KEY 
pour déchiffrer .env.vault et démarrer le développement local.

Merci!

[Mon 1Password email]: [your.email@company.com]
```

---

## ✅ Validation Finale

Avant de commencer le développement, vérifier:

- [ ] `git clone` réussi
- [ ] `npm install` sans erreurs
- [ ] DOTENV_KEY reçue de DPO
- [ ] `.env.keys` créé localement
- [ ] `npx dotenv-vault decrypt` réussie
- [ ] `.env.local` contient DATABASE_URL
- [ ] `npm run dev` démarre sur localhost:3000
- [ ] Login page visible ✓
- [ ] Prisma studio accessible
- [ ] Aucune erreur dans la console

**Si tout est ✓**: Vous êtes prêt à développer! 🚀

---

## 🔐 Code of Conduct - Secrets

**Je m'engage à:**

✅ Garder `.env.keys` local et secret  
✅ NE PAS committer `.env.local`  
✅ NE PAS envoyer clés par email/Slack public  
✅ Demander au DPO avant rotation  
✅ Reporter toute suspicion de fuite immédiatement  

**En violation:**
- Révocation d'accès
- Audit trail
- Notification de l'incident

---

**Questions?** → Slack `#engineering` ou `#ops-secrets`

**Bienvenue sur l'équipe!** 🎉
