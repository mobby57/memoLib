# 📋 Système de Formulaires Intelligents & Espaces Partagés

## 🎯 Vue d'Ensemble

Ce système permet aux avocats de :
1. **Créer des formulaires d'inscription personnalisés** pour chaque type de dossier
2. **Demander des pièces jointes spécifiques** aux clients
3. **Créer des espaces partagés** avec tous les participants (juge, avocat, secrétaire, client, expert)
4. **Suivre l'état du projet** en temps réel
5. **Adapter les formulaires** selon les besoins

---

## 🚀 Fonctionnalités

### 1. Formulaires d'Inscription Intelligents

#### Création de Formulaire
```http
POST /api/intake/forms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Formulaire Divorce",
  "description": "Formulaire pour les dossiers de divorce",
  "fields": [
    {
      "label": "Nom complet",
      "type": "text",
      "required": true,
      "order": 0
    },
    {
      "label": "Email",
      "type": "email",
      "required": true,
      "order": 1
    },
    {
      "label": "Téléphone",
      "type": "phone",
      "required": true,
      "order": 2
    },
    {
      "label": "Date de mariage",
      "type": "text",
      "required": true,
      "order": 3
    }
  ],
  "requiredDocuments": [
    "Pièce d'identité",
    "Acte de mariage",
    "Justificatif de domicile",
    "Contrat de mariage (si applicable)"
  ]
}
```

**Réponse:**
```json
{
  "id": "guid-du-formulaire",
  "name": "Formulaire Divorce",
  "description": "Formulaire pour les dossiers de divorce",
  "fields": [...],
  "requiredDocuments": [...],
  "isActive": true,
  "createdAt": "2025-03-01T19:55:00Z"
}
```

#### Types de Champs Disponibles
- `text` - Texte libre
- `email` - Email validé
- `phone` - Numéro de téléphone
- `file` - Upload de fichier
- `select` - Liste déroulante
- `checkbox` - Case à cocher

#### Récupérer Mes Formulaires
```http
GET /api/intake/forms
Authorization: Bearer {token}
```

#### Récupérer un Formulaire (Public)
```http
GET /api/intake/forms/{formId}
```
**Note:** Pas d'authentification requise - permet aux clients de voir le formulaire

---

### 2. Soumission de Formulaire par le Client

```http
POST /api/intake/submit
Content-Type: application/json

{
  "formId": "guid-du-formulaire",
  "clientEmail": "client@example.com",
  "clientName": "Jean Dupont",
  "formData": {
    "nom_complet": "Jean Dupont",
    "email": "client@example.com",
    "telephone": "+33612345678",
    "date_mariage": "15/06/2010"
  },
  "uploadedDocumentIds": [
    "guid-doc-1",
    "guid-doc-2",
    "guid-doc-3"
  ],
  "status": "PENDING"
}
```

**Réponse:**
```json
{
  "message": "Formulaire soumis avec succès",
  "submissionId": "guid-de-la-soumission"
}
```

#### Voir les Soumissions en Attente
```http
GET /api/intake/submissions/pending
Authorization: Bearer {token}
```

---

### 3. Espaces Partagés Multi-Participants

#### Créer un Espace Partagé
```http
POST /api/workspace/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "guid-du-dossier",
  "name": "Dossier Dupont - Divorce",
  "participants": [
    {
      "email": "client@example.com",
      "name": "Jean Dupont",
      "role": "VIEWER",
      "participantType": "CLIENT"
    },
    {
      "email": "avocat@cabinet.fr",
      "name": "Maître Martin",
      "role": "OWNER",
      "participantType": "LAWYER"
    },
    {
      "email": "juge@tribunal.fr",
      "name": "Juge Lefebvre",
      "role": "VIEWER",
      "participantType": "JUDGE"
    },
    {
      "email": "secretaire@cabinet.fr",
      "name": "Marie Secrétaire",
      "role": "EDITOR",
      "participantType": "SECRETARY"
    },
    {
      "email": "expert@expertise.fr",
      "name": "Expert Comptable",
      "role": "EDITOR",
      "participantType": "EXPERT"
    }
  ]
}
```

**Types de Participants:**
- `CLIENT` - Client du cabinet
- `LAWYER` - Avocat
- `JUDGE` - Juge
- `SECRETARY` - Secrétaire
- `EXPERT` - Expert (comptable, médical, etc.)

