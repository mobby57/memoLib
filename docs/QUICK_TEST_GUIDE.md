# 🚀 GUIDE DE TEST RAPIDE — Système Multi-Canal

> **Objectif:** Tester TOUS les canaux en 15 minutes

---

## ✅ PRÉREQUIS

```bash
# 1. Variables d'environnement minimales
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
OPENAI_API_KEY=sk-...

# 2. Base de données migrée
npx prisma migrate deploy
npx prisma generate

# 3. Serveur démarré
npm run dev
```

---

## 📧 TEST 1 — EMAIL

### Envoyer un email de test

```bash
curl -X POST http://localhost:3000/api/webhooks/channel/email \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{
    "from": "client@example.com",
    "fromName": "Jean Dupont",
    "to": "cabinet@iapostemanager.com",
    "subject": "Demande de RDV urgent",
    "text": "Bonjour, je souhaite un RDV pour mon titre de séjour qui expire le 15 février 2026.",
    "html": "<p>Bonjour, je souhaite un RDV pour mon titre de séjour qui expire le <strong>15 février 2026</strong>.</p>"
  }'
```

### Résultat attendu

```json
{
  "success": true,
  "messageId": "msg-xxx",
  "status": "RECEIVED",
  "processingTime": 234
}
```

### Vérifier en base

```sql
SELECT 
  id, 
  channel, 
  status, 
  "aiSummary", 
  "aiUrgency",
  "receivedAt"
FROM "channelMessage"
WHERE channel = 'EMAIL'
ORDER BY "receivedAt" DESC
LIMIT 1;
```

---

## 💬 TEST 2 — WHATSAPP

### Simuler un webhook WhatsApp

```bash
curl -X POST http://localhost:3000/api/webhooks/channel/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=test" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "33612345678",
            "id": "wamid.xxx",
            "timestamp": "1706184000",
            "text": {
              "body": "Bonjour, je veux savoir où en est mon dossier de naturalisation"
            },
            "type": "text"
          }],
          "contacts": [{
            "profile": {
              "name": "Marie Martin"
            }
          }]
        }
      }]
    }]
  }'
```

### Résultat attendu

```json
{
  "success": true,
  "messageId": "msg-yyy",
  "status": "RECEIVED",
  "processingTime": 189
}
```

---

## 📱 TEST 3 — SMS (Twilio)

### Simuler un SMS entrant

```bash
curl -X POST http://localhost:3000/api/webhooks/channel/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=+33612345678&To=+33123456789&Body=Urgent: besoin d'aide pour mon dossier&MessageSid=SM123456"
```

### Résultat attendu

```json
{
  "success": true,
  "messageId": "msg-zzz",
  "status": "RECEIVED",
  "processingTime": 156
}
```

---

## 📝 TEST 4 — FORMULAIRE WEB

### Soumettre un formulaire

```bash
curl -X POST http://localhost:3000/api/webhooks/channel/form \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "contact-form",
    "formType": "CONTACT",
    "name": "Pierre Durand",
    "email": "pierre@example.com",
    "phone": "+33698765432",
    "subject": "Demande de consultation",
    "message": "Je souhaite une consultation pour un problème de visa",
    "consentGiven": true,
    "consentPurpose": "Contact commercial"
  }'
```

---

## 📄 TEST 5 — UPLOAD DOCUMENT

### Uploader un document

```bash
curl -X POST http://localhost:3000/api/webhooks/channel/document \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "passeport.pdf",
    "mimeType": "application/pdf",
    "size": 245678,
    "url": "https://storage.example.com/passeport.pdf",
    "blobPath": "/uploads/client-123/passeport.pdf",
    "uploadedBy": "client-123",
    "description": "Copie de mon passeport",
    "documentType": "IDENTITY",
    "category": "IMMIGRATION"
  }'
```

---

## 🔍 VÉRIFICATIONS

### 1. Vérifier tous les messages reçus

```bash
curl http://localhost:3000/api/multichannel/messages?page=1&limit=10
```

