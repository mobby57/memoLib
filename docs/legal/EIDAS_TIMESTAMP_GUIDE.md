# Horodatage eIDAS Qualifié — Guide de mise en production

## Contexte

Le règlement eIDAS (UE 910/2014) définit 3 niveaux d'horodatage électronique :

| Niveau | Valeur légale | Usage MemoLib |
|---|---|---|
| Simple | Présomption faible | Dev/test |
| Avancé | Présomption renforcée | Dossiers standards |
| **Qualifié** | **Présomption légale d'exactitude** (art. 41.2 eIDAS) | **Preuves juridiques** |

Pour que les preuves générées par MemoLib soient **opposables en justice**, il faut un horodatage **qualifié**.

---

## Prestataires qualifiés eIDAS (liste UE)

Source : [EU Trusted List](https://eidas.ec.europa.eu/efda/tl-browser/)

### France

| Prestataire | Service | API | Coût estimé |
|---|---|---|---|
| **Universign** (Signaturit) | Horodatage qualifié | REST API | ~0.05-0.15€/timestamp |
| **CertEurope** (Oodrive) | Horodatage qualifié | REST API | ~0.10-0.20€/timestamp |
| **Docaposte** (La Poste) | Horodatage qualifié | REST API | Sur devis |

### Europe

| Prestataire | Pays | API | Coût estimé |
|---|---|---|---|
| **DigiCert** | US/EU | HTTP TSA | ~100-200€/an (illimité) |
| **GlobalSign** | BE | HTTP TSA | ~150-300€/an |
| **Sectigo** | UK/EU | HTTP TSA | ~100-200€/an |

### Recommandation : Universign

- Français, qualifié eIDAS
- API REST simple
- Tarification à l'usage (bon pour un MVP)
- Combine horodatage + signature électronique

---

## Intégration Universign

### 1. Configuration

```env
# .env.production
EIDAS_TSA_PROVIDER=universign
UNIVERSIGN_API_URL=https://ws.universign.eu/tsa/post
UNIVERSIGN_API_KEY=<your-api-key>

# Fallback pour dev
RFC3161_TSA_URL=https://freetsa.org/tsr
```

### 2. Adaptation du service existant

Le fichier `src/lib/services/rfc3161-timestamp.service.ts` existe déjà. Il faut :

1. Remplacer la construction ASN.1 simplifiée par `@peculiar/asn1-tsp`
2. Ajouter le provider Universign
3. Implémenter la vérification réelle des tokens

### 3. Dépendances à installer

```bash
npm install @peculiar/asn1-tsp @peculiar/asn1-schema asn1js
```

### 4. Flux de production

```
Document/Action
    ↓
Hash SHA-256
    ↓
Requête TSQ (RFC 3161) → Universign TSA
    ↓
Réponse TSR (token signé + certificat qualifié)
    ↓
Stockage en DB (LegalProof.timestampToken)
    ↓
Vérification possible à tout moment
```

---

## Stratégie de coûts

### Estimation pour un cabinet de 10 avocats

| Action | Fréquence | Timestamps/mois | Coût/mois |
|---|---|---|---|
| Création de dossier | 50/mois | 50 | 5€ |
| Upload document | 200/mois | 200 | 20€ |
| Signature | 30/mois | 30 | 3€ |
| Preuve juridique | 20/mois | 20 | 2€ |
| **Total** | | **300** | **~30€** |

### Optimisation

- Ne pas horodater chaque action, seulement les **preuves juridiques** et **documents critiques**
- Utiliser le hash chain interne (gratuit) pour les actions courantes
- Réserver l'horodatage qualifié pour les exports de preuve

---

## Vérification d'un timestamp qualifié

Pour qu'un timestamp soit recevable en justice :

1. **Token RFC 3161** signé par un TSA qualifié eIDAS
2. **Certificat du TSA** dans la EU Trusted List
3. **Hash du document** correspond au hash dans le token
4. **Date du timestamp** dans la période de validité du certificat

Le service `verifyRFC3161Timestamp` doit implémenter ces 4 vérifications.

---

## Checklist mise en production

- [ ] Compte Universign créé et API key obtenue
- [ ] Dépendances ASN.1 installées (`@peculiar/asn1-tsp`)
- [ ] Service `rfc3161-timestamp.service.ts` mis à jour avec vrai parsing ASN.1
- [ ] Variables d'env configurées sur Vercel
- [ ] Tests d'intégration avec le TSA réel
- [ ] Vérification que les tokens sont bien qualifiés eIDAS
- [ ] Documentation utilisateur mise à jour
- [ ] Facturation à l'usage configurée (Stripe metered billing)
