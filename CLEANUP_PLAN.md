# 🧹 Plan de Nettoyage - Workflows & Fichiers Inutiles

## Objectif

Supprimer complexité excessive, recentrer sur vision CESEDA, accélérer déploiement.

---

## Fichiers à Supprimer (Workflows Inutiles)

### 🗑️ Documentation Redondante

```bash
# Garder SEULEMENT:
- README.md
- VISION_MARKETING.md
- DEPLOY_SIMPLE.md (à créer)
- docs/API_ROUTES.md

# SUPPRIMER:
rm BUILD_ARCHITECTURE.md        # Trop technique, pas nécessaire
rm BUILD_COMMANDS.sh
rm BUILD_INDEX.md
rm BUILD_METRICS.json
rm BUILD_OPTIMIZATION_REPORT.md
rm BUILD_QUICK_START.md         # Redondant avec QUICKSTART.md
rm BUILD_STATUS_DASHBOARD.html  # Pas utilisé
rm BUILD_STRUCTURE_ANALYSIS.md
rm BUILD_SUMMARY.md
rm BUILD_VISUALIZER.html        # Outil de dev, pas prod
rm COMPLETION_SUMMARY.md        # Notes temporaires
rm EXECUTION_REPORT.md          # Notes temporaires
rm GET_STARTED_QUICK.md         # Redondant avec QUICKSTART.md
rm REFINEMENT_CHECKLIST.md      # Phase 2 terminée, archiver
rm bundle-report.html           # Build artifact
```

### 🗑️ Phase 2 Temporaire (Archiver)

```bash
mkdir -p archive/phase2
mv PHASE2_*.md archive/phase2/
mv MemoLib_Build_Analysis.ipynb archive/phase2/
```

### 🗑️ Scripts Inutilisés

```bash
# Garder scripts essentiels:
- validate-build.sh
- fix-flask-health.sh (déjà appliqué, peut supprimer après vérif)

# SUPPRIMER:
rm fix-tsconfig.sh              # Déjà appliqué
rm scripts/type-check-changed.sh  # Utiliser npm run type-check directement
rm scripts/type-check-safe.sh
rm scripts/typescript-diagnostic.sh
```

### 🗑️ Fichiers Marketing Obsolètes

```bash
# Ancienne landing page HTML statique
rm marketing/landing-page.html  # Remplacé par /src/app/page.tsx CESEDA

# Garder SEULEMENT version Next.js avec vision CESEDA
```

---

## Simplification Architecture

### Routes Next.js à Garder

```
✅ GARDER:
/dashboard              # Dashboard avocat principal
/lawyer/*               # Fonctionnalités avocat
/api/ceseda/*           # IA prédictive CESEDA
/api/health             # Monitoring
/api/auth/*             # NextAuth

❌ SUPPRIMER (si pas utilisées):
/demo                   # Rediriger vers /contact
/pricing (optionnel)    # Intégrer dans homepage si simple
```

### Backend Python: Focus CESEDA

```
✅ GARDER:
backend-python/app.py           # Flask dev server
- Route /api/ceseda/predict
- Route /api/ceseda/analyze
- Route /api/legal/delais/*     # Alertes délais
- Route /api/communications/*   # SMS/Email

❌ SUPPRIMER:
src/backend/ (FastAPI variant)  # GARDER Flask uniquement, éviter duplication
```

---

## Configuration à Simplifier

### Variables d'Environnement

```bash
# Garder MINIMUM viable:
NEXTAUTH_SECRET
NEXTAUTH_URL
DATABASE_URL
OPENAI_API_KEY         # IA CESEDA
TWILIO_ACCOUNT_SID     # Alertes SMS
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# SUPPRIMER (si non utilisés):
AZURE_BLOB_*           # Si stockage local suffit en dev
SENDGRID_*             # Si Twilio suffit pour comms
```

### Fichiers Config

