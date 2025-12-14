# 🗑️ ANALYSE POUR SUPPRESSION - Dossiers Inutiles

## 🔴 **DOSSIERS À SUPPRIMER** (2.8GB libérés)

### 📦 **Archives Massives** (2GB)
```
archive/                           # Toutes les anciennes versions
├── v1_html_static_20251213/      # Version HTML obsolète
├── v2_minimal_backend_20251213/  # Backend minimal archivé
├── v4_pro_architecture_20251213/ # Architecture pro archivée
├── v5_microservices_experimental/ # Microservices expérimental
└── *.py_20251213                 # Fichiers datés
```

### 🔄 **Doublons Frontend** (500MB)
```
frontend-react/                   # Doublon de src/frontend/
react-app/                       # Version minimale redondante
mobile-app/                      # Vide/incomplet
```

### 🗂️ **Projets Séparés** (300MB)
```
assistant_demarches/             # Projet différent
chronology/                      # Librairie externe
backup/                         # Sauvegardes obsolètes
```

### 💾 **Sessions Temporaires** (200MB)
```
data/flask_session/             # 200+ fichiers de sessions
flask_session/                  # Doublon sessions
```

### 🧪 **Tests Redondants** (100MB)
```
*/test-results/                 # Résultats tests multiples
*/playwright-report/            # Rapports Playwright
```

### 📁 **Dossiers Vides/Inutiles**
```
config/                         # Vide
migrations/                     # Vide
gui/                           # Interface obsolète
k8s/                           # Kubernetes non utilisé
landing/                       # Page d'accueil statique
monitoring/                    # Doublon de src/monitoring/
```

---

## 🟢 **DOSSIERS À CONSERVER** (200MB)

### ✅ **Core Fonctionnel**
```
src/                           # Code principal
├── web/app.py                # App Flask
├── core/                     # Config, crypto, DB
├── services/                 # Email, IA, vocal
├── accessibility/            # Fonctionnalités universelles
├── security/                 # Audit, 2FA
├── analytics/                # Dashboard
├── api/                      # REST endpoints
└── frontend/                 # Interface React
```

### ✅ **Assets Nécessaires**
```
templates/                    # Templates HTML/JSON
static/                      # CSS, JS, images
data/                        # Données chiffrées (nettoyer sessions)
docs/                        # Documentation
tests/                       # Tests unitaires/intégration
```

### ✅ **Configuration**
```
docker-compose.yml           # Orchestration principale
requirements.txt             # Dépendances Python
package.json                 # Dépendances Node
.env.example                 # Template configuration
README.md                    # Documentation principale
```

---

## 📊 **IMPACT SUPPRESSION**

| Catégorie | Avant | Après | Gain |
|-----------|-------|-------|------|
| **Archives** | 2.0GB | 0MB | 2.0GB |
| **Doublons** | 500MB | 0MB | 500MB |
| **Sessions** | 200MB | 10MB | 190MB |
| **Tests** | 100MB | 20MB | 80MB |
| **Vides** | 50MB | 0MB | 50MB |
| **TOTAL** | **2.85GB** | **200MB** | **2.65GB** |

**Gain d'espace : 93%**

---

## 🛠️ **ACTIONS RECOMMANDÉES**

### 1. **Sauvegarde Sélective**
Avant suppression, sauvegarder uniquement :
- `src/` complet
- `templates/` et `static/`
- `docs/` essentiels
- Configuration (`.env.example`, `requirements.txt`)

### 2. **Nettoyage Sessions**
```bash
# Garder seulement les 10 dernières sessions
cd data/flask_session/
ls -t | tail -n +11 | xargs rm -f
```

### 3. **Consolidation Documentation**
Fusionner les guides éparpillés dans `docs/guides/`

### 4. **Optimisation Structure**
Réorganiser selon `STRUCTURE_FINALE_OPTIMISEE.md`