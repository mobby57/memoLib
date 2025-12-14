# API REST v1 - Documentation

## Authentification

### Obtenir un token
```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "api_key": "votre-api-key"
}
```

**Reponse:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Endpoints

### Envoyer un email
```http
POST /api/v1/emails/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "destinataire@example.com",
  "subject": "Objet de l'email",
  "body": "Corps de l'email",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"]
}
```

### Generer un email avec IA
```http
POST /api/v1/emails/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "context": "Demande de reunion pour discuter du projet",
  "tone": "professionnel"
}
```

**Reponse:**
```json
{
  "success": true,
  "email": {
    "subject": "Demande de reunion",
    "body": "Bonjour,\n\nJe souhaiterais..."
  }
}
```

### Lister les workflows
```http
GET /api/v1/workflows
Authorization: Bearer {token}
```

### Recuperer un workflow
```http
GET /api/v1/workflows/{workflow_id}
Authorization: Bearer {token}
```

## Codes d'erreur

- `401` - Token manquant ou invalide
- `404` - Ressource non trouvee
- `500` - Erreur serveur

## Limites

- Rate limit: 100 requetes/minute
- Token expire apres 24h
- Taille max body: 10MB
