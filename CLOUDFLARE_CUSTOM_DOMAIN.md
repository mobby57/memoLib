# 🌐 Configuration Domaine Custom - Cloudflare Pages

**Application déployée :** https://f6717315.iapostemanage.pages.dev  
**Date :** 22 janvier 2026  
**Status :** ✅ En production

---

## 🎯 Objectif

Configurer un domaine personnalisé (ex: `app.iapostemanager.com` ou `iapostemanager.com`) pour remplacer l'URL Cloudflare par défaut.

---

## 📋 Prérequis

- ✅ Application déployée sur Cloudflare Pages
- ✅ Compte Cloudflare actif
- 🔑 Domaine enregistré (à acheter si nécessaire)
- 🔑 Accès DNS du domaine

---

## 🚀 Méthode 1 : Domaine via Cloudflare (Recommandé)

### Étape 1 : Acheter/Transférer le Domaine sur Cloudflare

**Option A - Acheter un nouveau domaine :**

```bash
# Via Dashboard Cloudflare
1. Aller sur https://dash.cloudflare.com
2. Cliquer "Domain Registration" dans le menu
3. Rechercher "iapostemanager.com" (ou variante)
4. Acheter le domaine (~$10/an)
```

**Option B - Transférer un domaine existant :**

```bash
# Si domaine déjà acheté ailleurs (OVH, GoDaddy, etc.)
1. Déverrouiller le domaine chez votre registrar actuel
2. Obtenir le code de transfert (EPP/Auth code)
3. Initier le transfert dans Cloudflare Domain Registration
4. Confirmer par email (5-7 jours de délai)
```

**Option C - Utiliser Cloudflare comme DNS uniquement :**

```bash
# Garder le domaine chez votre registrar, pointer DNS vers Cloudflare
1. Dans votre registrar (OVH, etc.), modifier les nameservers :
   - Nameserver 1: ns1.cloudflare.com
   - Nameserver 2: ns2.cloudflare.com
2. Dans Cloudflare : "Add Site" → Entrer le domaine
3. Suivre les instructions de configuration DNS
```

---

### Étape 2 : Ajouter le Domaine Custom à Cloudflare Pages

#### Via Dashboard (Interface Web)

```bash
1. Aller sur https://dash.cloudflare.com
2. Pages → Sélectionner "iapostemanage"
3. Onglet "Custom domains"
4. Cliquer "Set up a custom domain"
5. Entrer le domaine :
   - Domaine principal : iapostemanager.com
   - Sous-domaine (optionnel) : app.iapostemanager.com
6. Cliquer "Continue"
7. Cloudflare configure automatiquement les DNS (si domaine sur Cloudflare)
8. Si domaine externe : copier les enregistrements CNAME/A affichés
```

#### Via Wrangler CLI

```powershell
# Se connecter (si pas déjà fait)
wrangler login

# Lister les projets
wrangler pages project list

# Ajouter le domaine custom
wrangler pages domain add iapostemanager.com --project-name iapostemanage

# Ajouter un sous-domaine
wrangler pages domain add app.iapostemanager.com --project-name iapostemanage

# Vérifier les domaines configurés
wrangler pages domain list --project-name iapostemanage
```

---

### Étape 3 : Configuration DNS (Automatique si Domaine sur Cloudflare)

**Si domaine géré par Cloudflare :**
- ✅ DNS configuré automatiquement
- ✅ Certificat SSL gratuit provisionné automatiquement
- ⏱️ Propagation : 5-10 minutes

**Si domaine externe :**

Ajouter ces enregistrements DNS chez votre registrar :

| Type  | Nom/Host          | Valeur/Target                        | TTL  |
|-------|-------------------|--------------------------------------|------|
| CNAME | iapostemanager.com| iapostemanage.pages.dev              | Auto |
| CNAME | www               | iapostemanage.pages.dev              | Auto |
| CNAME | app               | iapostemanage.pages.dev              | Auto |