**Réponse attendue:**
```json
{
  "messages": [
    {
      "id": "msg-xxx",
      "channel": "EMAIL",
      "status": "PROCESSED",
      "sender": { "email": "client@example.com", "name": "Jean Dupont" },
      "body": "Bonjour, je souhaite un RDV...",
      "aiAnalysis": {
        "summary": "Demande de RDV pour titre de séjour",
        "category": "IMMIGRATION",
        "urgency": "HIGH",
        "tags": ["rdv", "titre-séjour", "deadline"]
      },
      "timestamps": {
        "received": "2026-01-25T12:00:00Z",
        "processed": "2026-01-25T12:00:02Z"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

---

### 2. Vérifier les stats

```bash
curl http://localhost:3000/api/multichannel/stats?period=7d
```

**Réponse attendue:**
```json
{
  "period": "7d",
  "channels": [
    { "channel": "EMAIL", "count": 1, "urgent": 1 },
    { "channel": "WHATSAPP", "count": 1, "urgent": 0 },
    { "channel": "SMS", "count": 1, "urgent": 1 },
    { "channel": "FORM", "count": 1, "urgent": 0 },
    { "channel": "DOCUMENT", "count": 1, "urgent": 0 }
  ],
  "totalMessages": 5,
  "urgentMessages": 2,
  "avgResponseTime": "2s"
}
```

---

### 3. Vérifier l'audit trail

```sql
SELECT 
  action,
  channel,
  "resourceType",
  "resourceId",
  details,
  "createdAt"
FROM "auditLog"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Résultat attendu:**
```
action                  | channel   | resourceType | resourceId | details
------------------------|-----------|--------------|------------|------------------
WEBHOOK_RECEIVED        | EMAIL     | MESSAGE      | msg-xxx    | {"channel":"EMAIL"}
AI_PROCESSING_COMPLETE  | EMAIL     | MESSAGE      | msg-xxx    | {"urgency":"HIGH"}
CLIENT_AUTO_LINKED      | EMAIL     | MESSAGE      | msg-xxx    | {"clientId":"..."}
URGENT_ALERT_CREATED    | EMAIL     | MESSAGE      | msg-xxx    | {"urgency":"HIGH"}
WEBHOOK_RECEIVED        | WHATSAPP  | MESSAGE      | msg-yyy    | {"channel":"WHATSAPP"}
...
```

---

## 🧪 TESTS AVANCÉS

### Test auto-linking client

```bash
# 1. Créer un client
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-autolink@example.com",
    "name": "Test AutoLink",
    "phone": "+33600000000"
  }'

# 2. Envoyer un message avec cet email
curl -X POST http://localhost:3000/api/webhooks/channel/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test-autolink@example.com",
    "subject": "Test auto-linking",
    "text": "Ce message devrait être automatiquement lié à mon compte"
  }'

# 3. Vérifier le linking
curl http://localhost:3000/api/multichannel/messages?clientId=<CLIENT_ID>
```

---

### Test détection d'urgence

```bash
# Messages avec mots-clés urgents
curl -X POST http://localhost:3000/api/webhooks/channel/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "urgent@example.com",
    "subject": "URGENT - Expulsion demain",
    "text": "Mon propriétaire veut m'\''expulser demain matin, j'\''ai besoin d'\''aide immédiatement !"
  }'

# Vérifier l'urgence détectée
curl http://localhost:3000/api/multichannel/messages?urgency=CRITICAL
```

---

### Test extraction d'entités

```bash
curl -X POST http://localhost:3000/api/webhooks/channel/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "entities@example.com",
    "subject": "RDV préfecture",
    "text": "J'\''ai un RDV à la préfecture de Paris le 15 février 2026 à 14h30 pour mon titre de séjour. Mon numéro de dossier est 2026-IMM-12345."
  }'

# Vérifier les entités extraites
curl http://localhost:3000/api/multichannel/messages/<MESSAGE_ID>
```

