# ☁️ Configuration Cloudflare Tunnel - URL Permanente

## 🎯 Pourquoi Cloudflare Tunnel plutôt que ngrok?

| Critère | ngrok | Cloudflare Tunnel |
|---------|-------|-------------------|
| **URL** | ⚠️ Change à chaque démarrage | ✅ **Permanente** |
| **Coût** | Gratuit (limité) | ✅ **Gratuit illimité** |
| **Performance** | Bon | ✅ Excellent (réseau Cloudflare) |
| **Sécurité** | Bon | ✅ DDoS protection inclus |
| **Configuration** | Simple | Moyenne |
| **Webhooks** | ⚠️ Doit être reconfiguré | ✅ Stable |

---

## 📥 Installation Cloudflare Tunnel

### Méthode 1: Installation Automatique (Recommandé)

```powershell
# Télécharger et installer cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$env:USERPROFILE\cloudflared.exe"

# Déplacer vers un dossier system
Move-Item -Path "$env:USERPROFILE\cloudflared.exe" -Destination "C:\Windows\System32\cloudflared.exe" -Force

# Vérifier installation
cloudflared --version
```

### Méthode 2: Installation Manuelle

1. **Télécharger**:
   - Aller sur: https://github.com/cloudflare/cloudflared/releases/latest
   - Télécharger: `cloudflared-windows-amd64.exe`

2. **Installer**:
   ```powershell
   # Renommer le fichier
   Rename-Item -Path "Downloads\cloudflared-windows-amd64.exe" -NewName "cloudflared.exe"
   
   # Copier vers System32
   Copy-Item -Path "Downloads\cloudflared.exe" -Destination "C:\Windows\System32\"
   ```

3. **Vérifier**:
   ```powershell
   cloudflared --version
   ```

---

## 🔐 Configuration Cloudflare Tunnel

### Étape 1: Authentification Cloudflare

```powershell
# Se connecter à Cloudflare (ouvre le navigateur)
cloudflared tunnel login
```

**Ce qui se passe:**
1. Une page Cloudflare s'ouvre dans votre navigateur
2. Connectez-vous à votre compte Cloudflare
3. Sélectionnez le domaine à utiliser (ou créez-en un gratuit)
4. Autorisez l'accès

Un fichier `cert.pem` sera créé dans `~/.cloudflared/`

### Étape 2: Créer un Tunnel

```powershell
# Créer un tunnel nommé "iapostemanage"
cloudflared tunnel create iapostemanage
```

**Résultat**: Un tunnel UUID sera généré (ex: `abc123-def456-ghi789`)

### Étape 3: Configuration DNS

```powershell
# Associer un sous-domaine à votre tunnel
cloudflared tunnel route dns iapostemanage iaposte.votredomaine.com
```

**Si vous n'avez pas de domaine:**
- Cloudflare offre des domaines gratuits `.trycloudflare.com`
- OU utilisez un domaine gratuit (Freenom, etc.)

### Étape 4: Fichier de Configuration

Créer le fichier: `~/.cloudflared/config.yml`

```powershell
# Créer le dossier
New-Item -ItemType Directory -Path "$env:USERPROFILE\.cloudflared" -Force

# Créer config.yml
@"
tunnel: iapostemanage
credentials-file: $env:USERPROFILE\.cloudflared\<TUNNEL-UUID>.json

ingress:
  - hostname: iaposte.votredomaine.com
    service: http://localhost:3000
  - service: http_status:404
"@ | Out-File -FilePath "$env:USERPROFILE\.cloudflared\config.yml" -Encoding UTF8
```

**Remplacer:**
- `<TUNNEL-UUID>` par votre UUID de tunnel
- `iaposte.votredomaine.com` par votre domaine

---

## 🚀 Démarrage du Tunnel

### Option 1: Démarrage Manuel

```powershell
# Démarrer le tunnel
cloudflared tunnel run iapostemanage
```

