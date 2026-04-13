# 🔧 Azure Setup — MemoLib

## 1. Deploy .NET Backend → Azure App Service (Free F1)

### Créer les ressources Azure (CLI)

```bash
# Login
az login

# Créer le resource group (si pas déjà fait)
az group create --name memolib-rg --location francecentral

# Créer le plan App Service (gratuit F1)
az appservice plan create \
  --name memolib-plan \
  --resource-group memolib-rg \
  --sku F1 \
  --is-linux

# Créer l'App Service (.NET 9)
az webapp create \
  --name memolib-api \
  --resource-group memolib-rg \
  --plan memolib-plan \
  --runtime "DOTNETCORE:9.0"
```

### Configurer les variables d'environnement

```bash
az webapp config appsettings set \
  --name memolib-api \
  --resource-group memolib-rg \
  --settings \
    "ConnectionStrings__Default=Data Source=/home/data/memolib.db" \
    "JwtSettings__SecretKey=<your-strong-secret-min-32-chars>" \
    "JwtSettings__Issuer=MemoLib.Api" \
    "JwtSettings__Audience=MemoLib.Client" \
    "Cors__AllowedOrigins__0=https://memolib.vercel.app" \
    "ASPNETCORE_ENVIRONMENT=Production" \
    "DisableHttpsRedirection=true"
```

### Configurer GitHub Actions (CI/CD)

1. Créer un Service Principal Azure :
```bash
az ad sp create-for-rbac \
  --name "memolib-github-deploy" \
  --role contributor \
  --scopes /subscriptions/03b6b7fe-90b8-4fa5-ae31-24cd21958add/resourceGroups/memolib-rg \
  --sdk-auth
```

2. Copier le JSON retourné dans GitHub → Settings → Secrets → `AZURE_CREDENTIALS`

3. Push sur `main` → le workflow `.github/workflows/deploy-azure-api.yml` déploie automatiquement.

### Vérifier le déploiement

```
https://memolib-api.azurewebsites.net/health
https://memolib-api.azurewebsites.net/swagger
```

---

## 2. Azure AD OAuth (Gratuit — Microsoft Entra ID)

Azure AD (Microsoft Entra ID) est **gratuit** pour l'authentification OAuth/SSO basique.

### Enregistrer l'application dans Azure AD

1. Aller sur https://portal.azure.com → **Microsoft Entra ID** → **App registrations** → **New registration**

2. Remplir :
   - **Name** : `MemoLib`
   - **Supported account types** : `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI** : `Web` → `http://localhost:3000/api/auth/callback/azure-ad`

3. Cliquer **Register**

4. Récupérer :
   - **Application (client) ID** → `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_TENANT_ID`

5. Aller dans **Certificates & secrets** → **New client secret** :
   - Description : `MemoLib NextAuth`
   - Expiration : 24 mois
   - Copier la **Value** → `AZURE_CLIENT_SECRET`

6. Aller dans **API permissions** → vérifier que `User.Read` (Microsoft Graph) est présent (ajouté par défaut)

### Ajouter les redirect URIs (production)

Dans **Authentication** → **Add URI** :
```
https://memolib.vercel.app/api/auth/callback/azure-ad
```

### Configurer les variables d'environnement

Dans `.env.local` (frontend Next.js) :
```env
AZURE_CLIENT_ID=<votre-application-client-id>
AZURE_CLIENT_SECRET=<votre-client-secret-value>
AZURE_TENANT_ID=<votre-directory-tenant-id>
```

C'est tout. Le code NextAuth détecte automatiquement ces variables et active le provider Azure AD.

### Tester

1. `npm run dev`
2. Aller sur http://localhost:3000/auth/login
3. Le bouton "Se connecter avec Microsoft" apparaît
4. L'utilisateur doit **déjà exister** dans la DB MemoLib (anti-phishing : pas d'auto-création OAuth)

### Coût

**0€** — Microsoft Entra ID Free inclut :
- SSO illimité
- OAuth 2.0 / OpenID Connect
- Jusqu'à 50 000 utilisateurs
- MFA basique (optionnel)
