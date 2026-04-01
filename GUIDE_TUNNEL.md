# 🌐 TUNNEL HTTPS - Guide d'Utilisation

## 🚀 Démarrage Rapide

```powershell
.\tunnel-https.ps1
```

## 📋 Options Disponibles

### 1. ngrok (Recommandé)
- ✅ Gratuit
- ✅ Simple à utiliser
- ✅ URL stable pendant la session
- ✅ Dashboard web (http://localhost:4040)

**Installation:**
```powershell
# Via Chocolatey
choco install ngrok

# OU téléchargement manuel
# https://ngrok.com/download
```

**Configuration:**
```powershell
ngrok config add-authtoken VOTRE_TOKEN
```

**Utilisation:**
```powershell
ngrok http 5078
```

**Résultat:**
```
https://abc123.ngrok-free.app → http://localhost:5078
```

### 2. cloudflared (Cloudflare)
- ✅ Gratuit
- ✅ Rapide
- ✅ Pas de compte requis
- ✅ URL aléatoire

**Installation:**
```powershell
choco install cloudflared
```

**Utilisation:**
```powershell
cloudflared tunnel --url http://localhost:5078
```

**Résultat:**
```
https://xyz789.trycloudflare.com → http://localhost:5078
```

### 3. localtunnel (npm)
- ✅ Gratuit
- ✅ Basique
- ⚠️ Nécessite Node.js

**Installation:**
```powershell
npm install -g localtunnel
```

**Utilisation:**
```powershell
npx localtunnel --port 5078
```

**Résultat:**
```
https://random.loca.lt → http://localhost:5078
```

## 🎯 Cas d'Usage

### Test Mobile
1. Démarrez l'API: `dotnet run`
2. Créez le tunnel: `.\tunnel-https.ps1`
3. Ouvrez l'URL sur votre mobile

### Démo Client
1. Partagez l'URL HTTPS
2. Le client accède depuis n'importe où
3. Arrêtez le tunnel après la démo

### Webhook Testing
1. Configurez le webhook avec l'URL HTTPS
2. Testez les callbacks en local
3. Debuggez en temps réel

## ⚠️ Sécurité

- ❌ Ne pas utiliser en production
- ❌ Ne pas exposer de données sensibles
- ✅ Utiliser uniquement pour tests/démos
- ✅ Arrêter le tunnel après usage

## 📊 Monitoring

### ngrok Dashboard
```
http://localhost:4040
```

Affiche:
- Requêtes en temps réel
- Headers HTTP
- Body des requêtes
- Temps de réponse

## 🔧 Dépannage

### Port déjà utilisé
```powershell
netstat -ano | findstr :5078
taskkill /PID <PID> /F
```

### Tunnel ne démarre pas
- Vérifiez que l'API est démarrée
- Vérifiez votre connexion Internet
- Essayez une autre méthode

## 💡 Conseils

1. **ngrok** pour démos professionnelles
2. **cloudflared** pour tests rapides
3. **localtunnel** si vous avez déjà Node.js

---

**Fichier**: tunnel-https.ps1  
**Statut**: ✅ Prêt à utiliser
