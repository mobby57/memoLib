# Formulaires Dynamiques CESEDA - Guide Complet

## 📋 Vue d'ensemble

Le système de formulaires dynamiques adapte automatiquement les champs affichés en fonction du type de dossier CESEDA sélectionné. Chaque procédure (OQTF, Asile, Titre de Séjour, Naturalisation, Regroupement Familial) a ses propres champs spécifiques avec validation contextuelle.

## 🎯 Objectifs

- **Précision juridique** : Champs adaptés aux exigences réelles de chaque procédure
- **Gain de temps** : Formulaires pré-remplis avec les informations pertinentes
- **Conformité CESEDA** : Respect des articles et fondements juridiques
- **Aide contextuelle** : Informations sur les délais et documents requis
- **Validation intelligente** : Champs obligatoires selon le contexte

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── components/
│   └── dossiers/
│       ├── EtapeTypeDossier.tsx       # Sélection du type
│       └── CesedaSpecificFields.tsx   # Formulaires spécifiques ⭐
├── app/
│   └── dossiers/
│       └── nouveau/
│           └── page.tsx                # Wizard principal
```

### Composant principal : `CesedaSpecificFields.tsx`

```typescript
<CesedaSpecificFields />
  ├── FormulaireOQTF          // Recours contre OQTF
  ├── FormulaireAsile         // Demande d'asile
  ├── FormulaireTitreSejour   // Titre de séjour
  ├── FormulaireNaturalisation // Naturalisation française
  └── FormulaireRegroupementFamilial // Regroupement familial