```bash
# Garder:
- .env.local (à créer par utilisateur)
- next.config.js (simplifié)
- tsconfig.json (optimisé Phase 2)
- package.json

# SUPPRIMER:
- docker-compose.*.yml (sauf docker-compose.yml principal si utilisé)
- compose.*.yaml (redondant)
- railway.json, render.yaml (déploiement manuel suffit)
- fly.toml (déploiement manuel)
```

---

## Commandes de Nettoyage

### Étape 1: Backup Sécurisé

```bash
# Créer archive avant suppression
tar -czf memolib-backup-$(date +%Y%m%d).tar.gz \
  BUILD_*.md \
  PHASE2_*.md \
  marketing/ \
  scripts/ \
  *.html

# Déplacer dans dossier archive
mkdir -p archive
mv memolib-backup-*.tar.gz archive/
```

### Étape 2: Nettoyage Documentaire

```bash
# Supprimer docs redondantes
rm -f BUILD_*.md BUILD_*.html BUILD_*.sh BUILD_*.json
rm -f COMPLETION_SUMMARY.md EXECUTION_REPORT.md
rm -f GET_STARTED_QUICK.md REFINEMENT_CHECKLIST.md
rm -f bundle-report.html

# Archiver Phase 2
mkdir -p archive/phase2
mv PHASE2_*.md archive/phase2/
mv MemoLib_Build_Analysis.ipynb archive/phase2/
```

### Étape 3: Nettoyage Scripts

```bash
# Supprimer scripts appliqués/inutilisés
rm -f fix-tsconfig.sh fix-flask-health.sh
rm -rf scripts/type-check-*.sh scripts/typescript-diagnostic.sh

# Garder seulement validation
# validate-build.sh et scripts/validate-project.sh
```

### Étape 4: Nettoyage Marketing

```bash
# Supprimer ancienne landing HTML
rm -rf marketing/

# Vision désormais dans VISION_MARKETING.md + /src/app/page.tsx
```

### Étape 5: Nettoyage Config Déploiement

```bash
# Garder seulement docker-compose.yml principal
rm -f docker-compose.dev.yml docker-compose.prod.yml
rm -f docker-compose.full.yml docker-compose.monitoring.yml
rm -f docker-compose.simple.yml compose.*.yaml

# Supprimer configs cloud redondantes
rm -f railway.json render.yaml fly.toml
```

---

## Structure Finale (Post-Nettoyage)

```
memolib/
├── src/
│   ├── frontend/        # Next.js 16 (App Router)
│   └── app/             # Pages & API routes CESEDA
├── backend-python/      # Flask (port 5000) - IA CESEDA
├── docs/
│   ├── API_ROUTES.md    # Documentation API
│   └── ENVIRONMENT_VARIABLES.md
├── archive/             # Fichiers historiques
│   └── phase2/
├── VISION_MARKETING.md  # 🎯 Vision produit & marketing
├── DEPLOY_SIMPLE.md     # 🚀 Guide déploiement (à créer)
├── README.md            # Vue d'ensemble projet
├── QUICKSTART.md        # Démarrage rapide dev
├── CHANGELOG.md         # Historique versions
├── package.json
├── next.config.js
├── tsconfig.json
├── .env.local           # À créer (secrets)
└── validate-build.sh    # Validation sanity check
```

---

## Métriques Attendues (Post-Nettoyage)

- **Fichiers supprimés**: ~30 fichiers
- **Taille réduite**: -15 MB (docs + HTML)
- **Complexité réduite**: 60% moins de fichiers config
- **Temps onboarding dev**: 20 min → 5 min
- **Clarté vision**: 100% focus CESEDA

---

## Validation Post-Nettoyage

```bash
# 1. Vérifier build fonctionne
npm run build

# 2. Vérifier backend démarre
curl http://localhost:5000/api/health

# 3. Vérifier tests passent
npm test

# 4. Compter fichiers restants
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l
# Cible: < 200 fichiers (vs ~250 avant)
```

---

**Priorité**: 🔴 HAUTE
**Durée estimée**: 30 minutes
**Risques**: FAIBLE (backup créé)
**Impact**: Clarté, vitesse déploiement, focus produit

**Status**: ⏳ EN ATTENTE VALIDATION UTILISATEUR
