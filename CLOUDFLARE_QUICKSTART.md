# 🚀 Cloudflare Tunnel - Installation & Démarrage Rapide

## ⚡ Installation Cloudflared (Windows)

### Option 1 : Winget (Recommandé)
```powershell
winget install --id Cloudflare.cloudflared
```

### Option 2 : Chocolatey
```powershell
choco install cloudflared
```

### Option 3 : Téléchargement Manuel
1. Télécharger : https://github.com/cloudflare/cloudflared/releases/latest
2. Chercher `cloudflared-windows-amd64.exe`
3. Renommer en `cloudflared.exe`
4. Placer dans `C:\Windows\System32\` ou ajouter au PATH

---

## 🌐 Démarrage Rapide (Quick Tunnel)

### Mode Temporaire (Sans Configuration)
```powershell
cloudflared tunnel --url http://localhost:3000
```

**Avantages :**
- ✅ Aucune configuration requise
- ✅ URL publique immédiate
- ✅ Parfait pour tests et démo

**Inconvénients :**
- ⚠️ URL change à chaque démarrage
- ⚠️ Tunnel se ferme avec le terminal

---

## 🔧 Configuration Permanente (Recommandé Production)

### 1. Se Connecter à Cloudflare
```powershell
cloudflared tunnel login
```
→ Ouvre le navigateur pour autorisation

### 2. Créer un Tunnel Nommé
```powershell
cloudflared tunnel create iapostemanage
```
→ Génère un UUID de tunnel

### 3. Créer le Fichier de Configuration

Créer `C:\Users\moros\.cloudflared\config.yml` :

```yaml
tunnel: <UUID-du-tunnel>
credentials-file: C:\Users\moros\.cloudflared\<UUID>.json

ingress:
  - hostname: iapostemanage.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 4. Configurer le DNS
```powershell
cloudflared tunnel route dns iapostemanage iapostemanage.yourdomain.com
```

### 5. Démarrer le Tunnel
```powershell
cloudflared tunnel run iapostemanage
```

---

## 📝 Configuration .env

Ajouter dans `.env` :

```env
# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_ENABLED=true
CLOUDFLARE_TUNNEL_URL=https://votre-url.trycloudflare.com
CLOUDFLARE_TUNNEL_TOKEN=votre-token-si-permanent
```

---

## 🎯 Pour IA Poste Manager

### Démarrage Complet avec Cloudflare

Créer `start-full.ps1` :

```powershell
# Démarrer Next.js
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Attendre 10 secondes (Next.js démarre)
Start-Sleep -Seconds 10

# Démarrer Cloudflare Tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:3000"

Write-Host ""
Write-Host "✅ Tous les services démarrés !" -ForegroundColor Green
Write-Host "   Local: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Public: Vérifier le terminal Cloudflare" -ForegroundColor Yellow
Write-Host ""
```

### Lancer
```powershell
.\start-full.ps1
```

---

## 🔍 Vérifier l'Installation

```powershell
cloudflared --version
```

**Résultat attendu :**
```
cloudflared version 2024.x.x (built yyyy-mm-dd)
```

---

## 🌍 URLs Cloudflare

### Quick Tunnel (Temporaire)
```
https://random-words-1234.trycloudflare.com
```

### Tunnel Permanent
```
https://iapostemanage.votredomaine.com
```

---

## 🛠️ Commandes Utiles

```powershell
# Lister les tunnels
cloudflared tunnel list

# Voir les infos d'un tunnel
cloudflared tunnel info iapostemanage

# Nettoyer les tunnels
cloudflared tunnel cleanup iapostemanage

# Supprimer un tunnel
cloudflared tunnel delete iapostemanage

# Logs détaillés
cloudflared tunnel --loglevel debug --url http://localhost:3000
```

---

## 🚨 Dépannage

### Erreur : "cloudflared n'est pas reconnu"
→ Cloudflared pas installé ou pas dans le PATH

**Solution :**
```powershell
# Vérifier PATH
$env:Path

# Ajouter temporairement
$env:Path += ";C:\chemin\vers\cloudflared"

# Ajouter définitivement (PowerShell Admin)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\chemin\vers\cloudflared", "Machine")
```

### Erreur : "Cannot determine default origin certificate"
→ Pas de connexion Cloudflare configurée

**Solution :**
```powershell
cloudflared tunnel login
```

### Tunnel se ferme tout seul
→ Utiliser Quick Tunnel ou configurer tunnel permanent

---

## 📊 Architecture Finale

```
Internet (HTTPS)
     ↓
Cloudflare Tunnel
     ↓
https://xxx.trycloudflare.com
     ↓
Cloudflared (Local)
     ↓
http://localhost:3000
     ↓
Next.js Server (IA Poste Manager)
```

---

## ✅ Checklist

- [ ] Cloudflared installé (`cloudflared --version`)
- [ ] Quick Tunnel testé (`cloudflared tunnel --url http://localhost:3000`)
- [ ] URL publique obtenue
- [ ] Application accessible publiquement
- [ ] (Optionnel) Tunnel permanent configuré
- [ ] (Optionnel) DNS configuré
- [ ] .env mis à jour avec CLOUDFLARE_TUNNEL_URL

---

## 🎯 Résumé

**Pour tests rapides :**
```powershell
cloudflared tunnel --url http://localhost:3000
```

**Pour production :**
```powershell
cloudflared tunnel login
cloudflared tunnel create iapostemanage
cloudflared tunnel route dns iapostemanage iapostemanage.com
cloudflared tunnel run iapostemanage
```

---

**Créé le 7 janvier 2026**