**Note :** Certains registrars n'acceptent pas CNAME pour le domaine racine. Dans ce cas :

| Type  | Nom/Host          | Valeur/Target                        |
|-------|-------------------|--------------------------------------|
| A     | @                 | 104.21.0.0 (IP Cloudflare Pages)     |
| AAAA  | @                 | 2606:4700::6810:1500 (IPv6)          |
| CNAME | www               | iapostemanage.pages.dev              |

---

### Étape 4 : Activer le SSL/TLS (Automatique)

Cloudflare active automatiquement :
- ✅ Certificat SSL gratuit (Let's Encrypt)
- ✅ HTTPS obligatoire (redirection HTTP → HTTPS)
- ✅ TLS 1.3 par défaut
- ✅ HTTP/3 (QUIC) disponible

**Vérifier le statut SSL :**

```powershell
# Via Dashboard
Pages → iapostemanage → Custom domains → Vérifier le badge "Active"

# Via CLI
wrangler pages domain list --project-name iapostemanage
# Output : Status: Active, SSL: Active
```

---

## 🔧 Méthode 2 : Domaine Externe (OVH, GoDaddy, etc.)

### Configuration DNS Manuelle

**Exemple avec OVH :**

```bash
1. Se connecter à l'espace client OVH
2. Domaines → Sélectionner le domaine
3. Zone DNS → Ajouter une entrée

Enregistrements à créer :

CNAME  www   iapostemanage.pages.dev.
CNAME  app   iapostemanage.pages.dev.
A      @     104.21.0.0
AAAA   @     2606:4700::6810:1500

4. Enregistrer et attendre propagation (2-24h)
```

**Exemple avec GoDaddy :**

```bash
1. Se connecter à GoDaddy
2. Mes produits → DNS
3. Ajouter les enregistrements :

Type   Nom   Valeur                    TTL
CNAME  www   iapostemanage.pages.dev   600
CNAME  app   iapostemanage.pages.dev   600
A      @     104.21.0.0                 600

4. Enregistrer
```

---

## ⚙️ Configuration Next.js pour Domaine Custom

### Mettre à Jour les Variables d'Environnement

**Dans Cloudflare Pages Dashboard :**

```bash
Pages → iapostemanage → Settings → Environment variables

Production :
- NEXTAUTH_URL = https://iapostemanager.com (ou votre domaine)
- NEXT_PUBLIC_APP_URL = https://iapostemanager.com

Preview/Development : (optionnel)
- NEXTAUTH_URL = https://preview.iapostemanager.com
```

**Via Wrangler CLI :**

```powershell
# Ajouter une variable d'environnement
wrangler pages secret put NEXTAUTH_URL --project-name iapostemanage
# Entrer : https://iapostemanager.com

wrangler pages secret put NEXT_PUBLIC_APP_URL --project-name iapostemanage
# Entrer : https://iapostemanager.com

# Lister les secrets configurés
wrangler pages secret list --project-name iapostemanage
```

### Mettre à Jour next.config.js (Optionnel)

```javascript
// next.config.js
const nextConfig = {
  // ... configuration existante
  
  // Ajouter le domaine custom aux images autorisées
  images: {
    domains: ['iapostemanager.com', 'f6717315.iapostemanage.pages.dev'],
  },
  
  // Redirection HTTP → HTTPS (géré par Cloudflare, mais bon à avoir)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};
```

### Redéployer l'Application

```powershell
# Commit et push pour déclencher redéploiement
git add .
git commit -m "feat: configure custom domain"
git push origin main

# Ou redéploiement manuel via Wrangler
wrangler pages deploy --project-name iapostemanage --branch main
```

---

## ✅ Vérification Post-Configuration

### 1. Tester le Domaine

```powershell
# Test DNS
nslookup iapostemanager.com
# Output attendu : Résout vers Cloudflare IPs

# Test HTTPS
curl -I https://iapostemanager.com
# Output : HTTP/2 200, avec certificat SSL valide

# Test redirection WWW
curl -I https://www.iapostemanager.com
# Output : Doit rediriger vers https://iapostemanager.com
```

### 2. Vérifier le Certificat SSL

```bash
# Via navigateur
1. Ouvrir https://iapostemanager.com
2. Cliquer sur le cadenas (barre d'adresse)
3. Vérifier :
   - Émis par : Let's Encrypt
   - Valide jusqu'à : [Date + 90 jours]
   - Chaîne de certificats complète

# Via outil en ligne
https://www.ssllabs.com/ssltest/analyze.html?d=iapostemanager.com
# Score attendu : A+ avec TLS 1.3
```

### 3. Test de Performance

```bash
# Lighthouse audit (Chrome DevTools)
- Performance : > 90
- Accessibility : > 90
- Best Practices : > 90
- SEO : > 90

# Test de vitesse
https://pagespeed.web.dev/?url=https://iapostemanager.com
```

---

## 🎨 Configuration Avancée

### Redirection WWW → Non-WWW (ou inverse)

**Via Cloudflare Page Rules :**

```bash
1. Dashboard Cloudflare → Page Rules
2. Create Page Rule
3. URL : www.iapostemanager.com/*
4. Setting : Forwarding URL (301 - Permanent Redirect)
5. Destination : https://iapostemanager.com/$1
6. Save and Deploy
```

**Via _redirects (Cloudflare Pages) :**

```bash
# Créer public/_redirects
https://www.iapostemanager.com/* https://iapostemanager.com/:splat 301
```

### Sous-domaines pour Environnements

```bash
# Production
iapostemanager.com → main branch

# Staging/Preview
staging.iapostemanager.com → staging branch
preview.iapostemanager.com → preview deployments

# Configuration
wrangler pages domain add staging.iapostemanager.com --project-name iapostemanage
wrangler pages domain add preview.iapostemanager.com --project-name iapostemanage
```

### Cloudflare Analytics (Inclus Gratuitement)

```bash
1. Pages → iapostemanage → Analytics
2. Métriques disponibles :
   - Visites uniques
   - Pages vues
   - Requêtes par seconde
   - Bandwidth utilisé
   - Géolocalisation visiteurs
   - Performance (TTFB, FCP, LCP)
```

---

## 📊 Recommandations de Domaines

### Pour Production Professionnelle

**Domaines Premium (Crédibilité) :**
- ✅ `iapostemanager.com` (~$12/an)
- ✅ `postemanager.fr` (~$10/an)
- ✅ `ia-poste-manager.com` (~$12/an)

**Sous-domaines Suggérés :**
- `app.iapostemanager.com` - Application principale
- `api.iapostemanager.com` - API backend
- `docs.iapostemanager.com` - Documentation
- `admin.iapostemanager.com` - Interface Super Admin

### Structure Multi-Environnement

```
Production  : iapostemanager.com
Staging     : staging.iapostemanager.com
Development : dev.iapostemanager.com
Preview     : preview-[branch].iapostemanager.com (auto)
```

---

## 🔒 Sécurité & Conformité

### Configuration Cloudflare Recommandée

**SSL/TLS :**
```bash
Dashboard → SSL/TLS → Overview
Mode : Full (strict)

→ Edge Certificates
- Always Use HTTPS : ON
- Minimum TLS Version : TLS 1.2
- Opportunistic Encryption : ON
- TLS 1.3 : ON
- Automatic HTTPS Rewrites : ON
- Certificate Transparency Monitoring : ON
```

**Firewall & Protection :**
```bash
Security → WAF
- Cloudflare Managed Ruleset : ON
- OWASP Core Ruleset : ON

Security → Bots
- Bot Fight Mode : ON

Security → DDoS
- Activé automatiquement (gratuit)
```

**Headers de Sécurité (déjà dans staticwebapp.config.json) :**
```json
{
  "globalHeaders": {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.neon.tech https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  }
}
```

---

## 🚨 Dépannage

### Problème : Domaine ne résout pas

```bash
# Vérifier DNS
nslookup iapostemanager.com

# Si timeout :
1. Vérifier nameservers chez registrar
2. Attendre propagation (max 48h)
3. Purger cache DNS local :
   ipconfig /flushdns (Windows)
```

### Problème : Certificat SSL invalide

```bash
# Causes possibles :
1. Propagation DNS incomplète → Attendre 24h
2. CAA records bloquant Let's Encrypt → Supprimer CAA ou autoriser letsencrypt.org
3. DNSSEC mal configuré → Désactiver temporairement

# Forcer renouvellement SSL (Cloudflare Dashboard)
SSL/TLS → Edge Certificates → Disable Universal SSL → Re-enable
```

### Problème : Erreur 522 (Connection Timed Out)

```bash
# Cloudflare ne peut pas atteindre l'origin
1. Vérifier que l'app est bien déployée sur Pages
2. Vérifier les DNS (CNAME vers .pages.dev)
3. Dashboard Pages → Vérifier build status
```

### Problème : Mixed Content (HTTP/HTTPS)

```bash
# Forcer HTTPS pour toutes les ressources
1. Cloudflare : Always Use HTTPS → ON
2. Next.js : Vérifier que tous les liens sont relatifs ou HTTPS
3. Vérifier variables d'env (NEXTAUTH_URL en HTTPS)
```

---

## 📝 Checklist de Configuration

### Avant Migration Domaine

- [ ] Application testée sur URL Cloudflare (`f6717315.iapostemanage.pages.dev`)
- [ ] Variables d'environnement correctes (DATABASE_URL, NEXTAUTH_SECRET, etc.)
- [ ] Domaine acheté/disponible
- [ ] Backup base de données effectué

### Configuration Initiale

- [ ] Domaine ajouté à Cloudflare Pages
- [ ] Enregistrements DNS créés (CNAME/A)
- [ ] Certificat SSL actif (badge "Active" dans dashboard)
- [ ] NEXTAUTH_URL mis à jour avec le nouveau domaine
- [ ] NEXT_PUBLIC_APP_URL mis à jour

### Tests Post-Configuration

- [ ] `https://iapostemanager.com` accessible
- [ ] Certificat SSL valide (cadenas vert)
- [ ] Redirection HTTP → HTTPS fonctionne
- [ ] Authentification NextAuth fonctionne
- [ ] Base de données Neon accessible
- [ ] Lighthouse score > 90

### Mise en Production

- [ ] Redirection WWW → Non-WWW configurée
- [ ] Google Search Console configuré avec nouveau domaine
- [ ] Analytics Cloudflare activé
- [ ] Monitoring uptime configuré (ex: UptimeRobot)
- [ ] Documentation mise à jour
- [ ] Équipe/clients notifiés du nouveau domaine

---

## 🎯 Commandes Rapides

```powershell
# Vérifier status déploiement
wrangler pages deployment list --project-name iapostemanage

# Ajouter domaine custom
wrangler pages domain add iapostemanager.com --project-name iapostemanage

# Lister domaines
wrangler pages domain list --project-name iapostemanage

# Ajouter variable d'environnement
wrangler pages secret put NEXTAUTH_URL --project-name iapostemanage

# Redéployer
wrangler pages deploy --project-name iapostemanage --branch main

# Logs en temps réel
wrangler pages deployment tail --project-name iapostemanage
```

---

## 📚 Ressources

- [Cloudflare Pages Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [SSL/TLS Best Practices](https://developers.cloudflare.com/ssl/edge-certificates/ssl-tls-recommender/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

**Créé le :** 22 janvier 2026  
**Dernière mise à jour :** 22 janvier 2026  
**Status :** ✅ Guide complet - Prêt à l'emploi
