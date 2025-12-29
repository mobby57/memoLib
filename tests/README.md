# 🧪 Tests - IAPosteManager

## Structure

```
tests/
├── test_auth_api.py      # Tests authentification
├── test_contacts_api.py   # Tests API contacts
├── test_emails_api.py     # Tests API emails
├── conftest.py            # Configuration pytest
└── README.md              # Ce fichier
```

---

## 🚀 Exécuter les Tests

### Tous les tests
```bash
pytest tests/ -v
```

### Avec coverage
```bash
pytest tests/ -v --cov=src/backend --cov-report=html
```

### Tests spécifiques
```bash
pytest tests/test_contacts_api.py -v
pytest tests/test_auth_api.py::TestAuthAPI::test_login_success -v
```

---

## 📊 Coverage

**Objectif:** > 80%

**Générer rapport:**
```bash
pytest --cov=src/backend --cov-report=html
open htmlcov/index.html
```

---

## ✅ Tests Disponibles

### Authentication (6 tests)
- ✅ Register user
- ✅ Register duplicate email
- ✅ Login success
- ✅ Login invalid credentials
- ✅ Login inactive user
- ✅ Get current user

### Contacts (7 tests)
- ✅ Create contact
- ✅ Create contact unauthorized
- ✅ Get contacts
- ✅ Get contact by ID
- ✅ Update contact
- ✅ Delete contact
- ✅ Contact isolation

### Emails (5 tests)
- ✅ Send email
- ✅ Send email unauthorized
- ✅ Get email history
- ✅ Get email by ID
- ✅ Email isolation

**Total:** 18 tests

---

## 🔧 Configuration

### Variables d'environnement
```bash
TEST_DATABASE_URL=sqlite:///:memory:
```

### Base de données de test
- Utilise SQLite en mémoire
- Tables créées/détruites automatiquement
- Isolation complète entre tests

---

## 📝 Ajouter un Test

```python
def test_my_feature(client, db, test_user, auth_headers):
    """Test description"""
    response = client.post(
        "/api/endpoint",
        json={"key": "value"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["key"] == "value"
```

---

**🎯 Coverage actuel:** En cours de mesure

