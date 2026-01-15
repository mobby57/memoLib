# 🔗 Intégration GitHub avec Cloudflare Tunnel

## 📋 Présentation

Ce guide explique comment configurer les webhooks GitHub avec Cloudflare Tunnel au lieu de ngrok pour une URL permanente et fiable.

## ✅ Avantages Cloudflare vs ngrok

| Critère | ngrok | Cloudflare Tunnel ✅ |
|---------|-------|---------------------|
| **URL** | Change à chaque redémarrage | **Permanente** |
| **Prix** | Gratuit limité, puis payant | **Totalement gratuit** |
| **Stabilité** | Parfois instable | **Production-ready** |
| **Sécurité** | Bonne | **Excellente (DDoS protection)** |
| **Setup** | Simple | **Aussi simple** |

## 🚀 Configuration Rapide

### 1. Lancer Cloudflare Tunnel

```powershell
# Dans un terminal PowerShell
.\cloudflare-start.ps1
```

Votre URL permanente sera affichée :
```
🌐 Cloudflare Tunnel actif sur : https://votes-additional-filed-definitions.trycloudflare.com
```

### 2. Configurer GitHub Webhook

1. Allez sur votre dépôt GitHub : `https://github.com/mobby57/iapostemanager`
2. **Settings** → **Webhooks** → **Add webhook**
3. Configurez :
   - **Payload URL** : `https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github`
   - **Content type** : `application/json`
   - **Secret** : Votre `GITHUB_WEBHOOK_SECRET` du fichier `.env`
   - **Events** : Sélectionnez les événements souhaités (push, pull request, issues, etc.)

4. Cliquez sur **Add webhook**

### 3. Tester le Webhook

```powershell
# Test local
curl https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github

# Ou via PowerShell
Invoke-WebRequest -Uri "https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github"
```

### 4. Vérifier dans GitHub

1. Retournez dans **Settings** → **Webhooks**
2. Cliquez sur votre webhook
3. Vérifiez l'onglet **Recent Deliveries**
4. Si vous voyez une ✅ réponse 200, c'est configuré !

## 🔧 Configuration des Variables d'Environnement

Votre fichier `.env` devrait contenir :

```env
# CLOUDFLARE TUNNEL - URL Permanente
CLOUDFLARE_TUNNEL_ENABLED="true"
CLOUDFLARE_TUNNEL_URL="https://votes-additional-filed-definitions.trycloudflare.com"
PUBLIC_WEBHOOK_URL="https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github"

# GITHUB INTEGRATION
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY_PATH="./github-app-key.pem"
GITHUB_WEBHOOK_SECRET="117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889"
GITHUB_REPOSITORY="mobby57/iapostemanager"
GITHUB_BRANCH_MAIN="main"

# API CORS - Inclure l'URL Cloudflare
API_CORS_ORIGINS="http://localhost:3000,https://votes-additional-filed-definitions.trycloudflare.com"
```

## 📝 Migration depuis ngrok

Si vous utilisiez ngrok auparavant :

### 1. Mettre à jour .env

```env
# Ancienne configuration ngrok (à commenter/supprimer)
# NGROK_URL="https://baaf048af00d.ngrok-free.app"
# NGROK_AUTHTOKEN="votre_token"

# Nouvelle configuration Cloudflare ✅
CLOUDFLARE_TUNNEL_ENABLED="true"
CLOUDFLARE_TUNNEL_URL="https://votes-additional-filed-definitions.trycloudflare.com"
PUBLIC_WEBHOOK_URL="https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github"
```

### 2. Mettre à jour GitHub Webhooks

1. Allez dans **Settings** → **Webhooks**
2. Pour chaque webhook existant :
   - Cliquez sur **Edit**
   - Remplacez l'URL ngrok par votre URL Cloudflare
   - **Update webhook**

### 3. Arrêter ngrok

```powershell
# Trouver le processus ngrok
Get-Process -Name "ngrok"

# L'arrêter
Stop-Process -Name "ngrok"
```

## 🔐 Sécurité

### Vérifier la signature GitHub

Votre API vérifie automatiquement la signature des webhooks GitHub :

```typescript
// app/api/webhooks/github/route.ts
const signature = headers.get('x-hub-signature-256');
const isValid = verifyGitHubSignature(body, signature, process.env.GITHUB_WEBHOOK_SECRET);
```

### Bonnes pratiques

✅ Utilisez un `GITHUB_WEBHOOK_SECRET` fort (généré avec `openssl rand -hex 32`)  
✅ Activez HTTPS (Cloudflare le fait automatiquement)  
✅ Limitez les événements aux seuls nécessaires  
✅ Surveillez les logs de webhooks dans GitHub  

## 🎯 Événements GitHub Supportés

Votre application peut recevoir et traiter :

- ✅ **Push** - Déploiements automatiques
- ✅ **Pull Request** - Revue de code automatique
- ✅ **Issues** - Création de tickets
- ✅ **Comments** - Notifications
- ✅ **Release** - Déploiement en production

## 🐛 Dépannage

### Webhook ne fonctionne pas

1. **Vérifier que Cloudflare Tunnel est actif** :
   ```powershell
   # Vérifier le processus cloudflared
   Get-Process -Name "cloudflared"
   ```

2. **Tester l'URL localement** :
   ```powershell
   curl http://localhost:3000/api/webhooks/github
   ```

3. **Vérifier les logs GitHub** :
   - GitHub → Settings → Webhooks → Recent Deliveries
   - Regardez les codes de réponse

4. **Vérifier les logs de votre app** :
   ```powershell
   # Logs Next.js
   npm run dev
   ```

### URL Cloudflare change

Si vous redémarrez `cloudflared`, l'URL peut changer. Solutions :

**Option 1 : Garder cloudflared actif**
```powershell
# Lancer en arrière-plan
.\cloudflare-start.ps1
```

**Option 2 : Créer un tunnel nommé (URL fixe)** ⭐
```powershell
# Se connecter à Cloudflare
cloudflared tunnel login

# Créer un tunnel nommé
cloudflared tunnel create iapostemanager

# Configurer le tunnel
cloudflared tunnel route dns iapostemanager tunnel.votredomaine.com
```

Avec cette option, vous aurez une URL fixe comme `https://tunnel.votredomaine.com` !

## 📊 Monitoring

### Surveiller les webhooks

Consultez les logs dans :
- **GitHub** : Settings → Webhooks → Recent Deliveries
- **Votre App** : Logs console ou fichiers de logs
- **Cloudflare Dashboard** : Analytics du tunnel

## 🎉 Résultat Final

Une fois configuré, vous avez :

✅ Une URL permanente Cloudflare  
✅ Des webhooks GitHub fonctionnels  
✅ Une intégration CI/CD automatique  
✅ Une meilleure sécurité qu'avec ngrok  
✅ Tout cela **gratuitement** !

## 📚 Ressources

- [Documentation Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Documentation GitHub Webhooks](https://docs.github.com/webhooks)
- [Guide complet Cloudflare](./CLOUDFLARE_TUNNEL_SETUP.md)
- [Guide migration](./CLOUDFLARE_MIGRATION_SUCCESS.md)

---

**🎯 Vous avez maintenant une intégration GitHub professionnelle avec Cloudflare Tunnel !**
