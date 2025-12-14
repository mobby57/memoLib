# 📥 Système de Gestion de Boîte de Réception

## Vue d'ensemble

Le système de gestion de boîte de réception permet de **centraliser et traiter tous vos emails reçus** directement dans IAPosteManager, avec des **filtres avancés**, **statistiques intelligentes** et **organisation automatique** en fils de discussion.

---

## ✨ Fonctionnalités Principales

### 1. **Synchronisation Automatique**
- Récupération automatique des emails depuis Gmail via IMAP
- Synchronisation paramétrable (7, 30, 90 jours)
- Sauvegarde locale en JSON pour accès rapide
- Préservation de l'historique complet

### 2. **Filtres Avancés Puissants**

#### Filtres Disponibles :

| Filtre | Description | Exemple |
|--------|-------------|---------|
| **Recherche texte** | Sujet, corps, expéditeur | "facture impayée" |
| **Date** | Période personnalisée | Du 01/12 au 10/12 |
| **Domaine** | Domaine de l'expéditeur | "gouv.fr", "impots" |
| **Type** | Catégorie automatique | urgent, facture, administratif |
| **Importance** | Emails importants uniquement | ✓ |
| **Statut réponse** | Avec/sans réponse | Non répondus |
| **Deadline** | Deadline de réponse passée | ✓ |
| **Pièces jointes** | Emails avec PJ | ✓ |
| **Tags** | Tags personnalisés | "à traiter", "urgent" |

### 3. **Organisation Intelligente**

#### Détection Automatique du Type :
```javascript
Types détectés automatiquement :
- 🔴 urgent       → Action immédiate requise
- 💰 facture      → Documents financiers
- 💬 reponse      → Réponse à un email précédent
- 📋 administratif → Courriers officiels
- 📰 newsletter   → Communications marketing
- ✅ confirmation → Confirmations de commande/réservation
- 📧 general      → Emails standards
```

#### Fils de Discussion (Threads) :
- Regroupement automatique des emails liés
- Affichage chronologique
- Compteur de messages par discussion
- Liste des participants
- Date de dernière activité

### 4. **Statistiques en Temps Réel**

Tableau de bord avec 7 indicateurs clés :

```
┌─────────────────────────────────────────────────────────┐
│  Total  │ Non lus │ Sans rép. │ Important │ En retard  │
│   247   │    18   │     42    │    12     │     5      │
├─────────────────────────────────────────────────────────┤
│       Discussions  │  Temps moyen de réponse           │
│          38        │         24h                        │
└─────────────────────────────────────────────────────────┘
```

**Statistiques supplémentaires :**
- Répartition par type (graphique)
- Top 10 domaines expéditeurs
- Temps de réponse moyen calculé automatiquement

### 5. **Gestion des Deadlines**

Système intelligent de calcul automatique :

| Type d'email | Délai de réponse recommandé |
|--------------|------------------------------|
| Urgent | 1 jour |
| Facture | 7 jours |
| Administratif | 15 jours |
| Réponse | 3 jours |
| Général | 7 jours |

- Alertes visuelles pour deadlines dépassées 🔴
- Badge "En retard" sur les emails concernés
- Filtre dédié pour emails en retard

### 6. **Actions Rapides**

Pour chaque email :

| Action | Icône | Description |
|--------|-------|-------------|
| **Marquer lu** | 👁️ | Change le statut de lecture |
| **Marquer répondu** | ✅ | Indique qu'une réponse a été envoyée |
| **Ajouter tag** | 🏷️ | Catégorisation personnalisée |
| **Ajouter note** | 📝 | Commentaires et rappels |
| **Voir détails** | 📄 | Affichage complet du message |
| **Répondre** | 💬 | Rédaction de réponse directe |

---

## 🎯 Scénarios d'Utilisation

### Scénario 1 : Traitement des Emails Urgents
```
1. Cliquer sur "Boîte de réception"
2. Activer le filtre "Importants uniquement"
3. Consulter les emails avec badge 🔴 urgent
4. Traiter par ordre de deadline
5. Marquer comme répondu après action
```

### Scénario 2 : Suivi des Factures
```
1. Ouvrir les filtres avancés
2. Sélectionner Type : "Facture"
3. Date : "30 derniers jours"
4. Filtrer "Sans réponse"
5. Identifier les factures non traitées
6. Ajouter tag "Payée" après paiement
```

### Scénario 3 : Emails en Retard
```
1. Activer filtre "Deadline passée"
2. Liste des emails nécessitant attention urgente
3. Trier par date (plus ancien en premier)
4. Répondre directement depuis l'interface
5. Système marque automatiquement comme répondu
```

