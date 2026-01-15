# 🎯 Architecture Séparation Client/Avocat

## 📋 Vue d'ensemble

L'application sépare désormais clairement les interfaces **Client** et **Avocat** pour une meilleure expérience utilisateur et une gestion optimale des dossiers.

---

## 👤 Interface CLIENT

### Page de création de demande
**URL** : `/client/dossiers/nouveau`

**Fonctionnalités** :
- ✅ Formulaire **simplifié** pour les clients
- ✅ Sélection visuelle du type de démarche (avec icônes)
- ✅ Description de la demande (minimum 20 caractères)
- ✅ Date limite optionnelle
- ✅ Case à cocher "Situation urgente"
- ✅ Informations complémentaires
- ✅ Interface conviviale avec explications claires

**Workflow** :
1. Client remplit le formulaire simplifié
2. Demande créée avec statut `BROUILLON`
3. Notification envoyée à l'avocat (TODO)
4. Client redirigé vers `/client/dossiers`

**API** : `POST /api/client/demandes`

```typescript
{
  typeDossier: 'TITRE_SEJOUR',
  objetDemande: 'Description...',
  dateEcheance: '2026-06-15',
  urgence: true,
  complementInfo: '...'
}
```

---

## ⚖️ Interface AVOCAT

### 1. Liste de TOUS les dossiers
**URL** : `/admin/dossiers`

**Fonctionnalités** :
- ✅ Vue complète de **tous les dossiers** du cabinet
- ✅ Filtres avancés :
  - Recherche par numéro, client, objet
  - Filtre par statut (Brouillon, En cours, etc.)
  - Filtre par priorité
- ✅ Tri par date, échéance ou priorité
- ✅ Affichage des informations clés :
  - Numéro de dossier
  - Client (nom, prénom)
  - Type de dossier
  - Statut et priorité (badges colorés)
  - Nombre de documents et échéances
- ✅ Actions rapides :
  - Voir le dossier
  - Éditer
  - Supprimer

**API** : `GET /api/admin/dossiers`

**Réponse** :
```json
{
  "dossiers": [
    {
      "id": "...",
      "numeroDossier": "DOS-2026-00001",
      "typeDossier": "TITRE_SEJOUR",
      "objetDemande": "...",
      "statut": "EN_COURS",
      "priorite": "URGENTE",
      "dateCreation": "2026-01-03",
      "dateEcheance": "2026-06-15",
      "client": {
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean@example.com"
      },
      "_count": {
        "documents": 5,
        "echeances": 2
      }
    }
  ]
}
```

---

### 2. Création de dossier pour un client
**URL** : `/admin/dossiers/nouveau`

**Fonctionnalités** :
- ✅ L'avocat sélectionne un **client existant**
- ✅ Formulaire complet de création :
  - Type de dossier
  - Priorité
  - Statut initial
  - Date d'échéance
  - Objet de la demande
  - Notes internes
- ✅ Création immédiate avec statut `EN_COURS`
- ✅ Génération automatique du numéro de dossier

**API** : `POST /api/admin/dossiers`

```json
{
  "clientId": "client-uuid",
  "typeDossier": "NATURALISATION",
  "objetDemande": "...",
  "priorite": "HAUTE",
  "statut": "EN_COURS",
  "dateEcheance": "2026-12-31",
  "notes": "Notes internes..."
}
```

---

### 3. Gestion des clients
**URL** : `/admin/clients` (existe déjà)

**Nouvelle API** : `GET /api/admin/clients`

**Fonctionnalités** :
- ✅ Liste de tous les clients du cabinet
- ✅ Informations : nom, email, téléphone, nombre de dossiers
- ✅ Permet la sélection dans le formulaire de création de dossier

---

## 🔄 Workflow Complet

### Scénario 1 : Client crée une demande

```mermaid
graph LR
A[Client] -->|Accède à| B[/client/dossiers/nouveau]
B -->|Remplit formulaire| C[API: POST /client/demandes]
C -->|Crée dossier BROUILLON| D[(Database)]
D -->|Notification| E[Avocat]
E -->|Valide et traite| F[Dossier EN_COURS]
```

1. **Client** : Va sur `/client/dossiers/nouveau`
2. **Client** : Remplit le formulaire simplifié
3. **Système** : Crée dossier avec statut `BROUILLON`
4. **Système** : Notifie l'avocat (TODO)
5. **Avocat** : Voit la demande dans `/admin/dossiers` (filtre Brouillon)
6. **Avocat** : Valide et passe en `EN_COURS`

### Scénario 2 : Avocat crée un dossier

```mermaid
graph LR
A[Avocat] -->|Accède à| B[/admin/dossiers/nouveau]
B -->|Sélectionne client| C[Liste clients]
B -->|Remplit formulaire| D[API: POST /admin/dossiers]
D -->|Crée dossier EN_COURS| E[(Database)]
E -->|Notification| F[Client]
```

