# 🛠️ Guide de Développement - SecureVault

## 🚀 Démarrage Rapide

### Installation
```bash
git clone https://github.com/user/securevault
cd securevault
make dev-setup
```

### Lancement
```bash
# Backend + Frontend
make dev-full

# Backend seul
make run

# Tests
make test-all
```

## 📁 Structure Développement

```
src/
├── core/           # Services fondamentaux
├── services/       # Services métier
├── web/           # Routes Flask
├── monitoring/    # Observabilité
└── security/      # Sécurité

frontend/
├── src/pages/     # Pages React
├── src/contexts/  # État global
└── src/components/ # Composants

tests/
├── unit/          # Tests unitaires
├── integration/   # Tests API
└── e2e/          # Tests Selenium
```

## 🔧 Workflow Développement

### 1. Nouvelle Fonctionnalité
```bash
# Créer branche
git checkout -b feature/nouvelle-fonction

# Développer avec tests
make test-watch

# Valider qualité
make lint
make security
```

### 2. Services Core
```python
# src/core/nouveau_service.py
class NouveauService:
    def __init__(self):
        pass
    
    def methode_principale(self):
        return True

# Ajouter dans app.py
nouveau_service = NouveauService()
```

### 3. Routes API
```python
@app.route('/api/nouvelle-route', methods=['POST'])
@rate_limiter.limit(max_requests=10)
def nouvelle_route():
    if not session_manager.validate_session():
        return jsonify({'error': 'Non authentifié'}), 401
    
    data = request.get_json()
    # Logique métier
    return jsonify({'success': True})
```

### 4. Frontend React
```typescript
// frontend/src/pages/NouvellePage.tsx
import React from 'react';
import { Container, Typography } from '@mui/material';

const NouvellePage: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4">Nouvelle Page</Typography>
    </Container>
  );
};

export default NouvellePage;
```

## 🧪 Tests

### Tests Unitaires
```python
# tests/unit/test_nouveau_service.py
def test_nouveau_service():
    service = NouveauService()
    result = service.methode_principale()
    assert result == True
```

### Tests API
```python
# tests/integration/test_api.py
def test_nouvelle_route(authenticated_client):
    response = authenticated_client.post('/api/nouvelle-route')
    assert response.status_code == 200
```

### Tests E2E
```python
# tests/e2e/test_nouvelle_page.py
def test_nouvelle_page(driver):
    driver.get('http://localhost:5000/nouvelle-page')
    assert 'Nouvelle Page' in driver.page_source
```

## 📊 Monitoring Développement

### Métriques Locales
```bash
# Health check
curl http://localhost:5000/api/health/detailed

# Métriques
curl http://localhost:5000/api/metrics

# Logs temps réel
make logs
```

### Debug
```python
# Logging debug
import logging
logger = logging.getLogger(__name__)
logger.debug("Message debug")

# Breakpoints
import pdb; pdb.set_trace()
```

## 🔐 Sécurité Développement

### Validation Input
```python
# Toujours valider
data = validator.sanitize_input(user_input)
if not validator.validate_email(email):
    return error_response()
```

### Gestion Erreurs
```python
try:
    # Code risqué
    result = operation_dangereuse()
except Exception as e:
    logger.error(f"Erreur: {e}")
    notification_service.notify_system_error('module', e)
    return error_response()
```

## 🚀 Déploiement

### Local
```bash
make deploy-local
```

### Staging
```bash
make deploy-staging
```

### Production
```bash
make deploy-prod
```

## 📋 Checklist PR

- [ ] Tests passent (`make test-all`)
- [ ] Qualité code (`make lint`)
- [ ] Sécurité (`make security`)
- [ ] Documentation mise à jour
- [ ] Pas de secrets hardcodés
- [ ] Performance acceptable