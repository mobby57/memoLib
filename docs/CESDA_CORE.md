# 📘 IA POSTE MANAGER — CŒUR CESDA

**Document d'intégration unique (fonctionnel + prompts)**

---

## 1️⃣ CHECKLISTS JURIDIQUES AUTOMATIQUES (CESDA)

> Objectif :
> 👉 Permettre à l'IA de **ne rien oublier**, **sans jamais décider à la place de l'avocat**.

---

### 🟥 WORKSPACE OQTF — Checklist

**Vérifications automatiques**

* ☐ Type d'OQTF (avec / sans délai)
* ☐ Date de notification
* ☐ Mode de notification (main propre / courrier)
* ☐ Délai de recours applicable

**Pièces attendues**

* ☐ Décision OQTF
* ☐ Preuve de notification
* ☐ Passeport / identité
* ☐ Justificatifs de présence en France
* ☐ Situation familiale

**Alertes**

* 🔴 Délai < 48h
* 🔴 Pièce critique manquante

---

### 🟧 REFUS / RETRAIT DE TITRE

* ☐ Type de titre refusé
* ☐ Motif administratif exact
* ☐ Date décision
* ☐ Voies de recours possibles

Pièces :

* Décision préfectorale
* Historique de séjour
* Justificatifs actuels

---

### 🟨 ASILE

* ☐ Stade (OFPRA / CNDA)
* ☐ Langue requise
* ☐ Vulnérabilité détectée
* ☐ Délai actif

Pièces :

* Décisions précédentes
* Récits existants
* Convocations

---

### 🟦 REGROUPEMENT FAMILIAL

* ☐ Statut du demandeur
* ☐ Ressources
* ☐ Logement
* ☐ Composition familiale

---

### 🟩 NATURALISATION

* ☐ Ancienneté séjour
* ☐ Type procédure
* ☐ Blocages potentiels
* ☐ Dossiers incomplets

---

## 2️⃣ PROMPTS IA CESDA (À COLLER TELS QUELS)

### 🔒 PROMPT SYSTÈME GLOBAL (OBLIGATOIRE)

```
Tu es IA Poste Manager.
Tu es un assistant de préparation juridique.
Tu n'as PAS le droit de :
- donner un avis juridique définitif
- prendre une décision
- engager la responsabilité d'un cabinet

Tu aides à organiser, structurer, alerter et préparer.
Toute situation critique doit être signalée à un humain.
```

---

### 📥 PROMPT ANALYSE MAIL ENTRANT

```
Analyse ce mail entrant.
Identifie :
- le type de procédure CESDA
- le niveau d'urgence
- les délais potentiels
- les pièces mentionnées ou manquantes

Crée un Workspace adapté.
Ne propose aucune décision juridique.
```

---

### 🧩 PROMPT FORMULAIRE CLIENT

```
Génère un formulaire clair et accessible.
Pose uniquement des questions factuelles.
Adapte le langage à un public non-juriste.
Accessibilité prioritaire (malvoyants, handicap).
```

---

### ✍️ PROMPT BROUILLON (STRICT)

```
Prépare un brouillon de document juridique.
Ne jamais conclure.
Utilise des formulations conditionnelles.
Ajoute systématiquement :
"Ce document nécessite validation humaine."
```

---

### ⚠️ PROMPT ALERTE

```
Détecte tout délai légal actif ou dépassé.
Classe le risque : faible / moyen / élevé / critique.
Alerte immédiatement si critique.
```

---

## 3️⃣ MOTEUR DE DÉLAIS LÉGAUX (LOGIQUE MÉTIER)

### 🎯 Principe

> Le **temps est l'ennemi n°1** en CESDA.

---

### 🧠 Fonctionnement

* Extraction automatique des dates
* Calcul selon type de procédure
* Compte à rebours visible
* Blocage automatique si délai expiré

---

### 📊 Exemple logique

```ts
if (procedure === "OQTF" && hours_remaining < 48) {
  risk_level = "critique"
  notifyHuman = true
}
```

---

### UI

* 🔴 Compteur rouge
* ⏱️ Heures restantes
* ⚠️ Message clair :
  *"Action humaine immédiate requise"*

---

## 4️⃣ MAPPING CESDA → PLANS (BUSINESS & TECH)

### 🟢 BASIC

* 1 type de Workspace
* Analyse mail simple
* Checklist
* Pas de brouillon long
* Pas d'IA externe

