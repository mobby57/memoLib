# 🧪 Guide de Test Utilisateur - IAPosteManager

## 1. Démarrage de l'application

```bash
# Terminal 1 - Backend
cd src/backend
python app.py

# Terminal 2 - Frontend (si disponible)
cd src/frontend
npm run dev
```

## 2. Accès URLs

- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:3001 (si React démarré)
- **API Health:** http://localhost:5000/api/health

## 3. Tests API avec curl/Postman

### 🔐 Authentification
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"motdepasse123"}'
```

### 📧 Envoi d'email
```bash
# Configuration Gmail (après login)
curl -X POST http://localhost:5000/api/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email":"votre@gmail.com",
    "app_password":"votre_mot_de_passe_app",
    "openai_key":"sk-votre_cle_openai"
  }'

# Envoyer un email
curl -X POST http://localhost:5000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipient":"test@example.com",
    "subject":"Test IAPosteManager",
    "body":"Ceci est un test"
  }'
```

### 🤖 Génération IA
```bash
# Générer un email avec IA
curl -X POST http://localhost:5000/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{
    "context":"Demande de rendez-vous médecin",
    "tone":"professionnel"
  }'
```

### ♿ Accessibilité
```bash
# Paramètres d'accessibilité
curl http://localhost:5000/api/accessibility/settings

# Activer TTS
curl -X POST http://localhost:5000/api/accessibility/settings \
  -H "Content-Type: application/json" \
  -d '{"toggle_tts":true}'
```

## 4. Tests Frontend (si React disponible)

1. **Page de connexion:** http://localhost:3001/login
2. **Dashboard:** http://localhost:3001/dashboard
3. **Composer email:** http://localhost:3001/compose
4. **Accessibilité:** http://localhost:3001/accessibility

## 5. Tests d'accessibilité

### Raccourcis clavier
- `Tab` - Navigation
- `Ctrl+H` - Haut contraste
- `Ctrl+T` - TTS
- `Escape` - Fermer modals

### Profils d'accessibilité
```bash
# Profil aveugle
curl -X POST http://localhost:5000/api/accessibility/profile \
  -H "Content-Type: application/json" \
  -d '{"needs":["blind"]}'

# Profil sourd
curl -X POST http://localhost:5000/api/accessibility/profile \
  -H "Content-Type: application/json" \
  -d '{"needs":["deaf"]}'
```

## 6. Tests de performance

```bash
# Statistiques
curl http://localhost:5000/api/dashboard/stats

# Historique emails
curl http://localhost:5000/api/email-history?limit=10

# Templates
curl http://localhost:5000/api/templates
```

## 7. Scénarios de test complets

### Scénario 1: Nouvel utilisateur
1. Accéder à http://localhost:5000
2. Créer mot de passe maître
3. Configurer Gmail
4. Envoyer premier email

### Scénario 2: Utilisateur aveugle
1. Activer profil aveugle
2. Utiliser TTS
3. Navigation clavier
4. Dicter email avec IA

### Scénario 3: Envoi en masse
1. Créer template
2. Importer contacts
3. Envoi batch
4. Vérifier statistiques

## 8. Vérifications importantes

✅ **Backend fonctionne:** http://localhost:5000/api/health
✅ **Base de données:** Vérifier src/backend/data/unified.db
✅ **Logs:** Vérifier src/backend/logs/app.log
✅ **Sessions:** Vérifier src/backend/flask_session/

## 9. Dépannage rapide

```bash
# Vérifier les processus
ps aux | grep python

# Vérifier les ports
netstat -tulpn | grep :5000

# Logs en temps réel
tail -f src/backend/logs/app.log
```