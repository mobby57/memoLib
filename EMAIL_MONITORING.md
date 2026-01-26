# 📧 Configuration Email Monitoring

## Fonctionnement

Le système analyse automatiquement les emails reçus et :
1. **Détecte le type de dossier** (mots-clés dans objet/corps)
2. **Trouve ou crée le client** (depuis l'email expéditeur)
3. **Lie au dossier existant** (si numéro DOS-XXXX présent)
4. **Crée un nouveau dossier** (si nécessaire)

## Configuration Webhook

### Option 1 : Resend (Recommandé)

```bash
# .env.local
RESEND_API_KEY=re_xxxxx
EMAIL_WEBHOOK_SECRET=votre-secret-aleatoire
```

Configuration Resend :
- Webhook URL : `https://votre-domaine.com/api/webhooks/email`
- Events : `email.received`
- Secret : Même que `EMAIL_WEBHOOK_SECRET`

### Option 2 : SendGrid

```bash
# .env.local
SENDGRID_API_KEY=SG.xxxxx
EMAIL_WEBHOOK_SECRET=votre-secret-aleatoire
```

Configuration SendGrid :
- Inbound Parse : `https://votre-domaine.com/api/webhooks/email`

### Option 3 : Gmail (Dev uniquement)

Utiliser le script de monitoring local :

```bash
npm run email:monitor
```

## Règles de Classification

### Types de Dossier Détectés

| Mots-clés | Type Dossier |
|-----------|--------------|
| "titre de séjour", "carte de séjour" | TITRE_SEJOUR |
| "naturalisation", "nationalité" | NATURALISATION |
| "regroupement familial" | REGROUPEMENT_FAMILIAL |
| "oqtf", "expulsion" | CONTENTIEUX_OQTF |
| Autres | GENERAL |

### Urgence

| Mots-clés | Niveau |
|-----------|--------|
| "urgent", "délai", "audience" | HIGH |
| Autres | MEDIUM |

### Numéro de Dossier

Format reconnu : `DOS-1234` ou `#1234`

Si présent → Lie au dossier existant
Si absent → Crée nouveau dossier

## Exemples d'Emails

### Email avec dossier existant

```
Objet: Re: DOS-1234 - Documents complémentaires
De: client@example.com

Bonjour,
Voici les documents demandés...
```

→ Email lié au dossier DOS-1234

### Email nouveau dossier

```
Objet: Demande titre de séjour urgent
De: nouveau.client@example.com

Bonjour,
Je souhaite faire une demande de titre de séjour...
```

→ Crée client + dossier TITRE_SEJOUR (priorité haute)

### Email général

```
Objet: Question sur honoraires
De: client@example.com

Bonjour,
Pouvez-vous me préciser...
```

→ Email enregistré, action manuelle requise

## Test Manuel

```bash
# Envoyer un email de test
curl -X POST http://localhost:3000/api/webhooks/email \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: votre-secret" \
  -d '{
    "tenantId": "votre-tenant-id",
    "from": "test@example.com",
    "subject": "Demande titre de séjour urgent",
    "text": "Je souhaite faire une demande..."
  }'
```

## Interface de Monitoring

Accéder à : `/emails`

Fonctionnalités :
- ✅ Liste tous les emails reçus
- ✅ Filtrer par statut (traités/en attente)
- ✅ Voir la classification automatique
- ✅ Retraiter un email manuellement
- ✅ Lier manuellement à un dossier

## Amélioration Future (V2)

- [ ] IA avancée avec Ollama pour meilleure classification
- [ ] Extraction automatique de pièces jointes
- [ ] OCR des documents scannés
- [ ] Réponses automatiques
- [ ] Détection de sentiment