### Option 2: Service Windows (Recommandé pour Production)

```powershell
# Installer comme service Windows
cloudflared service install

# Démarrer le service
net start cloudflared
```

**Avantages:**
- ✅ Démarre automatiquement au démarrage de Windows
- ✅ Redémarre automatiquement en cas d'erreur
- ✅ Tourne en arrière-plan

---

## 🔧 Configuration pour iaPostemanage

### 1. Mettre à jour .env

```env
# Cloudflare Tunnel (URL permanente)
CLOUDFLARE_TUNNEL_URL="https://iaposte.votredomaine.com"
PUBLIC_WEBHOOK_URL="https://iaposte.votredomaine.com/api/webhooks/github"

# Désactiver ngrok
# NGROK_URL="..."
# NGROK_AUTHTOKEN="..."
```

### 2. Script de Démarrage

Créer `start-tunnel.ps1`:

```powershell
# start-tunnel.ps1
Write-Host "🚀 Démarrage Cloudflare Tunnel..." -ForegroundColor Cyan

# Vérifier si le tunnel tourne déjà
$process = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if ($process) {
    Write-Host "✅ Tunnel déjà actif" -ForegroundColor Green
} else {
    Write-Host "🔄 Démarrage du tunnel..." -ForegroundColor Yellow
    Start-Process -FilePath "cloudflared" -ArgumentList "tunnel", "run", "iapostemanage" -NoNewWindow
    Start-Sleep -Seconds 3
    Write-Host "✅ Tunnel démarré: https://iaposte.votredomaine.com" -ForegroundColor Green
}

Write-Host "🌐 Dashboard Cloudflare: https://one.dash.cloudflare.com/" -ForegroundColor Cyan
```

### 3. Tester le Tunnel

```powershell
# Démarrer Next.js
npm run dev

# Dans un autre terminal, démarrer le tunnel
.\start-tunnel.ps1

# Tester
curl https://iaposte.votredomaine.com
```

---

## 📋 Configuration GitHub Webhooks

### 1. Récupérer votre URL permanente

```
https://iaposte.votredomaine.com
```

### 2. Configurer dans GitHub

1. Aller sur votre repo: https://github.com/mobby57/iapostemanager/settings/hooks
2. Cliquer **"Add webhook"**
3. **Payload URL**: `https://iaposte.votredomaine.com/api/webhooks/github`
4. **Content type**: `application/json`
5. **Secret**: Votre `GITHUB_WEBHOOK_SECRET` du `.env`
6. **Events**: Sélectionner `push`, `pull_request`, `issues`
7. **Active**: ✅ Coché
8. Cliquer **"Add webhook"**

✅ **L'URL ne changera JAMAIS** contrairement à ngrok!

---

## 🔒 Sécurité

### 1. Protection du Tunnel

```yaml
# Dans config.yml, ajouter:
ingress:
  - hostname: iaposte.votredomaine.com
    service: http://localhost:3000
    originRequest:
      httpHostHeader: iaposte.votredomaine.com
      # Limitation IP (optionnel)
      connectTimeout: 30s
      noTLSVerify: false
```

### 2. Firewall Cloudflare

Dans le dashboard Cloudflare:
1. **Security** → **WAF**
2. Activer "Bot Fight Mode"
3. Créer des règles pour bloquer les IPs suspectes

### 3. Rate Limiting

```yaml
# Dans config.yml
ingress:
  - hostname: iaposte.votredomaine.com
    service: http://localhost:3000
    originRequest:
      # Limite de connexions
      keepAliveConnections: 100
      keepAliveTimeout: 90s
```

---

## 🎯 Avantages pour votre Projet

### 1. Webhooks GitHub Stables

```env
# URL permanente = Pas besoin de reconfigurer GitHub à chaque fois!
PUBLIC_WEBHOOK_URL="https://iaposte.votredomaine.com/api/webhooks/github"
```

### 2. Email Notifications

