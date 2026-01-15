# 🚀 DÉPLOYER SUR CLOUDFLARE PAGES

## 📋 GUIDE COMPLET DE DÉPLOIEMENT

### ✅ Prérequis
- [ ] Code pushé sur GitHub : `https://github.com/mobby57/iapostemanager`
- [ ] Compte Cloudflare créé
- [ ] Variables d'environnement Upstash Redis configurées

---

## 🌐 MÉTHODE 1 : INTERFACE WEB CLOUDFLARE (Recommandé)

### Étape 1 : Connecter GitHub

1. **Aller sur Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **Naviguer vers Pages**
   - Cliquer sur **"Workers & Pages"** dans le menu de gauche
   - Cliquer sur **"Create application"**
   - Choisir **"Pages"**
   - Cliquer sur **"Connect to Git"**

3. **Autoriser GitHub**
   - Cliquer sur **"Connect GitHub"**
   - Autoriser Cloudflare à accéder à vos repos
   - Sélectionner le repo : **`mobby57/iapostemanager`**

### Étape 2 : Configuration du Projet

**Nom du projet** :
```
iapostemanager
```

**Branche de production** :
```
multitenant-render
```
ou
```
main
```

**Build settings** :

| Paramètre | Valeur |
|-----------|--------|
| Framework preset | **Next.js** |
| Build command | `npm run build` |
| Build output directory | `.next` |
| Root directory | `/` (racine) |
| Node.js version | `20.x` |

### Étape 3 : Variables d'Environnement

Cliquer sur **"Environment variables"** et ajouter :

#### 🔴 Variables OBLIGATOIRES

```env
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://iapostemanager.pages.dev
NEXTAUTH_SECRET=vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=
UPSTASH_REDIS_REST_URL=https://intimate-bull-28349.upstash.io
UPSTASH_REDIS_REST_TOKEN=AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk
REDIS_ENABLED=true
NEXT_TELEMETRY_DISABLED=1
NODE_VERSION=20
```

**Pour chaque variable** :
1. Cliquer **"Add variable"**
2. **Variable name** : (nom de la variable, ex: DATABASE_URL)
3. **Value** : (valeur correspondante)
4. **Environment** : Cocher **Production** et **Preview**
5. Cliquer **"Save"**

### Étape 4 : Déployer

1. Cliquer sur **"Save and Deploy"**
2. Attendre la compilation (2-5 minutes)
3. ✅ Votre site sera disponible sur : `https://iapostemanager.pages.dev`

---

## 💻 MÉTHODE 2 : WRANGLER CLI (Avancé)

### Installation

```powershell
# Installer Wrangler globalement
npm install -g wrangler

# Se connecter à Cloudflare
wrangler login
```

### Configuration

```powershell
# Créer le projet Pages
wrangler pages project create iapostemanager

# Configurer les variables d'environnement
wrangler pages secret put DATABASE_URL --project-name=iapostemanager
# Entrer : file:./dev.db

wrangler pages secret put NEXTAUTH_URL --project-name=iapostemanager
# Entrer : https://iapostemanager.pages.dev

wrangler pages secret put NEXTAUTH_SECRET --project-name=iapostemanager
# Entrer : vquobyYX9ptr8LfgJ0fcs7HtiA7B3HrC/0ji30D39OA=

wrangler pages secret put UPSTASH_REDIS_REST_URL --project-name=iapostemanager
# Entrer : https://intimate-bull-28349.upstash.io

wrangler pages secret put UPSTASH_REDIS_REST_TOKEN --project-name=iapostemanager
# Entrer : AW69AAIncDFmZGNmMzIyNjc5NjE0ODk3OTBjODY5MmM0ZTNhNTJjYnAxMjgzNDk
```

### Build et Déploiement

```powershell
# Build local
npm run build

# Déployer sur Cloudflare Pages
wrangler pages deploy .next/standalone --project-name=iapostemanager --branch=multitenant-render
```

---

## 🔄 DÉPLOIEMENTS AUTOMATIQUES (CI/CD)

Une fois configuré via l'interface web, **chaque push sur GitHub** déclenche automatiquement un déploiement !

