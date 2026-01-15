# TEMPLATES MÉTIERS - IA POSTE MANAGER

## 🎯 MÉTHODOLOGIE D'ADAPTATION

Le modèle IA Poste Manager (avocats CESEDA) peut être adapté à d'autres professions juridiques/réglementées selon ce template :

1. **Adapter le domaine métier** (CESEDA → autre spécialité)
2. **Adapter la Charte IA** selon les risques du métier
3. **Adapter les types de dossiers** (Recours OQTF → autres actes)
4. **Conserver l'architecture 3-tier** (SUPER_ADMIN → ADMIN → CLIENT)
5. **Ajuster les niveaux IA** selon la criticité des décisions

---

## 📋 TEMPLATE 1 : NOTAIRES

### Contexte Métier
- **Domaine** : Droit notarial (immobilier, successions, donations)
- **Actes critiques** : Ventes immobilières, testaments, contrats de mariage
- **Risques** : Erreurs juridiques, non-conformité fiscale, vice de forme

### Adaptations Schema Prisma

```prisma
model Dossier {
  id                String        @id @default(cuid())
  numero            String        @unique // Format: N-2026-001
  typeDossier       String        // "Vente immobilière", "Testament", "Donation", "Succession"
  objet             String
  statut            StatutDossier @default(brouillon)
  
  // Spécifique notaires
  montantActe       Float?        // Montant de la transaction
  fraisNotariaux    Float?        // Calcul automatique
  dateSignature     DateTime?
  lieuSignature     String?
  
  clientId          String
  client            Client        @relation(fields: [clientId], references: [id])
  
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  
  parties           Partie[]      // Vendeur, acheteur, héritiers, etc.
  actes             Acte[]
  documents         Document[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

model Partie {
  id                String   @id @default(cuid())
  role              String   // "Vendeur", "Acheteur", "Héritier", "Donateur", "Donataire"
  nom               String
  prenom            String
  dateNaissance     DateTime?
  adresse           String?
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Acte {
  id                String   @id @default(cuid())
  typeActe          String   // "Acte de vente", "Testament authentique", "Donation"
  numeroRepertoire  String   @unique
  dateActe          DateTime
  lieuSignature     String
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  fichierPDF        String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Charte IA Notaires

```markdown
# CHARTE IA - ASSISTANT NOTARIAL

## Rôle de l'IA

L'IA est un **assistant documentaire et calculateur**, JAMAIS un notaire de substitution.

### ✅ AUTORISÉ (selon niveau plan)

**Niveau 1 - Basic** :
- Recherche de modèles d'actes
- Calcul de frais notariaux (simulateur)
- Rappel de deadlines fiscales

**Niveau 2 - Premium** :
- Pré-rédaction d'actes simples (brouillon)
- Vérification de conformité cadastrale
- Génération de lettres aux parties

**Niveau 3 - Enterprise** :
- Analyse de cohérence d'actes complexes
- Détection d'incohérences juridiques
- Suggestions d'optimisation fiscale

### ❌ INTERDIT (tous niveaux)

- ❌ Signature électronique d'actes
- ❌ Validation finale d'un acte authentique
- ❌ Calcul définitif de droits de mutation sans relecture notaire
- ❌ Conseil fiscal sans validation humaine
- ❌ Modification d'un acte après signature
- ❌ Représentation d'une partie à une signature

### ⚠️ VALIDATION HUMAINE OBLIGATOIRE

