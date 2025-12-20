# 🚀 Déploiement sur Render.com - iaPosteManager v3.6

## 📋 Récapitulatif des Nouvelles Fonctionnalités

### ✅ Fonctionnalités Déployées

1. **Webhooks OpenAI** (`/api/webhooks/*`)
   - 15+ types d'événements (response, batch, fine-tuning, eval, realtime)
   - Vérification signature HMAC-SHA256
   - Dashboard en temps réel (`/webhooks.html`)

2. **Batch API** (`/api/batch/*`)
   - Économies de 50% sur les coûts
   - Upload/Download JSONL
   - Interface de gestion (`/batch-api.html`)

3. **Vector Stores** (`/api/vector-stores/*`)
   - Recherche sémantique
   - File Batches (max 500 fichiers)
   - Chunking auto/static
   - Interface complète (`/vector-stores.html`)

4. **Realtime API** (`/api/realtime/*`)
   - Communication WebRTC temps réel
   - Support Audio/Vidéo/Texte
   - 3 voix: alloy, echo, shimmer
   - Demo WebRTC (`/realtime-api.html`)

## 🚀 Déploiement Automatique

### Option 1: Script PowerShell (Recommandé)

```powershell
.\DEPLOY_PRODUCTION.ps1
```

Ce script effectue automatiquement:
1. ✅ Vérification Git
2. ✅ Affichage des modifications
3. ✅ Commit avec message personnalisé
4. ✅ Push vers GitHub
5. ✅ Déclenchement du déploiement Render
6. ✅ Affichage des URLs et endpoints

### Option 2: Commandes Manuelles

```bash
# 1. Ajouter les modifications
git add .

# 2. Commit
git commit -m "Production: OpenAI Realtime API + Vector Stores + Batch API + Webhooks"

# 3. Push vers GitHub
git push -u origin main

# Le déploiement sur Render démarre automatiquement
```

## 🔧 Configuration Render.com

### Variables d'Environnement Requises

Ajoutez dans le Dashboard Render (Settings > Environment):

```bash
# Clé API OpenAI (REQUIS pour toutes les fonctionnalités)
OPENAI_API_KEY=sk-...

# Secret Webhook (REQUIS pour webhooks)
OPENAI_WEBHOOK_SECRET=whsec_...

# Configuration Flask
FLASK_ENV=production
SECRET_KEY=<généré automatiquement>
PORT=10000

# Optionnel
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
```

### Fichiers de Configuration

**render.yaml** - Configuration du service
```yaml
services:
  - type: web
    name: iapostemanager
    runtime: python
    plan: free
    branch: main
    buildCommand: bash build.sh
    startCommand: bash start.sh
    healthCheckPath: /health
```

**build.sh** - Script de construction
```bash
#!/bin/bash
pip install -r requirements.txt
cd frontend-react
npm install
npm run build
cd ..
mkdir -p src/backend/static
cp -r frontend-react/dist/* src/backend/static/
```

**start.sh** - Script de démarrage
```bash
#!/bin/bash
export PORT=${PORT:-10000}
cd src/backend
exec python app.py
```

## 📡 URLs de Production

### Backend API
```
https://iapostemanager.onrender.com
```

### Nouveaux Endpoints

#### Webhooks
```
POST /api/webhooks/openai - Recevoir webhooks
GET  /api/webhooks/events - Liste événements
GET  /api/webhooks/stats - Statistiques
```

#### Batch API
```
POST /api/batch/create - Créer un batch
GET  /api/batch/{id} - Détails batch
POST /api/batch/{id}/cancel - Annuler
GET  /api/batch/stats - Statistiques
```

#### Vector Stores
```
POST /api/vector-stores/ - Créer vector store
GET  /api/vector-stores/<id> - Récupérer
POST /api/vector-stores/<id>/file-batches - Ajouter fichiers
GET  /api/vector-stores/stats - Statistiques
```

#### Realtime API
```
POST   /api/realtime/calls - Créer appel WebRTC
GET    /api/realtime/calls/<id> - Détails appel
DELETE /api/realtime/calls/<id> - Terminer appel
GET    /api/realtime/stats - Statistiques
```

### Interfaces Web