**Rôles d'Accès:**
- `OWNER` - Propriétaire (tous les droits)
- `EDITOR` - Éditeur (peut ajouter/modifier)
- `VIEWER` - Lecteur (lecture seule)

#### Récupérer l'Espace d'un Dossier
```http
GET /api/workspace/case/{caseId}
Authorization: Bearer {token}
```

---

### 4. Gestion des Documents dans l'Espace

#### Upload de Document
```http
POST /api/workspace/{workspaceId}/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "fileName": "contrat_mariage.pdf",
  "filePath": "/uploads/contrat_mariage.pdf",
  "fileSize": 245678,
  "uploadedBy": "avocat@cabinet.fr",
  "category": "CONTRACT",
  "visibleToRoles": ["LAWYER", "CLIENT"]
}
```

**Catégories de Documents:**
- `GENERAL` - Document général
- `EVIDENCE` - Preuve
- `CONTRACT` - Contrat
- `COURT_FILING` - Dépôt au tribunal

#### Récupérer les Documents
```http
GET /api/workspace/{workspaceId}/documents?role=LAWYER
Authorization: Bearer {token}
```

**Note:** Les documents sont filtrés selon le rôle de l'utilisateur

---

### 5. Journal d'Activité

#### Récupérer les Activités
```http
GET /api/workspace/{workspaceId}/activities
Authorization: Bearer {token}
```

**Réponse:**
```json
[
  {
    "id": "guid",
    "workspaceId": "guid",
    "actorEmail": "avocat@cabinet.fr",
    "actorName": "Maître Martin",
    "action": "DOCUMENT_UPLOADED",
    "details": "Uploaded contrat_mariage.pdf",
    "occurredAt": "2025-03-01T20:00:00Z"
  },
  {
    "id": "guid",
    "workspaceId": "guid",
    "actorEmail": "client@example.com",
    "actorName": "Jean Dupont",
    "action": "COMMENT_ADDED",
    "details": "Ajouté un commentaire sur le document",
    "occurredAt": "2025-03-01T19:45:00Z"
  }
]
```

#### Logger une Activité
```http
POST /api/workspace/{workspaceId}/activity
Authorization: Bearer {token}
Content-Type: application/json

{
  "actorEmail": "avocat@cabinet.fr",
  "actorName": "Maître Martin",
  "action": "STATUS_CHANGED",
  "details": "Dossier passé en phase de négociation"
}
```

**Actions Typiques:**
- `DOCUMENT_UPLOADED` - Document uploadé
- `COMMENT_ADDED` - Commentaire ajouté
- `STATUS_CHANGED` - Statut changé
- `PARTICIPANT_ADDED` - Participant ajouté
- `DEADLINE_SET` - Échéance définie

---

## 🎨 Interface Utilisateur

### Accès à l'Interface
```
http://localhost:5078/intake-forms.html
```

### Fonctionnalités de l'Interface

#### 1. Onglet "Créer Formulaire"
- Nom et description du formulaire
- Ajout de champs dynamiques
- Configuration des champs (label, type, obligatoire)
- Liste des documents requis
- Sauvegarde du formulaire

#### 2. Onglet "Soumissions"
- Liste des soumissions en attente
- Détails de chaque soumission
- Statut (PENDING, REVIEWED, APPROVED)
- Actions (approuver, rejeter)

#### 3. Onglet "Espace Partagé"
- Création d'espace pour un dossier
- Ajout de participants avec rôles
- Visualisation des participants
- Gestion des documents
- Journal d'activité

---

## 📊 Workflow Complet

### Scénario: Nouveau Client - Divorce

#### Étape 1: L'avocat crée un formulaire
```javascript
POST /api/intake/forms
{
  "name": "Formulaire Divorce",
  "fields": [...],
  "requiredDocuments": ["Pièce d'identité", "Acte de mariage", ...]
}
```

#### Étape 2: L'avocat envoie le lien au client
```
Lien: http://localhost:5078/form/{formId}
```

#### Étape 3: Le client remplit le formulaire
```javascript
POST /api/intake/submit
{
  "formId": "...",
  "clientEmail": "client@example.com",
  "formData": {...},
  "uploadedDocumentIds": [...]
}
```

#### Étape 4: L'avocat reçoit la notification
```javascript
GET /api/intake/submissions/pending
// Retourne la nouvelle soumission
```