Tout acte authentique doit être :
1. Relu par le notaire titulaire
2. Signé physiquement ou par signature électronique notariale
3. Enregistré au répertoire officiel par le notaire
```

### Types de Dossiers Notaires

```typescript
enum TypeDossierNotaire {
  VENTE_IMMOBILIERE = "Vente immobilière",
  SUCCESSION = "Succession",
  DONATION = "Donation",
  TESTAMENT = "Testament",
  CONTRAT_MARIAGE = "Contrat de mariage",
  PACS = "PACS",
  PROMESSE_VENTE = "Promesse de vente",
  BAIL_COMMERCIAL = "Bail commercial",
  CONSTITUTION_SOCIETE = "Constitution de société",
}
```

---

## 📋 TEMPLATE 2 : EXPERTS-COMPTABLES

### Contexte Métier
- **Domaine** : Comptabilité, fiscalité, gestion d'entreprise
- **Actes critiques** : Déclarations fiscales, bilans certifiés, audit
- **Risques** : Erreurs comptables, redressements fiscaux, sanctions

### Adaptations Schema Prisma

```prisma
model Dossier {
  id                String        @id @default(cuid())
  numero            String        @unique // Format: EC-2026-001
  typeDossier       String        // "Bilan annuel", "Liasse fiscale", "Audit", "Déclaration TVA"
  objet             String
  statut            StatutDossier @default(brouillon)
  
  // Spécifique experts-comptables
  exerciceFiscal    String        // "2025", "2025-Q1"
  siren             String?
  formeJuridique    String?       // "SARL", "SAS", "EI", "Auto-entrepreneur"
  
  clientId          String
  client            Client        @relation(fields: [clientId], references: [id])
  
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  
  ecritures         EcritureComptable[]
  declarations      Declaration[]
  documents         Document[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

model EcritureComptable {
  id                String   @id @default(cuid())
  date              DateTime
  libelle           String
  compteDebit       String   // Plan comptable (ex: 601000)
  compteCredit      String
  montant           Float
  pieceJustif       String?
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Declaration {
  id                String   @id @default(cuid())
  typeDeclaration   String   // "TVA", "IS", "CFE", "CVAE"
  periode           String   // "2025", "2025-Q1"
  montant           Float?
  dateDepot         DateTime?
  numeroDepot       String?
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Charte IA Experts-Comptables

```markdown
# CHARTE IA - ASSISTANT COMPTABLE

## Rôle de l'IA

L'IA est un **assistant de saisie et d'analyse**, JAMAIS un expert-comptable certifié.

### ✅ AUTORISÉ (selon niveau plan)

**Niveau 1 - Basic** :
- Saisie assistée d'écritures comptables
- Rapprochement bancaire automatique
- Calcul de TVA

**Niveau 2 - Premium** :
- Pré-remplissage de déclarations fiscales (brouillon)
- Détection d'anomalies comptables
- Génération de tableaux de bord

**Niveau 3 - Enterprise** :
- Analyse prédictive de trésorerie
- Optimisation fiscale suggérée
- Audit automatisé de cohérence

### ❌ INTERDIT (tous niveaux)

- ❌ Signature de bilan certifié
- ❌ Dépôt de déclaration fiscale sans relecture
- ❌ Validation finale d'un audit
- ❌ Conseil fiscal sans validation humaine
- ❌ Représentation du client devant l'administration fiscale

### ⚠️ VALIDATION HUMAINE OBLIGATOIRE

Toute déclaration fiscale/bilan doit être :
1. Relu par l'expert-comptable diplômé
2. Signé avec certificat expert-comptable
3. Déposé sous responsabilité de l'expert-comptable
```

### Types de Dossiers Experts-Comptables

```typescript
enum TypeDossierComptable {
  BILAN_ANNUEL = "Bilan annuel",
  LIASSE_FISCALE = "Liasse fiscale",
  DECLARATION_TVA = "Déclaration TVA",
  AUDIT = "Audit comptable",
  CONSEIL_FISCAL = "Conseil fiscal",
  CREATION_ENTREPRISE = "Création d'entreprise",
  CESSATION_ACTIVITE = "Cessation d'activité",
  BULLETINS_PAIE = "Bulletins de paie",
}
```

---

## 📋 TEMPLATE 3 : MÉDECINS (Télémédecine)

### Contexte Métier
- **Domaine** : Téléconsultation, suivi patients, prescriptions
- **Actes critiques** : Diagnostics, prescriptions, décisions thérapeutiques
- **Risques** : Erreurs médicales, responsabilité engagée, données de santé

### Adaptations Schema Prisma

```prisma
model Dossier {
  id                String        @id @default(cuid())
  numero            String        @unique // Format: M-2026-001
  typeDossier       String        // "Consultation", "Suivi chronique", "Urgence"
  objet             String
  statut            StatutDossier @default(brouillon)
  
  // Spécifique médecins
  motifConsultation String
  symptomes         String?
  diagnostic        String?
  traitement        String?
  
  patientId         String
  patient           Client        @relation(fields: [patientId], references: [id]) // Client = Patient
  
  medecinId         String
  medecin           User          @relation(fields: [medecinId], references: [id])
  
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  
  consultations     Consultation[]
  ordonnances       Ordonnance[]
  examens           Examen[]
  documents         Document[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

model Consultation {
  id                String   @id @default(cuid())
  dateConsultation  DateTime
  duree             Int      // en minutes
  type              String   // "Visio", "Présentiel", "Téléphone"
  
  anamnese          String?  // Histoire du patient
  examenClinique    String?
  hypotheseDiag     String?
  conclusion        String?
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Ordonnance {
  id                String   @id @default(cuid())
  dateOrdonnance    DateTime @default(now())
  medicaments       String   // JSON array ou texte
  posologie         String
  duree             String   // "7 jours", "1 mois"
  
  valide            Boolean  @default(false) // Validé par médecin
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Examen {
  id                String   @id @default(cuid())
  typeExamen        String   // "Prise de sang", "Radio", "IRM"
  prescription      String
  resultat          String?
  dateResultat      DateTime?
  
  dossierId         String
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### Charte IA Médecins

```markdown
# CHARTE IA - ASSISTANT MÉDICAL

## Rôle de l'IA

L'IA est un **assistant de documentation et d'aide à la décision**, JAMAIS un médecin de substitution.

### ✅ AUTORISÉ (selon niveau plan)

**Niveau 1 - Basic** :
- Prise de notes durant consultation
- Rappel de protocoles standards
- Calcul de dosages (adultes sains)

**Niveau 2 - Premium** :
- Suggestions de diagnostics différentiels
- Génération d'ordonnances-brouillon
- Détection d'interactions médicamenteuses

**Niveau 3 - Enterprise** :
- Analyse d'examens complémentaires
- Recommandations thérapeutiques basées sur guidelines
- Alerte sur déviations de protocoles

### ❌ INTERDIT (tous niveaux)

- ❌ Diagnostic final sans validation médecin
- ❌ Prescription automatique de médicaments
- ❌ Décision thérapeutique autonome
- ❌ Annonce de diagnostic grave sans médecin
- ❌ Modification de traitement chronique sans validation
- ❌ Gestion d'urgence vitale sans médecin

### ⚠️ VALIDATION HUMAINE OBLIGATOIRE

Toute décision médicale doit être :
1. Validée par le médecin diplômé
2. Signée avec certificat médical (RPPS)
3. Tracée dans le dossier médical sécurisé
4. Conforme au secret médical (RGPD santé)

### 🚨 URGENCES VITALES

L'IA doit IMMÉDIATEMENT alerter le médecin en cas de :
- Symptômes d'AVC, infarctus
- Détresse respiratoire
- Hémorragie active
- Perte de conscience
- Douleur thoracique aiguë
```

### Types de Dossiers Médecins

```typescript
enum TypeDossierMedical {
  CONSULTATION_GENERALE = "Consultation générale",
  SUIVI_CHRONIQUE = "Suivi maladie chronique",
  URGENCE = "Urgence",
  TELECONSULTATION = "Téléconsultation",
  RENOUVELLEMENT_ORDONNANCE = "Renouvellement ordonnance",
  CERTIFICAT_MEDICAL = "Certificat médical",
  ARRET_TRAVAIL = "Arrêt de travail",
}
```

---

## 🔧 ADAPTATION GÉNÉRIQUE

### Checklist d'Adaptation

Pour adapter IA Poste Manager à un nouveau métier :

1. **[ ] Identifier le domaine métier**
   - Quelle spécialité ?
   - Quels actes critiques ?
   - Quels risques juridiques ?

2. **[ ] Adapter le schema Prisma**
   - Renommer `Dossier.typeDossier` selon métier
   - Ajouter champs métier spécifiques
   - Créer modèles complémentaires (Partie, EcritureComptable, Ordonnance, etc.)

3. **[ ] Rédiger la Charte IA métier**
   - Définir niveaux d'autonomie IA
   - Lister actes autorisés par niveau
   - Lister interdictions absolues
   - Définir points de validation humaine obligatoire

4. **[ ] Adapter les limites de plans**
   - Basic : Combien de clients/dossiers ?
   - Premium : Quelles fonctionnalités avancées ?
   - Enterprise : Niveau IA maximal autorisé ?

5. **[ ] Adapter les dashboards**
   - Stats métier (CA, taux de réussite, délais moyens)
   - Urgences métier (deadlines fiscales, RDV patients, audiences)
   - Indicateurs de conformité

6. **[ ] Adapter les seeds**
   - Créer 3 cabinets/cliniques/études types
   - Générer dossiers types du métier
   - Créer utilisateurs test

7. **[ ] Tester la conformité**
   - Respect du secret professionnel
   - Conformité RGPD
   - Respect des ordres professionnels (Barreau, Ordre des médecins, etc.)

---

## 📊 TABLEAU COMPARATIF

| Métier | Domaine | Acte Critique | Niveau IA Max | Validation Obligatoire |
|--------|---------|---------------|---------------|------------------------|
| **Avocats CESEDA** | Immigration | Recours OQTF | 3 | Signature avocat |
| **Notaires** | Actes authentiques | Vente immobilière | 3 | Signature notaire + répertoire |
| **Experts-Comptables** | Comptabilité | Bilan certifié | 3 | Signature expert + certificat |
| **Médecins** | Télémédecine | Prescription | 3 | Signature médecin RPPS |

---

## 🎯 EXEMPLE COMPLET : HUISSIERS DE JUSTICE

```prisma
model Dossier {
  id                String        @id @default(cuid())
  numero            String        @unique // Format: H-2026-001
  typeDossier       String        // "Constat", "Signification", "Saisie", "Expulsion"
  objet             String
  statut            StatutDossier @default(brouillon)
  
  // Spécifique huissiers
  natureProcedure   String        // "Civile", "Pénale", "Commerciale"
  numeroRG          String?       // Numéro RG tribunal
  montantCreance    Float?
  
  clientId          String
  client            Client        @relation(fields: [clientId], references: [id])
  
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  
  constats          Constat[]
  significations    Signification[]
  saisies           Saisie[]
  documents         Document[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

Charte IA : **Interdiction absolue** de rédiger des procès-verbaux officiels sans validation huissier assermenté.

---

Ce template permet d'adapter IA Poste Manager à tous métiers réglementés en conservant :
- Architecture 3-tier
- Isolation tenant
- Limites par plan
- Charte IA responsable
- Validation humaine obligatoire