```

## 📝 Formulaires par type de dossier

### 1. OQTF (Obligation de Quitter le Territoire Français)

**Champs spécifiques :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `type` | Radio | ✅ | Sans délai / 30 jours |
| `dateNotification` | Date | ✅ | Date de remise de l'OQTF |
| `modeNotification` | Select | ✅ | Main propre / Courrier / Préfecture |
| `numeroArrete` | Text | ❌ | Numéro préfectoral |
| `prefecture` | Text | ✅ | Préfecture émettrice |
| `interdictionRetour` | Checkbox | ❌ | IRTF associée |
| `dureeInterdiction` | Select | ❌ | 1 an / 2 ans / 3 ans / + |
| `paysDestination` | Text | ❌ | Pays de renvoi prévu |
| `situationParticuliere` | Select | ❌ | Enfants / Conjoint FR / Santé |
| `contexte` | Textarea | ❌ | Circonstances de la notification |

**Délais critiques affichés :**
- ⚠️ **48 heures** : Référé-liberté et référé-suspension (OQTF sans délai)
- 📅 **30 jours** : Recours gracieux préfecture
- 📅 **2 mois** : Recours contentieux Tribunal Administratif

**Couleur du formulaire :** 🔴 Rouge (urgence critique)

---

### 2. Asile (Demande d'Asile et Protection Internationale)

**Champs spécifiques :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `typeDemande` | Radio | ✅ | Première demande / Réexamen / Recours CNDA |
| `dateEnregistrement` | Date | ❌ | Date OFPRA |
| `numeroOfpra` | Text | ❌ | Numéro de dossier OFPRA |
| `paysOrigine` | Text | ✅ | Pays de fuite |
| `dateFuite` | Date | ❌ | Date de départ |
| `procedure` | Radio | ❌ | Normale / Accélérée / Dublin |
| `motifs.*` | Checkboxes | ❌ | Politique / Religion / Race / Groupe social / Orientation sexuelle |
| `recitSynthetique` | Textarea | ❌ | Synopsis du récit |
| `hebergement` | Select | ❌ | CADA / HUDA / Hôtel / Famille / Rue |
| `attestationDemande` | Checkbox | ❌ | Possession de l'attestation |

**Étapes de procédure affichées :**
1. Enregistrement préfecture (guichet unique)
2. Dépôt dossier OFPRA (récit + documents)
3. Convocation entretien OFPRA
4. Décision OFPRA
5. Si rejet : Recours CNDA dans 1 mois

**Couleur du formulaire :** 🟠 Orange (haute priorité)

---

### 3. Titre de Séjour

**Champs spécifiques :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `natureDemande` | Radio | ✅ | Première demande / Renouvellement / Changement statut |
| `fondement` | Select | ✅ | Article CESEDA (L423-23, L421-1, L422-1, etc.) |
| `dateExpiration` | Date | ⚠️ | Si renouvellement |
| `numeroTitreActuel` | Text | ❌ | Si renouvellement |
| `typeContrat` | Select | ⚠️ | Si fondement travail (CDI/CDD/Intérim) |
| `salaireMensuel` | Number | ❌ | Si fondement travail |
| `nomEmployeur` | Text | ❌ | Si fondement travail |
| `etablissement` | Text | ⚠️ | Si étudiant |
| `niveauEtudes` | Select | ❌ | Licence / Master / Doctorat |
| `membreFamille` | Text | ❌ | Si vie privée et familiale |
| `prefecture` | Text | ✅ | Préfecture de dépôt |
| `dateRendezVous` | Date | ❌ | RDV préfecture |
| `recepisse` | Checkbox | ❌ | Récépissé obtenu |

**Fondements juridiques disponibles :**

- **Vie privée et familiale :**
  - L.423-23 : Conjoint de Français
  - L.423-1 : Parent d'enfant français
  - L.435-1 : 10 ans de résidence
  - L.425-9 : Jeune majeur entré mineur

- **Travail :**
  - L.421-1 : Salarié
  - L.421-5 : Travailleur temporaire
  - L.421-10 : Entrepreneur

- **Études :**
  - L.422-1 : Étudiant
  - L.422-10 : Stagiaire

- **Santé :**
  - L.425-10 : Étranger malade

**Couleur du formulaire :** 🔵 Bleu (normal)

---

### 4. Naturalisation

**Champs spécifiques :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `mode` | Radio | ✅ | Décret / Mariage / Parent enfant FR |
| `dateArrivee` | Date | ✅ | Date d'arrivée en France |
| `anneesResidence` | Number | ❌ | Nombre d'années (min 5) |
| `titresSejour` | Textarea | ❌ | Historique des titres |
| `niveauFrancais` | Select | ✅ | B1 oral / B2 / C1 / C2 |
| `organismeCertif` | Text | ❌ | TCF / DELF / DALF |
| `situationPro` | Select | ✅ | CDI / CDD / Indépendant / Chômage |
| `revenusAnnuels` | Number | ❌ | Revenus annuels (€) |
| `casierVierge` | Checkbox | ❌ | Casier judiciaire vierge |
| `assimilation` | Textarea | ❌ | Éléments d'intégration |
| `prefecture` | Text | ✅ | Préfecture de dépôt |
| `dateDepot` | Date | ❌ | Date de dépôt |
| `entretienPasse` | Checkbox | ❌ | Entretien fait |
| `dateEntretien` | Date | ❌ | Date de l'entretien |

**Conditions principales affichées :**
- ✅ **Résidence** : 5 ans minimum
- ✅ **Langue** : Niveau B1 oral certifié
- ✅ **Ressources** : Stables et suffisantes
- ✅ **Assimilation** : Connaissance France
- ✅ **Moralité** : Casier vierge
- ⏱️ **Délai** : 12-18 mois

**Couleur du formulaire :** 🟣 Indigo (procédure longue)

---

### 5. Regroupement Familial

**Champs spécifiques :**

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `conjoint` | Checkbox | ✅ | Faire venir conjoint |
| `enfants` | Checkbox | ✅ | Faire venir enfants |
| `nombreEnfants` | Number | ⚠️ | Si enfants cochés |
| `dureeResidence` | Number | ✅ | En mois (min 18) |
| `titreSejour` | Text | ❌ | Type de titre actuel |
| `revenusMensuels` | Number | ✅ | Revenus nets (≥ SMIC) |
| `typeEmploi` | Select | ❌ | CDI / CDD long / Indépendant |
| `typeLogement` | Select | ✅ | Propriétaire / Locataire / Hébergé |
| `surfaceLogement` | Number | ✅ | En m² |
| `nombrePieces` | Number | ❌ | Nombre de pièces |
| `logementDecent` | Checkbox | ❌ | Conforme normes |
| `visiteEffectuee` | Checkbox | ❌ | Visite OFII faite |
| `dateVisite` | Date | ⚠️ | Si visite effectuée |
| `resultatVisite` | Select | ⚠️ | Favorable / Réserves / Défavorable |
| `prefecture` | Text | ✅ | Préfecture |
| `dateDepot` | Date | ❌ | Date de dépôt |
| `observations` | Textarea | ❌ | Observations |

**Conditions affichées :**
- 🏠 **Résidence** : 18 mois minimum régulière
- 💰 **Ressources** : ≥ SMIC (stables)
- 🏡 **Logement** : Surface minimale + visite OFII
- ⏱️ **Délai** : 6 mois + visite
- 👨‍👩‍👧 **Famille** : Conjoint + enfants mineurs

**Couleur du formulaire :** 🟢 Vert (familial)

---

## 🔄 Flux d'utilisation

### Wizard multi-étapes

```
Étape 0: Type de Dossier
   ↓