**Entités attendues:**
```json
{
  "aiAnalysis": {
    "entities": [
      { "type": "DATE", "value": "2026-02-15", "confidence": 0.95 },
      { "type": "TIME", "value": "14:30", "confidence": 0.92 },
      { "type": "LOCATION", "value": "Préfecture de Paris", "confidence": 0.88 },
      { "type": "DOCUMENT", "value": "Titre de séjour", "confidence": 0.98 },
      { "type": "DOSSIER_NUMBER", "value": "2026-IMM-12345", "confidence": 0.99 }
    ]
  }
}
```

---

## 🔐 TEST SÉCURITÉ

### Test sans authentification

```bash
# Devrait retourner 401
curl -X POST http://localhost:3000/api/webhooks/channel/email \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","text":"Test"}'
```

### Test avec mauvaise signature

```bash
# Devrait retourner 401
curl -X POST http://localhost:3000/api/webhooks/channel/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=WRONG_SIGNATURE" \
  -d '{"entry":[]}'
```

---

## 📊 DASHBOARD

### Accéder au dashboard

```
http://localhost:3000/admin/multichannel
```

**Fonctionnalités à tester:**
- ✅ Liste des messages par canal
- ✅ Filtres (canal, statut, urgence)
- ✅ Recherche full-text
- ✅ Détails message avec IA
- ✅ Actions rapides (répondre, archiver, lier)
- ✅ Stats temps réel

---

## 🐛 DEBUGGING

### Logs en temps réel

```bash
# Suivre les logs
npm run dev | grep "WEBHOOK\|AI\|AUDIT"
```

### Vérifier la base de données

```bash
# Ouvrir Prisma Studio
npx prisma studio
```

### Vérifier les secrets

```bash
# Lister les variables d'environnement
node -e "console.log(Object.keys(process.env).filter(k => k.includes('CHANNEL')).join('\n'))"
```

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Email reçu et traité
- [ ] WhatsApp reçu et traité
- [ ] SMS reçu et traité
- [ ] Formulaire reçu et traité
- [ ] Document uploadé et traité
- [ ] IA analyse correctement
- [ ] Urgence détectée
- [ ] Entités extraites
- [ ] Auto-linking fonctionne
- [ ] Audit trail complet
- [ ] Stats correctes
- [ ] Dashboard accessible
- [ ] Sécurité validée

---

## 🚨 PROBLÈMES COURANTS

### Message non traité par l'IA

**Cause:** OpenAI API key manquante ou invalide

**Solution:**
```bash
# Vérifier la clé
echo $OPENAI_API_KEY

# Tester l'API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

### Auto-linking ne fonctionne pas

**Cause:** Email/téléphone ne correspond à aucun client

**Solution:**
```sql
-- Vérifier les clients
SELECT id, email, phone FROM "client";

-- Créer un client de test
INSERT INTO "client" (id, email, name, "tenantId")
VALUES (gen_random_uuid(), 'test@example.com', 'Test Client', 'tenant-1');
```

---

### Webhook rejeté (401)

**Cause:** Signature invalide ou secret manquant

**Solution:**
```bash
# Mode dev: désactiver la validation
NODE_ENV=development npm run dev

# Ou ajouter le secret
export CHANNEL_EMAIL_SECRET=test-secret
```

---

## 📞 SUPPORT

Si un test échoue :

1. Vérifier les logs : `npm run dev`
2. Vérifier la base : `npx prisma studio`
3. Vérifier les secrets : `.env.local`
4. Consulter la doc : `docs/MULTICHANNEL_SYSTEM.md`

---

## 🎯 PROCHAINE ÉTAPE

Une fois tous les tests passés → **Déploiement en production**

```bash
# 1. Configurer les secrets Azure Key Vault
az keyvault secret set --vault-name iapostemanager-kv --name "OPENAI-API-KEY" --value "sk-..."

# 2. Déployer
git push origin main

# 3. Vérifier le déploiement
curl https://iapostemanager.vercel.app/api/health
```