### Scénario 4 : Recherche Spécifique
```
1. Barre de recherche : "contrat de travail"
2. Filtre domaine : "entreprise.fr"
3. Période : 01/01/2025 - 31/01/2025
4. Résultats triés par pertinence
5. Accès direct aux emails trouvés
```

---

## 🛠️ Architecture Technique

### Fichiers Backend

#### `src/services/inbox_manager.py` (600+ lignes)

**Classes principales :**
```python
class InboxManager:
    def __init__(self, data_dir: str)
    
    # Connexion et récupération
    def connect_to_imap(email, app_password) -> IMAP4_SSL
    def fetch_emails(email, app_password, days_back) -> List[Dict]
    
    # Filtrage et recherche
    def filter_emails(filters: Dict) -> List[Dict]
    
    # Organisation
    def _organize_threads()
    def get_thread(message_id) -> List[Dict]
    
    # Actions
    def mark_as_read(message_id)
    def mark_as_replied(message_id)
    def add_tag(message_id, tag)
    def add_note(message_id, note)
    
    # Statistiques
    def get_statistics() -> Dict
    def _calculate_avg_response_time() -> float
```

**Fonctions de détection :**
```python
def _detect_email_type(subject, body) -> str
    # Analyse mots-clés → type
    
def _is_important(subject, from_, body) -> bool
    # Détection urgence/importance
    
def _calculate_deadline(email_type, received_date) -> str
    # Calcul deadline recommandée
    
def _extract_domain(from_address) -> str
    # Extraction domaine expéditeur
```

**Stockage :**
- `data/inbox.json` : Tous les emails
- `data/email_threads.json` : Organisation des fils

### Fichiers Frontend

#### `frontend-react/src/pages/Inbox.jsx` (800+ lignes)

**Composants :**
```javascript
// Composant principal
export default function Inbox()

// Composant carte email
const EmailCard = ({ email, isInThread }) => (...)

// États principaux
const [emails, setEmails] = useState([])
const [filteredEmails, setFilteredEmails] = useState([])
const [filters, setFilters] = useState({...})
const [statistics, setStatistics] = useState(null)
const [viewMode, setViewMode] = useState('list') // ou 'threads'
```

**Hooks et effets :**
```javascript
useEffect(() => loadInbox(), [])          // Chargement initial
useEffect(() => applyFilters(), [filters]) // Réaction aux filtres
```

### Routes API Backend

