# 📋 Checklist Déploiement Cloudflare

## ✅ Checklist Complète - IA Poste Manager

---

## 🎯 Phase 1 : Préparation (Avant le Déploiement)

### Compte & Accès

- [ ] Compte Cloudflare créé (gratuit sur cloudflare.com)
- [ ] Email vérifié
- [ ] Wrangler CLI installé (`npm install -g wrangler`)
- [ ] Connexion Wrangler OK (`wrangler login` + `wrangler whoami`)

### Code & Configuration

- [ ] Code sur GitHub (optionnel mais recommandé)
- [ ] `.env.local` configuré localement
- [ ] `wrangler.toml` présent à la racine
- [ ] `next.config.ts` configuré pour export statique
- [ ] Application testée localement (`npm run dev`)

---

## 🗄️ Phase 2 : Base de Données D1

### Création D1

- [ ] Base D1 créée : `wrangler d1 create iaposte-production-db`
- [ ] `database_id` copié dans `wrangler.toml`
- [ ] Binding configuré dans `wrangler.toml` :
  ```toml
  [[d1_databases]]
  binding = "iaposte_production_db"
  database_name = "iaposte-production-db"
  database_id = "VOTRE_ID_ICI"
  ```

### Migration Schéma

- [ ] Script de migration exécuté : `.\scripts\migrate-to-d1.ps1`
- [ ] Schéma SQL généré dans `migrations/d1-schema.sql`
- [ ] Tables créées dans D1
- [ ] Vérification : `wrangler d1 execute iaposte-production-db --command "SELECT name FROM sqlite_master WHERE type='table'" --remote`

### Données Initiales

- [ ] Seed data préparé (si nécessaire)
- [ ] Données insérées : `wrangler d1 execute iaposte-production-db --file=prisma/seed-d1.sql --remote`
- [ ] Utilisateurs test créés
- [ ] Tenants test créés

---

## 🏗️ Phase 3 : Build & Déploiement

### Build Local

- [ ] `npm install` exécuté
- [ ] `npm run build` réussi
- [ ] Dossier `out/` généré
- [ ] Fichiers HTML/JS/CSS présents dans `out/`
- [ ] Taille raisonnable (< 25 MB idéalement)

### Déploiement Pages

- [ ] Première déploiement : `wrangler pages deploy out --project-name=iaposte-manager`
- [ ] Déploiement réussi
- [ ] URL `.pages.dev` obtenue
- [ ] Application accessible sur l'URL

### Vérification Déploiement

- [ ] Page d'accueil charge correctement
- [ ] Assets (CSS, images) chargent
- [ ] API routes répondent (si applicable)
- [ ] Pas d'erreurs 404 majeures

---

## 🔐 Phase 4 : Secrets & Configuration

### Secrets Requis

- [ ] `NEXTAUTH_SECRET` généré et ajouté
  ```powershell
  wrangler pages secret put NEXTAUTH_SECRET --project-name=iaposte-manager
  ```