Étape 1: Infos Spécifiques CESEDA ⭐ NOUVEAU
   ↓
Étape 2: Identité
   ↓
Étape 3: Situation
   ↓
Étape 4: Professionnel
   ↓
Étape 5: Administratif
   ↓
Étape 6: Documents
   ↓
Étape 7: Validation
```

### Logique conditionnelle

```typescript
// L'utilisateur sélectionne "RECOURS_OQTF" à l'étape 0
typeDossier = 'RECOURS_OQTF'

// À l'étape 1, le composant CesedaSpecificFields affiche :
<FormulaireOQTF />
  // Formulaire rouge avec champs OQTF
  // Délais critiques (48h référé)
  // Informations sur IRTF
  // Aide contextuelle

// Les données sont stockées dans metadata.oqtf.*
{
  typeDossier: 'RECOURS_OQTF',
  metadata: {
    oqtf: {
      type: 'sans_delai',
      dateNotification: '2026-01-05',
      modeNotification: 'main_propre',
      interdictionRetour: true,
      dureeInterdiction: '2_ans',
      // ...
    }
  }
}
```

## 💾 Stockage des données

### Structure en base de données

Les données spécifiques CESEDA sont stockées dans le champ `metadata` (JSON) du modèle `Dossier` :

```prisma
model Dossier {
  id              String   @id @default(uuid())
  typeDossier     String   // "OQTF", "Asile", "TitreSejour", etc.
  metadata        Json?    // ⭐ Données dynamiques par type
  // ... autres champs
}
```

### Exemple de metadata pour OQTF

```json
{
  "oqtf": {
    "type": "sans_delai",
    "dateNotification": "2026-01-05",
    "modeNotification": "main_propre",
    "numeroArrete": "2026-PREF-00123",
    "prefecture": "Préfecture du Val-de-Marne",
    "interdictionRetour": true,
    "dureeInterdiction": "2_ans",
    "motifInterdiction": "Séjour irrégulier",
    "paysDestination": "Algérie",
    "situationParticuliere": "enfants_scolarises",
    "contexte": "Contrôle d'identité dans le RER. OQTF notifiée à la PAF de Roissy."
  }
}
```

### Exemple de metadata pour Asile

```json
{
  "asile": {
    "typeDemande": "premiere_demande",
    "dateEnregistrement": "2025-12-15",
    "numeroOfpra": "25012345",
    "paysOrigine": "Syrie",
    "dateFuite": "2025-11-20",
    "procedure": "normale",
    "motifs": {
      "politique": true,
      "religion": false,
      "race": false,
      "groupe_social": true
    },
    "recitSynthetique": "Journaliste ayant critiqué le régime. Menaces et tentative d'arrestation en novembre 2025...",
    "hebergement": "cada",
    "attestationDemande": true
  }
}
```

## 🎨 UI/UX Features

### Codes couleur par type

| Type | Couleur | Classe CSS | Signification |
|------|---------|-----------|---------------|
| OQTF | 🔴 Rouge | `bg-red-50 border-red-200` | Urgence critique |
| Asile | 🟠 Orange | `bg-orange-50 border-orange-200` | Haute priorité |
| Titre de Séjour | 🔵 Bleu | `bg-blue-50 border-blue-200` | Normal |
| Naturalisation | 🟣 Indigo | `bg-indigo-50 border-indigo-200` | Procédure longue |
| Regroupement | 🟢 Vert | `bg-green-50 border-green-200` | Familial |

### Aide contextuelle

Chaque formulaire inclut un encadré bleu avec :
- ✅ Délais de recours
- ✅ Documents requis
- ✅ Étapes de la procédure
- ✅ Conditions légales

Exemple :
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start gap-2">
    <Info className="w-5 h-5 text-blue-600" />
    <div className="text-sm text-blue-900">
      <p className="font-medium mb-1">Délais de recours critiques :</p>
      <ul className="list-disc list-inside space-y-1">
        <li><strong>48 heures</strong> : Référé-liberté</li>
        <li><strong>2 mois</strong> : Recours contentieux TA</li>
      </ul>
    </div>
  </div>
</div>
```

### Champs conditionnels

Les champs s'affichent dynamiquement selon les réponses :

```typescript
// Si IRTF cochée → afficher durée et motif
{watch('metadata.oqtf.interdictionRetour') && (
  <>
    <SelectField name="dureeInterdiction" />
    <TextField name="motifInterdiction" />
  </>
)}

// Si renouvellement titre → afficher date expiration
{watch('metadata.titreSejour.natureDemande') === 'renouvellement' && (
  <DateField name="dateExpiration" required />
)}
```

