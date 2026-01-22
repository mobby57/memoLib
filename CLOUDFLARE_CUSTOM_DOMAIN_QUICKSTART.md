# 🚀 Guide Rapide - Domaine Custom Cloudflare Pages

**Application :** IA Poste Manager  
**URL actuelle :** https://f6717315.iapostemanage.pages.dev  
**Objectif :** Configurer votre propre domaine (ex: iapostemanager.com)

---

## ⚡ Configuration en 5 Minutes

### 1️⃣ Prérequis (2 min)

```powershell
# Vérifier que vous êtes authentifié
wrangler whoami

# Si non authentifié
wrangler login
```

### 2️⃣ Ajouter le Domaine (30 sec)

**Option A - Script PowerShell (Recommandé) :**
```powershell
.\cloudflare-custom-domain.ps1
# Puis suivre le menu interactif
```

**Option B - Commande directe :**
```powershell
# Remplacez par votre domaine
wrangler pages domain add iapostemanager.com --project-name iapostemanage

# Ajouter aussi www
wrangler pages domain add www.iapostemanager.com --project-name iapostemanage
```

### 3️⃣ Configurer le DNS (2 min)

**Si domaine chez Cloudflare :**
- ✅ Configuration automatique (rien à faire !)

**Si domaine externe (OVH, GoDaddy, etc.) :**

Ajouter ces enregistrements dans votre zone DNS :

| Type  | Nom   | Valeur                    | TTL  |
|-------|-------|---------------------------|------|
| CNAME | @     | iapostemanage.pages.dev   | Auto |
| CNAME | www   | iapostemanage.pages.dev   | Auto |

**Si CNAME @ non supporté :**

| Type  | Nom   | Valeur                    |
|-------|-------|---------------------------|
| A     | @     | 104.21.0.0                |
| AAAA  | @     | 2606:4700::6810:1500      |
| CNAME | www   | iapostemanage.pages.dev   |

### 4️⃣ Vérifier le DNS (30 sec)

```powershell
# Via script
.\cloudflare-custom-domain.ps1 -CheckDNS -Domain "iapostemanager.com"

# Ou manuellement
nslookup iapostemanager.com
```

### 5️⃣ Mettre à Jour les Variables d'Env (1 min)

```powershell
# Via Wrangler
wrangler pages secret put NEXTAUTH_URL --project-name iapostemanage
# Entrer: https://iapostemanager.com

wrangler pages secret put NEXT_PUBLIC_APP_URL --project-name iapostemanage
# Entrer: https://iapostemanager.com
```

**OU via Dashboard :**
1. https://dash.cloudflare.com → Pages → iapostemanage
2. Settings → Environment variables
3. Add variable → `NEXTAUTH_URL` = `https://iapostemanager.com`
4. Add variable → `NEXT_PUBLIC_APP_URL` = `https://iapostemanager.com`

---

## 🎯 Commandes Rapides

```powershell
# Lister domaines configurés
wrangler pages domain list --project-name iapostemanage

# Retirer un domaine
wrangler pages domain remove iapostemanager.com --project-name iapostemanage

# Voir les déploiements
wrangler pages deployment list --project-name iapostemanage

# Redéployer (après changement env vars)
git commit --allow-empty -m "chore: redeploy after domain config"
git push origin main
```

---

## ✅ Checklist de Vérification

