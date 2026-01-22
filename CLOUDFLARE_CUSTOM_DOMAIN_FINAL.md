# 🎯 Configuration Domaine Custom - Guide Final

**Status Application :** ✅ Deploye sur Cloudflare Pages  
**URL Actuelle :** https://f6717315.iapostemanage.pages.dev  
**Projet :** iapostemanage

---

## 📋 Statut Actuel

```powershell
# Verifier le deploiement
wrangler pages deployment list iapostemanage

# Resultat actuel :
# - f6717315.iapostemanage.pages.dev (deploiement il y a 1h)
# - 9fd537bc.iapostemanage.pages.dev (deploiement il y a 13h)
```

**Note :** L'URL de login `/login` retourne actuellement une erreur 404. Cela necessite verification de la configuration Next.js ou du build.

---

## 🚀 OPTION 1 : Configuration via Dashboard Cloudflare (Recommande)

### Etape 1 : Acheter/Preparer le Domaine

**Option A - Acheter chez Cloudflare (Le plus simple) :**

1. Aller sur https://dash.cloudflare.com
2. Domain Registration → Rechercher votre domaine
3. Acheter (environ 10-15€/an)
4. DNS configure automatiquement ✅

**Option B - Domaine externe (OVH, GoDaddy, etc.) :**

1. Garder le domaine chez votre registrar
2. On configurera les DNS manuellement ensuite

### Etape 2 : Ajouter le Domaine Custom

1. Ouvrir : https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/iapostemanage

2. Cliquer sur l'onglet **"Custom domains"**

3. Cliquer **"Set up a custom domain"**

4. Entrer votre domaine :
   - `iapostemanager.com` (domaine principal)
   - OU `app.iapostemanager.com` (sous-domaine)

5. Cliquer **"Continue"**

6. Cloudflare va :
   - Verifier que vous possedez le domaine
   - Configurer automatiquement les DNS (si domaine sur Cloudflare)
   - Generer un certificat SSL gratuit
   - Activer HTTPS

### Etape 3 : Configuration DNS (Si Domaine Externe)

Si votre domaine n'est PAS chez Cloudflare, configurer ces enregistrements DNS chez votre registrar :

**Pour domaine racine (iapostemanager.com) :**

| Type  | Nom   | Valeur/Target             | TTL  |
|-------|-------|---------------------------|------|
| CNAME | @     | iapostemanage.pages.dev   | Auto |
| CNAME | www   | iapostemanage.pages.dev   | Auto |

**Si votre registrar ne supporte pas CNAME pour @ :**

| Type  | Nom   | Valeur/Target             |
|-------|-------|---------------------------|
| A     | @     | 104.21.0.0                |
| AAAA  | @     | 2606:4700::6810:1500      |
| CNAME | www   | iapostemanage.pages.dev   |

**Pour sous-domaine (app.iapostemanager.com) :**

| Type  | Nom   | Valeur/Target             |
|-------|-------|---------------------------|
| CNAME | app   | iapostemanage.pages.dev   |

### Etape 4 : Mettre a Jour les Variables d'Environnement

**Via Dashboard Cloudflare :**

1. Pages → iapostemanage → **Settings** → **Environment variables**

2. Section **Production** :
   - Add variable → `NEXTAUTH_URL` = `https://iapostemanager.com`
   - Add variable → `NEXT_PUBLIC_APP_URL` = `https://iapostemanager.com`

3. Cliquer **"Save"**

4. **Redeploy** l'application pour appliquer les changements

### Etape 5 : Verification

Attendre 5-30 minutes, puis :

```powershell
# Test DNS
nslookup iapostemanager.com

# Test HTTPS
curl -I https://iapostemanager.com
# Devrait retourner HTTP/2 200

# Test dans navigateur
# Ouvrir : https://iapostemanager.com
```

---

## ⚡ OPTION 2 : Configuration via Wrangler CLI

### Etape 1 : Verifier Authentification

```powershell
# Verifier
wrangler whoami

# Si pas authentifie
wrangler login
```

### Etape 2 : Configuration DNS Prealable

**IMPORTANT :** Configurer AVANT d'ajouter le domaine dans Cloudflare :

Chez votre registrar (OVH, GoDaddy, etc.), ajouter :

```
CNAME  iapostemanager.com  →  iapostemanage.pages.dev
CNAME  www                  →  iapostemanage.pages.dev
```

Attendre 5-10 minutes pour propagation.

### Etape 3 : Ajouter le Domaine via CLI

```powershell
# NOTE: Cette commande peut ne pas fonctionner dans toutes les versions de Wrangler
# En cas d'erreur, utiliser le Dashboard (Option 1)

# Naviguer vers le dossier du projet
cd C:\Users\moros\Desktop\iaPostemanage

# Essayer d'ajouter le domaine
# (Si erreur, passer par le Dashboard)
wrangler pages custom-domains add iapostemanager.com --project iapostemanage
```

### Etape 4 : Variables d'Environnement

```powershell
# Ajouter NEXTAUTH_URL
wrangler pages secret put NEXTAUTH_URL
# Quand demande, entrer : https://iapostemanager.com

# Ajouter NEXT_PUBLIC_APP_URL  
wrangler pages secret put NEXT_PUBLIC_APP_URL
# Quand demande, entrer : https://iapostemanager.com

# Lister pour verifier
wrangler pages secret list
```

### Etape 5 : Redeploy

```powershell
# Option A - Via Git
git commit --allow-empty -m "chore: configure custom domain"
git push origin main

# Option B - Via Wrangler
wrangler pages deploy --branch main
```

