# 🏗️ Plan d'Architecture Expert - IA Poste Manager

> **Dernière mise à jour**: 24 janvier 2026
> **Couverture tests**: ~2% → Objectif 30%
> **Tests passants**: 171/192

## 🔴 PRIORITÉ CRITIQUE (Cette semaine)

### 1. Middleware Global Next.js ✅ FAIT
- [x] Créer `src/middleware.ts`
- [x] Implémenter rate limiting (in-memory, à migrer vers Upstash)
- [x] RBAC par rôle (CLIENT, ADMIN, AVOCAT, SUPER_ADMIN)
- [x] Headers de sécurité (X-Frame-Options, XSS, etc.)

### 2. Rate Limiting ✅ FAIT (basique)
- [x] Rate limiting en mémoire
- [x] 30 req/min pour API publiques
- [x] 100 req/min pour utilisateurs auth
- [x] 10 req/min pour endpoints IA
- [ ] **À FAIRE**: Migrer vers `@upstash/ratelimit` pour persistance

### 3. Supprimer les $disconnect() ✅ FAIT
- [x] Utiliser le singleton Prisma de `src/lib/prisma.ts`
- [x] Supprimer tous les `await prisma.$disconnect()` des routes

---

## 🟠 PRIORITÉ HAUTE (2 semaines)

### 4. Couverture Tests → 30% 🔄 EN COURS
- [x] CI/CD: `.github/workflows/test-coverage.yml` créé
- [x] Tests DossierService créés
- [x] Tests Auth créés
- [x] Tests Middleware créés
- [x] Script `scripts/coverage-check.js` créé
- [ ] Ajouter tests pour tous les services métier
- [ ] Tests d'intégration API
- [ ] Atteindre seuil minimum 30%

### 5. Validation Inputs (Zod)
- [ ] Créer schémas Zod pour chaque endpoint
- [ ] Middleware de validation automatique
- [ ] Messages d'erreur standardisés

### 6. Error Handling Centralisé
- [ ] Créer classes d'erreur personnalisées
- [ ] Logger Sentry/LogSnag en prod
- [ ] Réponses API standardisées

---

## 🟡 PRIORITÉ MOYENNE (1 mois)

### 7. Documentation API
- [ ] Générer OpenAPI/Swagger
- [ ] Postman collection
- [ ] Exemples pour chaque endpoint

### 8. Performance
- [ ] Analyser N+1 queries Prisma
- [ ] Implémenter caching Redis
- [ ] Lazy loading composants

### 9. Cleanup Code Legacy
- [ ] Évaluer fichiers Python (supprimer ou migrer?)
- [ ] Résoudre les 20+ TODOs
- [ ] Supprimer code mort

---

## 🟢 PRIORITÉ BASSE (Backlog)

### 10. CI/CD Amélioré
- [ ] Ajouter environnement staging
- [ ] Tests E2E automatiques
- [ ] Deploy preview branches

### 11. Monitoring
- [ ] APM (Sentry Performance)
- [ ] Métriques custom (quotas, usage IA)
- [ ] Alerting (PagerDuty/Discord)

### 12. Infrastructure
- [ ] Redis pour sessions/cache
- [ ] CDN pour assets
- [ ] Backup DB automatique

---

## 📁 Structure Recommandée

```
src/
├── app/
│   └── api/           # Routes API (134 endpoints)
├── components/        # Composants React
├── lib/
│   ├── services/      # Logique métier
│   ├── repositories/  # Accès données (Prisma)
│   ├── validators/    # Schémas Zod
│   └── errors/        # Classes d'erreur
├── middleware/        # Middlewares réutilisables
│   ├── auth.ts
│   ├── rate-limit.ts
│   ├── validation.ts
│   └── error-handler.ts
├── types/             # Types TypeScript
└── middleware.ts      # Middleware global Next.js
```

---

## 🛠️ Technologies à ajouter

| Besoin | Solution | Coût |
|--------|----------|------|
| Rate Limiting | Upstash Redis | Gratuit 10k req/jour |
| Validation | Zod | Gratuit |
| Monitoring | Sentry | Gratuit 5k events |
| Caching | Vercel KV ou Upstash | Gratuit tier |
| E2E Tests | Playwright | Gratuit |

---

## 📈 Objectifs à 3 mois

| Métrique | Actuel | Objectif |
|----------|--------|----------|
| Coverage | 1.68% | 50% |
| Routes protégées | ~60% | 100% |
| Temps réponse P95 | N/A | < 500ms |
| Erreurs 5xx/jour | N/A | < 10 |
| Disponibilité | N/A | 99.5% |