- [ ] Domaine ajouté à Cloudflare Pages
- [ ] DNS configuré (CNAME ou A/AAAA)
- [ ] `nslookup` résout vers Cloudflare
- [ ] HTTPS accessible (https://votre-domaine.com)
- [ ] Certificat SSL actif (cadenas vert)
- [ ] NEXTAUTH_URL mis à jour
- [ ] NEXT_PUBLIC_APP_URL mis à jour
- [ ] Application redéployée
- [ ] Login fonctionne sur nouveau domaine

---

## 🚨 Dépannage Express

**Problème : "Domain not found"**
```powershell
# Vérifier propagation DNS
nslookup iapostemanager.com 8.8.8.8
# Attendre max 48h pour propagation mondiale
```

**Problème : "SSL Certificate Error"**
```powershell
# Cloudflare génère SSL automatiquement
# Attendre 5-15 minutes après ajout du domaine
# Si > 24h, vérifier DNS correct
```

**Problème : "404 Not Found"**
```powershell
# Vérifier que le déploiement est actif
wrangler pages deployment list --project-name iapostemanage

# Vérifier les variables d'env
wrangler pages secret list --project-name iapostemanage
```

**Problème : "Authentication failed"**
```powershell
# NextAuth nécessite NEXTAUTH_URL correct
# 1. Vérifier variable d'env = nouveau domaine
# 2. Redéployer l'app
git push origin main
```

---

## 📊 Exemples de Configuration

### Domaine Racine (iapostemanager.com)

```powershell
# Ajouter
wrangler pages domain add iapostemanager.com --project-name iapostemanage
wrangler pages domain add www.iapostemanager.com --project-name iapostemanage

# DNS (si domaine Cloudflare)
# ✅ Automatique

# DNS (si domaine externe - OVH exemple)
# CNAME @ → iapostemanage.pages.dev
# CNAME www → iapostemanage.pages.dev

# Variables
NEXTAUTH_URL=https://iapostemanager.com
NEXT_PUBLIC_APP_URL=https://iapostemanager.com
```

### Sous-domaine (app.iapostemanager.com)

```powershell
# Ajouter
wrangler pages domain add app.iapostemanager.com --project-name iapostemanage

# DNS
# CNAME app → iapostemanage.pages.dev

# Variables
NEXTAUTH_URL=https://app.iapostemanager.com
NEXT_PUBLIC_APP_URL=https://app.iapostemanager.com
```

### Multi-environnements

```powershell
# Production
wrangler pages domain add iapostemanager.com --project-name iapostemanage

# Staging
wrangler pages domain add staging.iapostemanager.com --project-name iapostemanage

# Dev
wrangler pages domain add dev.iapostemanager.com --project-name iapostemanage

# DNS
# CNAME @ → iapostemanage.pages.dev
# CNAME staging → iapostemanage.pages.dev  
# CNAME dev → iapostemanage.pages.dev
```

---

## 🎨 URLs Recommandées

**Pour Production :**
- ✅ `iapostemanager.com` - Principal
- ✅ `www.iapostemanager.com` - Redirection vers principal
- ✅ `app.iapostemanager.com` - Application (optionnel)

**Pour Staging/Tests :**
- `staging.iapostemanager.com` - Tests pré-production
- `dev.iapostemanager.com` - Développement
- `preview.iapostemanager.com` - Preview branches

**Pour API/Services :**
- `api.iapostemanager.com` - API backend (futur)
- `docs.iapostemanager.com` - Documentation (futur)
- `admin.iapostemanager.com` - Super Admin (futur)

---

## 📞 Liens Utiles

- **Dashboard Cloudflare :** https://dash.cloudflare.com/b8fe52a9c1217b3bb71b53c26d0acfab/pages/view/iapostemanage
- **DNS Checker :** https://dnschecker.org
- **SSL Checker :** https://www.ssllabs.com/ssltest/
- **PageSpeed :** https://pagespeed.web.dev/
- **Documentation Cloudflare :** https://developers.cloudflare.com/pages/configuration/custom-domains/

---

## 🎯 Temps Estimés

| Étape                        | Durée   |
|------------------------------|---------|
| Authentification Wrangler    | 1 min   |
| Ajout domaine via CLI        | 30 sec  |
| Configuration DNS (Cloudflare)| Auto    |
| Configuration DNS (Externe)  | 2 min   |
| Propagation DNS              | 5-30 min|
| Certificat SSL               | 5-15 min|
| Mise à jour variables env    | 1 min   |
| Redéploiement                | 3-5 min |
| **TOTAL (Cloudflare)**       | **8 min**|
| **TOTAL (Domaine externe)**  | **40 min**|

---

**💡 Conseil :** Achetez le domaine directement chez Cloudflare pour une configuration 100% automatique et sans configuration DNS manuelle !

**📅 Date de création :** 22 janvier 2026  
**✅ Status :** Guide testé et validé
