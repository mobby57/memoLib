# TODO - MemoLib Project

## 🔴 URGENT - Priorité Haute

- [ ] **Supprimer submodule cassé** `dbcodeio-public`
  ```bash
  git rm --cached dbcodeio-public
  rm -rf dbcodeio-public
  git commit -m "Remove broken submodule"
  ```

- [ ] **Activer TypeScript strict mode**
  - Fichier: `tsconfig.json`
  - Changer: `"ignoreBuildErrors": false`
  - Corriger erreurs TypeScript

- [ ] **Configurer monitoring production**
  - Réactiver Sentry OU installer alternative (Datadog, New Relic)
  - Ajouter alertes critiques

## 🟡 IMPORTANT - Priorité Moyenne

- [ ] **Optimiser bundle size**
  - Analyser: `npm run analyze`
  - Lazy load composants lourds
  - Tree-shaking des dépendances

- [ ] **Augmenter coverage tests**
  - Objectif: 50%+ (actuellement 30%)
  - Ajouter tests unitaires manquants
  - Compléter tests E2E

- [ ] **Documenter variables d'environnement**
  - Créer: `docs/ENVIRONMENT_VARIABLES.md`
  - Lister toutes les vars requises
  - Exemples par environnement

- [ ] **Consolider scripts**
  - Réduire 70+ scripts
  - Grouper par catégorie
  - Supprimer doublons

## 🟢 AMÉLIORATION - Priorité Basse

- [ ] **Nettoyer dépendances**
  ```bash
  npm run deps:audit
  npm run deps:update
  ```

- [ ] **Optimiser images Docker**
  - Multi-stage builds
  - Réduire taille images

- [ ] **Améliorer documentation**
  - README plus concis
  - Guides quick-start
  - Vidéos démo

- [ ] **Refactoring code**
  - Extraire logique dupliquée
  - Simplifier composants complexes
  - Améliorer nommage

## 📋 BACKLOG

- [ ] Ajouter tests de charge (k6, Artillery)
- [ ] Implémenter feature flags (LaunchDarkly)
- [ ] Créer storybook composants
- [ ] Ajouter i18n (multi-langues)
- [ ] Optimiser SEO (meta tags, sitemap)
- [ ] Créer CLI admin
- [ ] Ajouter webhooks personnalisés
- [ ] Implémenter cache Redis avancé

## 🐛 BUGS CONNUS

- [ ] TypeScript errors ignorés (voir `next.config.js`)
- [ ] Submodule `dbcodeio-public` cassé
- [ ] Sentry désactivé (pas de monitoring erreurs)
- [ ] Build Azure nécessite 8GB RAM

## 🔒 SÉCURITÉ

- [ ] Audit dépendances: `npm audit`
- [ ] Scan secrets: `npm run security:scan`
- [ ] Tester OWASP Top 10
- [ ] Revoir permissions Azure AD
- [ ] Rotation secrets Key Vault

## 📊 PERFORMANCE

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals optimisés
- [ ] API response time < 200ms
- [ ] Database query optimization
- [ ] CDN pour assets statiques

---

**Dernière mise à jour**: 2026-01-30  
**Mainteneur**: @memolib-team
