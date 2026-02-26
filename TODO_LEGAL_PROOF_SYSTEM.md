# 📋 TODO: Système de Preuve Légale - MemoLib

## ✅ Tâches Complétées (1-3)

### 1. ✅ Ajouter table LegalProof au schéma Prisma

**Statut**: ✅ TERMINÉ
**Fichier**: `prisma/schema.prisma`

- [x] Modèle `LegalProof` créé avec tous les champs nécessaires
- [x] Enums `LegalProofType`, `LegalSignatureType`, `LegalProofFormat` ajoutés
- [x] Relations avec `User`, `Tenant`, `Dossier`, `Client` configurées
- [x] Indexes optimisés pour les requêtes

```prisma
model LegalProof {
  id String @id @default(uuid())
  type LegalProofType
  content String
  hash String @unique
  signatures Json
  timestamp DateTime
  userId String
  tenantId String
  // ... tous les champs
}
```

### 2. ✅ Exécuter migration Prisma

**Statut**: ✅ CLIENT GÉNÉRÉ (migration bloquée par DB distante)
**Commande**: `npx prisma generate --schema prisma/schema.prisma`

- [x] Client Prisma généré avec succès v5.22.0
- [x] Types TypeScript disponibles pour `LegalProof`
- ⚠️ Migration DB en attente (DB PostgreSQL Neon non accessible actuellement)
- 📝 À exécuter en production: `npx prisma migrate deploy`

### 3. ✅ Mettre à jour LegalProofService avec DB réelle

**Statut**: ✅ TERMINÉ
**Fichier**: `src/lib/services/legal-proof.service.ts`

- [x] Méthode `saveProof()` utilise `prisma.legalProof.create()`
- [x] Méthode `getProof()` utilise `prisma.legalProof.findUnique()`
- [x] Méthode `updateProof()` utilise `prisma.legalProof.update()`
- [x] Nouvelle méthode `listProofs()` avec filtres (type, isValid, userId)
- [x] Endpoint API `/api/legal/proof/list` créé
- [x] Page admin mise à jour pour charger les données réelles

---

## 🚧 Tâches En Cours (4)

### 4. 🔄 Tester le workflow complet

**Statut**: 🚧 EN COURS
**Priorié**: ⚡ P0 - CRITIQUE

#### Tests à effectuer:

1. **Test Génération de Preuve**
   - [ ] Ouvrir http://localhost:3000/demo/legal-proof
   - [ ] Cliquer sur "Générer Nouvelle Preuve"
   - [ ] Remplir le formulaire:
     - Type: DOCUMENT
     - Raison: "Test preuve dossier client"
     - Juridiction: FR
     - Timestamp Authority: ✓ Activé
   - [ ] Cliquer "Générer Preuve"
   - [ ] Vérifier que la preuve apparaît avec ID unique

2. **Test Vérification**
   - [ ] Copier l'ID de la preuve générée
   - [ ] Coller dans l'onglet "Vérifier"
   - [ ] Cliquer "Vérifier Preuve"
   - [ ] Valider les 5 points de vérification:
     - ✅ Hash document
     - ✅ Signatures
     - ✅ Timestamp
     - ✅ Chaîne d'audit
     - ✅ Non expiré

3. **Test Exports**
   - [ ] Export JSON: télécharger et vérifier structure
   - [ ] Export PDF: télécharger et vérifier contenu
   - [ ] Export XML: télécharger et vérifier format

4. **Test Admin Dashboard**
   - [ ] Ouvrir http://localhost:3000/admin/legal-proofs
   - [ ] Vérifier affichage des preuves
   - [ ] Tester filtres (Type, Validité)
   - [ ] Tester recherche par ID/raison
   - [ ] Vérifier stats (Total, Valid, RFC 3161, Signatures)

5. **Test Persistance DB**
   - [ ] Rafraîchir la page admin
   - [ ] Vérifier que les preuves persistent (après connexion DB)
   - [ ] Tester création depuis plusieurs utilisateurs

#### Serveur:

```bash
cd src/frontend
npm run dev
# ✓ Ready in 6.2s at http://localhost:3000
```

#### Erreurs connues à résoudre:

- ⚠️ Base de données PostgreSQL Neon non accessible
- ⚠️ NextAuth session non configurée (tests sans auth pour le moment)
- ⚠️ Mock data en fallback si API échoue

---

## 📝 Tâches À Venir (5-10)

