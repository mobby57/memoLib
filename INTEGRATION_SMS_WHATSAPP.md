# 📱 INTEGRATION SMS & WHATSAPP - MemoLib

## 🎯 VALEUR AJOUTEE

**AVANT MemoLib :**
- ❌ SMS perdus dans le téléphone
- ❌ WhatsApp non archivé
- ❌ Pas de traçabilité
- ❌ Recherche impossible
- ❌ Pas de dossier automatique

**AVEC MemoLib :**
- ✅ Tous les messages centralisés
- ✅ Dossiers créés automatiquement
- ✅ Recherche IA sur SMS/WhatsApp
- ✅ Réponses depuis la plateforme
- ✅ Audit complet
- ✅ Analytics multi-canaux

## 💰 IMPACT COMMERCIAL

**Nouveau positionnement :**
- 📧 Email + 📱 SMS + 💬 WhatsApp = **Solution omnicanale**
- **Prix justifié** : 49€/mois → 79€/mois
- **Différenciation** : Seule solution juridique omnicanale
- **Valeur perçue** : +200%

## 🚀 CONFIGURATION RAPIDE

### 1. Créer un compte Twilio

1. Allez sur https://www.twilio.com/try-twilio
2. Créez un compte gratuit (essai avec 15$ de crédit)
3. Notez vos identifiants :
   - **Account SID** : ACxxxxxxxxxxxxxxxxx
   - **Auth Token** : xxxxxxxxxxxxxxxxx

### 2. Obtenir un numéro de téléphone

**Pour SMS :**
```
1. Console Twilio → Phone Numbers → Buy a Number
2. Choisir un numéro français (+33)
3. Activer "SMS" et "Voice"
4. Coût : ~1€/mois
```

**Pour WhatsApp :**
```
1. Console Twilio → Messaging → Try WhatsApp
2. Utiliser le sandbox WhatsApp (gratuit pour tests)
3. Numéro sandbox : +1 415 523 8886
4. Envoyer "join <code>" depuis WhatsApp
```

### 3. Configurer MemoLib

Ajoutez dans `appsettings.json` :

```json
{
  "Twilio": {
    "AccountSid": "ACxxxxxxxxxxxxxxxxx",
      "ApiKeySid": "SKxxxxxxxxxxxxxxxxx",
      "ApiKeySecret": "votre-api-key-secret",
      "AuthToken": "votre-auth-token (fallback/dev)",
    "PhoneNumber": "+33612345678",
    "WhatsAppNumber": "+14155238886"
  }
}
```

**OU** via User Secrets (recommandé) :

```powershell
dotnet user-secrets set "Twilio:AccountSid" "ACxxxxxxxxxxxxxxxxx"
dotnet user-secrets set "Twilio:ApiKeySid" "SKxxxxxxxxxxxxxxxxx"
dotnet user-secrets set "Twilio:ApiKeySecret" "votre-api-key-secret"
# Optionnel (fallback/dev pour compatibilité):
dotnet user-secrets set "Twilio:AuthToken" "votre-auth-token"
dotnet user-secrets set "Twilio:PhoneNumber" "+33612345678"
dotnet user-secrets set "Twilio:WhatsAppNumber" "+14155238886"
```

### 4. Configurer les Webhooks Twilio

**Pour SMS :**
```
1. Console Twilio → Phone Numbers → Manage → Active Numbers
2. Cliquer sur votre numéro
3. Messaging Configuration :
   - A MESSAGE COMES IN: Webhook
   - URL: https://votre-domaine.com/api/messaging/sms/webhook
   - HTTP POST
```

**Pour WhatsApp :**
```
1. Console Twilio → Messaging → Settings → WhatsApp Sandbox
2. WHEN A MESSAGE COMES IN:
   - URL: https://votre-domaine.com/api/messaging/whatsapp/webhook
   - HTTP POST

### 4bis. Option passerelle pour voir les SMS reçus sur votre 06

Si votre 06 personnel n'est pas porté chez Twilio, vous pouvez transférer chaque SMS reçu vers MemoLib via un raccourci téléphone / automatisation.

1. Définir une clé d'ingestion (User Secrets):

```powershell
dotnet user-secrets set "Messaging:ForwardingApiKey" "votre-cle-longue-aleatoire"
```

2. Appeler l'endpoint sécurisé:

```http
POST /api/messaging/sms/forwarded
Header: X-MemoLib-Forward-Key: votre-cle-longue-aleatoire
Content-Type: application/json
```

Payload JSON:

```json
{
   "from": "+33601020304",
   "to": "+33611223344",
   "body": "Texte du SMS reçu",
   "messageSid": "MANUAL-20260226-001",
   "userId": "00000000-0000-0000-0000-000000000001"
}
```

Notes:
- `userId` est optionnel (si omis, le mapping interne numéro -> user est utilisé).
- Ne pas exposer la clé `Messaging:ForwardingApiKey` dans le frontend.

Guide pas-à-pas iPhone/Android: `docs/SMS_FORWARDING_06_SETUP.md`.
```

### 5. Enregistrer les services dans Program.cs

Ajoutez dans `Program.cs` :

```csharp
builder.Services.AddScoped<SmsIntegrationService>();
builder.Services.AddScoped<WhatsAppIntegrationService>();
builder.Services.AddHttpClient();
```

## 📡 ENDPOINTS API