#### Dans `src/web/app.py`

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/inbox` | GET | Liste complète des emails |
| `/api/inbox/sync` | POST | Synchronisation depuis Gmail |
| `/api/inbox/statistics` | GET | Statistiques complètes |
| `/api/inbox/filter` | POST | Filtrage avancé |
| `/api/inbox/<id>/read` | POST | Marquer comme lu |
| `/api/inbox/<id>/replied` | POST | Marquer comme répondu |
| `/api/inbox/<id>/tag` | POST | Ajouter un tag |
| `/api/inbox/<id>/note` | POST | Ajouter une note |
| `/api/inbox/thread/<id>` | GET | Récupérer un fil complet |

---

## 📊 Structure des Données

### Format d'un Email

```json
{
  "uid": "12345",
  "message_id": "<unique-id@gmail.com>",
  "in_reply_to": "<previous-id@gmail.com>",
  "references": "...",
  "subject": "Facture n°2024-001",
  "from": "Entreprise <contact@entreprise.fr>",
  "to": "moi@gmail.com",
  "date": "2025-12-10T14:30:00",
  "domain": "entreprise.fr",
  "body": "Corps de l'email...",
  "type": "facture",
  "has_attachments": true,
  "is_read": false,
  "is_replied": false,
  "is_important": true,
  "tags": ["à_payer", "urgent"],
  "notes": "Paiement prévu le 15/12",
  "response_deadline": "2025-12-17T14:30:00",
  "fetched_date": "2025-12-10T15:00:00"
}
```

### Format d'un Thread

```json
{
  "root_id": "<first-message-id>",
  "subject": "Demande d'information",
  "participants": [
    "contact@entreprise.fr",
    "moi@gmail.com"
  ],
  "emails": [
    "<msg-1-id>",
    "<msg-2-id>",
    "<msg-3-id>"
  ],
  "started_date": "2025-12-01T10:00:00",
  "last_activity": "2025-12-10T14:30:00",
  "message_count": 3,
  "is_closed": false
}
```

### Format des Statistiques

```json
{
  "total_emails": 247,
  "unread": 18,
  "unreplied": 42,
  "important": 12,
  "overdue": 5,
  "total_threads": 38,
  "by_type": {
    "urgent": 8,
    "facture": 45,
    "reponse": 67,
    "administratif": 23,
    "newsletter": 89,
    "confirmation": 15,
    "general": 0
  },
  "top_domains": {
    "gmail.com": 87,
    "entreprise.fr": 34,
    "gouv.fr": 12,
    "impots.gouv.fr": 8
  },
  "avg_response_time": 24.5
}
```

---

## 🚀 Installation et Configuration

### Prérequis

**Dépendances Python** (déjà incluses) :
```bash
# Aucune dépendance externe supplémentaire requise
# Utilise la bibliothèque standard :
- imaplib (connexion IMAP)
- email (parsing)
- json (stockage)
- datetime (gestion dates)
```

### Configuration Gmail

**Activation IMAP dans Gmail :**
1. Aller dans Paramètres Gmail
2. Onglet "Transfert et POP/IMAP"
3. Activer "Accès IMAP"
4. Enregistrer les modifications

**App Password :**
- Déjà configuré dans Configuration
- Même mot de passe d'application utilisé pour l'envoi

### Premier Lancement

```
1. Ouvrir IAPosteManager
2. Cliquer sur "Boîte de réception" dans le menu
3. Cliquer sur "Synchroniser"
4. Choisir période (30 jours par défaut)
5. Attendre synchronisation (peut prendre 30s-2min)
6. ✅ Emails disponibles !
```

---

## 🎨 Interface Utilisateur

### Vue Liste (par défaut)

```
┌────────────────────────────────────────────────────────┐
│  📥 Boîte de réception          [🔄 Synchroniser]      │
├────────────────────────────────────────────────────────┤
│  [Total: 247] [Non lus: 18] [Sans rép: 42] ...        │
├────────────────────────────────────────────────────────┤
│  🔍 Rechercher...          [Filtres ▼] [Liste|Thread] │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │ 👤 contact@entreprise.fr     Il y a 2h      │     │
│  │ 📧 Facture n°2024-001                        │     │
│  │ Veuillez trouver ci-joint la facture...     │     │
│  │ [facture] [Important] [PJ]                   │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │ 👤 mairie@ville.fr          Hier             │     │
│  │ 📧 Réponse à votre demande                   │     │
│  │ Nous avons bien reçu votre courrier...      │     │
│  │ [administratif] [Répondu]                    │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Panneau Filtres Avancés

```
┌────────────────────────────────────────────────────────┐
│  Date début    Date fin     Domaine      Type         │
│  [01/12/2025]  [10/12/2025] [gouv.fr]    [Urgent ▼]   │
│                                                         │
│  ☑ Importants uniquement                               │
│  ☑ Sans réponse                                        │
│  ☑ Deadline passée                                     │
│  ☑ Non lus uniquement                                  │
└────────────────────────────────────────────────────────┘
```

### Modal Détails Email