- [ ] `NEXTAUTH_URL` configuré (https://iaposte-manager.pages.dev)
- [ ] `DATABASE_URL` configuré (format: `d1://DATABASE_ID`)

### Secrets Optionnels

- [ ] `GITHUB_CLIENT_ID` (si OAuth GitHub)
- [ ] `GITHUB_CLIENT_SECRET` (si OAuth GitHub)
- [ ] `GMAIL_CLIENT_ID` (si monitoring email)
- [ ] `GMAIL_CLIENT_SECRET` (si monitoring email)
- [ ] `OLLAMA_BASE_URL` (si IA externe)

### Vérification Secrets

- [ ] Liste des secrets : `wrangler pages secret list --project-name=iaposte-manager`
- [ ] Tous les secrets requis présents
- [ ] Redéploiement après ajout secrets

---

## 📁 Phase 5 : Storage (Optionnel)

### R2 Bucket (Documents)

- [ ] Bucket créé : `wrangler r2 bucket create iaposte-documents`
- [ ] Binding ajouté dans `wrangler.toml`
- [ ] Upload test réussi
- [ ] Download test réussi

### KV Namespace (Cache)

- [ ] Namespace créé : `wrangler kv:namespace create SESSIONS`
- [ ] ID ajouté dans `wrangler.toml`
- [ ] Test lecture/écriture OK

---

## 🚀 Phase 6 : CI/CD GitHub Actions

### Configuration Workflow

- [ ] Fichier `.github/workflows/cloudflare-pages.yml` présent
- [ ] Workflow activé dans GitHub

### Secrets GitHub

- [ ] Repository → Settings → Secrets
- [ ] `CLOUDFLARE_API_TOKEN` ajouté (créé sur https://dash.cloudflare.com/profile/api-tokens)
- [ ] `CLOUDFLARE_ACCOUNT_ID` ajouté (visible sur Dashboard)
- [ ] `DATABASE_URL` ajouté
- [ ] `NEXTAUTH_SECRET` ajouté

### Test Auto-Deploy

- [ ] Push sur `main` déclenche le workflow
- [ ] Build réussit dans Actions
- [ ] Déploiement automatique OK
- [ ] Nouvelle version accessible

---

## 🌐 Phase 7 : Domaine Personnalisé (Optionnel)

### Configuration DNS

- [ ] Domaine ajouté à Cloudflare
- [ ] CNAME créé : `app.example.com` → `iaposte-manager.pages.dev`
- [ ] Domaine validé dans Pages settings

### SSL/TLS

- [ ] HTTPS automatiquement activé
- [ ] Certificat SSL valide
- [ ] Redirection HTTP → HTTPS activée
- [ ] Test : `https://app.example.com` accessible

---

## 📊 Phase 8 : Monitoring & Analytics

### Web Analytics

- [ ] Web Analytics activé dans Dashboard
- [ ] Script beacon ajouté (si manual)
- [ ] Premières données visibles

### Logs & Debugging

- [ ] Logs accessibles : `wrangler pages deployment tail --project-name=iaposte-manager`
- [ ] Erreurs 500 gérées
- [ ] Alertes configurées (optionnel)

### Performance

- [ ] Lighthouse score > 90
- [ ] Temps de chargement < 2s
- [ ] Core Web Vitals OK
- [ ] Cache activé

---

## 🔧 Phase 9 : Maintenance

### Backup

- [ ] Script de backup créé : `backup-cloudflare.ps1`
- [ ] Premier backup exécuté
- [ ] Backup stocké hors-site
- [ ] Fréquence backup définie (quotidien/hebdomadaire)

### Mises à Jour

- [ ] Process de mise à jour défini
- [ ] Tests avant déploiement
- [ ] Rollback plan documenté

### Documentation

- [ ] Guide déploiement à jour
- [ ] Credentials documentés (de manière sécurisée)
- [ ] Contacts d'urgence définis

---

## ✅ Phase 10 : Tests Finaux

### Tests Fonctionnels

- [ ] Authentification fonctionne
- [ ] CRUD utilisateurs OK
- [ ] CRUD dossiers OK
- [ ] Upload documents OK (si R2)
- [ ] API endpoints répondent

### Tests Sécurité

- [ ] HTTPS forcé
- [ ] Headers de sécurité présents
- [ ] Pas de secrets exposés
- [ ] CORS configuré correctement
- [ ] Rate limiting actif (si configuré)

### Tests Performance

- [ ] Temps de réponse < 500ms
- [ ] Images optimisées
- [ ] JS/CSS minifiés
- [ ] Cache-Control headers OK

### Tests Multi-Tenant

- [ ] Isolation tenant OK
- [ ] Pas d'accès croisé
- [ ] Données correctement filtrées

---

## 🎯 Validation Finale

### Critères de Succès

- [ ] ✅ Application accessible publiquement
- [ ] ✅ Base D1 fonctionnelle
- [ ] ✅ Authentification opérationnelle
- [ ] ✅ CI/CD automatique
- [ ] ✅ Backups configurés
- [ ] ✅ Monitoring actif
- [ ] ✅ Performance > 90/100
- [ ] ✅ Sécurité validée

### Documentation

- [ ] README à jour
- [ ] CHANGELOG créé
- [ ] Guide utilisateur disponible
- [ ] Guide admin disponible

### Communication

- [ ] Équipe informée
- [ ] Utilisateurs prévenus (si migration)
- [ ] Support prêt

---

## 📝 Notes & Commandes Utiles

```powershell
# Déploiement rapide
.\deploy-cloudflare-full.ps1

# Migration D1
.\scripts\migrate-to-d1.ps1

# Backup
.\backup-cloudflare.ps1

# Logs temps réel
wrangler pages deployment tail --project-name=iaposte-manager

# Query D1
wrangler d1 execute iaposte-production-db --command "SELECT COUNT(*) FROM User" --remote

# Lister secrets
wrangler pages secret list --project-name=iaposte-manager

# Health check
Invoke-WebRequest -Uri "https://iaposte-manager.pages.dev/api/health"
```

---

## 🎉 Statut du Déploiement

**Date:** _______________  
**Version:** _______________  
**Déployé par:** _______________

**Status:**
- [ ] ✅ En développement
- [ ] ✅ En staging
- [ ] ✅ En production

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**✅ Checklist complète = Déploiement réussi!** 🚀
