# 📚 Index - Gestion des Secrets & Sécurité

**Complété**: 21 janvier 2026  
**Statut**: ✅ Production-ready  

---

## 📖 Documents Disponibles

### 1. 🔐 [ENCRYPTED_SECRETS_GUIDE.md](./ENCRYPTED_SECRETS_GUIDE.md)
**Pour**: Tous (devs, admins, DPO)  
**Durée**: 20 min  
**Contenu**:
- ✅ Vue d'ensemble du système dotenv-vault
- ✅ Concepts clés (fichiers, flux de données)
- ✅ Installation et setup initial
- ✅ Ajouter/modifier des secrets
- ✅ Déchiffrement local pour développeurs
- ✅ Configuration production (Vercel, Cloudflare, Docker)
- ✅ Rotation des secrets (91 jours)
- ✅ Sécurité & audit trail
- ✅ Commandes de référence
- ✅ Checklists pour devs et admins

**Commande rapide**: `.\scripts\setup-encrypted-secrets.ps1`

---

### 2. 🎯 [ONBOARDING_SECRETS.md](./ONBOARDING_SECRETS.md)
**Pour**: Nouveaux développeurs  
**Durée**: 5-10 min  
**Contenu**:
- ✅ Checklist onboarding en 7 étapes
- ✅ Comment obtenir la clé master
- ✅ Création de `.env.keys` local
- ✅ Déchiffrement et vérification
- ✅ Troubleshooting courant
- ✅ Commandes essentielles
- ✅ Code of conduct secrets
- ✅ Template demande Slack

**Lien rapide**: Copier le template Slack dans #ops-secrets

---

### 3. 🔄 [Scripts Automatisés](../scripts/)

#### a) `setup-encrypted-secrets.ps1`
**Usage**: `.\scripts\setup-encrypted-secrets.ps1`  
**Fait**:
- Installe dotenv-vault globalement
- Génère une clé master aléatoire (32 chars)
- Crée `.env.vault` (template vide)
- Crée `.env.keys` (contient clé master)
- Met à jour `.gitignore` automatiquement

**Output**: Affiche la nouvelle clé à sauvegarder dans 1Password

#### b) `rotate-secrets.ps1`
**Usage**: `.\scripts\rotate-secrets.ps1`  
**Exécution**: Tous les 90 jours (ou après suspicion de fuite)  
**Fait**:
- Sauvegarde l'ancienne configuration
- Extrait tous les secrets actuels
- Génère une nouvelle clé master
- Re-chiffre tous les secrets
- Valide le déchiffrement
- Génère un rapport de rotation

**Output**: `docs/ROTATION_REPORT_<timestamp>.md`

---

### 4. 📝 [SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md)
**Pour**: Admin/DPO (maintenance)  
**Durée**: 15 min  
**Contenu**:
- ✅ Liste des secrets critiques (tableau)
- ✅ Où retrouver chaque secret (par console)
- ✅ Bonnes pratiques de stockage
- ✅ Procédure pour nouveau dev
- ✅ Sauvegarde & chiffrement des backups
- ✅ Contacts et support

---

## 🎯 Roadmap d'Utilisation

### **Jour 1 - Activation initiale** (Admin)
```bash
# 1. Exécuter le script d'installation
.\scripts\setup-encrypted-secrets.ps1

# 2. Sauvegarder la clé dans 1Password
# DOTENV_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456

# 3. Partager avec l'équipe via Slack/1Password
```

### **Jour 2+ - Pour chaque développeur**
```bash
# 1. Cloner le repo
git clone https://github.com/yourusername/iaPostemanage.git
cd iaPostemanage

# 2. Demander clé master dans #ops-secrets

# 3. Créer .env.keys
echo "DOTENV_KEY=<clé_reçue>" > .env.keys

# 4. Déchiffrer
npx dotenv-vault decrypt

# 5. Démarrer
npm run dev
```

### **Tous les 90 jours - Rotation** (Admin)
```bash
# 1. Exécuter le script de rotation
.\scripts\rotate-secrets.ps1

# 2. Vérifier le rapport généré
cat docs/ROTATION_REPORT_<timestamp>.md

# 3. Envoyer la nouvelle clé via 1Password

# 4. Chaque dev met à jour son .env.keys
echo "DOTENV_KEY=<nouvelle_clé>" > .env.keys
npx dotenv-vault decrypt
```

---

## 📊 Matrice d'Accès

