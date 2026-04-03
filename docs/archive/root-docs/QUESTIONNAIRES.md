# 📋 Système de Questionnaires Dynamiques - MemoLib

## Vue d'ensemble

Le système de questionnaires permet de définir des listes de questions à remplir pour chaque type d'événement, guidant les utilisateurs dans la clôture correcte des dossiers.

## Fonctionnalités

### ✅ Questionnaires par Type d'Événement
- Questions automatiques selon le type d'email/événement
- Filtrage par tags (urgent, client, famille, etc.)
- Questions obligatoires et optionnelles
- Types de réponses: texte, choix multiple, booléen, nombre, date

### ✅ Workflow de Clôture
- Questionnaires présentés lors de la clôture d'événements
- Suivi des réponses complétées
- Historique des réponses par dossier
- Validation des champs obligatoires

## Structure des Données

### Questionnaire
```csharp
public class Questionnaire
{
    public Guid Id { get; set; }
    public string Name { get; set; }           // "Clôture Email Client"
    public string Description { get; set; }    // Description du questionnaire
    public string EventType { get; set; }      // "EMAIL", "CALL", etc.
    public string Tags { get; set; }           // "urgent,client,famille"
    public bool IsActive { get; set; }         // Actif/Inactif
    public List<Question> Questions { get; set; }
}
```

### Question
```csharp
public class Question
{
    public Guid Id { get; set; }
    public string Text { get; set; }           // "Le client a-t-il été satisfait?"
    public string Type { get; set; }           // TEXT, CHOICE, BOOLEAN, NUMBER, DATE
    public string Options { get; set; }        // JSON: ["Oui","Non","Partiellement"]
    public bool IsRequired { get; set; }       // Obligatoire
    public int Order { get; set; }             // Ordre d'affichage
}
```

## API Endpoints

### Récupérer les questionnaires pour un événement
```http
GET /api/questionnaire/for-event/{eventId}
```

**Réponse:**
```json
[
  {
    "id": "guid",
    "name": "Clôture Email Client",
    "description": "Questions pour clôturer un email client",
    "questions": [
      {
        "id": "guid",
        "text": "Le client a-t-il été satisfait de la réponse?",
        "type": "CHOICE",
        "options": ["Oui", "Non", "Partiellement"],
        "isRequired": true,
        "order": 1
      }
    ],
    "isCompleted": false
  }
]
```

### Soumettre une réponse
```http
POST /api/questionnaire/response
Content-Type: application/json

{
  "questionnaireId": "guid",
  "caseId": "guid",
  "eventId": "guid",
  "answers": {
    "question-guid-1": "Oui",
    "question-guid-2": "true",
    "question-guid-3": "2024-12-31"
  }
}
```

### Récupérer les réponses d'un dossier
```http
GET /api/questionnaire/case/{caseId}/responses
```

## Questionnaires par Défaut

### 1. Clôture Email Client
**Déclencheur:** EventType = "EMAIL", Tags contient "client"

**Questions:**
1. Le client a-t-il été satisfait de la réponse? (Choix: Oui/Non/Partiellement) *Obligatoire*
2. Une action de suivi est-elle nécessaire? (Booléen) *Obligatoire*
3. Date de suivi prévue (Date) *Optionnel*
4. Commentaires additionnels (Texte) *Optionnel*

### 2. Clôture Dossier Urgent
**Déclencheur:** EventType = "EMAIL", Tags contient "urgent"

**Questions:**
1. Tous les documents ont-ils été archivés? (Booléen) *Obligatoire*
2. Le client a-t-il été informé de la clôture? (Booléen) *Obligatoire*
3. Facturation effectuée? (Choix: Oui/Non/En cours) *Obligatoire*
4. Temps passé (heures) (Nombre) *Optionnel*

## Workflow d'Utilisation

### 1. Création automatique
Lors de la réception d'un email, le système:
- Crée l'événement
- Identifie le type et les tags
- Associe les questionnaires correspondants

### 2. Interface utilisateur
L'utilisateur voit:
- Les questionnaires à compléter pour chaque événement
- Le statut (complété/non complété)
- Les questions avec leurs types de réponse

### 3. Clôture guidée
Avant de clôturer un dossier:
- Vérification des questionnaires obligatoires
- Affichage des questions non répondues
- Validation des réponses requises

## Configuration

### Créer un nouveau questionnaire
```csharp
var questionnaire = new Questionnaire
{
    Name = "Clôture Consultation",
    Description = "Questions pour les consultations",
    EventType = "EMAIL",
    Tags = "consultation",
    Questions = new List<Question>
    {
        new Question
        {
            Text = "Durée de la consultation (minutes)",
            Type = "NUMBER",
            IsRequired = true,
            Order = 1
        }
    }
};
```

### Types de questions supportés
- **TEXT**: Texte libre
- **CHOICE**: Choix multiple (options en JSON)
- **BOOLEAN**: Oui/Non
- **NUMBER**: Nombre
- **DATE**: Date

## Avantages

### ✅ Clôture Complète
- Garantit que toutes les informations importantes sont collectées
- Évite les oublis lors de la clôture des dossiers
- Standardise le processus de clôture

### ✅ Traçabilité
- Historique complet des réponses
- Audit des actions de clôture
- Données structurées pour les rapports

### ✅ Flexibilité
- Questionnaires adaptés par type d'événement
- Questions conditionnelles par tags
- Configuration dynamique sans code

## Intégration Interface

### JavaScript - Récupérer les questionnaires
```javascript
async function getQuestionnaires(eventId) {
    const response = await fetch(`/api/questionnaire/for-event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
}
```

### JavaScript - Soumettre les réponses
```javascript
async function submitAnswers(questionnaireId, caseId, eventId, answers) {
    const response = await fetch('/api/questionnaire/response', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            questionnaireId,
            caseId,
            eventId,
            answers
        })
    });
    return await response.json();
}
```

## Migration

Pour ajouter le système à une base existante:

```bash
# 1. Créer la migration
dotnet ef migrations add AddQuestionnaires

# 2. Appliquer la migration
dotnet ef database update

# 3. Les questionnaires par défaut sont créés automatiquement au démarrage
```

## Cas d'Usage

### Scenario 1: Email Client Urgent
1. Email reçu avec tags "client,urgent"
2. Système propose 2 questionnaires:
   - "Clôture Email Client"
   - "Clôture Dossier Urgent"
3. Utilisateur complète les questions
4. Dossier peut être clôturé proprement

### Scenario 2: Suivi Qualité
1. Manager consulte les réponses aux questionnaires
2. Analyse la satisfaction client
3. Identifie les dossiers nécessitant un suivi
4. Génère des rapports de qualité

Ce système garantit une clôture complète et traçable de tous les événements dans MemoLib.