Vous pouvez partager l'URL avec vos clients:
```
https://iaposte.votredomaine.com/client/dossiers
```

### 3. API Publique

```
https://iaposte.votredomaine.com/api/tracking
https://iaposte.votredomaine.com/api/status
```

---

## 📊 Monitoring

### Dashboard Cloudflare

Accès: https://one.dash.cloudflare.com/

**Métriques disponibles:**
- 📈 Trafic en temps réel
- 🌍 Répartition géographique
- ⚡ Performance (latence, bande passante)
- 🛡️ Attaques bloquées
- 📊 Logs des requêtes

### Logs Locaux

```powershell
# Voir les logs du tunnel
cloudflared tunnel info iapostemanage

# Logs en temps réel
Get-EventLog -LogName Application -Source cloudflared
```

---

## 🆘 Dépannage

### Erreur: "Tunnel not found"

```powershell
# Lister les tunnels
cloudflared tunnel list

# Recréer si nécessaire
cloudflared tunnel create iapostemanage
```

### Erreur: "Port 3000 already in use"

```powershell
# Vérifier quel process utilise le port
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess

# Tuer le process
Stop-Process -Id <PID>
```

### Tunnel lent

1. Vérifier la latence:
   ```powershell
   cloudflared tunnel info iapostemanage
   ```

2. Changer de région Cloudflare (dans config.yml):
   ```yaml
   tunnel: iapostemanage
   region: eu  # ou us, asia
   ```

### Certificat expiré

```powershell
# Se reconnecter
cloudflared tunnel login

# Vérifier le certificat
Get-Content "$env:USERPROFILE\.cloudflared\cert.pem"
```

---

## 🔄 Migration depuis ngrok

### 1. Arrêter ngrok

```powershell
# Trouver le process ngrok
Get-Process -Name "ngrok"

# Arrêter
Stop-Process -Name "ngrok"
```

### 2. Démarrer Cloudflare

```powershell
cloudflared tunnel run iapostemanage
```

### 3. Mettre à jour les webhooks GitHub

Remplacer l'ancienne URL ngrok par votre nouvelle URL Cloudflare permanente.

---

## 💡 Astuces Pro

### 1. Sous-domaines multiples

```yaml
ingress:
  # Dashboard admin
  - hostname: admin.iaposte.votredomaine.com
    service: http://localhost:3000/admin
  
  # API
  - hostname: api.iaposte.votredomaine.com
    service: http://localhost:3000/api
  
  # Client portal
  - hostname: client.iaposte.votredomaine.com
    service: http://localhost:3000/client
  
  - service: http_status:404
```

### 2. HTTPS Local

Cloudflare gère automatiquement le SSL/TLS. Votre app Next.js peut rester en HTTP local.

### 3. Cache Cloudflare

```yaml
ingress:
  - hostname: iaposte.votredomaine.com
    service: http://localhost:3000
    originRequest:
      # Cache les assets statiques
      disableChunkedEncoding: false
```

---

## 📚 Ressources

- [Documentation Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [GitHub Releases](https://github.com/cloudflare/cloudflared/releases)
- [Dashboard Cloudflare](https://one.dash.cloudflare.com/)
- [Support Cloudflare](https://community.cloudflare.com/)

---

## ✅ Checklist de Configuration

- [ ] Cloudflared installé (`cloudflared --version`)
- [ ] Authentifié (`cloudflared tunnel login`)
- [ ] Tunnel créé (`cloudflared tunnel create iapostemanage`)
- [ ] DNS configuré (`cloudflared tunnel route dns`)
- [ ] Fichier config.yml créé
- [ ] Tunnel testé (`cloudflared tunnel run`)
- [ ] Service Windows installé (optionnel)
- [ ] .env mis à jour avec nouvelle URL
- [ ] GitHub webhooks reconfigurés
- [ ] Testé avec `curl https://iaposte.votredomaine.com`

---

🎉 **Votre tunnel Cloudflare est maintenant permanent et stable!**