### Recevoir SMS (Webhook Twilio)
```http
POST /api/messaging/sms/webhook
Content-Type: application/x-www-form-urlencoded

MessageSid=SMxxxxxxxxx
From=+33612345678
To=+33687654321
Body=Bonjour Maître, j'ai besoin de vos conseils
```

### Recevoir WhatsApp (Webhook Twilio)
```http
POST /api/messaging/whatsapp/webhook
Content-Type: application/x-www-form-urlencoded

MessageSid=SMxxxxxxxxx
From=whatsapp:+33612345678
To=whatsapp:+14155238886
Body=Bonjour, question urgente
```

### Envoyer SMS
```http
POST /api/messaging/sms/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "+33612345678",
  "body": "Bonjour, votre rendez-vous est confirmé pour demain 14h."
}
```

### Envoyer WhatsApp
```http
POST /api/messaging/whatsapp/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "to": "+33612345678",
  "body": "Bonjour, votre dossier a été mis à jour."
}
```

## 🧪 TESTS

### Test SMS (avec curl)
```bash
curl -X POST http://localhost:5078/api/messaging/sms/webhook \
  -d "MessageSid=SM123456" \
  -d "From=+33612345678" \
  -d "To=+33687654321" \
  -d "Body=Test SMS MemoLib"
```

### Test WhatsApp (avec curl)
```bash
curl -X POST http://localhost:5078/api/messaging/whatsapp/webhook \
  -d "MessageSid=SM789012" \
  -d "From=whatsapp:+33612345678" \
  -d "To=whatsapp:+14155238886" \
  -d "Body=Test WhatsApp MemoLib"
```

## 🎯 WORKFLOW AUTOMATIQUE

**Quand un SMS/WhatsApp arrive :**

1. ✅ **Webhook reçu** → MemoLib notifié instantanément
2. ✅ **Client détecté** → Création automatique si nouveau
3. ✅ **Dossier créé** → "SMS - Client X" ou "WhatsApp - Client Y"
4. ✅ **Message archivé** → Stocké avec métadonnées complètes
5. ✅ **Recherche IA** → Message indexé pour recherche sémantique
6. ✅ **Notification** → Avocat alerté du nouveau message
7. ✅ **Réponse possible** → Depuis l'interface MemoLib

## 💰 TARIFICATION TWILIO

**SMS :**
- Réception : 0,0075€/SMS
- Envoi : 0,08€/SMS
- Numéro : 1€/mois

**WhatsApp :**
- Réception : Gratuit
- Envoi : 0,005€/message (conversations)
- Pas de frais de numéro

**Exemple cabinet 100 SMS/mois :**
- Réception : 100 × 0,0075€ = 0,75€
- Envoi : 50 × 0,08€ = 4€
- Numéro : 1€
- **Total : 5,75€/mois**

## 🚀 DEPLOIEMENT PRODUCTION

### Option 1 : Ngrok (Test local)
```bash
ngrok http 5078
# URL publique : https://abc123.ngrok.io
# Webhook : https://abc123.ngrok.io/api/messaging/sms/webhook
```

### Option 2 : Azure App Service
```bash
# Déployer sur Azure
az webapp up --name memolib-prod --resource-group memolib-rg

# URL : https://memolib-prod.azurewebsites.net
# Webhook : https://memolib-prod.azurewebsites.net/api/messaging/sms/webhook
```

### Option 3 : Serveur dédié
```bash
# Configurer reverse proxy Nginx
# Webhook : https://memolib.votredomaine.com/api/messaging/sms/webhook
```

## 📊 ANALYTICS MULTI-CANAUX

**Nouvelles métriques disponibles :**
- 📧 Emails reçus/envoyés
- 📱 SMS reçus/envoyés
- 💬 WhatsApp reçus/envoyés
- 📊 Canal préféré par client
- ⏱️ Temps de réponse par canal
- 💰 Coût par canal

## 🎯 ARGUMENTS COMMERCIAUX

**Pour vendre l'upgrade :**

1. **Centralisation totale**
   - "Tous vos échanges clients au même endroit"
   - "Plus besoin de jongler entre 3 applications"

2. **Traçabilité complète**
   - "Audit complet de toutes les communications"
   - "Conformité RGPD sur tous les canaux"

3. **Recherche unifiée**
   - "Retrouvez n'importe quel message en 2 secondes"
   - "IA qui cherche dans emails, SMS et WhatsApp"

4. **Gain de temps**
   - "Répondez depuis une seule interface"
   - "Templates automatiques pour tous les canaux"

5. **Différenciation**
   - "Seule solution juridique omnicanale en France"
   - "Vos concurrents n'ont que l'email"

## 💡 PROCHAINES ETAPES

**Phase 1 (Actuel) :**
- ✅ SMS Twilio
- ✅ WhatsApp Twilio

**Phase 2 (Futur) :**
- 📱 Telegram
- 💬 Facebook Messenger
- 📞 Appels vocaux (transcription)
- 📧 Autres providers email

**Phase 3 (Vision) :**
- 🤖 Réponses IA automatiques
- 🎙️ Messages vocaux → texte
- 🌍 Traduction automatique
- 📊 Sentiment analysis

## 🎉 RESULTAT

**MemoLib devient :**
- ✅ Solution omnicanale complète
- ✅ Différenciation forte
- ✅ Valeur perçue +200%
- ✅ Prix justifié 79€/mois
- ✅ Barrière à l'entrée pour concurrents

**Vous êtes maintenant le SEUL à offrir ça ! 🚀**
