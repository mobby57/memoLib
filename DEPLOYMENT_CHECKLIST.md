# 🚀 Checklist de Livraison - MemoLib

**Date:** 2 février 2026
**Version:** 1.0.0
**Responsable:** DevOps

---

## ✅ Phase 1: QA Finale

- [x] Build production réussit (`npm run build`)
- [x] Tests passent (3757/3862 = 97%)
- [x] Next.js démarre (`npm run dev`)
- [x] Flask backend démarre (`python app.py`)
- [ ] Type-check clean (616 erreurs détectées - À corriger)
- [ ] Aucun avertissement critical dans les logs

**Action:** Corriger les 616 erreurs TypeScript

---

## 🔒 Phase 2: Sécurité

- [ ] Audit npm - 1 vulnerability haute (jsPDF) à corriger
  ```bash
  npm audit fix
  ```
- [ ] Pas de secrets dans le code
- [ ] Variables d'env configurées (`.env.production`)
- [ ] CORS configuré
- [ ] Rate limiting activé
- [ ] HTTPS en production

**Serveurs cibles:**

- Frontend: Vercel ou Azure Static Web Apps
- Backend: Azure App Service ou Render.com

---

## 🧪 Phase 3: Tests d'Intégration

### Frontend (Next.js)

```bash
npm test -- --coverage
```

- [ ] Tous les composants testés
- [ ] Coverage > 80%

### Backend (Flask)

```bash
python -m pytest --cov=backend-python
```

- [ ] Endpoints testés
- [ ] Authentification OK
- [ ] Webhooks OK

### API

- [ ] GET /api/health → 200
- [ ] POST /api/auth/login → OK
- [ ] POST /api/data/titanic/prepare → OK (Titanic API test)

---

## 📦 Phase 4: Build & Containerisation

```bash
# Docker Frontend
docker build -t memolib-frontend:1.0.0 -f Dockerfile .

# Docker Backend
docker build -t memolib-backend:1.0.0 -f Dockerfile.backend .

# Test images localement
docker run -p 3000:3000 memolib-frontend:1.0.0
docker run -p 5000:5000 memolib-backend:1.0.0
```

- [ ] Images Docker compilent sans erreur
- [ ] Images testées localement
- [ ] Images pushées à registry (Docker Hub / Azure ACR)

---

## 🌐 Phase 5: Déploiement en Staging

### Vercel (Frontend)

```bash
# Déploiement automatique via Git
git push origin main
```

- [ ] Staging URL accessible
- [ ] Build logs OK
- [ ] Pas d'erreurs 500

### Azure (Backend)

```bash
# Via Azure CLI
az webapp deployment source config-zip \
  --resource-group memolib \
  --name memolib-api \
  --src deploy.zip
```

- [ ] API en staging répliquée
- [ ] Base de données migrée
- [ ] Webhooks testés

---

## ✨ Phase 6: Vérifications Pre-Production

### Fonctionnalités critiques

- [ ] Authentification Azure AD
- [ ] Emails entrants (IMAP)
- [ ] Webhooks GitHub/Twilio
- [ ] Titanic data API (test endpoint)
- [ ] Dossiers juridiques (CRUD)
- [ ] Facturation/Stripe
- [ ] IA/LLM (Ollama/OpenAI)

### Performance

- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] DB queries optimisées
- [ ] Caching activé (Redis si dispo)

### Monitoring

- [ ] Sentry configuré
- [ ] Logs centralisés
- [ ] Alertes actives
- [ ] Uptime monitoring

---

## 🚀 Phase 7: Go-Live

### Jour J

1. **Backup database**

   ```bash
   npx prisma db push --preview-features
   ```

2. **Déployer frontend**
   - Vercel: Auto via Git (ou `vercel deploy --prod`)

3. **Déployer backend**
   - Azure: `az webapp deployment ...`

4. **Migrer data** (si nécessaire)
   - Prisma migrations: `npx prisma migrate deploy`

5. **Vérifier**
   - Tests de fumée post-déploiement
   - Logs sans erreurs critiques
   - Users peuvent se connecter

### Rollback (si problème)

```bash
git revert HEAD
npm run build
# Re-déployer
```

---

## 📊 Phase 8: Post-Go-Live

**Durée:** 24-48h après lancement

- [ ] Sentry 0 erreurs critiques
- [ ] Logs propres (< 5 errors/min)
- [ ] Users actifs (> 10 connexions)
- [ ] Aucun incident signalé
- [ ] Performance stable

---

## 📝 Documentation

- [ ] README.md à jour
- [ ] API docs générées (`/api/docs`)
- [ ] Guide d'installation
- [ ] Troubleshooting guide
- [ ] Changelog v1.0.0

```markdown
# v1.0.0 (2 février 2026)

## Nouvelles fonctionnalités

- Intégration Titanic Data API
- Amélioration UI dossiers
- Support GitHub App webhooks

## Bugs corrigés

- Sentry instrumentation
- TypeScript type paths
- Middleware conflicts

## Notes de déploiement

- Prisma migrations auto
- Pas de downtime
- Rollback disponible
```

---

## 🆘 Support

**En cas de problème:**

1. Vérifier les logs: `az webapp log tail --resource-group memolib --name memolib-api`
2. Sentry dashboard: https://sentry.io
3. Vérifier la base de données: `npx prisma studio`
4. Redéployer si nécessaire: voir "Rollback"

---

## 📈 Métriques de succès

| Métrique          | Cible   | Statut    |
| ----------------- | ------- | --------- |
| Uptime            | > 99.5% | À mesurer |
| Response time     | < 500ms | À mesurer |
| Error rate        | < 0.1%  | À mesurer |
| User satisfaction | > 4.5/5 | À mesurer |

---

**Status:** 🔄 EN COURS
**Prochaine action:** Corriger les 616 erreurs TypeScript
**ETA livraison:** TBD
