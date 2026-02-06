# Guide d'Intégration - Système de Preuve Légale

Ce guide explique comment configurer et utiliser les nouvelles intégrations pour le système de preuve légale.

## 📋 Table des matières

1. [RFC 3161 Timestamp Authority](#rfc-3161)
2. [Signatures eIDAS](#signatures-eidas)
3. [Tests E2E Playwright](#tests-e2e)
4. [Configuration Azure](#configuration-azure)

---

## 🔐 RFC 3161 Timestamp Authority

### Fichier

`src/lib/services/rfc3161-timestamp.service.ts`

### Fonctionnalités

- Génération de timestamps certifiés conformes RFC 3161
- Support de plusieurs fournisseurs (DigiCert, GlobalSign, Sectigo, FreeTSA)
- Fallback mock pour développement
- Vérification de timestamps

### Configuration

#### 1. Variables d'environnement

```env
RFC3161_TSA_URL=https://freetsa.org/tsr
RFC3161_TSA_USERNAME=votre_username (optionnel)
RFC3161_TSA_PASSWORD=votre_password (optionnel)
```

#### 2. Fournisseurs disponibles

| Fournisseur | URL                                             | Gratuit | Auth | Coût         |
| ----------- | ----------------------------------------------- | ------- | ---- | ------------ |
| FreeTSA     | https://freetsa.org/tsr                         | ✅      | ❌   | Gratuit      |
| DigiCert    | http://timestamp.digicert.com                   | ❌      | ❌   | ~€100-200/an |
| GlobalSign  | http://timestamp.globalsign.com/tsa/r6advanced1 | ❌      | ✅   | ~€150-300/an |
| Sectigo     | http://timestamp.sectigo.com                    | ❌      | ❌   | ~€100-200/an |

#### 3. Utilisation

```typescript
import {
  requestRFC3161Timestamp,
  verifyRFC3161Timestamp,
} from '@/lib/services/rfc3161-timestamp.service';

// Générer un timestamp
const hash = 'sha256_hash_of_document';
const tsaResponse = await requestRFC3161Timestamp(hash, {
  url: 'https://freetsa.org/tsr',
  timeout: 10000,
});

console.log(tsaResponse.token); // Token RFC 3161
console.log(tsaResponse.timestamp); // Date du timestamp
console.log(tsaResponse.certificate); // Certificat TSA

// Vérifier un timestamp
const isValid = await verifyRFC3161Timestamp(tsaResponse.token, hash);
```

### ⚠️ Important

**Production**: Le service utilise un fallback mock en développement. Pour la production :

1. Choisir un fournisseur certifié (DigiCert, GlobalSign, Sectigo)
2. Configurer les credentials dans Azure Key Vault
3. Implémenter le parsing ASN.1 complet (utiliser `node-forge` ou `@peculiar/asn1-tsp`)

**Librairies recommandées**:

```bash
npm install node-forge @peculiar/asn1-tsp
```

---

## ✍️ Signatures eIDAS

### Fichier

`src/lib/services/eidas-signature.service.ts`

### Fonctionnalités

- Support des 3 niveaux eIDAS : SIMPLE, ADVANCED, QUALIFIED
- Intégration DocuSign, Adobe Sign, Yousign, Universign
- Vérification de signatures
- Certificats X.509

### Configuration

#### 1. DocuSign (recommandé pour signatures qualifiées)

```env
DOCUSIGN_INTEGRATION_KEY=votre_integration_key
DOCUSIGN_SECRET_KEY=votre_secret_key
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_ACCOUNT_ID=votre_account_id
```

**Obtenir les credentials**:

1. Créer compte sur https://developers.docusign.com
2. Créer une application OAuth
3. Récupérer Integration Key et Secret Key
4. Configurer OAuth flow

**Coût**: ~€40-60/mois (10 signatures/mois)

#### 2. Adobe Sign

```env
ADOBE_SIGN_API_KEY=votre_api_key
ADOBE_SIGN_BASE_URL=https://api.eu1.adobesign.com/api/rest/v6
```

**Obtenir la clé**:

1. Compte sur https://acrobat.adobe.com/fr/fr/sign.html
2. API Access dans les paramètres
3. Générer Integration Key

**Coût**: ~€50-70/mois

#### 3. Yousign (Français, recommandé UE)

```env
YOUSIGN_API_KEY=votre_api_key
YOUSIGN_BASE_URL=https://api.yousign.com/v3
```

**Avantages**:

- Conformité eIDAS européenne
- Support français
- RGPD natif

**Coût**: ~€40-50/mois

#### 4. Utilisation

```typescript
import { createEIDASSignature, verifyEIDASSignature } from '@/lib/services/eidas-signature.service';

// Créer une signature
const signatureResponse = await createEIDASSignature({
  documentHash: 'sha256_hash',
  signerEmail: 'avocat@cabinet.fr',
  signerName: 'Me. Dupont',
  signatureType: 'QUALIFIED', // SIMPLE, ADVANCED, QUALIFIED
  reason: 'Signature recours administratif',
  location: 'Paris, France',
});

console.log(signatureResponse.signature); // Objet DigitalSignature
console.log(signatureResponse.certificate); // Certificat X.509
console.log(signatureResponse.envelopeId); // ID DocuSign

// Vérifier une signature
const isValid = await verifyEIDASSignature(signatureResponse.signature, 'sha256_hash');
```

### Niveaux eIDAS

| Niveau        | Description                | Valeur légale | Fournisseur              |
| ------------- | -------------------------- | ------------- | ------------------------ |
| **SIMPLE**    | Signature basique          | Faible        | Interne                  |
| **ADVANCED**  | Certificat + identité      | Moyenne       | DocuSign, Adobe, Yousign |
| **QUALIFIED** | HSM + prestataire qualifié | **Maximale**  | DocuSign, Yousign        |

**Recommandation**: Utiliser **QUALIFIED** pour tous les documents juridiques critiques.

---

## 🧪 Tests E2E Playwright

### Fichier

`tests/e2e/legal-proof.spec.ts`

### Scénarios couverts

1. **Workflow complet**: Générer → Vérifier → Exporter → Signer
2. **Validation formulaires**: Champs obligatoires
3. **Détection tampering**: Preuves modifiées
4. **Filtres admin**: Par type, validité
5. **Règles sectorielles**: Navigation, filtres, recherche
6. **Exports multiples**: JSON, PDF, XML
7. **API endpoints**: Tests directs

### Installation

```bash
# Installer Playwright
npm install -D @playwright/test

# Installer les navigateurs
npx playwright install
```

### Exécution

```bash
# Tous les tests
npx playwright test

# Tests spécifiques
npx playwright test legal-proof

# Mode UI
npx playwright test --ui

# Mode debug
npx playwright test --debug

# Par navigateur
npx playwright test --project=chromium
```

### Configuration

Le fichier `playwright.config.ts` a été mis à jour avec:

- Timeouts : 30s par test
- Reporters : HTML, JSON, List
- Screenshots et vidéos en cas d'échec
- Support multi-navigateurs (Chrome, Firefox, Safari, Mobile)
- Serveur local automatique

### Structure des tests

```typescript
test('Workflow complet', async ({ page }) => {
  // 1. Générer preuve
  await page.goto('/demo/legal-proof');
  await page.click('button:has-text("Générer")');

  // 2. Vérifier
  const proofId = await page.locator('[data-testid="proof-id"]').textContent();
  await page.click('text="Vérifier"');

  // 3. Exporter
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("JSON")'),
  ]);

  // 4. Signer
  await page.click('button:has-text("Ajouter Signature")');
  await page.fill('input[name="signerName"]', 'Avocat Test');

  // 5. Vérifier dans admin
  await page.goto('/admin/legal-proofs');
  await expect(page.locator(`[data-proof-id="${proofId}"]`)).toBeVisible();
});
```

### Rapports

Après exécution, les rapports sont disponibles:

- HTML: `npx playwright show-report`
- JSON: `test-results/results.json`
- Screenshots: `test-results/`

---

## ☁️ Configuration Azure

### Azure Key Vault

Pour stocker les secrets en production :

```bash
# Créer Key Vault
az keyvault create \
  --name memolib-legal-kv \
  --resource-group memolib-rg \
  --location westeurope

# Ajouter secrets
az keyvault secret set --vault-name memolib-legal-kv --name "RFC3161-TSA-URL" --value "https://timestamp.digicert.com"
az keyvault secret set --vault-name memolib-legal-kv --name "DOCUSIGN-INTEGRATION-KEY" --value "..."
az keyvault secret set --vault-name memolib-legal-kv --name "DOCUSIGN-SECRET-KEY" --value "..."
az keyvault secret set --vault-name memolib-legal-kv --name "YOUSIGN-API-KEY" --value "..."
```

### Next.js Integration

Dans `src/frontend/lib/azure-keyvault.ts`:

```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

const vaultUrl = process.env.AZURE_KEYVAULT_URL || '';
const credential = new DefaultAzureCredential();
const client = new SecretClient(vaultUrl, credential);

export async function getSecret(name: string): Promise<string> {
  const secret = await client.getSecret(name);
  return secret.value || '';
}
```

### Intégration dans les services

```typescript
// rfc3161-timestamp.service.ts
import { getSecret } from '@/lib/azure-keyvault';

const DEFAULT_TSA_CONFIG: TSAConfig = {
  url: await getSecret('RFC3161-TSA-URL'),
  username: await getSecret('RFC3161-TSA-USERNAME'),
  password: await getSecret('RFC3161-TSA-PASSWORD'),
};
```

---

## 📊 Coûts récapitulatifs

| Service      | Coût mensuel | Coût annuel    | Notes                     |
| ------------ | ------------ | -------------- | ------------------------- |
| FreeTSA      | Gratuit      | Gratuit        | Dev uniquement            |
| DigiCert TSA | €8-17        | €100-200       | Production                |
| DocuSign     | €40-60       | €480-720       | 10 signatures/mois        |
| Yousign      | €40-50       | €480-600       | Français, RGPD            |
| Azure Blob   | €0.02/GB     | ~€2-10         | Archivage                 |
| **TOTAL**    | **€88-127**  | **€1062-1530** | Configuration recommandée |

---

## 🚀 Prochaines étapes

1. ✅ Code généré (tâches #5, #6, #8)
2. ⏳ Configurer fournisseurs (DigiCert, Yousign)
3. ⏳ Tester intégrations en staging
4. ⏳ Validation juridique (tâche #10)
5. ⏳ Déploiement production

---

## 📞 Support

- RFC 3161: https://datatracker.ietf.org/doc/html/rfc3161
- eIDAS: https://www.ssi.gouv.fr/entreprise/reglementation/confiance-numerique/le-reglement-eidas/
- DocuSign: https://developers.docusign.com
- Yousign: https://developers.yousign.com
- Playwright: https://playwright.dev/docs/intro

---

**Dernière mise à jour**: 3 février 2026
