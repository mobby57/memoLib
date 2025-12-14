# 🎯 Smart Email - Guide Utilisateur

## Concept

**Vous remplissez un formulaire simple, l'IA s'occupe de TOUT le reste**

## 📝 Formulaire Simple

### Champs à Remplir

1. **📧 Email destinataire** (requis)
   - L'adresse email du destinataire

2. **📝 Type d'email** (requis)
   - Demande administrative
   - Réclamation
   - Remerciement
   - Relance
   - Candidature
   - Résiliation
   - Demande d'information

3. **🎨 Ton** (optionnel)
   - Professionnel (défaut)
   - Formel
   - Amical
   - Urgent

4. **📄 Contexte** (requis)
   - Décrivez votre situation
   - Ajoutez tous les détails importants
   - Plus vous donnez d'infos, meilleur sera l'email

5. **🔐 Mot de passe maître** (requis)
   - Pour accéder à vos credentials

6. **🚀 Envoi automatique** (optionnel)
   - Cochez pour envoyer directement après génération

## 🤖 Ce Que l'IA Fait

1. ✅ Analyse votre contexte
2. ✅ Génère un objet pertinent
3. ✅ Rédige le corps de l'email
4. ✅ Adapte le ton demandé
5. ✅ Sauvegarde en base de données
6. ✅ Envoie l'email (si demandé)

## 🚀 Utilisation

### URL
```
http://localhost:5000/smart
```

### Exemple 1 - Demande Administrative

**Formulaire:**
- Destinataire: `mairie@ville.fr`
- Type: `Demande administrative`
- Ton: `Formel`
- Contexte: 
  ```
  Je souhaite obtenir un acte de naissance.
  Nom: Dupont
  Prénom: Jean
  Date de naissance: 15/03/1990
  Lieu: Paris
  ```

**Résultat IA:**
- Objet: `Demande d'acte de naissance - Jean Dupont`
- Corps: Email formel complet avec toutes les infos

### Exemple 2 - Réclamation

**Formulaire:**
- Destinataire: `service.client@entreprise.fr`
- Type: `Réclamation`
- Ton: `Professionnel`
- Contexte:
  ```
  Commande #12345 reçue endommagée le 10/12/2024.
  Article: Ordinateur portable
  Problème: Écran cassé
  Demande: Remboursement ou échange
  ```

**Résultat IA:**
- Objet: `Réclamation commande #12345 - Article endommagé`
- Corps: Email professionnel avec demande claire

### Exemple 3 - Candidature

**Formulaire:**
- Destinataire: `rh@entreprise.fr`
- Type: `Candidature`
- Ton: `Professionnel`
- Contexte:
  ```
  Candidature pour poste Développeur Python
  5 ans d'expérience
  Compétences: Python, Flask, React
  Disponible immédiatement
  ```

**Résultat IA:**
- Objet: `Candidature Développeur Python - 5 ans d'expérience`
- Corps: Lettre de motivation professionnelle

## 📊 API Endpoint

### POST /api/smart/generate-and-send

**Headers:**
```json
{
  "Content-Type": "application/json",
  "X-Master-Password": "votre_mot_de_passe"
}
```

**Body:**
```json
{
  "recipient": "destinataire@email.com",
  "email_type": "demande",
  "tone": "professionnel",
  "context": "Votre contexte détaillé...",
  "auto_send": true
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Email généré et envoyé",
  "email_id": 123,
  "subject": "Objet généré",
  "preview": "Aperçu du corps..."
}
```

**Response Draft:**
```json
{
  "success": true,
  "message": "Email généré",
  "email_id": 123,
  "subject": "Objet généré",
  "body": "Corps complet..."
}
```

## 🎨 Types d'Emails Disponibles

### GET /api/smart/templates

**Response:**
```json
{
  "success": true,
  "templates": {
    "demande": "Demande administrative ou professionnelle",
    "reclamation": "Réclamation ou contestation",
    "remerciement": "Remerciement",
    "relance": "Relance ou rappel",
    "candidature": "Candidature emploi",
    "resiliation": "Résiliation contrat",
    "information": "Demande d'information"
  }
}
```

## 💡 Conseils

### Pour un Meilleur Résultat

1. **Soyez précis** - Plus de détails = meilleur email
2. **Incluez les dates** - Dates importantes, délais
3. **Ajoutez les références** - Numéros de commande, dossier
4. **Mentionnez les pièces jointes** - Si vous en avez
5. **Précisez votre demande** - Ce que vous attendez

### Contexte Idéal

```
Situation: [Décrivez la situation]
Date: [Date importante]
Référence: [Numéro de dossier/commande]
Demande: [Ce que vous voulez]
Pièces jointes: [Liste des documents]
Délai: [Si urgent]
```

## 🔒 Sécurité

- ✅ Mot de passe maître requis
- ✅ Credentials chiffrés
- ✅ Rate limiting actif
- ✅ Logs sécurisés

## 🚀 Workflow Complet

```
1. Utilisateur remplit formulaire
   ↓
2. API reçoit données
   ↓
3. IA génère objet + corps
   ↓
4. Sauvegarde en DB
   ↓
5. Si auto_send = true:
   - Récupère credentials SMTP
   - Envoie email
   - Met à jour status
   ↓
6. Retourne résultat
```

## 📈 Avantages

- ⚡ **Rapide** - Quelques secondes
- 🎯 **Précis** - IA comprend le contexte
- 📝 **Professionnel** - Emails bien rédigés
- 🔄 **Automatique** - Envoi optionnel
- 💾 **Sauvegardé** - Historique en DB

## 🎉 Résultat

**Vous**: Remplissez 5 champs  
**IA**: Génère email complet professionnel  
**Système**: Envoie automatiquement (optionnel)

**Temps total**: < 1 minute

---

**URL**: http://localhost:5000/smart  
**Status**: ✅ Opérationnel
