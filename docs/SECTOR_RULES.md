# 📋 Règles Sectorielles — MemoLib

**Pilier #3: Multi-secteurs avec règles spécifiques**

Ce document définit les règles métier, délais légaux et exigences de preuve pour chaque secteur supporté par MemoLib.

---

## 🏛️ Secteur LEGAL (Juridique)

### Délais légaux

| Procédure            | Délai    | Base légale  | Conséquences dépassement |
| -------------------- | -------- | ------------ | ------------------------ |
| Appel jugement civil | 1 mois   | CPC art. 538 | Irrecevabilité           |
| Appel jugement pénal | 10 jours | CPP art. 498 | Irrecevabilité           |
| Pourvoi cassation    | 2 mois   | CPC art. 612 | Irrecevabilité           |
| Opposition           | 1 mois   | CPC art. 540 | Forclusion               |
| Réponse conclusions  | Variable | Ordonnance   | Sanction possible        |

### Preuves requises

- ✅ **Signature avocat** obligatoire sur actes
- ✅ **Horodatage** des dépôts électroniques (RPVA)
- ✅ **Accusé de réception** courrier recommandé
- ✅ **Certificat de non-recours** après expiration délais

### Règles spécifiques

1. **Confidentialité**: Secret professionnel (art. 66-5 Loi 31/12/1971)
2. **Conservation**: 5 ans minimum après fin dossier
3. **Archivage**: Dossiers clos doivent être archivés, pas supprimés
4. **Communication**: Toute pièce envoyée = EventLog avec destinataire

### Intégration MemoLib

```typescript
// Workflow automatique pour délais juridiques
const LEGAL_DEADLINES = {
  'appel-civil': { days: 30, strict: true },
  'appel-penal': { days: 10, strict: true },
  cassation: { days: 60, strict: true },
};

// Validation avant envoi
if (documentType === 'acte-juridique' && !signature.avocat) {
  throw new Error('Signature avocat obligatoire');
}
```

---

## 🏥 Secteur MDPH (Handicap)

### Délais légaux

| Demande                                     | Délai instruction | Base légale | Silence vaut |
| ------------------------------------------- | ----------------- | ----------- | ------------ |
| AAH (allocation adulte handicapé)           | 4 mois            | L241-3 CASF | Rejet        |
| RQTH (reconnaissance travailleur handicapé) | 4 mois            | L146-9 CASF | Rejet        |
| PCH (prestation compensation)               | 4 mois            | L146-9 CASF | Rejet        |
| Carte mobilité inclusion                    | 4 mois            | L241-3 CASF | Rejet        |

### Preuves requises

- ✅ **Certificat médical** < 6 mois (obligatoire)
- ✅ **Formulaire Cerfa** 15692*01 ou 13788*01
- ✅ **Pièces justificatives** identité + domicile
- ✅ **Accusé réception** dépôt MDPH

### Règles spécifiques

1. **Délai réclamation**: Si pas de réponse après 4 mois, droit de saisir tribunal
2. **Renouvellement**: AAH/RQTH expirent, faut renouveler 6 mois avant
3. **Confidentialité**: Données santé = catégorie spéciale RGPD
4. **Conservation**: 10 ans (données médicales)

### Intégration MemoLib

```typescript
// Validation certificat médical
if (documentType === 'certificat-medical') {
  const age = Date.now() - document.createdAt.getTime();
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
  if (age > sixMonths) {
    warnings.push('Certificat médical > 6 mois, MDPH peut refuser');
  }
}

// Alerte délai 4 mois
if (dossier.type === 'MDPH' && daysElapsed > 120) {
  alerts.push('Délai légal MDPH dépassé - droit de saisir tribunal');
}
```

---

## 🏥 Secteur MEDICAL (Santé)

### Délais légaux

| Acte                 | Délai conservation | Base légale | Exceptions        |
| -------------------- | ------------------ | ----------- | ----------------- |
| Dossier patient      | 20 ans             | CSP R1112-7 | 10 ans si décès   |
| Imagerie médicale    | 10 ans             | CSP R1112-7 | 20 ans si implant |
| Certificats médicaux | 20 ans             | CSP R1112-7 | -                 |
| Ordonnances          | 3 ans              | CSP R5132-9 | -                 |

### Preuves requises

- ✅ **Signature médecin** + numéro RPPS
- ✅ **Date de consultation** obligatoire
- ✅ **Consentement patient** pour transmission données
- ✅ **Traçabilité** accès dossier patient

### Règles spécifiques

1. **Secret médical**: Art. L1110-4 CSP - confidentialité absolue
2. **Droit accès**: Patient peut demander copie dossier sous 8 jours
3. **Hébergeur agréé**: Données santé doivent être chez HDS certifié
4. **NIR**: Numéro sécu = donnée sensible, chiffrement obligatoire

### Intégration MemoLib

```typescript
// Chiffrement données médicales
if (workspace.type === 'MEDICAL') {
  document.data = encrypt(document.data, MEDICAL_ENCRYPTION_KEY);
  auditLog.create({
    action: 'MEDICAL_DATA_ENCRYPTED',
    dataType: 'HEALTH',
    regulation: 'HDS',
  });
}

// Consentement obligatoire
if (!patient.consentementTransmission) {
  throw new Error('Consentement patient requis pour transmission');
}
```

