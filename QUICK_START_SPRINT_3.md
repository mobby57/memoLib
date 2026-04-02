# 🚀 QUICK START - Sprint 3 Features

## Démarrage Rapide

```powershell
# 1. Lancer l'API
dotnet run

# 2. Accéder
http://localhost:5078/api
```

## Test Rapide des 3 Nouvelles Fonctionnalités

### 1. Templates Avancés

```http
POST http://localhost:5078/api/templates/advanced
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Lettre type",
  "type": "LETTER",
  "content": "Bonjour {{clientName}},\n\nVotre dossier {{caseTitle}} est {{caseStatus}}.",
  "variables": [
    {"name": "clientName", "type": "text", "isRequired": true},
    {"name": "caseTitle", "type": "text", "isRequired": true},
    {"name": "caseStatus", "type": "text", "isRequired": true}
  ]
}
```

### 2. Signatures Électroniques

```http
POST http://localhost:5078/api/signatures
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "documentId": "guid",
  "caseId": "guid",
  "documentName": "Contrat.pdf",
  "documentUrl": "https://example.com/doc.pdf",
  "signers": [
    {
      "signerName": "Client",
      "signerEmail": "client@example.com"
    }
  ]
}
```

### 3. Formulaires Dynamiques

```http
POST http://localhost:5078/api/forms
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Contact",
  "isPublic": true,
  "fields": [
    {"name": "nom", "label": "Nom", "type": "TEXT", "isRequired": true, "order": 1},
    {"name": "email", "label": "Email", "type": "EMAIL", "isRequired": true, "order": 2},
    {"name": "message", "label": "Message", "type": "TEXTAREA", "isRequired": true, "order": 3}
  ]
}
```

## Endpoints Disponibles

### Templates (7)
- GET/POST/PUT/DELETE `/api/templates/advanced`
- POST `/api/templates/advanced/{id}/render`
- POST `/api/templates/advanced/{id}/render-for-case/{caseId}`

### Signatures (6)
- GET/POST `/api/signatures`
- GET `/api/signatures/case/{caseId}`
- GET `/api/signatures/verify/{token}` (public)
- POST `/api/signatures/sign/{token}` (public)

### Formulaires (8)
- GET/POST/PUT/DELETE `/api/forms`
- GET `/api/forms/public/{url}` (public)
- POST `/api/forms/{id}/submit` (public)
- GET `/api/forms/{id}/submissions`

## Prochaines Étapes

1. **Tester les APIs** - Utiliser test-sprint-3.http
2. **Créer l'interface** - Templates, signatures, formulaires
3. **Déployer** - Production ready!

**🎉 10/10 FONCTIONNALITÉS COMPLÈTES!**