1. **Avocat** : Va sur `/admin/dossiers/nouveau`
2. **Avocat** : Sélectionne un client dans la liste
3. **Avocat** : Remplit le formulaire complet
4. **Système** : Crée dossier avec statut `EN_COURS`
5. **Système** : Notifie le client (TODO)

---

## 🎨 Différences Interface Client vs Avocat

| Aspect | Client | Avocat |
|--------|--------|--------|
| **Complexité** | ✅ Simplifié | 🔧 Complet |
| **Champs** | 5 champs essentiels | Tous les champs |
| **Sélection client** | ❌ Automatique (session) | ✅ Liste déroulante |
| **Statut initial** | `BROUILLON` | `EN_COURS` ou choix |
| **Notes internes** | ❌ Non | ✅ Oui |
| **Priorité** | Auto (urgence → URGENTE) | ✅ Choix manuel |
| **Design** | 🎨 Coloré, convivial | 📊 Professionnel |

---

## 📁 Structure des Fichiers

```
src/app/
├── client/
│   └── dossiers/
│       └── nouveau/
│           └── page.tsx          # Formulaire CLIENT simplifié
│
├── admin/
│   ├── dossiers/
│   │   ├── page.tsx              # Liste TOUS les dossiers
│   │   └── nouveau/
│   │       └── page.tsx          # Formulaire AVOCAT complet
│   └── clients/
│       └── page.tsx              # Liste clients (existe)
│
└── api/
    ├── client/
    │   └── demandes/
    │       └── route.ts          # POST: client crée demande
    │
    └── admin/
        ├── dossiers/
        │   ├── route.ts          # GET: liste, POST: création
        │   └── [id]/
        │       └── route.ts      # GET, PUT, DELETE
        └── clients/
            └── route.ts          # GET: liste clients
```

---

## 🚀 APIs Créées/Modifiées

### Client APIs

| Endpoint | Méthode | Rôle | Description |
|----------|---------|------|-------------|
| `/api/client/demandes` | POST | CLIENT | Créer une demande (BROUILLON) |
| `/api/client/demandes` | GET | CLIENT | Voir ses demandes en attente |

### Admin APIs

| Endpoint | Méthode | Rôle | Description |
|----------|---------|------|-------------|
| `/api/admin/dossiers` | GET | AVOCAT | Tous les dossiers du cabinet |
| `/api/admin/dossiers` | POST | AVOCAT | Créer dossier pour un client |
| `/api/admin/dossiers/[id]` | GET | AVOCAT | Détails d'un dossier |
| `/api/admin/dossiers/[id]` | PUT | AVOCAT | Modifier un dossier |
| `/api/admin/dossiers/[id]` | DELETE | AVOCAT | Supprimer un dossier |
| `/api/admin/clients` | GET | AVOCAT | Liste tous les clients |
| `/api/admin/clients` | POST | AVOCAT | Créer un nouveau client |

---

## ✅ Points de Contrôle Sécurité

### Client
- ✅ Vérifie `role === 'CLIENT'`
- ✅ Utilise automatiquement `clientId` de la session
- ✅ Ne peut créer que pour lui-même
- ✅ Statut forcé à `BROUILLON`

### Avocat
- ✅ Vérifie `role === 'AVOCAT' || role === 'ADMIN'`
- ✅ Filtre par `tenantId` (isolation multi-tenant)
- ✅ Peut voir TOUS les dossiers de son cabinet
- ✅ Peut créer pour N'IMPORTE QUEL client du cabinet
- ✅ Contrôle total sur statut, priorité, etc.

---

## 🎯 Prochaines Étapes

### Court terme
- [ ] Système de notifications (email/in-app)
- [ ] Page de détail dossier `/admin/dossiers/[id]`
- [ ] Page d'édition `/admin/dossiers/[id]/edit`

### Moyen terme
- [ ] Dashboard avocat avec statistiques demandes en attente
- [ ] Workflow validation : BROUILLON → EN_COURS (avec bouton)
- [ ] Historique des modifications

### Long terme
- [ ] Chat intégré client-avocat sur un dossier
- [ ] Upload documents depuis formulaire client
- [ ] Signatures électroniques

---

## 📊 Statuts des Dossiers

| Statut | Signification | Qui peut créer |
|--------|---------------|----------------|
| `BROUILLON` | Demande client en attente | CLIENT |
| `EN_COURS` | Dossier actif | AVOCAT |
| `EN_ATTENTE` | En attente info/décision | AVOCAT |
| `TERMINE` | Dossier clôturé | AVOCAT |
| `REJETE` | Demande rejetée | AVOCAT |
| `ANNULE` | Annulé par client/avocat | AVOCAT |

---

## 🎨 Codes Couleurs

### Statuts
- `BROUILLON` → Gris
- `EN_COURS` → Bleu
- `EN_ATTENTE` → Jaune/Orange
- `TERMINE` → Vert
- `REJETE` → Rouge
- `ANNULE` → Gris

### Priorités
- `NORMALE` → Gris
- `HAUTE` → Jaune
- `URGENTE` → Orange
- `CRITIQUE` → Rouge

---

**✅ Architecture complète et fonctionnelle !**
