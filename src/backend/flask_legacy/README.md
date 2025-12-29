# Flask Legacy Files

Ce dossier contient les anciens fichiers Flask qui ont été remplacés par FastAPI.

## Fichiers

### Backend Principal
- `app.py` - Ancienne application Flask principale (5765 lignes)
- `api.py` - API Flask alternative
- `api_endpoints.py` - Endpoints Flask
- `missing_endpoints.py` - Endpoints manquants Flask
- `enterprise_features.py` - Features entreprise Flask
- `security_improvements.py` - Améliorations sécurité Flask

### Routes Flask (Blueprints)
- `legal_routes.py` - Routes légales Flask
- `smtp_routes.py` - Routes SMTP Flask
- `realtime.py` - Routes temps réel Flask
- `vector_stores.py` - Vector stores Flask
- `batch.py` - Batch API Flask
- `webhooks.py` - Webhooks Flask

## Migration

Ces fichiers ont été migrés vers FastAPI dans :
- `src/backend/main_fastapi.py` - Point d'entrée principal FastAPI
- `src/backend/routes/auth.py` - Routes authentification FastAPI
- `src/backend/routes/document_analysis.py` - Routes analyse documents FastAPI

## Suppression

Ces fichiers peuvent être supprimés après validation complète de la migration.

**Date de migration:** 2025-01-XX  
**Status:** ⏳ En attente de validation

