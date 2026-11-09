# ⚡ Quick Start - Système de Preuve Légale

**Temps estimé** : 15 minutes
**Niveau** : Développeur

---

## 🎯 Objectif

Générer votre première preuve légale en moins de 15 minutes.

---

## ✅ Prérequis

- [x] Node.js 20+ installé
- [x] PostgreSQL 15+ (ou compte Neon gratuit)
- [x] Git installé
- [x] Éditeur de code (VS Code recommandé)

---

## 🚀 Installation (5 min)

### 1. Cloner le projet

```bash
git clone https://github.com/mobby57/memoLib.git
cd memolib
```

### 2. Installer dépendances

```bash
cd src/frontend
npm install --legacy-peer-deps
```

### 3. Configurer environnement

```bash
cp .env.example .env.local
```

**Éditer `.env.local`** :

```env
# Base de données (Neon gratuit: https://neon.tech)
DATABASE_URL="postgresql://user:password@your-host.neon.tech/memolib?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-aleatoire-32-chars-minimum"

# Azure AD (optionnel en dev)
AZURE_AD_CLIENT_ID="skip-in-dev"
AZURE_AD_CLIENT_SECRET="skip-in-dev"
AZURE_AD_TENANT_ID="skip-in-dev"

# Legal Proof (dev sans fournisseurs)
RFC3161_TSA_URL="https://freetsa.org/tsr"
```

### 4. Initialiser base de données

```bash
# Générer client Prisma
npx prisma generate --schema ../../prisma/schema.prisma

# Créer tables
npx prisma migrate dev --schema ../../prisma/schema.prisma --name init
```

### 5. Démarrer serveur

```bash
npm run dev
```

✅ **Serveur lancé** : http://localhost:3000

---

## 🎨 Première Preuve (5 min)

### Option A : Interface Web (recommandé)

1. **Ouvrir** : http://localhost:3000/demo/legal-proof

2. **Remplir formulaire** :
   - Type : `DOCUMENT`
   - Entité : `dossier`
   - Raison : `Test première preuve`
   - Juridiction : `FR`

3. **Cliquer** : "Générer Preuve"

4. **Résultat** :

   ```
   ✅ Preuve générée !
   ID: proof_cm5x9q2p40001xyz
   Hash: a3f5b8c2d1e9f7a4b6c8d0e2f4a6b8c0...
   Timestamp: 2026-02-03T14:30:00.000Z
   ```

5. **Vérifier** :
   - Cliquer "Vérifier"
   - ✅ 5/5 checks passés

6. **Exporter** :
   - Choisir format : PDF
   - Télécharger preuve imprimable

### Option B : API REST (développeurs)

**Générer preuve** :

```bash
curl -X POST http://localhost:3000/api/legal/proof/generate \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant_test",
    "entityType": "dossier",
    "entityId": "dossier_001",
    "type": "DOCUMENT",
    "content": {
      "documentId": "test.pdf",
      "action": "Test preuve"
    },
    "metadata": {
      "reason": "Test API",
      "jurisdiction": "FR"
    }
  }'
```

**Réponse** :

```json
{
  "success": true,
  "proof": {
    "id": "proof_cm5x9q2p40001xyz",
    "hash": "a3f5b8c2d1e9f7a4b6c8...",
    "timestamp": "2026-02-03T14:30:00.000Z"
  }
}
```

**Vérifier preuve** :

```bash
curl http://localhost:3000/api/legal/proof/verify?proofId=proof_cm5x9q2p40001xyz
```

**Réponse** :

```json
{
  "isValid": true,
  "validationDetails": {
    "hashValid": true,
    "signaturesValid": true,
    "timestampValid": true,
    "auditTrailValid": true,
    "notExpired": true
  }
}
```

---

## 📝 Code TypeScript (5 min)

### Générer Preuve (Code)

```typescript
import { legalProofService } from '@/lib/services/legal-proof.service';

async function genererPreuve() {
  const proof = await legalProofService.generateProofBundle({
    tenantId: 'tenant_test',
    entityType: 'dossier',
    entityId: 'dossier_mdph_001',
    type: 'DOCUMENT',
    content: {
      documentId: 'recours_mdph.pdf',
      action: 'Envoi recours MDPH',
      timestamp: new Date().toISOString(),
    },
    metadata: {
      createdBy: 'user_avocat_001',
      reason: 'Recours administratif MDPH',
      jurisdiction: 'FR',
    },
  });

  console.log('✅ Preuve générée:', proof.id);
  console.log('Hash:', proof.hash);
  console.log('Timestamp:', proof.timestamp);

  return proof;
}
```

### Vérifier Preuve

