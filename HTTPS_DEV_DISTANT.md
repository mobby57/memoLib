# 🔒 HTTPS pour Développement Distant

## 🎯 Quand Utiliser

| Scénario | HTTPS |
|----------|-------|
| Local (localhost) | ❌ Non |
| **Dev distant (IP publique)** | ✅ **OUI** |
| Staging | ✅ OUI |
| Production | ✅ OUI |

## ⚡ Setup Rapide (2 minutes)

### Option 1: Certificat Auto-Signé (Développement)

```powershell
# 1. Générer certificat
.\generate-cert.ps1

# 2. Lancer avec HTTPS
dotnet run --environment Remote

# 3. Accéder
https://localhost:5079
```

### Option 2: Let's Encrypt (Production-like)

```bash
# Installer Certbot
sudo apt install certbot

# Générer certificat
sudo certbot certonly --standalone -d yourdomain.com

# Copier certificat
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem key.pem

# Convertir en PFX
openssl pkcs12 -export -out cert.pfx -inkey key.pem -in cert.pem
```

### Option 3: Cloudflare Tunnel (Recommandé)

```bash
# Installer cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -o cloudflared.exe

# Créer tunnel
cloudflared tunnel login
cloudflared tunnel create memolib
cloudflared tunnel route dns memolib dev.memolib.com

# Lancer
cloudflared tunnel run memolib --url http://localhost:5078
```

**Avantages Cloudflare:**
- ✅ HTTPS automatique
- ✅ Pas de certificat à gérer
- ✅ Protection DDoS
- ✅ Gratuit

## 📋 Configuration

### appsettings.Remote.json
```json
{
  "Kestrel": {
    "Endpoints": {
      "Https": {
        "Url": "https://0.0.0.0:5079",
        "Certificate": {
          "Path": "cert.pfx",
          "Password": "DevCert2024!"
        }
      }
    }
  }
}
```

### Avec Variables d'Environnement
```powershell
$env:ASPNETCORE_ENVIRONMENT="Remote"
$env:ASPNETCORE_URLS="https://0.0.0.0:5079"
$env:ASPNETCORE_Kestrel__Certificates__Default__Path="cert.pfx"
$env:ASPNETCORE_Kestrel__Certificates__Default__Password="DevCert2024!"
dotnet run
```

## 🔐 Sécurité

### Certificat Auto-Signé
```powershell
# Ajouter à .gitignore
echo "cert.pfx" >> .gitignore
echo "*.pem" >> .gitignore
```

### Mot de Passe Certificat
```powershell
# Utiliser User Secrets
dotnet user-secrets set "Kestrel:Certificates:Default:Password" "DevCert2024!"
```

## 🚀 Déploiement

### Docker avec HTTPS
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY . .
COPY cert.pfx /app/cert.pfx
ENV ASPNETCORE_URLS="https://+:443"
ENV ASPNETCORE_Kestrel__Certificates__Default__Path="/app/cert.pfx"
EXPOSE 443
ENTRYPOINT ["dotnet", "MemoLib.Api.dll"]
```

### Azure App Service
```bash
# HTTPS automatique avec certificat gratuit
az webapp create --name memolib --resource-group rg --plan plan
az webapp config ssl bind --name memolib --certificate-thumbprint THUMBPRINT
```

## 📊 Comparaison Solutions

| Solution | Setup | Coût | Maintenance | Recommandé |
|----------|-------|------|-------------|------------|
| Auto-signé | 2 min | Gratuit | Renouvellement manuel | Dev uniquement |
| Let's Encrypt | 10 min | Gratuit | Auto-renouvellement | Staging/Prod |
| **Cloudflare** | **5 min** | **Gratuit** | **Zéro** | **✅ Meilleur** |
| Azure | 1 min | Inclus | Automatique | Production |

## 🎯 Recommandation

**Pour dev distant : Cloudflare Tunnel**

```powershell
# Installation unique
cloudflared tunnel login
cloudflared tunnel create memolib

# Lancer à chaque fois
cloudflared tunnel run memolib --url http://localhost:5078
```

**Résultat:**
- ✅ HTTPS automatique
- ✅ URL publique: https://dev.memolib.com
- ✅ Zéro configuration certificat
- ✅ Gratuit

## 🆘 Troubleshooting

### Erreur "Certificate not found"
```powershell
# Vérifier chemin
Test-Path cert.pfx
# Régénérer si nécessaire
.\generate-cert.ps1
```

### Erreur "Port already in use"
```powershell
# Trouver processus
netstat -ano | findstr :5079
# Tuer processus
taskkill /PID <PID> /F
```

### Navigateur refuse certificat auto-signé
```
Chrome: Taper "thisisunsafe" sur la page d'erreur
Firefox: Avancé → Accepter le risque
```
