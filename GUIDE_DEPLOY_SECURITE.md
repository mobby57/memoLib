# 🛡️ Sécurité CI/CD - Guide de Déploiement

## ✅ Configuration Complète

### Workflows Créés

1. **CodeQL Analysis** (`.github/workflows/codeql-analysis.yml`)
   - Analyse statique du code JavaScript/TypeScript
   - Détection de vulnérabilités de sécurité
   - Upload automatique vers GitHub Security
   - Commentaires automatiques sur les PRs

2. **Trivy Security Scan** (`.github/workflows/trivy-scan.yml`)
   - Scan des dépendances NPM
   - Scan de l'image Docker
   - Scan des fichiers de configuration
   - Scan des secrets dans le code
   - Résumé agrégé dans GitHub Actions

3. **CodeQL Configuration** (`.github/codeql/codeql-config.yml`)
   - Configuration optimisée pour Next.js + Prisma
   - Chemins analysés et exclusions

## 🚀 Déploiement

### Étapes

```bash
# 1. Vérifier l'état
git status

# 2. Ajouter les workflows
git add .github/

# 3. Commit
git commit -m "feat(security): add CodeQL and Trivy security scanning

- Add CodeQL static analysis for JavaScript/TypeScript
- Add Trivy vulnerability scanner (4 scan types)
- Configure CodeQL for Next.js + Prisma
- Upload SARIF results to GitHub Security tab
- Auto-comment on PRs with security results"

# 4. Push vers GitHub
git push origin multitenant-render
```

### Vérification

1. **GitHub Actions**: <https://github.com/mobby57/iapostemanager/actions>
   - Vérifier que les 2 workflows apparaissent
   - Vérifier la première exécution

2. **GitHub Security**: <https://github.com/mobby57/iapostemanager/security/code-scanning>
   - Vérifier les résultats SARIF uploadés
   - Consulter les alertes détectées

## 📊 Calendrier d'Exécution

- **CodeQL**: Lundi 2h du matin (hebdomadaire) + Push/PR
- **Trivy**: Tous les jours 3h du matin + Push/PR
- **Manuel**: Onglet Actions → Run workflow

## 🎯 Niveau de Sécurité

**Avant**: Niveau 2/5 (GitGuardian + Snyk)
**Après**: Niveau 4/5 (+ CodeQL + Trivy 4-scan)

Prochaine étape: SAST/DAST avancé (Niveau 5/5)