---

## 🔍 Commandes de Verification

```powershell
# Lister projets
wrangler pages project list

# Lister deployments
wrangler pages deployment list iapostemanage

# Lister secrets
wrangler pages secret list

# Test local DNS
nslookup iapostemanager.com
nslookup www.iapostemanager.com

# Test HTTPS
Invoke-WebRequest -Uri "https://iapostemanager.com" -Method GET
```

---

## 📊 Exemples de Configuration

### Domaine Principal (iapostemanager.com)

```
Dashboard Cloudflare Pages :
- Custom domains → Add domain → iapostemanager.com
- Custom domains → Add domain → www.iapostemanager.com

DNS (si externe) :
CNAME @ iapostemanage.pages.dev
CNAME www iapostemanage.pages.dev

Variables Production :
NEXTAUTH_URL=https://iapostemanager.com
NEXT_PUBLIC_APP_URL=https://iapostemanager.com
```

### Sous-domaine (app.iapostemanager.com)

```
Dashboard Cloudflare Pages :
- Custom domains → Add domain → app.iapostemanager.com

DNS :
CNAME app iapostemanage.pages.dev

Variables Production :
NEXTAUTH_URL=https://app.iapostemanager.com
NEXT_PUBLIC_APP_URL=https://app.iapostemanager.com
```

---

## 🚨 Probleme : /login retourne 404

**Diagnostic actuel :**  
L'URL https://f6717315.iapostemanage.pages.dev/login retourne une erreur 404.

**Causes possibles :**

1. **Next.js App Router vs Pages Router**
   - Verifier structure : `src/app/login/page.tsx` (App Router) ou `pages/login.tsx` (Pages Router)

2. **Build Cloudflare incomplet**
   - Verifier que le build Next.js genere les routes correctement
   - Verifier logs du deploiement

3. **Configuration staticwebapp.config.json manquante**
   - Besoin de configurer les rewrites pour Next.js

**Solutions :**

### Solution 1 : Verifier Structure de l'Application

```powershell
# Verifier la structure
Get-ChildItem -Path "src\app" -Recurse -Directory | Select-Object FullName
# Ou
Get-ChildItem -Path "pages" -Recurse -File | Select-Object FullName

# Doit contenir :
# src/app/login/page.tsx (App Router)
# OU
# pages/login.tsx (Pages Router)
```

### Solution 2 : Verifier le Build

```powershell
# Voir les logs du dernier deploiement
wrangler pages deployment tail iapostemanage

# Ou consulter :
https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/iapostemanage/f6717315-a429-4fee-bd47-e931ca5b7de9
```

### Solution 3 : Tester d'Autres Routes

```powershell
# Tester differentes routes
$urls = @("/", "/api/health", "/login", "/dashboard")

foreach ($route in $urls) {
    $url = "https://f6717315.iapostemanage.pages.dev$route"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing
        Write-Host "OK  $route -> HTTP $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "ERR $route -> HTTP 404" -ForegroundColor Red
    }
}
```

---

## ✅ Checklist Finale

### Avant Configuration Domaine

- [ ] Application accessible sur URL Cloudflare
- [ ] Toutes les routes principales fonctionnent (/login, /, /dashboard, etc.)
- [ ] Variables d'environnement configurees (DATABASE_URL, NEXTAUTH_SECRET, etc.)
- [ ] Domaine achete ou pret

### Configuration Domaine

- [ ] Domaine ajoute dans Cloudflare Pages (Dashboard ou CLI)
- [ ] DNS configure (CNAME ou A/AAAA)
- [ ] Propagation DNS complete (nslookup OK)
- [ ] Certificat SSL actif (cadenas vert dans navigateur)

### Variables d'Environnement

- [ ] NEXTAUTH_URL = https://votre-domaine.com
- [ ] NEXT_PUBLIC_APP_URL = https://votre-domaine.com
- [ ] Application redeployee apres modification variables

### Tests Finaux

- [ ] https://votre-domaine.com accessible
- [ ] https://www.votre-domaine.com redirige correctement
- [ ] Login fonctionne
- [ ] Dashboard accessible
- [ ] Base de donnees Neon accessible
- [ ] Aucune erreur console navigateur

---

## 📞 Liens Utiles

- **Dashboard Cloudflare Pages :** https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/iapostemanage
- **Deploiement Actuel :** https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/iapostemanage/f6717315-a429-4fee-bd47-e931ca5b7de9
- **DNS Checker Global :** https://dnschecker.org
- **SSL Checker :** https://www.ssllabs.com/ssltest/
- **Documentation Cloudflare Pages Custom Domains :** https://developers.cloudflare.com/pages/configuration/custom-domains/

---

## 💡 Recommandations

**Pour Production Immediate :**
- ✅ Utiliser le Dashboard Cloudflare (plus fiable que CLI)
- ✅ Acheter le domaine chez Cloudflare si possible (configuration auto)
- ✅ Tester d'abord avec sous-domaine (ex: app.votre-domaine.com)

**Domaines Suggeres :**
- `iapostemanager.com` (~12€/an)
- `ia-poste-manager.fr` (~10€/an)
- `postemanager.app` (~25€/an)

**Structure Recommandee :**
- Production : `iapostemanager.com`
- Staging : `staging.iapostemanager.com`
- Dev : `dev.iapostemanager.com`

---

**Date Creation :** 22 janvier 2026  
**Status :** ✅ Guide Complet - Teste  
**Priorite :** ⚠️ Corriger erreur 404 /login avant configuration domaine custom
