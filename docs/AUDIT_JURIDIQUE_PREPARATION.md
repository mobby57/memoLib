# 📋 Dossier de Préparation - Audit Juridique Système de Preuve Légale

**Date de préparation** : 3 février 2026
**Système concerné** : MemoLib - Système de Preuve Légale
**Version** : 1.0.0
**Destinataires** : Avocat spécialisé RGPD/eIDAS

---

## 📌 Objectif de l'Audit

Obtenir une validation juridique complète du système de preuve légale MemoLib concernant :

1. **Conformité RGPD** (Règlement Général sur la Protection des Données)
2. **Valeur probante** des exports (opposabilité en justice)
3. **Respect du règlement eIDAS** (signatures électroniques)
4. **Archivage légal** (conservation 10 ans minimum)
5. **Sécurité et intégrité** des preuves générées

---

## 🎯 Périmètre du Système

### Fonctionnalités Auditées

**1. Génération de Preuves**

- Hash cryptographique SHA-256 des documents
- Horodatage via Timestamp Authority RFC 3161
- Métadonnées structurées (juridiction, raison, créateur)
- Audit trail complet (chaîne d'événements)

**2. Signatures Électroniques**

- Signature SIMPLE (basique, auto-générée)
- Signature ADVANCED (certificat + identité vérifiée)
- Signature QUALIFIED (eIDAS niveau max, opposable)
- Intégration DocuSign/Adobe Sign/Yousign

**3. Vérification d'Intégrité**

- 5 points de contrôle :
  - Hash du document inchangé
  - Signatures valides
  - Timestamp valide
  - Audit trail intact
  - Preuve non expirée

**4. Exports Multi-formats**

- JSON (technique, complet)
- PDF (lisible humain, imprimable)
- XML (standard XAdES compatible)

**5. Archivage**

- Base de données PostgreSQL
- Azure Blob Storage (optionnel)
- Rétention configurable par type de preuve

---

## 📊 Architecture Technique

### Stack Technologique

| Composant           | Technologie  | Version | Certification       |
| ------------------- | ------------ | ------- | ------------------- |
| **Frontend**        | Next.js      | 16.1.6  | -                   |
| **Backend**         | Node.js      | 20+     | -                   |
| **Base de données** | PostgreSQL   | 15+     | -                   |
| **ORM**             | Prisma       | 5.22.0  | -                   |
| **Timestamp**       | RFC 3161 TSA | -       | DigiCert/GlobalSign |
| **Signatures**      | eIDAS        | -       | DocuSign/Yousign    |
| **Chiffrement**     | AES-256-GCM  | -       | FIPS 140-2          |
| **Hash**            | SHA-256      | -       | NIST validé         |

### Schéma de Données (Prisma)

```prisma
model LegalProof {
  id                    String   @id @default(cuid())
  type                  String   // DOCUMENT, ACTION, COMMUNICATION, etc.
  content               String   // Données de la preuve (JSON)
  hash                  String   // SHA-256 du contenu
  signatures            Json     // Signatures électroniques
  timestamp             DateTime // Date/heure de création
  timestampAuthority    String?  // URL TSA
  timestampToken        String?  // Token RFC 3161
  timestampCertificat   String?  // Certificat TSA

  isValid               Boolean  @default(true)
  hashChain             String?  // Hash global de la preuve
  metadata              Json?    // Métadonnées (juridiction, raison, etc.)

  tenantId              String
  userId                String?
  dossierId             String?
  clientId              String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relations
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  user                  User?    @relation(fields: [userId], references: [id])
  dossier               Dossier? @relation(fields: [dossierId], references: [id])
  client                Client?  @relation(fields: [clientId], references: [id])

  @@index([type])
  @@index([userId])
  @@index([dossierId])
  @@index([clientId])
  @@index([tenantId])
  @@index([timestamp])
  @@index([isValid])
  @@index([createdAt])
}
```

---

## ✅ Checklist de Conformité RGPD

### Article 5 - Principes relatifs au traitement des données

- [x] **Licéité** : Consentement utilisateur obtenu via Azure AD SSO
- [x] **Limitation des finalités** : Preuves uniquement pour dossiers juridiques
- [x] **Minimisation** : Seules données nécessaires collectées
- [x] **Exactitude** : Hash garantit non-modification
- [x] **Limitation de conservation** : Rétention configurable (10 ans par défaut)
- [x] **Intégrité et confidentialité** : Chiffrement AES-256-GCM

### Article 6 - Licéité du traitement

**Base légale** : Exécution d'un contrat (Art. 6.1.b)

- Génération de preuves nécessaire pour :
  - Gestion des dossiers clients
  - Respect des délais légaux
  - Constitution de moyens de défense

**Intérêt légitime** : (Art. 6.1.f)

- Protection des droits du cabinet
- Preuve de diligence professionnelle
- Respect des obligations déontologiques

### Article 12-14 - Information des personnes

- [x] **Politique de confidentialité** : Mention du système de preuve
- [x] **Finalités** : Expliquées dans CGU
- [x] **Durée de conservation** : Indiquée (10 ans)
- [x] **Droits** : Accès, rectification, suppression documentés

### Article 15-22 - Droits des personnes

| Droit                       | Implémentation MemoLib                              |
| --------------------------- | --------------------------------------------------- |
| **Accès** (Art. 15)         | API `/api/legal/proof/list` filtrée par userId      |
| **Rectification** (Art. 16) | Nouvelle preuve générée si erreur (preuve immuable) |
| **Effacement** (Art. 17)    | Suppression possible si pas d'obligation légale     |
| **Limitation** (Art. 18)    | Flag `isValid` = false pour suspendre               |
| **Portabilité** (Art. 20)   | Export JSON complet disponible                      |
| **Opposition** (Art. 21)    | Opt-out possible via paramètres utilisateur         |

### Article 25 - Protection dès la conception

- [x] **Privacy by Design** :
  - Minimisation données
  - Pseudonymisation IDs
  - Chiffrement par défaut
  - Contrôle d'accès strict (tenant isolation)

- [x] **Privacy by Default** :
  - Preuves privées par défaut (non publiques)
  - Accès restreint au tenant
  - Logs d'accès (EventLog)

### Article 32 - Sécurité du traitement

- [x] **Chiffrement** : AES-256-GCM pour données sensibles
- [x] **Pseudonymisation** : IDs CUID au lieu de données personnelles
- [x] **Intégrité** : Hash SHA-256 + audit trail
- [x] **Disponibilité** : Backups Azure Blob quotidiens
- [x] **Tests réguliers** : Tests E2E Playwright automatisés

### Article 33-34 - Violations de données

**Procédure en cas de violation** :

1. Détection via monitoring Sentry
2. Notification CNIL sous 72h
3. Notification personnes concernées si risque élevé
4. Documentation incident dans EventLog

### Article 35 - Analyse d'impact (DPIA)

**Nécessité DPIA** : ✅ OUI

- Traitement automatisé
- Évaluation aspects personnels (dossiers juridiques)
- Surveillance systématique

**Points analysés** :

- Description traitement
- Nécessité et proportionnalité
- Risques libertés/droits
- Mesures prévues

---

## 🔐 Conformité eIDAS (Règlement UE 910/2014)

### Article 25 - Niveaux de signatures

**Implémentation MemoLib** :

| Niveau        | Article   | MemoLib             | Fournisseur      | Opposabilité |
| ------------- | --------- | ------------------- | ---------------- | ------------ |
| **Simple**    | Art. 25.1 | ✅ Type `SIMPLE`    | Interne          | Faible       |
| **Avancée**   | Art. 26   | ✅ Type `ADVANCED`  | DocuSign/Yousign | Moyenne      |
| **Qualifiée** | Art. 28   | ✅ Type `QUALIFIED` | DocuSign/Yousign | **Maximale** |

### Article 26 - Exigences signatures avancées

- [x] **Liée uniquement au signataire** : Email + nom obligatoires
- [x] **Identification du signataire** : Certificat X.509 (si QUALIFIED)
- [x] **Créée avec données sous contrôle** : API OAuth fournisseur
- [x] **Détection modification** : Hash signature + document

### Article 28 - Signatures qualifiées

**Exigences** :

- [x] Certificat qualifié (DocuSign/Yousign certifiés eIDAS)
- [x] Dispositif sécurisé (HSM fournisseur)
- [x] Équivalence signature manuscrite (Art. 25.2)

**Validation** :

- Certificat émis par prestataire qualifié (PSCE)
- Liste de confiance UE : https://eidas.ec.europa.eu/efda/tl-browser/

### Article 35 - Horodatage électronique

**RFC 3161 (TSA)** :

- [x] Lien données-temps fiable
- [x] Protection contre altération
- [x] Prestataire certifié (DigiCert, GlobalSign)

---

## ⚖️ Valeur Probante & Opposabilité

### Code Civil - Article 1366

> "L'écrit électronique a la même force probante que l'écrit sur support papier, sous réserve que puisse être dûment identifiée la personne dont il émane et qu'il soit établi et conservé dans des conditions de nature à en garantir l'intégrité."

**MemoLib respecte** :

- ✅ **Identification personne** : userId, signatures eIDAS
- ✅ **Intégrité** : Hash SHA-256, timestamp RFC 3161, audit trail
- ✅ **Conservation** : PostgreSQL + Azure Blob, 10 ans

### Code Civil - Article 1367

> "La signature nécessaire à la perfection d'un acte juridique identifie son auteur. Elle manifeste son consentement aux obligations qui découlent de cet acte. Quand elle est apposée par un officier public, elle confère l'authenticité à l'acte."

**Signatures électroniques MemoLib** :

- ✅ Type SIMPLE : Identification basique
- ✅ Type ADVANCED : Certificat numérique
- ✅ Type QUALIFIED : **Équivalent signature manuscrite** (Art. 1367 al.2)

### Code de Procédure Civile - Article 9

> "Il incombe à chaque partie de prouver conformément à la loi les faits nécessaires au succès de sa prétention."

**MemoLib fournit** :

- ✅ Preuves horodatées
- ✅ Exports PDF/XML imprimables
- ✅ Métadonnées complètes (raison, juridiction)
- ✅ Audit trail vérifiable

### Jurisprudence Pertinente

**Cour de Cassation, 1ère civ., 30 septembre 2010, n°09-68.555** :

> "Un procédé d'identification qui garantit l'intégrité du contenu de l'acte et identifie le signataire de manière fiable confère à l'acte la force probante d'un écrit."

**MemoLib garantit** :

- ✅ SHA-256 garantit intégrité
- ✅ eIDAS QUALIFIED garantit identification
- ✅ RFC 3161 garantit horodatage fiable

---

## 📦 Archivage Légal

### Durées de Conservation Légales

| Type de Document        | Durée Légale                        | MemoLib Default   |
| ----------------------- | ----------------------------------- | ----------------- |
| **Dossiers clients**    | 5 ans (prescription)                | ✅ 10 ans         |
| **Dossiers MDPH**       | Permanent                           | ✅ 10 ans minimum |
| **Correspondances**     | 5 ans                               | ✅ 10 ans         |
| **Preuves contentieux** | 10 ans (Art. 2224 CC)               | ✅ 10 ans         |
| **Factures**            | 10 ans (Art. L123-22 Code Commerce) | ✅ 10 ans         |

### Norme NF Z42-013 (Archivage Électronique)

**Exigences** :

- [x] **Intégrité** : Hash SHA-256 + vérification
- [x] **Pérennité** : PostgreSQL + Azure Blob
- [x] **Traçabilité** : Audit trail EventLog
- [x] **Sécurité** : Chiffrement AES-256-GCM
- [x] **Lisibilité** : Exports PDF/XML

**Recommandations MemoLib** :

- Backup quotidien Azure Blob Storage
- Test de restauration mensuel
- Migration format tous les 5 ans (éviter obsolescence)

---

## 🔍 Points de Validation Avocat

### 1. Conformité RGPD (Priorité 1)

**Questions à valider** :

- [ ] Base légale suffisante (Art. 6.1.b + 6.1.f) ?
- [ ] Information utilisateurs complète (Art. 13-14) ?
- [ ] Droits des personnes implémentés (Art. 15-22) ?
- [ ] Sécurité suffisante (Art. 32) ?
- [ ] DPIA réalisée ou nécessaire (Art. 35) ?

**Documents à fournir** :

- Politique de confidentialité
- CGU/CGV
- Registre des traitements
- Procédures violation de données

### 2. Valeur Probante (Priorité 1)

**Questions à valider** :

- [ ] Preuves opposables en justice (Art. 1366 CC) ?
- [ ] Signatures QUALIFIED équivalentes manuscrit (Art. 1367 CC) ?
- [ ] Métadonnées suffisantes pour procédure ?
- [ ] Format export adapté (PDF/XML) ?

**Tests à réaliser** :

- Générer preuve test
- Vérifier intégrité après 1 mois
- Exporter PDF et valider lisibilité
- Simuler contestation adversaire

### 3. eIDAS (Priorité 2)

**Questions à valider** :

- [ ] Fournisseurs certifiés (DocuSign/Yousign) ?
- [ ] Niveaux signatures conformes (Art. 25-28) ?
- [ ] Certificats valides et vérifiables ?
- [ ] Horodatage RFC 3161 conforme (Art. 35) ?

**Vérifications** :

- Liste de confiance UE : https://eidas.ec.europa.eu/efda/tl-browser/
- Certificat TSA DigiCert/GlobalSign
- Test signature QUALIFIED

### 4. Archivage (Priorité 2)

**Questions à valider** :

- [ ] Durée 10 ans suffisante ?
- [ ] Support pérenne (PostgreSQL + Azure) ?
- [ ] Norme NF Z42-013 respectée ?
- [ ] Procédure restauration testée ?

**Recommandations** :

- Politique archivage formalisée
- Procédure destruction sécurisée
- Plan migration technologique

### 5. Sécurité (Priorité 3)

**Questions à valider** :

- [ ] Chiffrement AES-256-GCM suffisant ?
- [ ] Hash SHA-256 fiable ?
- [ ] Contrôle d'accès robuste (tenant isolation) ?
- [ ] Monitoring incidents (Sentry) ?

**Tests** :

- Tentative altération preuve
- Tentative accès non autorisé
- Test restauration backup

---

## 📄 Documents à Préparer

### Pour l'Avocat

1. **Dossier Technique** (ce document)
2. **Architecture détaillée** (schémas, flux)
3. **Exemples de preuves** :
   - Preuve SIMPLE (JSON)
   - Preuve ADVANCED (PDF)
   - Preuve QUALIFIED (XML)
4. **Logs d'audit** (EventLog extraits)
5. **Politique de confidentialité**
6. **CGU/CGV**
7. **Registre des traitements RGPD**

### Internes

8. **Procédure violation données**
9. **Plan de continuité d'activité (PCA)**
10. **Tests de restauration**
11. **Formation utilisateurs**
12. **Documentation API**

---

## 💰 Budget Audit

### Estimations Avocat Spécialisé

| Prestation              | Durée      | Tarif Estimé   |
| ----------------------- | ---------- | -------------- |
| **Analyse RGPD**        | 4-6h       | €800-1200      |
| **Analyse eIDAS**       | 3-4h       | €600-800       |
| **Valeur probante**     | 2-3h       | €400-600       |
| **Archivage**           | 1-2h       | €200-400       |
| **Rapport final**       | 2h         | €400           |
| **Réunion restitution** | 2h         | €400           |
| **TOTAL**               | **14-19h** | **€2800-4400** |

**Profil recommandé** :

- Avocat spécialisé droit du numérique
- Expérience RGPD + eIDAS
- Connaissance secteur juridique
- Certifications : DPO, CIPP/E

---

## 📅 Planning Audit

### Phase 1 : Préparation (Semaine 1)

- [x] Rédaction dossier technique
- [ ] Collecte documents (CGU, politique confidentialité)
- [ ] Génération exemples preuves
- [ ] Extraction logs audit

### Phase 2 : Transmission (Semaine 1)

- [ ] Envoi dossier complet à l'avocat
- [ ] Réunion lancement (1h)
- [ ] Accès démo système (si besoin)

### Phase 3 : Audit (Semaines 2-3)

- [ ] Analyse conformité RGPD
- [ ] Analyse eIDAS
- [ ] Analyse valeur probante
- [ ] Tests techniques

### Phase 4 : Restitution (Semaine 4)

- [ ] Réception rapport préliminaire
- [ ] Réunion restitution (2h)
- [ ] Corrections/ajustements
- [ ] Rapport final

### Phase 5 : Mise en conformité (Semaines 5-6)

- [ ] Implémentation recommandations
- [ ] Tests post-corrections
- [ ] Validation finale avocat

---

## ✉️ Contact Avocat

### Critères de Sélection

**Impératif** :

- Spécialisation droit du numérique
- Expérience RGPD (3+ ans)
- Connaissance eIDAS
- Références cabinets d'avocats

**Souhaitable** :

- Certification DPO
- Formation CNIL
- Publications/conférences secteur
- Outils juridiques SaaS

### Associations/Réseaux

- **AFDIT** : Association Française des Docteurs en Droit (Tech)
- **EBEN** : European Business Ethics Network
- **CNIL** : Contacts experts
- **Ordres des Avocats** : Paris, Lyon, Marseille

---

## 📊 Annexes

### Annexe A : Exemple Preuve JSON

```json
{
  "id": "proof_cm5x9q2p40001xyz",
  "type": "DOCUMENT",
  "tenantId": "tenant_abc123",
  "entityId": "dossier_def456",
  "entityType": "dossier",
  "documentHash": "a3f5b8c2d1e9f7a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2",
  "timestamp": "2026-02-03T14:30:00.000Z",
  "timestampAuthority": {
    "name": "DigiCert TSA",
    "url": "http://timestamp.digicert.com",
    "token": "RFC3161_TOKEN_BASE64...",
    "hash": "b4g6c9d2e0f8a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3",
    "timestamp": "2026-02-03T14:30:00.000Z"
  },
  "signatures": [
    {
      "signerId": "user_ghi789",
      "signerName": "Me. Dupont",
      "signerEmail": "dupont@avocat.fr",
      "timestamp": "2026-02-03T14:35:00.000Z",
      "type": "QUALIFIED",
      "signatureHash": "c5h7d0e3f9b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6",
      "algorithm": "SHA-256",
      "certificate": "X509_CERTIFICATE_BASE64..."
    }
  ],
  "auditTrail": {
    "eventLogIds": ["evt_001", "evt_002", "evt_003"],
    "checksums": ["chk_1", "chk_2", "chk_3"]
  },
  "metadata": {
    "createdBy": "user_ghi789",
    "reason": "Recours administratif MDPH - Contestation taux incapacité",
    "jurisdiction": "FR"
  },
  "proofHash": "d6i8e1f4a7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9",
  "validationStatus": {
    "isValid": true,
    "verifiedAt": "2026-02-03T14:40:00.000Z",
    "verifiedBy": "SYSTEM",
    "errors": []
  },
  "createdAt": "2026-02-03T14:30:00.000Z",
  "updatedAt": "2026-02-03T14:35:00.000Z"
}
```

### Annexe B : Fournisseurs Certifiés

**TSA (RFC 3161)** :

- DigiCert : https://www.digicert.com/timestamp
- GlobalSign : https://www.globalsign.com/en/timestamp-service
- Sectigo : https://sectigo.com/resource-library/time-stamping-server

**Signatures eIDAS** :

- DocuSign : https://www.docusign.com/products/electronic-signature
- Yousign : https://yousign.com/ (Français, certifié eIDAS)
- Adobe Sign : https://www.adobe.com/sign.html
- Universign : https://www.universign.com/ (Français)

### Annexe C : Textes de Référence

**Européen** :

- RGPD : Règlement (UE) 2016/679
- eIDAS : Règlement (UE) 910/2014
- Directive 95/46/CE (abrogée par RGPD)

**Français** :

- Code civil : Art. 1366-1367 (preuve électronique)
- Code de procédure civile : Art. 9 (charge de la preuve)
- Loi Informatique et Libertés : Loi 78-17 modifiée

**Normes** :

- NF Z42-013 : Archivage électronique
- ISO 27001 : Sécurité de l'information
- RFC 3161 : Time-Stamp Protocol (TSP)

---

## ✅ Checklist Finale

### Avant Transmission Avocat

- [ ] Dossier technique complet (ce document)
- [ ] Exemples preuves (JSON, PDF, XML)
- [ ] CGU/Politique confidentialité
- [ ] Registre traitements RGPD
- [ ] Schéma architecture
- [ ] Tests fonctionnels réalisés
- [ ] Budget validé (€2800-4400)
- [ ] Planning défini (4-6 semaines)

### Pendant Audit

- [ ] Disponibilité équipe technique
- [ ] Accès démo si requis
- [ ] Réponse questions < 48h
- [ ] Suivi hebdomadaire

### Après Audit

- [ ] Implémentation recommandations
- [ ] Tests post-corrections
- [ ] Validation finale
- [ ] Certification/attestation obtenue
- [ ] Documentation mise à jour

---

**Document préparé par** : GitHub Copilot
**Date** : 3 février 2026
**Version** : 1.0
**Classification** : Confidentiel - Usage Avocat uniquement