```bash
# Faire des modifications
git add .
git commit -m "fix: update feature"
git push origin multitenant-render

# ✅ Cloudflare déploie automatiquement !
```

---

## 📊 VÉRIFICATION POST-DÉPLOIEMENT

### 1. Tester l'URL

Ouvrir dans le navigateur :
```
https://iapostemanager.pages.dev
```

### 2. Vérifier les logs

1. Dashboard Cloudflare → **Workers & Pages**
2. Cliquer sur **iapostemanager**
3. Onglet **"Deployments"** → Voir le statut
4. Onglet **"Logs"** → Voir les erreurs éventuelles

### 3. Test API Health

```bash
curl https://iapostemanager.pages.dev/api/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-01-15T..."
}
```

### 4. Test Authentification

1. Aller sur `https://iapostemanager.pages.dev`
2. Cliquer sur **"Se connecter"**
3. Vérifier que la page de login s'affiche
4. Tester la connexion avec un compte test

---

## 🐛 DÉPANNAGE

### Erreur : Build Failed

**Cause** : Problème de compilation

**Solution** :
1. Vérifier que le build fonctionne localement :
   ```bash
   npm run build
   ```
2. Si erreur locale, corriger le code
3. Push à nouveau

### Erreur : Environment variable missing

**Cause** : Variables d'environnement non configurées

**Solution** :
1. Dashboard Cloudflare → iapostemanager → Settings → Environment variables
2. Vérifier que toutes les variables obligatoires sont présentes
3. Cliquer "Redeploy" pour forcer un nouveau déploiement

### Erreur : Redis connection failed

**Cause** : Credentials Upstash invalides

**Solution** :
1. Vérifier sur https://console.upstash.com/
2. Copier les bonnes valeurs de `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
3. Mettre à jour dans Cloudflare Pages

### Erreur : NEXTAUTH_URL mismatch

**Cause** : URL incorrecte dans les variables

**Solution** :
1. Vérifier que `NEXTAUTH_URL=https://iapostemanager.pages.dev` (HTTPS, sans "/" final)
2. Redéployer

---

## 🔗 DOMAINE PERSONNALISÉ (Optionnel)

### Ajouter votre propre domaine

1. Dashboard Cloudflare → iapostemanager → **Custom domains**
2. Cliquer **"Set up a custom domain"**
3. Entrer votre domaine : `iapostemanager.com`
4. Suivre les instructions pour configurer le DNS

**Mise à jour de NEXTAUTH_URL** :
```env
NEXTAUTH_URL=https://iapostemanager.com
```

---

## 📈 MONITORING

### Métriques disponibles

Dashboard Cloudflare → iapostemanager → **Analytics** :

- 📊 Nombre de requêtes
- ⚡ Temps de réponse
- 🌍 Répartition géographique
- 💾 Bande passante utilisée
- ❌ Taux d'erreur

### Alertes

Configurer des alertes email pour :
- Déploiements échoués
- Taux d'erreur > 5%
- Quota dépassé

---

## ✅ CHECKLIST FINALE

Avant de considérer le déploiement comme réussi :

- [ ] Site accessible : `https://iapostemanager.pages.dev`
- [ ] Page d'accueil se charge correctement
- [ ] Authentification fonctionne
- [ ] `/api/health` retourne status OK
- [ ] Redis connecté (visible dans logs)
- [ ] Aucune erreur critique dans les logs Cloudflare
- [ ] Déploiements automatiques configurés (push GitHub)
- [ ] Variables d'environnement validées
- [ ] Domaine personnalisé configuré (optionnel)

---

## 🎯 LIENS RAPIDES

- **Cloudflare Dashboard** : https://dash.cloudflare.com/
- **Votre projet GitHub** : https://github.com/mobby57/iapostemanager
- **Upstash Console** : https://console.upstash.com/
- **Documentation Cloudflare Pages** : https://developers.cloudflare.com/pages/

---

**✅ Vous êtes prêt à déployer !** 🚀

Suivez l'une des deux méthodes ci-dessus. La **Méthode 1 (Interface Web)** est la plus simple pour commencer.