👉 Solo, petits cabinets

---

### 🟠 PREMIUM

* Tous Workspaces CESDA
* Moteur délais
* Formulaires adaptatifs
* Brouillons complets
* IA externe autorisée

👉 Cabinets actifs CESDA

---

### 🔴 ENTERPRISE

* Multi-cabinets
* Multi-pays
* Analytics
* IA locale dédiée
* Paramétrage fin des coûts

👉 Cabinets structurés / réseaux

---

## 5️⃣ VISION PRODUIT (IMPORTANT)

👉 **IA Poste Manager =**

* le **premier salarié numérique**
* jamais malade
* jamais distrait
* jamais hors délai
* jamais hors cadre juridique

Mais **toujours supervisé**.

---

## 6️⃣ IMPLÉMENTATION TECHNIQUE

### Types TypeScript

```typescript
enum ProcedureType {
  OQTF = "OQTF",
  REFUS_TITRE = "REFUS_TITRE",
  ASILE = "ASILE",
  REGROUPEMENT_FAMILIAL = "REGROUPEMENT_FAMILIAL",
  NATURALISATION = "NATURALISATION"
}

enum RiskLevel {
  FAIBLE = "faible",
  MOYEN = "moyen",
  ELEVE = "eleve",
  CRITIQUE = "critique"
}

interface CesdaChecklist {
  procedureType: ProcedureType
  verifications: ChecklistItem[]
  pieces: ChecklistItem[]
  alertes: Alert[]
  deadline?: Date
}

interface ChecklistItem {
  label: string
  completed: boolean
  required: boolean
}

interface Alert {
  level: RiskLevel
  message: string
  timestamp: Date
}
```

### Logique de calcul des délais

```typescript
function calculateDeadline(
  procedureType: ProcedureType,
  notificationDate: Date
): { deadline: Date; hoursRemaining: number; riskLevel: RiskLevel } {
  const now = new Date()
  let deadline: Date

  switch (procedureType) {
    case ProcedureType.OQTF:
      // 48h pour OQTF sans délai
      deadline = new Date(notificationDate.getTime() + 48 * 60 * 60 * 1000)
      break
    case ProcedureType.REFUS_TITRE:
      // 2 mois pour refus de titre
      deadline = new Date(notificationDate)
      deadline.setMonth(deadline.getMonth() + 2)
      break
    // Autres cas...
    default:
      deadline = new Date(notificationDate)
  }

  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  let riskLevel: RiskLevel
  if (hoursRemaining < 0) riskLevel = RiskLevel.CRITIQUE
  else if (hoursRemaining < 48) riskLevel = RiskLevel.CRITIQUE
  else if (hoursRemaining < 168) riskLevel = RiskLevel.ELEVE
  else if (hoursRemaining < 720) riskLevel = RiskLevel.MOYEN
  else riskLevel = RiskLevel.FAIBLE

  return { deadline, hoursRemaining, riskLevel }
}
```

---

## 7️⃣ RÈGLES DE SÉCURITÉ JURIDIQUE

### ⚖️ Disclaimers obligatoires

Tout document généré doit inclure :

```
⚠️ DOCUMENT PRÉPARATOIRE
Ce document a été généré automatiquement par IA Poste Manager.
Il nécessite IMPÉRATIVEMENT une validation par un avocat avant utilisation.
Aucune décision juridique n'a été prise de manière autonome.
```

### 🔐 Limites de l'IA

L'IA **NE PEUT PAS** :
- Signer un document
- Valider une stratégie juridique
- Prendre contact avec une administration
- Garantir un résultat
- Remplacer l'analyse humaine

L'IA **PEUT** :
- Organiser les informations
- Suggérer des vérifications
- Alerter sur des délais
- Préparer des brouillons
- Structurer des dossiers

---

## 8️⃣ PROCHAINES ÉTAPES

### Options disponibles :

1. 🎨 **Carte graphique UI/UX complète** — Interface utilisateur détaillée
2. 🧠 **Prompts "avocat senior CESDA"** — Prompts avancés pour analyse juridique
3. 🧩 **Schéma base de données final** — Structure Prisma complète
4. 📄 **CGU & disclaimers juridiques** — Documents légaux et conformité

---

**Document créé le 01/01/2026**
**Version 1.0 — IA Poste Manager CESDA Core**
