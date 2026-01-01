# Guide Complet des Tests Unitaires
## iaPostemanage - Infrastructure de Test

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation](#installation)
3. [Exécution des tests](#exécution-des-tests)
4. [Structure des tests](#structure-des-tests)
5. [Couverture de code](#couverture-de-code)
6. [Écrire de nouveaux tests](#écrire-de-nouveaux-tests)
7. [CI/CD Integration](#cicd-integration)

---

## 🎯 Vue d'ensemble

### Tests Backend (Python/Flask)

**Framework:** pytest + pytest-cov + pytest-mock
**Couverture cible:** 80%+
**Localisation:** `core/backend/tests/`

#### Modules testés :

- ✅ **database.py** - Initialisation DB, modèles
- ✅ **db_helpers.py** - Fonctions CRUD (9 fonctions)
- ✅ **audit_utils.py** - Audit trail RGPD (4 fonctions)
- ✅ **app.py** - Routes API REST
- ✅ **models_extended.py** - Modèles étendus
- ✅ **routes/documents.py** - Upload/analyse documents
- ✅ **validate_env.py** - Validation configuration

#### Types de tests :

```python
# Tests unitaires
@pytest.mark.unit
def test_create_dossier(): ...

# Tests d'intégration
@pytest.mark.integration  
def test_full_workflow(): ...

# Tests API
@pytest.mark.api
def test_get_dossiers_endpoint(): ...

# Tests audit
@pytest.mark.audit
def test_log_audit_creates_entry(): ...
```

### Tests Frontend (TypeScript/Next.js)

**Framework:** Jest + Testing Library
**Couverture cible:** 70%+
**Localisation:** `nextjs-app/__tests__/`

#### Composants testés :

- ⚠️ **En cours d'implémentation**
- Components React
- Hooks personnalisés
- Utilitaires
- API calls

---

## 🚀 Installation

### Backend

```powershell
cd core/backend

# Installer dépendances de test
pip install pytest pytest-cov pytest-mock pytest-flask

# Vérifier installation
pytest --version
```

### Frontend

```powershell
cd nextjs-app

# Installer dépendances de test
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Vérifier installation
npm test -- --version
```

---

## 🧪 Exécution des tests

### Script PowerShell Unifié (Recommandé)

```powershell
# Tous les tests avec coverage
.\run_tests.ps1

# Backend uniquement
.\run_tests.ps1 -Backend

# Frontend uniquement
.\run_tests.ps1 -Frontend

# Mode watch (développement)
.\run_tests.ps1 -Watch

# Verbeux
.\run_tests.ps1 -Verbose

# Test spécifique
.\run_tests.ps1 -Backend -TestPath "tests/test_db_helpers.py::test_create_dossier"
```

### Backend - Commandes manuelles

```powershell
cd core/backend

# Tous les tests
pytest tests/ -v

# Avec coverage
pytest tests/ -v --cov=. --cov-report=html --cov-report=term-missing

# Test spécifique
pytest tests/test_complete.py::TestDatabaseHelpers::test_create_dossier -v

# Avec markers
pytest -m unit  # Tests unitaires uniquement
pytest -m integration  # Tests d'intégration
pytest -m "not slow"  # Exclure tests lents

# Mode watch (rerun automatique)
pytest-watch tests/

# Parallélisation (plus rapide)
pytest tests/ -n auto  # Requiert pytest-xdist
```

### Frontend - Commandes manuelles

```powershell
cd nextjs-app

# Tous les tests
npm test

# Avec coverage
npm test -- --coverage

# Mode watch
npm test -- --watch

# Test spécifique
npm test -- ComponentName.test.tsx

# Update snapshots
npm test -- -u
```

---

## 📁 Structure des tests

### Backend

```
core/backend/
├── tests/
│   ├── conftest.py              # Fixtures partagées
│   ├── test_complete.py         # Tests principaux
│   ├── test_db_helpers.py       # Tests CRUD
│   ├── test_audit_utils.py      # Tests audit
│   ├── test_documents.py        # Tests documents
│   ├── test_api_routes.py       # Tests API
│   └── __pycache__/
├── pytest.ini                   # Configuration pytest
├── htmlcov/                     # Rapports coverage HTML
└── coverage.json                # Données coverage
```

### Fixtures disponibles (conftest.py)

```python
# Application et client
@pytest.fixture
def app(): ...           # Application Flask de test

@pytest.fixture  
def client(): ...        # Client HTTP

# Authentification
@pytest.fixture
def test_user(): ...     # Utilisateur standard

@pytest.fixture
def admin_user(): ...    # Administrateur

@pytest.fixture
def auth_headers(): ...  # Headers JWT valides

# Données de test
@pytest.fixture
def test_client_model(): ...  # Client
@pytest.fixture
def test_dossier(): ...       # Dossier
@pytest.fixture
def test_facture(): ...       # Facture
@pytest.fixture
def test_document(): ...      # Document

# Fichiers temporaires
@pytest.fixture
def mock_pdf_file(): ...      # PDF de test
@pytest.fixture
def mock_image_file(): ...    # Image de test

# Mocks externes
@pytest.fixture
def mock_ollama_response(): ...  # Réponse IA
@pytest.fixture
def mock_smtp_server(): ...      # Serveur email
```

---

## 📊 Couverture de code

### Objectifs

| Module | Couverture cible | Statut actuel |
|--------|------------------|---------------|
| db_helpers.py | 90%+ | ⚠️ En cours |
| audit_utils.py | 95%+ | ⚠️ En cours |
| routes/documents.py | 80%+ | ⚠️ En cours |
| app.py | 75%+ | ⚠️ En cours |
| **Global** | **80%+** | ⚠️ En cours |

### Visualiser la couverture

```powershell
# Backend
cd core/backend
pytest tests/ --cov=. --cov-report=html
start htmlcov/index.html  # Ouvre dans navigateur

# Frontend  
cd nextjs-app
npm test -- --coverage
start coverage/lcov-report/index.html
```

### Interpréter les rapports

- **Vert (>80%)** : Excellente couverture ✅
- **Jaune (60-80%)** : Couverture acceptable ⚠️
- **Rouge (<60%)** : Couverture insuffisante ❌

### Exclure du coverage

```ini
# pytest.ini
[coverage:run]
omit =
    tests/*
    venv/*
    */migrations/*
    conftest.py
```

---

## ✍️ Écrire de nouveaux tests

### Template test unitaire (Backend)

```python
import pytest
from unittest.mock import Mock, patch

class TestMyModule:
    """Tests pour my_module.py"""
    
    def test_my_function_success(self, app, test_user):
        """Test cas nominal"""
        with app.app_context():
            # Arrange
            data = {'key': 'value'}
            
            # Act
            result = my_function(data)
            
            # Assert
            assert result is not None
            assert result.key == 'value'
    
    def test_my_function_error(self, app):
        """Test cas d'erreur"""
        with app.app_context():
            with pytest.raises(ValueError):
                my_function(None)
    
    @patch('my_module.external_service')
    def test_my_function_with_mock(self, mock_service, app):
        """Test avec mock service externe"""
        # Configure mock
        mock_service.return_value = {'status': 'ok'}
        
        # Test
        result = my_function()
        
        # Vérifications
        assert result['status'] == 'ok'
        mock_service.assert_called_once()
```

### Template test API (Backend)

```python
class TestMyAPI:
    """Tests pour endpoint /api/my-route"""
    
    def test_get_endpoint_success(self, client, auth_headers):
        """Test GET avec authentification"""
        response = client.get('/api/my-route', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
    
    def test_post_endpoint_validation(self, client, auth_headers):
        """Test POST avec validation"""
        invalid_data = {'missing': 'required_field'}
        
        response = client.post(
            '/api/my-route',
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_unauthorized_access(self, client):
        """Test accès sans authentification"""
        response = client.get('/api/my-route')
        assert response.status_code == 401
```

### Template test Frontend (React)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    render(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
  
  it('calls API on submit', async () => {
    const mockFetch = jest.fn(() => 
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );
    global.fetch = mockFetch;
    
    render(<MyComponent />);
    
    fireEvent.submit(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/endpoint', expect.any(Object));
    });
  });
});
```

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd core/backend
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          cd core/backend
          pytest tests/ --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./core/backend/coverage.xml
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd nextjs-app
          npm ci
      
      - name: Run tests
        run: |
          cd nextjs-app
          npm test -- --coverage
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/sh

echo "🧪 Running tests before commit..."

# Backend tests
cd core/backend
pytest tests/ -q || exit 1

# Frontend tests
cd ../../nextjs-app
npm test -- --watchAll=false || exit 1

echo "✅ All tests passed!"
exit 0
```

---

## 🐛 Troubleshooting

### Problème: Import errors

```powershell
# Solution: Ajouter PYTHONPATH
$env:PYTHONPATH = "c:\Users\moros\Desktop\iaPostemanage\core\backend"
pytest tests/
```

### Problème: Database locked

```python
# Solution: Utiliser SQLite en mémoire
@pytest.fixture
def app():
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
```

### Problème: Tests lents

```powershell
# Solution: Parallélisation
pip install pytest-xdist
pytest tests/ -n auto
```

### Problème: Coverage incomplète

```powershell
# Identifier fichiers non couverts
pytest --cov=. --cov-report=term-missing

# Focus sur un module
pytest tests/test_db_helpers.py --cov=db_helpers --cov-report=html
```

---

## 📈 Métriques de qualité

### Commandes utiles

```powershell
# Compter les tests
pytest --collect-only | Select-String "test session starts"

# Tests les plus lents
pytest --durations=10

# Tests qui échouent en premier
pytest -x  # Stop au premier échec
pytest --maxfail=3  # Stop après 3 échecs

# Rapport JUnit (pour CI)
pytest --junitxml=test-results.xml
```

---

## 📚 Ressources

### Documentation

- [Pytest](https://docs.pytest.org/)
- [Testing Library](https://testing-library.com/)
- [Jest](https://jestjs.io/)
- [Coverage.py](https://coverage.readthedocs.io/)

### Best Practices

1. **AAA Pattern** : Arrange → Act → Assert
2. **Test isolation** : Chaque test indépendant
3. **Noms descriptifs** : `test_create_dossier_with_missing_fields`
4. **Mock services externes** : Ne pas dépendre d'APIs
5. **Tests rapides** : <1s par test unitaire

---

## 🎓 Exemples complets

### Test CRUD complet

```python
class TestDossierCRUD:
    def test_create(self, app, test_user):
        """CREATE"""
        dossier = create_dossier({...}, test_user.id)
        assert dossier.id is not None
    
    def test_read(self, app, test_dossier):
        """READ"""
        dossiers = get_all_dossiers_with_creator()
        assert len(dossiers) >= 1
    
    def test_update(self, app, test_dossier):
        """UPDATE"""
        updated = update_dossier(test_dossier.id, {'statut': 'termine'})
        assert updated.statut == 'termine'
    
    def test_delete(self, app, test_dossier):
        """DELETE"""
        result = delete_dossier(test_dossier.id)
        assert result is True
```

### Test avec mock Ollama

```python
@patch('routes.documents.requests.post')
def test_verify_document_ai(mock_post, app, mock_pdf_file):
    """Test vérification IA"""
    # Mock réponse Ollama
    mock_post.return_value.json.return_value = {
        'response': 'Document valide: passeport français'
    }
    
    # Test
    result = verify_document_ai(mock_pdf_file, 'passport')
    
    # Vérifications
    assert result['verified'] is True
    assert 'passeport' in result['details'].lower()
    mock_post.assert_called_once()
```

---

**Dernière mise à jour :** 22 décembre 2024  
**Version :** 1.0.0  
**Auteur :** iaPostemanage Team