```
https://iapostemanager.onrender.com/webhooks.html
https://iapostemanager.onrender.com/batch-api.html
https://iapostemanager.onrender.com/vector-stores.html
https://iapostemanager.onrender.com/realtime-api.html
```

## 🧪 Tests Post-Déploiement

### 1. Tester le Health Check
```bash
curl https://iapostemanager.onrender.com/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "version": "3.6",
  "features": ["webhooks", "batch", "vector_stores", "realtime"]
}
```

### 2. Tester Webhooks
```bash
curl -X GET https://iapostemanager.onrender.com/api/webhooks/stats
```

### 3. Tester Batch API
```bash
curl -X GET https://iapostemanager.onrender.com/api/batch/stats
```

### 4. Tester Vector Stores
```bash
curl -X GET https://iapostemanager.onrender.com/api/vector-stores/stats
```

### 5. Tester Realtime API
```bash
curl -X GET https://iapostemanager.onrender.com/api/realtime/stats
```

## 📊 Monitoring

### Logs Render
```
Dashboard > Logs
```

Vérifier:
- ✅ `[INIT] Webhooks routes registered`
- ✅ `[INIT] Batch API routes registered`
- ✅ `[INIT] Vector Stores routes registered`
- ✅ `[INIT] Realtime API routes registered`

### Métriques Disponibles
- Requêtes/seconde
- Temps de réponse
- Taux d'erreur
- Utilisation mémoire

## 🔐 Sécurité

### Configuration Webhooks OpenAI

1. **Créer le webhook secret sur OpenAI**:
   ```
   https://platform.openai.com/webhooks
   ```

2. **URL du webhook**:
   ```
   https://iapostemanager.onrender.com/api/webhooks/openai
   ```

3. **Ajouter le secret dans Render**:
   ```
   OPENAI_WEBHOOK_SECRET=whsec_...
   ```

### Rate Limiting
- 20 requêtes/minute par défaut
- Configurable via `RATE_LIMIT_ENABLED`

## 📦 Bases de Données

### SQLite (Inclus)
Fichiers créés automatiquement:
- `data/webhooks.db` - Événements webhooks
- `data/batches.db` - Batches API
- `data/vector_stores.db` - Vector stores
- `data/realtime_calls.db` - Appels Realtime

### PostgreSQL (Optionnel)
Décommenter dans `render.yaml` pour utiliser PostgreSQL.

## 🐛 Dépannage

### Build Échoue
```bash
# Vérifier requirements.txt
pip install -r requirements.txt --dry-run

# Vérifier build.sh
bash -n build.sh
```

### Service Ne Démarre Pas
```bash
# Vérifier start.sh
bash -n start.sh

# Tester localement
PORT=10000 bash start.sh
```

### Erreur 404 sur les Nouveaux Endpoints
```
# Vérifier que les routes sont bien enregistrées
curl https://iapostemanager.onrender.com/api/realtime/health
```

### Webhooks Ne Fonctionnent Pas
1. Vérifier `OPENAI_WEBHOOK_SECRET` dans Render
2. Vérifier les logs pour erreurs de signature
3. Tester avec un événement de test OpenAI

## 📞 Support

### Documentation
- Webhooks: `/WEBHOOKS_OPENAI.md`
- Batch API: `/BATCH_API_GUIDE.md`
- Vector Stores: `/VECTOR_STORES_FILE_BATCHES_GUIDE.md`
- Realtime: `/REALTIME_API_GUIDE.md`

### Liens Utiles
- Dashboard Render: https://dashboard.render.com
- Repository GitHub: https://github.com/mooby865/iapostemanager
- OpenAI Platform: https://platform.openai.com

## 🎯 Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] `OPENAI_API_KEY` ajoutée
- [ ] `OPENAI_WEBHOOK_SECRET` ajoutée (si webhooks utilisés)
- [ ] Code poussé sur GitHub
- [ ] Build Render réussi
- [ ] Health check répond
- [ ] Tous les endpoints testés
- [ ] Interfaces web accessibles
- [ ] Logs vérifiés
- [ ] Webhooks configurés (optionnel)

---

**Version**: 3.6  
**Date**: 21/12/2025  
**Auteur**: iaPosteManager Team  
**Statut**: ✅ Production Ready
