# 🌐 Accès HTTPS à Distance - Guide Complet

## Option 1: ngrok (Recommandé - Gratuit avec Auth)

### Installation
```bash
# Télécharger: https://ngrok.com/download
# Ou via Chocolatey:
choco install ngrok
```

### Configuration
```bash
# 1. Créer compte gratuit sur ngrok.com
# 2. Obtenir votre authtoken
ngrok config add-authtoken VOTRE_TOKEN

# 3. Exposer votre API avec authentification
ngrok http 5078 --basic-auth "demo:MemoLib2025!"
```

### Résultat
- URL publique: https://xxxx-xx-xx-xx-xx.ngrok-free.app
- Protection par mot de passe: demo / MemoLib2025!
- HTTPS automatique avec certificat valide

## Option 2: Cloudflare Tunnel (Gratuit - Plus sécurisé)

### Installation
```bash
# Télécharger cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Configuration
```bash
# 1. Login
cloudflared tunnel login

# 2. Créer tunnel
cloudflared tunnel create memolib-demo

# 3. Configurer
cloudflared tunnel route dns memolib-demo demo.votredomaine.com

# 4. Lancer
cloudflared tunnel run memolib-demo
```

### Avantages
- Domaine personnalisé
- Contrôle d'accès Cloudflare Access
- Protection DDoS gratuite
- Analytics inclus

## Option 3: Serveo (Le plus simple - Sans installation)

### Utilisation
```bash
# Exposer directement via SSH
ssh -R 80:localhost:5078 serveo.net
```

### Résultat
- URL publique immédiate
- Pas d'installation requise
- Pas d'authentification (moins sécurisé)

## 🎯 Configuration Recommandée pour Présentations

### 1. Ajouter authentification dans l'API .NET

Créer `Middleware/DemoAuthMiddleware.cs`:
```csharp
public class DemoAuthMiddleware
{
    private readonly RequestDelegate _next;
    private const string DemoUser = "demo";
    private const string DemoPass = "MemoLib2025!";

    public DemoAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/demo"))
        {
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !IsValidAuth(authHeader))
            {
                context.Response.StatusCode = 401;
                context.Response.Headers["WWW-Authenticate"] = "Basic realm=\"MemoLib Demo\"";
                await context.Response.WriteAsync("Unauthorized");
                return;
            }
        }
        await _next(context);
    }

    private bool IsValidAuth(string authHeader)
    {
        if (!authHeader.StartsWith("Basic ")) return false;
        var encoded = authHeader.Substring("Basic ".Length).Trim();
        var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
        return decoded == $"{DemoUser}:{DemoPass}";
    }
}
```

### 2. Script de démarrage avec ngrok

Créer `start-demo-remote.bat`:
```batch
@echo off
echo ========================================
echo   MemoLib - Demo HTTPS a Distance
echo ========================================
echo.

echo [1/2] Demarrage API .NET...
start "MemoLib API" cmd /k "dotnet run"
timeout /t 5 /nobreak >nul

echo [2/2] Exposition via ngrok...
start "ngrok" cmd /k "ngrok http 5078 --basic-auth demo:MemoLib2025!"

echo.
echo ========================================
echo   Serveur expose !
echo ========================================
echo.
echo Ouvrez l'interface ngrok pour voir l'URL:
echo   http://localhost:4040
echo.
echo Credentials:
echo   Username: demo
echo   Password: MemoLib2025!
echo.
pause
```

## 🔒 Sécurité Renforcée

### Limiter les IPs autorisées (ngrok payant)
```bash
ngrok http 5078 --cidr-allow 1.2.3.4/32
```

### Ajouter expiration de session
```bash
ngrok http 5078 --basic-auth "demo:pass" --session-cookie-timeout 3600
```

### Logs d'accès
```bash
ngrok http 5078 --log=stdout --log-level=info
```

## 📊 Monitoring des Accès

### Dashboard ngrok
- Accès: http://localhost:4040
- Voir toutes les requêtes en temps réel
- Replay des requêtes
- Statistiques de trafic

## 🎬 Workflow Présentation

1. **Avant la présentation:**
   ```bash
   start-demo-remote.bat
   ```

2. **Récupérer l'URL:**
   - Ouvrir http://localhost:4040
   - Copier l'URL HTTPS publique

3. **Partager avec les participants:**
   - URL: https://xxxx.ngrok-free.app
   - User: demo
   - Pass: MemoLib2025!

4. **Après la présentation:**
   - Ctrl+C dans les fenêtres
   - Ou lancer `stop-demo.bat`

## 💡 Conseils

- ✅ Utilisez ngrok pour démos courtes (< 8h)
- ✅ Utilisez Cloudflare Tunnel pour démos longues
- ✅ Changez le mot de passe après chaque présentation
- ✅ Surveillez le dashboard pendant la présentation
- ✅ Testez l'accès avant la présentation réelle

## 🆘 Dépannage

### ngrok ne démarre pas
```bash
# Vérifier l'installation
ngrok version

# Réinitialiser la config
ngrok config check
```

### Port déjà utilisé
```bash
# Arrêter tous les processus
stop-demo.bat
```

### Certificat SSL invalide
- ngrok gère automatiquement les certificats
- Pas de configuration nécessaire