#### Étape 5: L'avocat crée un dossier
```javascript
POST /api/cases
{
  "title": "Divorce Dupont",
  "clientId": "..."
}
```

#### Étape 6: L'avocat crée l'espace partagé
```javascript
POST /api/workspace/create
{
  "caseId": "...",
  "name": "Dossier Dupont - Divorce",
  "participants": [
    { "email": "client@...", "participantType": "CLIENT", "role": "VIEWER" },
    { "email": "avocat@...", "participantType": "LAWYER", "role": "OWNER" },
    { "email": "juge@...", "participantType": "JUDGE", "role": "VIEWER" }
  ]
}
```

#### Étape 7: Tous les participants peuvent suivre
- Upload de documents
- Commentaires
- Changements de statut
- Échéances
- Activités en temps réel

---

## 🔒 Sécurité

### Authentification
- JWT Bearer token requis pour toutes les opérations (sauf soumission publique)
- Token valide 24h

### Autorisation
- Seul le propriétaire du formulaire peut voir les soumissions
- Seuls les participants d'un workspace peuvent y accéder
- Documents filtrés selon les rôles

### Isolation
- Chaque utilisateur ne voit que ses propres formulaires
- Workspaces isolés par dossier
- Audit complet de toutes les actions

---

## 📝 Exemples de Formulaires

### Formulaire Divorce
```json
{
  "name": "Formulaire Divorce",
  "fields": [
    { "label": "Nom complet", "type": "text", "required": true },
    { "label": "Date de mariage", "type": "text", "required": true },
    { "label": "Enfants", "type": "select", "options": ["Oui", "Non"], "required": true },
    { "label": "Régime matrimonial", "type": "text", "required": false }
  ],
  "requiredDocuments": [
    "Pièce d'identité",
    "Acte de mariage",
    "Livret de famille",
    "Contrat de mariage"
  ]
}
```

### Formulaire Succession
```json
{
  "name": "Formulaire Succession",
  "fields": [
    { "label": "Nom du défunt", "type": "text", "required": true },
    { "label": "Date de décès", "type": "text", "required": true },
    { "label": "Lien de parenté", "type": "select", "options": ["Conjoint", "Enfant", "Parent", "Autre"], "required": true }
  ],
  "requiredDocuments": [
    "Acte de décès",
    "Livret de famille",
    "Testament (si existant)",
    "Relevés bancaires"
  ]
}
```

### Formulaire Immobilier
```json
{
  "name": "Formulaire Achat Immobilier",
  "fields": [
    { "label": "Type de bien", "type": "select", "options": ["Appartement", "Maison", "Terrain"], "required": true },
    { "label": "Adresse du bien", "type": "text", "required": true },
    { "label": "Prix d'achat", "type": "text", "required": true }
  ],
  "requiredDocuments": [
    "Compromis de vente",
    "Diagnostics immobiliers",
    "Justificatif de financement"
  ]
}
```

---

## 🎯 Avantages

### Pour l'Avocat
✅ Formulaires personnalisés par type de dossier  
✅ Collecte automatique des informations  
✅ Documents requis clairement définis  
✅ Gain de temps sur la prise de contact  
✅ Suivi centralisé de tous les participants  

### Pour le Client
✅ Formulaire clair et guidé  
✅ Liste précise des documents à fournir  
✅ Soumission en ligne 24/7  
✅ Suivi de l'avancement du dossier  
✅ Communication transparente  

### Pour Tous les Participants
✅ Espace partagé unique  
✅ Visibilité en temps réel  
✅ Documents centralisés  
✅ Journal d'activité complet  
✅ Collaboration facilitée  

---

## 🚀 Démarrage Rapide

### 1. Lancer l'API
```bash
cd MemoLib.Api
dotnet run
```

### 2. Accéder à l'interface
```
http://localhost:5078/intake-forms.html
```

### 3. Créer votre premier formulaire
- Cliquez sur "Créer Formulaire"
- Ajoutez des champs
- Ajoutez des documents requis
- Sauvegardez

### 4. Créer un espace partagé
- Cliquez sur "Espace Partagé"
- Entrez l'ID du dossier
- Ajoutez les participants
- Créez l'espace

---

## 📞 Support

Pour toute question ou problème, consultez la documentation principale ou ouvrez une issue sur GitHub.

**Bon usage ! 🎉**
