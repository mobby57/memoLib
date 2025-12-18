# 🔑 AIDE-MÉMOIRE - CLÉS SSH GITHUB ACTIONS

## ✅ Clés générées avec succès!

**Emplacement:**
- Clé privée : `C:\Users\moros\.ssh\github_deploy`
- Clé publique: `C:\Users\moros\.ssh\github_deploy.pub`

---

## 📋 Étapes suivantes

### 1️⃣ Copier la clé publique sur le serveur

**Afficher la clé publique:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"
```

**Méthode A - Automatique (si vous avez déjà accès SSH):**
```powershell
# Remplacer 'user' et 'votre-serveur.com' par vos valeurs
$pubKey = Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"
ssh user@votre-serveur.com "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```

**Méthode B - Manuelle:**
1. Copier le contenu de la clé publique (commande ci-dessus)
2. Se connecter au serveur: `ssh user@votre-serveur.com`
3. Sur le serveur, exécuter:
```bash
mkdir -p ~/.ssh
echo 'COLLER_LA_CLÉ_PUBLIQUE_ICI' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 2️⃣ Ajouter la clé privée dans GitHub Secrets

**Afficher la clé privée:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy"
```

**Ajouter dans GitHub:**
1. Aller sur: https://github.com/VOTRE_USERNAME/VOTRE_REPO/settings/secrets/actions
2. Cliquer: **New repository secret**
3. Name: `SSH_PRIVATE_KEY`
4. Secret: Coller **TOUTE** la clé privée (de `-----BEGIN` jusqu'à `-----END` inclus)
5. Cliquer: **Add secret**

---

### 3️⃣ Configurer les autres secrets GitHub

Ajouter ces secrets aussi (même page):

**PRODUCTION_HOST**
```
Valeur: IP ou domaine de votre serveur
Exemple: 123.45.67.89 ou monserveur.example.com
```

**PRODUCTION_USER**
```
Valeur: utilisateur SSH sur le serveur
Exemple: deploy ou ubuntu ou www-data
```

**DOCKER_USERNAME**
```
Valeur: votre nom d'utilisateur Docker Hub
Exemple: mooby865
```

**DOCKER_PASSWORD**
```
Valeur: token Docker Hub (pas votre mot de passe!)
1. Aller sur: https://hub.docker.com/settings/security
2. Cliquer: New Access Token
3. Description: "GitHub Actions CI/CD"
4. Permissions: Read, Write, Delete
5. Copier le token (commence par dckr_pat_...)
```

**SLACK_WEBHOOK_URL** (optionnel)
```
Valeur: URL webhook Slack pour notifications
1. Aller sur: https://api.slack.com/apps
2. Create New App → From scratch
3. Incoming Webhooks → Activate
4. Add New Webhook to Workspace
5. Copier l'URL
```

---

### 4️⃣ Tester la connexion SSH

**Test depuis Windows:**
```powershell
# Remplacer 'user' et 'votre-serveur.com'
ssh -i $env:USERPROFILE\.ssh\github_deploy user@votre-serveur.com
```

**Si ça fonctionne:**
✅ Vous devez vous connecter au serveur sans mot de passe
✅ La clé SSH est correctement configurée
✅ GitHub Actions pourra déployer automatiquement

**Si erreur "Permission denied":**
❌ Vérifier que la clé publique est bien dans `~/.ssh/authorized_keys` sur le serveur
❌ Vérifier les permissions: `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
❌ Vérifier le nom d'utilisateur et l'adresse du serveur

---

## 🚀 Déclenchement du CI/CD

Une fois tous les secrets configurés:

1. Faire un commit et push sur la branche `main` ou `develop`
2. Le workflow GitHub Actions se déclenche automatiquement
3. Vérifier sur: https://github.com/VOTRE_USERNAME/VOTRE_REPO/actions

**Déclenchement manuel:**
- GitHub → Actions → CI/CD Pipeline → Run workflow
- URL: https://github.com/mobby57/iapm.com/actions

---

## 📝 Commandes utiles

**Lister les clés SSH:**
```powershell
Get-ChildItem $env:USERPROFILE\.ssh\
```

**Afficher clé publique:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"
```

**Afficher clé privée:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy"
```

**Tester connexion SSH avec verbose:**
```powershell
ssh -v -i $env:USERPROFILE\.ssh\github_deploy user@votre-serveur.com
```

**Vérifier empreinte de la clé:**
```powershell
ssh-keygen -lf $env:USERPROFILE\.ssh\github_deploy.pub
```

---

## 🔐 Sécurité

**⚠️ IMPORTANT:**

- ❌ **NE JAMAIS** partager la clé privée (`github_deploy`)
- ❌ **NE JAMAIS** commiter la clé privée dans Git
- ❌ **NE JAMAIS** envoyer la clé privée par email/chat
- ✅ Seule la clé **publique** (`.pub`) peut être partagée
- ✅ La clé privée doit rester sur votre machine locale et dans GitHub Secrets uniquement

**Si la clé privée est compromise:**
1. Supprimer la clé du serveur: `rm ~/.ssh/authorized_keys`
2. Supprimer la clé de GitHub Secrets
3. Générer une nouvelle paire de clés
4. Recommencer la configuration

---

## 📚 Documentation complète

Pour plus de détails, voir: `GUIDE_PRODUCTION_COMPLET.md` (Section 4: CI/CD)

---

**Date de génération:** 17 décembre 2025  
**Clés générées pour:** GitHub Actions CI/CD iaPosteManager  
**Algorithme:** ED25519 (recommandé)