### 5. ⏳ Intégrer RFC 3161 Timestamp Authority réelle

**Statut**: ⏳ NON COMMENCÉ
**Priorité**: 🔥 P1 - HAUTE

**Objectif**: Remplacer le mock par un vrai service TSA certifié

**Étapes**:

1. Choisir un fournisseur TSA:
   - [DigiCert Timestamp Server](https://knowledge.digicert.com/solution/SO912.html)
   - [GlobalSign TSA](https://www.globalsign.com/en/timestamp-service)
   - [Sectigo TSA](https://sectigo.com/time-stamping-server)

2. Installer dépendances:

   ```bash
   npm install node-forge @peculiar/x509
   ```

3. Mettre à jour `requestTimestampAuthority()`:

   ```typescript
   private async requestTimestampAuthority(hash: string): Promise<TimestampAuthority> {
     const response = await fetch('https://timestamp.digicert.com', {
       method: 'POST',
       headers: { 'Content-Type': 'application/timestamp-query' },
       body: this.createTSARequest(hash),
     });

     const token = await response.arrayBuffer();
     return this.parseTSAResponse(token);
   }
   ```

4. Valider conformité RFC 3161

**Coût estimé**: ~50-200€/an selon fournisseur

---

### 6. ⏳ Intégrer signatures eIDAS qualifiées

**Statut**: ⏳ NON COMMENCÉ
**Priorité**: 🔥 P1 - HAUTE

**Objectif**: Supporter les 3 niveaux de signature électronique

**Niveaux eIDAS**:

1. **Simple** (actuel): Hash + timestamp
2. **Avancée**: Certificat X.509 + identité vérifiée
3. **Qualifiée**: HSM + Prestataire qualifié (valeur légale maximale)

**Intégrations possibles**:

- [DocuSign eSignature](https://www.docusign.com/products/electronic-signature) (€40-60/mois)
- [Adobe Sign](https://www.adobe.com/sign.html) (€15-50/mois)
- [Yousign](https://yousign.com/) (Français, €40/mois)
- [Universign](https://www.universign.com/) (Français, sur devis)

**Code à mettre à jour**:

```typescript
async addSignature(
  proofId: string,
  signature: Partial<DigitalSignature>
): Promise<void> {
  // Appel API DocuSign pour signature qualifiée
  const docusignSignature = await this.docusignClient.createSignature({
    documentHash: proof.documentHash,
    signerEmail: signature.signerEmail,
    signatureType: 'QUALIFIED', // eIDAS qualified
  });

  // Stocker certificat X.509
  signature.certificate = docusignSignature.certificate;
}
```

---

### 7. ⏳ Ajouter tests unitaires pour LegalProofService

**Statut**: ⏳ NON COMMENCÉ
**Priorité**: 🟡 P2 - MOYENNE

**Fichier à créer**: `src/lib/services/__tests__/legal-proof.service.test.ts`

**Tests à implémenter**:

```typescript
describe('LegalProofService', () => {
  describe('generateProofBundle', () => {
    it('should generate valid proof with SHA-256 hash', async () => {});
    it('should include timestamp authority when requested', async () => {});
    it('should handle signatures correctly', async () => {});
    it('should create audit trail', async () => {});
  });

  describe('verifyProof', () => {
    it('should validate correct proof', async () => {});
    it('should detect tampered document hash', async () => {});
    it('should detect invalid signatures', async () => {});
    it('should check timestamp validity', async () => {});
  });

  describe('exportProof', () => {
    it('should export as JSON', async () => {});
    it('should export as PDF', async () => {});
    it('should export as XML', async () => {});
  });
});
```

**Lancer les tests**:

```bash
cd src/frontend
npm test legal-proof.service.test.ts
```

---

### 8. ⏳ Ajouter tests E2E pour workflow complet

**Statut**: ⏳ NON COMMENCÉ
**Priorité**: 🟡 P2 - MOYENNE

**Framework**: Playwright

**Fichier**: `tests/e2e/legal-proof-workflow.spec.ts`

**Scénarios**:

1. **Génération bout-en-bout**:

   ```typescript
   test('should generate proof and verify it', async ({ page }) => {
     await page.goto('/demo/legal-proof');
     await page.click('button:has-text("Générer Nouvelle Preuve")');
     await page.fill('input[name="reason"]', 'Test E2E');
     await page.click('button:has-text("Générer")');

     const proofId = await page.locator('[data-testid="proof-id"]').textContent();
     expect(proofId).toBeTruthy();
   });
   ```

2. **Export et validation**
3. **Signatures multiples**

---

### 9. ⏳ Documenter les règles sectorielles dans l'app

**Statut**: ⏳ NON COMMENCÉ
**Priorité**: 🟢 P3 - BASSE

**Objectif**: Créer page interactive pour `docs/SECTOR_RULES.md`

**Page à créer**: `src/app/admin/sector-rules/page.tsx`

**Fonctionnalités**:

- Filtres par secteur (LEGAL, MDPH, MEDICAL, ADMIN)
- Recherche dans les règles
- Export PDF des règles applicables
- Alertes automatiques sur délais

**Wireframe**:

```
+--------------------------------------------------+
| 🏛️ Règles Sectorielles                          |
+--------------------------------------------------+
| [LEGAL] [MDPH] [MEDICAL] [ADMIN] [GENERAL]       |
+--------------------------------------------------+
| 📋 LEGAL - Recours Contentieux                   |
| ⏰ Délai: 2 mois                                 |
| 📄 Base légale: CJA art. R421-1                  |
| 📎 Preuves requises: AR, horodatage               |
+--------------------------------------------------+
```

---

### 10. ⏳ Validation juridique du système de preuve

**Statut**: ⏳ NON COMMENCÉ
**Priorité**: 🔥 P1 - CRITIQUE (avant production)

**Objectif**: Faire valider par avocat spécialisé en droit numérique

**Points à valider**:

1. **Conformité RGPD**
   - Conservation des preuves (durée maximale)
   - Droit à l'oubli vs archivage légal
   - Anonymisation vs authenticité

2. **Valeur probante**
   - Opposabilité des exports PDF/JSON
   - Conformité eIDAS pour signatures
   - Admissibilité devant tribunal

3. **Archivage légal**
   - Durée de rétention (10 ans pour juridique)
   - Format d'archivage (AFNOR NF Z 42-013)
   - Tiers archiveur certifié

4. **Responsabilité**
   - Clause de non-responsabilité
   - Assurance RC professionnelle
   - CGU/CGV spécifiques

**Livrables**:

- [ ] Rapport d'audit juridique
- [ ] Attestation de conformité eIDAS
- [ ] Clause CGU validée
- [ ] Documentation opposable

---

## 📊 Résumé de Progression

| Tâche                    | Statut | Priorité | Temps Estimé |
| ------------------------ | ------ | -------- | ------------ |
| 1. Schema Prisma         | ✅     | P0       | 30min        |
| 2. Migration Prisma      | ✅     | P0       | 15min        |
| 3. Service DB réel       | ✅     | P0       | 1h           |
| 4. Tests workflow        | 🚧     | P0       | 2h           |
| 5. RFC 3161 réel         | ⏳     | P1       | 4h           |
| 6. eIDAS qualifié        | ⏳     | P1       | 6h           |
| 7. Tests unitaires       | ⏳     | P2       | 3h           |
| 8. Tests E2E             | ⏳     | P2       | 4h           |
| 9. Règles sectorielles   | ⏳     | P3       | 2h           |
| 10. Validation juridique | ⏳     | P1       | 1 semaine    |

**Total**: 3/10 complétées (30%)
**MVP Ready**: Oui (avec mocks)
**Production Ready**: Non (besoin tâches 5, 6, 10)

---

## 🚀 Prochaines Étapes Immédiates

1. **Maintenant**: Terminer tâche #4 (tests workflow)

   ```bash
   # Ouvrir navigateur sur:
   http://localhost:3000/demo/legal-proof
   http://localhost:3000/admin/legal-proofs
   ```

2. **Cette semaine**: Tâches #5 et #6 (intégrations réelles)
   - Choisir fournisseur TSA
   - Créer compte DocuSign ou alternative
   - Configurer variables d'environnement

3. **Semaine prochaine**: Validation juridique (tâche #10)
   - Contacter avocat spécialisé
   - Préparer documentation pour audit
   - Budget: ~2000-5000€

---

## 📞 Support

**Questions**: Consulter `docs/LEGAL_PROOF_SYSTEM.md`
**Guide implémentation**: `LEGAL_PROOF_IMPLEMENTATION.md`
**Règles sectorielles**: `docs/SECTOR_RULES.md`

---

_Dernière mise à jour: 3 février 2026_
_Version: 1.0.0-beta_
_Auteur: MemoLib DevTeam_