```
┌────────────────────────────────────────────────────────┐
│  Facture n°2024-001                            [✕]    │
│                                                         │
│  De: Entreprise <contact@entreprise.fr>                │
│  Date: 10 décembre 2025 à 14:30                        │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  Bonjour,                                              │
│                                                         │
│  Veuillez trouver ci-joint la facture n°2024-001      │
│  d'un montant de 1 250,00€ pour vos services.         │
│                                                         │
│  Cordialement,                                         │
│  L'équipe Entreprise                                   │
│                                                         │
│  ───────────────────────────────────────────────────   │
│                                                         │
│  [💬 Répondre]  [✅ Marquer comme répondu]             │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 Intégration avec les Autres Fonctionnalités

### 1. Génération IA
- Clic sur "Répondre" → Pré-rempli dans SendEmail
- Contexte email transmis à l'IA
- Génération réponse adaptée au type

### 2. Analyse de Documents
- Pièces jointes détectées
- Possibilité d'analyser directement
- Lien vers page Document Analysis

### 3. Contacts
- Ajout automatique expéditeurs fréquents
- Synchronisation avec répertoire
- Statistiques croisées

### 4. Historique
- Emails envoyés marqués automatiquement
- Tracking conversation complète
- Lien bidirectionnel inbox ↔ historique

---

## 📈 Avantages et Bénéfices

### Gains de Temps

| Tâche | Avant | Après | Gain |
|-------|-------|-------|------|
| Trouver email spécifique | 5 min | 10 sec | **96%** |
| Identifier emails urgents | 10 min | 30 sec | **95%** |
| Suivre emails non répondus | Manuel | Automatique | **100%** |
| Organiser par conversation | Impossible | Automatique | **100%** |
| Statistiques d'activité | Inexistant | Temps réel | **∞** |

### Amélioration de la Productivité

- ✅ **Centralisation** : Tout au même endroit
- ✅ **Filtrage intelligent** : Trouvez ce que vous cherchez
- ✅ **Alertes deadlines** : Ne ratez plus aucun délai
- ✅ **Organisation auto** : Fils de discussion automatiques
- ✅ **Statistiques** : Comprenez votre activité

### Professionnalisme

- 📊 Temps de réponse optimisé
- 🎯 Priorisation intelligente
- 📅 Respect des délais
- 🔍 Traçabilité complète
- 💼 Gestion d'administration efficace

---

## 🔒 Sécurité et Confidentialité

### Stockage Local
- Tous les emails stockés localement en JSON
- Aucun serveur externe (sauf Gmail IMAP)
- Chiffrement des identifiants (déjà en place)

### Connexion IMAP
- SSL/TLS activé par défaut
- App Password (jamais le mot de passe principal)
- Session temporaire, pas de stockage permanent

### Données Personnelles
- Pas de partage avec des tiers
- Suppression possible à tout moment
- Contrôle total sur vos données

---

## 🐛 Dépannage

### Problème : Synchronisation échoue

**Solutions :**
1. Vérifier IMAP activé dans Gmail
2. Vérifier App Password valide
3. Vérifier connexion internet
4. Réessayer avec période plus courte (7 jours)

### Problème : Emails manquants

**Solutions :**
1. Cliquer sur "Synchroniser" manuellement
2. Augmenter période (90 jours)
3. Vérifier dossier Gmail (INBOX vs autre)

### Problème : Filtres ne fonctionnent pas

**Solutions :**
1. Actualiser la page
2. Vider la recherche texte
3. Réinitialiser tous les filtres
4. Recharger les emails

---

## 🚀 Évolutions Futures Possibles

### Court terme
- [ ] Marquage multiple (sélection masse)
- [ ] Export CSV des emails
- [ ] Recherche avancée avec regex
- [ ] Tri personnalisable

### Moyen terme
- [ ] Vue calendrier des deadlines
- [ ] Notifications desktop
- [ ] Réponses rapides prédéfinies
- [ ] Modèles de réponse

### Long terme
- [ ] Support multi-comptes
- [ ] Synchronisation bidirectionnelle
- [ ] Analyses ML avancées
- [ ] Prédiction temps de réponse

---

## 📚 Documentation Développeur

### Ajouter un Nouveau Filtre

**Backend :**
```python
# Dans inbox_manager.py, méthode filter_emails()
if filters.get('mon_nouveau_filtre'):
    filtered = [e for e in filtered if condition]
```

**Frontend :**
```javascript
// Dans Inbox.jsx, état filters
const [filters, setFilters] = useState({
  ...existingFilters,
  monNouveauFiltre: null
});

// Dans applyFilters()
if (filters.monNouveauFiltre !== null) {
  filtered = filtered.filter(e => condition);
}
```

### Ajouter un Nouveau Type d'Email

**Backend :**
```python
# Dans inbox_manager.py, méthode _detect_email_type()
elif any(word in subject_lower for word in ['nouveaux', 'mots-clés']):
    return 'nouveau_type'
```

**Frontend :**
```javascript
// Dans Inbox.jsx, fonction getTypeColor()
const colors = {
  ...existingColors,
  nouveau_type: 'bg-color-100 text-color-700'
};
```

---

## 📞 Support

Pour toute question ou problème :

1. **Documentation complète** : Ce fichier
2. **NOUVELLES_FONCTIONNALITES.md** : Vue d'ensemble
3. **Code source commenté** : `inbox_manager.py`, `Inbox.jsx`
4. **Logs** : Vérifier la console backend pour erreurs

---

## 📝 Changelog

### Version 1.0.0 (10/12/2025)
- ✅ Synchronisation Gmail via IMAP
- ✅ 9 filtres avancés
- ✅ Détection automatique de 7 types d'emails
- ✅ Organisation en fils de discussion
- ✅ 7 statistiques en temps réel
- ✅ Actions rapides (lu, répondu, tag, note)
- ✅ Calcul intelligent des deadlines
- ✅ Interface responsive complète
- ✅ 9 routes API backend

---

**🎉 Vous avez maintenant une boîte de réception professionnelle complète dans IAPosteManager !**
