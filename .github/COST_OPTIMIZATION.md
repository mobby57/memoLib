# 💰 Optimisation des Coûts GitHub Actions

## 🔴 Problèmes identifiés

### Workflows trop fréquents
| Workflow | Fréquence actuelle | Coût estimé/mois |
|----------|-------------------|------------------|
| `trivy-scan.yml` | Quotidien 3h | ~30 runs × 5 min = 150 min |
| `codeql-analysis.yml` | Hebdo + Push/PR | ~8 runs × 30 min = 240 min |
| `security.yml` | Hebdo + Push/PR | ~10 runs × 5 min = 50 min |
| `owasp-zap.yml` | Hebdomadaire | ~4 runs × 10 min = 40 min |
| `docker-build.yml` | Push main (multi-arch) | ~10 runs × 20 min = 200 min |
| `ci-cd-production.yml` | Push/PR main | ~20 runs × 20 min = 400 min |

**Total estimé: ~1100 minutes/mois** (sans compter les PR)

## ✅ Actions recommandées

### 1. Réduire la fréquence des scans de sécurité
```yaml
# trivy-scan.yml - Changer de quotidien à hebdomadaire
schedule:
  - cron: '0 3 * * 1'  # Lundi au lieu de tous les jours
```

### 2. Supprimer les workflows en doublon
- ❌ Supprimer `security.yml` (doublon de `security-audit.yml`)
- ❌ Supprimer `zap-scan.yml` (doublon de `owasp-zap.yml`)

### 3. Optimiser Docker build
```yaml
# Construire seulement amd64, pas arm64
platforms: linux/amd64  # Au lieu de linux/amd64,linux/arm64
```

### 4. Ajouter des filtres paths pour éviter les builds inutiles
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'package.json'
      - '!**.md'  # Ignorer les changements de docs
```

### 5. Désactiver les scans automatiques inutiles
Si vous utilisez Cloudflare, les scans Docker sont inutiles.

## 🛠️ Commandes pour appliquer les optimisations

```bash
# Supprimer les workflows en doublon
rm .github/workflows/security.yml
rm .github/workflows/zap-scan.yml

# Ou les désactiver en ajoutant au début:
# on: workflow_dispatch  # Manuel uniquement
```

## 📊 Économies estimées après optimisation

| Avant | Après | Économie |
|-------|-------|----------|
| ~1100 min/mois | ~300 min/mois | **~73%** |

## ⚠️ GitHub Codespaces

Vérifiez aussi votre utilisation de Codespaces :
- Limite gratuite : 120 heures/mois (Personal) ou 60h (Free)
- Coût après : ~$0.18/heure (2 cores)

Fermez les codespaces inutilisés !