## ✅ Validation

### Validation Zod

Les champs spécifiques sont dans `metadata: z.record(z.any()).optional()` car ils varient selon le type.

La validation est **optionnelle** à l'étape 1 (CESEDA-specific) pour permettre de passer à l'étape suivante même sans remplir tous les champs spécifiques.

```typescript
function getChampsEtape(etape: number): string[] {
  const etapesChamps: Record<number, string[]> = {
    0: ['typeDossier', 'objetDemande', 'priorite'],
    1: [], // ← CESEDA-specific fields optionnels
    2: ['nom', 'prenom', 'dateNaissance', ...],
    // ...
  }
  return etapesChamps[etape] || []
}
```

### Validation côté API

L'API `/api/dossiers` (POST) devrait valider que :
- Si `typeDossier === 'RECOURS_OQTF'`, alors `metadata.oqtf` est présent
- Si `metadata.oqtf.interdictionRetour === true`, alors `dureeInterdiction` est requis
- etc.

## 🚀 Utilisation

### Pour l'avocat (ADMIN)

1. Aller sur `/dossiers/nouveau`
2. Sélectionner le type de dossier (ex: "Recours OQTF")
3. Remplir les champs spécifiques OQTF (type, date notification, etc.)
4. Continuer avec identité, situation, etc.
5. Soumettre le dossier

### Pour le client (CLIENT)

Les clients ne créent généralement pas de dossiers eux-mêmes, mais l'avocat peut partager le formulaire pré-rempli pour validation.

## 📊 Statistiques

Les champs spécifiques permettent de générer des statistiques précises :

- **OQTF** : Combien sans délai vs 30 jours ? Taux d'IRTF ?
- **Asile** : Pays d'origine les plus fréquents ? Motifs de persécution ?
- **Titre de Séjour** : Fondements juridiques utilisés ? Taux de renouvellement ?
- **Naturalisation** : Délais d'instruction moyens ? Taux d'acceptation après entretien ?

## 🔮 Évolutions futures

### Phase 2 (Q2 2026)

- [ ] **Auto-complétion intelligente** : Suggérer préfecture selon code postal
- [ ] **Templates prédéfinis** : "OQTF standard", "Asile Syrie", etc.
- [ ] **Calcul automatique des délais** : Date notification → Date limite recours
- [ ] **Validation temps réel** : Vérifier numéro OFPRA auprès de l'API
- [ ] **Export PDF pré-rempli** : Générer formulaires administratifs

### Phase 3 (Q3 2026)

- [ ] **IA de remplissage** : Analyser document scanné et pré-remplir champs
- [ ] **Rappels automatiques** : Email/SMS avant expiration délais
- [ ] **Dossiers liés** : OQTF → Demande titre séjour automatique
- [ ] **Statistiques avancées** : Taux de réussite par type et fondement

## 🐛 Troubleshooting

### Les champs spécifiques ne s'affichent pas

```typescript
// Vérifier que l'import est correct
import { CesedaSpecificFields } from '@/components/dossiers/CesedaSpecificFields'

// Vérifier que le composant est bien rendu à l'étape 1
{etapeActive === 1 && <CesedaSpecificFields />}

// Vérifier que le type de dossier est défini
const typeDossier = watch('typeDossier')
console.log('Type:', typeDossier) // Doit afficher "RECOURS_OQTF", etc.
```

### Les données metadata ne sont pas sauvegardées

```typescript
// Vérifier que le schema inclut metadata
const dossierSchema = z.object({
  // ...
  metadata: z.record(z.any()).optional(), // ← Important
})

// Vérifier que le formulaire register bien les champs
<input {...register('metadata.oqtf.type')} />
```

### Erreur TypeScript "Property 'metadata' does not exist"

```typescript
// Ajouter metadata au type DossierFormData
type DossierFormData = z.infer<typeof dossierSchema> // Inclut metadata
```

## 📚 Ressources

- **CESEDA** : Code de l'Entrée et du Séjour des Étrangers et du Droit d'Asile
- **Formulaires CERFA** : https://www.service-public.fr/
- **OFPRA** : https://www.ofpra.gouv.fr/
- **Légifrance** : https://www.legifrance.gouv.fr/

---

**Version** : 1.0  
**Date** : 6 janvier 2026  
**Auteur** : Système iaPostemanage  
**Statut** : ✅ Production Ready