| Rôle | Fichier | Accès | Notes |
|------|---------|-------|-------|
| **Dev** | `.env.vault` | Read ✓ | Chiffré, sûr de committer |
| **Dev** | `.env.keys` | Read ✓ | Local only, .gitignore ✓ |
| **Dev** | `.env.local` | Read/Write | Après décryption, local only |
| **Admin** | `.env.vault` | R/W ✓ | Maintenance, re-chiffrement |
| **Admin** | `.env.keys` | R/W | Generation, rotation |
| **Admin** | `.env.*.backup` | R/W | Audits, recovery |
| **Public** | Repo | Read | Aucun secret exposé ✓ |

---

## 🔒 Sécurité - Checklist

### **Avant de committer**
- [ ] `.env.keys` est dans `.gitignore`
- [ ] `.env.local` est dans `.gitignore`
- [ ] `.env.vault` est chiffré (vérifier: `npx dotenv-vault status`)
- [ ] Aucun secret en clair dans le code
- [ ] `git diff` ne montre aucune valeur sensible

### **Avant de déployer**
- [ ] Prod secrets sont dans Vercel env vars (copié-collé)
- [ ] Cloudflare secrets sont dans wrangler secrets
- [ ] Aucun log contient de secrets
- [ ] Audit trail est sauvegardé

### **Après une rotation**
- [ ] Nouvelle clé est dans 1Password
- [ ] Ancien key est archivé avec `[ROTATED]` label
- [ ] Rapport de rotation est documenté
- [ ] Tous les devs ont reçu la nouvelle clé
- [ ] Prod est déployé avec les nouveaux secrets

---

## 🆘 Troubleshooting Rapide

| Problème | Solution | Lien |
|----------|----------|------|
| **Clé perdue** | Restaurer depuis 1Password | [SECRET_MANAGEMENT.md](./SECRET_MANAGEMENT.md#section-6) |
| **Décryption échoue** | Vérifier clé exacte, pas d'espaces | [ENCRYPTED_SECRETS_GUIDE.md#section-3) |
| **Dev nouveau** | Suivre ONBOARDING_SECRETS.md | [ONBOARDING_SECRETS.md](./ONBOARDING_SECRETS.md) |
| **Rotation 90j** | Exécuter `rotate-secrets.ps1` | [Scripts](../scripts/rotate-secrets.ps1) |
| **Soupçon de fuite** | Alerter `security@iapostemanage.com` | [ENCRYPTED_SECRETS_GUIDE.md#incident) |

---

## 📞 Contacts

| Besoin | Contact | Slack | Email |
|--------|---------|-------|-------|
| **Clé master** | DPO | @dpo | dpo@iapostemanage.com |
| **Rotation secrets** | Ops | #ops-secrets | ops@iapostemanage.com |
| **Sécurité** | Security | #security | security@iapostemanage.com |
| **Support dev** | #engineering | #engineering | engineering@iapostemanage.com |

---

## ✅ Checklist de Validation

**Production-ready?** Vérifier:

- [ ] `.env.vault` est commité (chiffré) ✓
- [ ] `.env.keys` est dans `.gitignore` ✓
- [ ] Clé master est dans 1Password ✓
- [ ] `setup-encrypted-secrets.ps1` fonctionne ✓
- [ ] `rotate-secrets.ps1` fonctionne ✓
- [ ] ENCRYPTED_SECRETS_GUIDE.md est complet ✓
- [ ] ONBOARDING_SECRETS.md est complet ✓
- [ ] Tous les devs ont accès à la clé ✓
- [ ] Vercel/Cloudflare secrets sont configurés ✓
- [ ] Audit trail est documenté ✓

**Tous les items checked?** ✅ **Prêt pour production!**

---

## 📚 Ressources Supplémentaires

- [dotenv-vault Official Docs](https://www.dotenv.org/docs/security/encryption)
- [OWASP: Secrets Management](https://owasp.org/www-project-nodejs-top-10/2023/A02_2023-Broken_Authentication)
- [1Password Teams](https://support.1password.com/teams/)
- [Vault by HashiCorp](https://www.vaultproject.io/)
- [Doppler.com](https://www.doppler.com/) (Alternative SaaS)

---

**Version**: 1.0  
**Dernière mise à jour**: 21 janvier 2026  
**Responsable**: DPO + Ops team  
**Prochaine révision**: 21 avril 2026 (90j)

---

## 🚀 Quick Start (30 secondes)

**Vous êtes admin?**
```bash
.\scripts\setup-encrypted-secrets.ps1
# Sauvegardez la clé dans 1Password ↑
```

**Vous êtes dev?**
```bash
# 1. Demander clé dans #ops-secrets
echo "DOTENV_KEY=<clé>" > .env.keys
npx dotenv-vault decrypt
npm run dev
```

**Done!** ✅