```typescript
async function verifierPreuve(proofId: string) {
  const verification = await legalProofService.verifyProof(proofId);

  if (verification.isValid) {
    console.log('✅ Preuve VALIDE');
    console.log('Détails:', verification.validationDetails);
  } else {
    console.log('❌ Preuve INVALIDE');
    console.log('Erreurs:', verification.errors);
  }

  return verification;
}
```

### Exporter Preuve

```typescript
async function exporterPreuve(proofId: string) {
  // Export PDF
  const pdf = await legalProofService.exportProof(proofId, 'PDF');
  console.log('PDF généré:', pdf);

  // Export JSON
  const json = await legalProofService.exportProof(proofId, 'JSON');
  console.log('JSON:', json);

  // Export XML (XAdES)
  const xml = await legalProofService.exportProof(proofId, 'XML');
  console.log('XML:', xml);
}
```

### Ajouter Signature

```typescript
async function signerPreuve(proofId: string) {
  // Signature SIMPLE (gratuite)
  await legalProofService.addSignature(proofId, {
    signerId: 'user_avocat_001',
    signerName: 'Me. Dupont',
    signerEmail: 'dupont@cabinet.fr',
    type: 'SIMPLE',
    reason: 'Validation dossier',
  });

  console.log('✅ Signature ajoutée');
}
```

### Workflow Complet

```typescript
async function workflowComplet() {
  // 1. Générer
  const proof = await genererPreuve();

  // 2. Signer
  await signerPreuve(proof.id);

  // 3. Vérifier
  const verification = await verifierPreuve(proof.id);

  // 4. Exporter
  if (verification.isValid) {
    await exporterPreuve(proof.id);
  }
}

workflowComplet();
```

---

## 🧪 Tester (Optionnel)

### Tests Unitaires

```bash
npm test -- legal-proof.service.test
```

**Résultat attendu** : 20+ tests passés ✅

### Tests E2E

```bash
# Installer Playwright
npx playwright install chromium

# Lancer tests
npx playwright test legal-proof
```

**Résultat attendu** : 10 scénarios passés ✅

---

## 🎓 Prochaines Étapes

### Niveau 1 : Découverte ✅ TERMINÉ

- [x] Première preuve générée
- [x] Vérification fonctionnelle
- [x] Export multi-formats

### Niveau 2 : Configuration

- [ ] Lire [Configuration](LEGAL_PROOF_README.md#-configuration)
- [ ] Configurer TSA production (DigiCert)
- [ ] Configurer signatures eIDAS (Yousign)
- [ ] Tester avec vraies données

### Niveau 3 : Production

- [ ] Lire [Conformité RGPD](CONFORMITE_RGPD_CHECKLIST.md)
- [ ] Désigner DPO
- [ ] Réaliser DPIA
- [ ] Pentest professionnel
- [ ] Validation avocat

---

## 📚 Ressources

| Document                                              | Description                 |
| ----------------------------------------------------- | --------------------------- |
| [README](LEGAL_PROOF_README.md)                       | Documentation complète      |
| [Configuration](LEGAL_PROOF_README.md#-configuration) | Variables environnement     |
| [API REST](LEGAL_PROOF_README.md#api-rest)            | Endpoints HTTP              |
| [Tests](LEGAL_PROOF_README.md#-tests)                 | Guide tests Jest/Playwright |
| [RGPD](CONFORMITE_RGPD_CHECKLIST.md)                  | Checklist conformité        |

---

## 🆘 Problèmes Courants

### Erreur base de données

```
Error: P1001 Can't reach database server
```

**Solution** :

1. Vérifier `DATABASE_URL` dans `.env.local`
2. Tester connexion : `npx prisma db pull --schema ../../prisma/schema.prisma`
3. Si Neon : vérifier `?sslmode=require` dans URL

### Port 3000 déjà utilisé

```
Error: Port 3000 is already in use
```

**Solution** :

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Prisma client non généré

```
Error: @prisma/client not found
```

**Solution** :

```bash
npx prisma generate --schema ../../prisma/schema.prisma
```

### Tests Playwright échouent

```
Error: Timeout 15000ms exceeded
```

**Solution** :

1. Serveur Next.js doit être démarré (`npm run dev`)
2. Augmenter timeout : `--timeout=60000`
3. Vérifier http://localhost:3000 accessible

---

## ✅ Checklist Réussite

- [x] Serveur démarre sans erreur
- [x] Page démo accessible (http://localhost:3000/demo/legal-proof)
- [x] Preuve générée avec succès
- [x] Hash + Timestamp visibles
- [x] Vérification 5/5 ✅
- [x] Export PDF fonctionne
- [x] Code TypeScript compris

**Félicitations ! 🎉**

Vous maîtrisez les bases du système de preuve légale MemoLib.

---

**Temps total** : ~15 minutes
**Niveau atteint** : Développeur opérationnel
**Prochaine étape** : [Configuration Production](LEGAL_PROOF_README.md#-configuration)