---

## 🏛️ Secteur ADMINISTRATIVE (Administration)

### Délais légaux

| Démarche               | Délai réponse | Silence vaut | Base légale  |
| ---------------------- | ------------- | ------------ | ------------ |
| Demande acte naissance | 15 jours      | -            | -            |
| Demande CNI/passeport  | Variable      | -            | -            |
| Recours gracieux       | 2 mois        | Rejet        | Loi 2000-321 |
| Recours hiérarchique   | 2 mois        | Rejet        | Loi 2000-321 |

### Preuves requises

- ✅ **Accusé réception** (si dépôt en ligne)
- ✅ **Justificatif identité** + domicile
- ✅ **Formulaires Cerfa** selon démarche

### Règles spécifiques

1. **CADA**: Droit d'accès documents administratifs (loi 78-753)
2. **Silence valant acceptation**: Certaines démarches (loi 2000-321)
3. **Conservation**: Variable selon type acte (3 à 30 ans)

---

## 🔄 Secteur GENERAL (Par défaut)

### Délais par défaut

- **Conservation documents**: 10 ans
- **Réponse demande client**: 30 jours
- **Archivage automatique**: Après 1 an inactivité

### Preuves standards

- ✅ **Timestamp serveur** sur toute action
- ✅ **EventLog** systématique
- ✅ **Soft delete** uniquement

---

## 🔐 Règles Transversales (Tous Secteurs)

### RGPD (Règlement Général Protection Données)

1. **Finalité**: Toute donnée collectée doit avoir une finalité claire
2. **Minimisation**: Collecter uniquement données nécessaires
3. **Durée conservation**: Limitée selon secteur
4. **Droit accès**: Export données sous 30 jours
5. **Droit oubli**: Anonymisation, pas suppression physique

### eIDAS (Identification Électronique)

- **Signature simple**: Valeur probante faible
- **Signature avancée**: Équivalent signature manuscrite
- **Signature qualifiée**: Valeur juridique maximale

### RFC 3161 (Timestamp Authority)

- **Horodatage certifié**: Preuve date/heure incontestable
- **Hash SHA-256**: Garantie intégrité document

---

## 📊 Tableau Récapitulatif

| Secteur     | Délais critiques | Preuves obligatoires | Conservation | Confidentialité      |
| ----------- | ---------------- | -------------------- | ------------ | -------------------- |
| **LEGAL**   | 10j-2 mois       | Signature avocat, AR | 5 ans+       | Secret professionnel |
| **MDPH**    | 4 mois           | Certif médical <6m   | 10 ans       | Données santé        |
| **MEDICAL** | -                | Signature RPPS       | 20 ans       | Secret médical       |
| **ADMIN**   | 2 mois           | Justif identité      | Variable     | Standard             |
| **GENERAL** | 30 jours         | Timestamp            | 10 ans       | Standard             |

---

## 🚀 Implémentation dans MemoLib

### 1. Détection automatique secteur

```typescript
// src/backend/mvp_orchestrator.py
function detectSector(content: string): WorkspaceType {
  if (content.includes('MDPH') || content.includes('handicap')) return WorkspaceType.MDPH;
  if (content.includes('tribunal') || content.includes('avocat')) return WorkspaceType.LEGAL;
  // ...
}
```

### 2. Application règles secteur

```typescript
// src/lib/services/sector-rules.service.ts
const SECTOR_RULES = {
  MDPH: {
    requiredDocuments: ['certificat-medical'],
    maxCertificateAge: 6 * 30 * 24 * 60 * 60 * 1000,
    legalDeadline: 120,
  },
  LEGAL: {
    requiredSignatures: ['avocat'],
    retentionYears: 5,
    strictDeadlines: true,
  },
};
```

### 3. Génération preuves sectorielles

```typescript
// Automatique selon secteur
if (workspace.type === 'LEGAL') {
  await legalProofService.generateProofBundle({
    type: ProofType.DOCUMENT,
    entityId: documentId,
    entityType: 'document',
    jurisdiction: 'FR',
    includeTimestampAuthority: true,
    signatures: [
      {
        type: SignatureType.ADVANCED,
        signerId: avocatId,
      },
    ],
  });
}
```

---

## 📚 Références

### Légales

- Code Procédure Civile (CPC)
- Code Procédure Pénale (CPP)
- Code Santé Publique (CSP)
- Code Action Sociale et Familles (CASF)

### Réglementaires

- RGPD: Règlement UE 2016/679
- eIDAS: Règlement UE 910/2014
- RFC 3161: Internet X.509 PKI Time-Stamp Protocol

### MemoLib

- [BUSINESS_RULES.md](BUSINESS_RULES.md) - Règles métier globales
- [EVENTLOG_IMPLEMENTATION.md](implementation/EVENTLOG_IMPLEMENTATION.md) - Traçabilité
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture système

---

**Dernière mise à jour**: 3 février 2026
**Responsable**: GitHub Copilot
**Validation**: À valider par expert juridique
