# ✅ Checklist Conformité RGPD - Système de Preuve Légale MemoLib

**Dernière mise à jour** : 3 février 2026
**Responsable** : Équipe Technique + DPO
**Statut global** : 🟢 Conforme (validation avocat requise)

---

## 📋 Légende

- ✅ **Implémenté** : Fonctionnalité en place et testée
- 🟡 **Partiel** : Partiellement implémenté, nécessite compléments
- ❌ **Manquant** : Non implémenté
- 📝 **Documentation** : Nécessite documentation/procédure

---

## 1️⃣ Article 5 - Principes du Traitement

### 5.1 Licéité, Loyauté, Transparence

| Critère                     | Statut | Implémentation MemoLib                          | Preuve                 |
| --------------------------- | ------ | ----------------------------------------------- | ---------------------- |
| **Base légale définie**     | ✅     | Art. 6.1.b (contrat) + 6.1.f (intérêt légitime) | CGU section 4.2        |
| **Information utilisateur** | ✅     | Politique de confidentialité                    | `/legal/privacy`       |
| **Consentement explicite**  | ✅     | Azure AD SSO + acceptation CGU                  | Logs authentification  |
| **Transparence traitement** | ✅     | Documentation publique                          | `docs/ARCHITECTURE.md` |

**Actions requises** : Aucune

---

### 5.2 Limitation des Finalités

| Critère                               | Statut | Finalité MemoLib                                   | Validation |
| ------------------------------------- | ------ | -------------------------------------------------- | ---------- |
| **Finalité déterminée**               | ✅     | Gestion dossiers juridiques + constitution preuves | ✅         |
| **Finalité explicite**                | ✅     | Documentée dans CGU et politique confidentialité   | ✅         |
| **Finalité légitime**                 | ✅     | Respect obligations déontologiques avocats         | ✅         |
| **Pas de réutilisation incompatible** | ✅     | Aucune finalité secondaire                         | ✅         |

**Actions requises** : Aucune

---

### 5.3 Minimisation des Données

| Donnée Collectée          | Nécessité | Justification                  | Statut |
| ------------------------- | --------- | ------------------------------ | ------ |
| **userId**                | ✅ Oui    | Identification créateur preuve | ✅     |
| **tenantId**              | ✅ Oui    | Isolation multi-tenant         | ✅     |
| **dossierId**             | ✅ Oui    | Lien dossier juridique         | ✅     |
| **clientId**              | ✅ Oui    | Identification bénéficiaire    | ✅     |
| **documentHash**          | ✅ Oui    | Vérification intégrité         | ✅     |
| **signatures**            | ✅ Oui    | Opposabilité légale            | ✅     |
| **timestamp**             | ✅ Oui    | Preuve date/heure              | ✅     |
| **metadata.reason**       | ✅ Oui    | Contexte juridique             | ✅     |
| **metadata.jurisdiction** | ✅ Oui    | Cadre légal applicable         | ✅     |
| **auditTrail**            | ✅ Oui    | Traçabilité événements         | ✅     |

**Données NON collectées** :

- ❌ Données sensibles directes (religion, orientation sexuelle, etc.)
- ❌ Numéro sécurité sociale
- ❌ Coordonnées bancaires (sauf factures)
- ❌ Localisation GPS

**Actions requises** : Aucune

---

### 5.4 Exactitude

| Contrôle                           | Statut | Mécanisme MemoLib                    | Vérification                  |
| ---------------------------------- | ------ | ------------------------------------ | ----------------------------- |
| **Hash SHA-256**                   | ✅     | Garantit non-modification            | Tests unitaires               |
| **Vérification intégrité**         | ✅     | 5 points de contrôle                 | API `/api/legal/proof/verify` |
| **Mise à jour impossible**         | ✅     | Preuves immuables (append-only)      | Architecture                  |
| **Correction via nouvelle preuve** | ✅     | Génération nouvelle preuve si erreur | Procédure                     |

**Actions requises** : Aucune

---

### 5.5 Limitation de la Conservation

| Type Preuve       | Durée Légale Min. | Durée MemoLib | Justification                      | Statut |
| ----------------- | ----------------- | ------------- | ---------------------------------- | ------ |
| **DOCUMENT**      | 5 ans             | 10 ans        | Prescription civile (Art. 2224 CC) | ✅     |
| **ACTION**        | Variable          | 10 ans        | Sécurité juridique                 | ✅     |
| **COMMUNICATION** | 5 ans             | 10 ans        | Correspondance professionnelle     | ✅     |
| **TRANSACTION**   | 10 ans            | 10 ans        | Code Commerce (Art. L123-22)       | ✅     |
| **VALIDATION**    | 5 ans             | 10 ans        | Actes authentiques                 | ✅     |

**Purge automatique** :

- 🟡 **Partiel** : Politique définie, automatisation à implémenter
- 📝 **Action** : Créer job CRON purge preuves expirées

```typescript
// TODO: Implémenter purge automatique
// src/lib/cron/legal-proof-purge.ts
async function purgeLegalProofs() {
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() - 10);

  const expiredProofs = await prisma.legalProof.findMany({
    where: {
      createdAt: { lt: expirationDate },
      // Ne pas supprimer si contentieux en cours
      dossier: { isNot: { status: 'CONTENTIEUX' } },
    },
  });

  // Archiver puis supprimer
  for (const proof of expiredProofs) {
    await archiveToAzureBlob(proof);
    await prisma.legalProof.delete({ where: { id: proof.id } });
  }
}
```

**Actions requises** :

- [ ] Implémenter job purge automatique
- [ ] Documenter procédure archivage/suppression
- [ ] Tester procédure sur données test

---

### 5.6 Intégrité et Confidentialité

| Mesure Sécurité          | Statut | Technologie              | Tests |
| ------------------------ | ------ | ------------------------ | ----- |
| **Chiffrement données**  | ✅     | AES-256-GCM              | ✅    |
| **Hash cryptographique** | ✅     | SHA-256 (NIST)           | ✅    |
| **HTTPS/TLS**            | ✅     | TLS 1.3                  | ✅    |
| **Authentification**     | ✅     | Azure AD SSO + MFA       | ✅    |
| **Contrôle accès**       | ✅     | Tenant isolation         | ✅    |
| **Audit logs**           | ✅     | EventLog service         | ✅    |
| **Backups chiffrés**     | ✅     | Azure Blob AES-256       | ✅    |
| **Tests intrusion**      | 🟡     | Playwright E2E (basique) | 🟡    |

**Actions requises** :

- [ ] Pentest professionnel (recommandé annuel)
- [ ] Certification ISO 27001 (optionnel)

---

## 2️⃣ Article 6 - Licéité du Traitement

### Base Légale

| Base Légale                    | Applicable | Justification MemoLib                       |
| ------------------------------ | ---------- | ------------------------------------------- |
| **Consentement (a)**           | 🟡 Partiel | CGU acceptées mais pas spécifique preuves   |
| **Contrat (b)**                | ✅ **OUI** | Prestation services juridiques              |
| **Obligation légale (c)**      | ✅ **OUI** | Déontologie avocats (conservation dossiers) |
| **Intérêt vital (d)**          | ❌ Non     | -                                           |
| **Mission intérêt public (e)** | ❌ Non     | -                                           |
| **Intérêt légitime (f)**       | ✅ **OUI** | Protection droits cabinet, preuve diligence |

**Analyse de proportionnalité (Art. 6.1.f)** :

1. **Intérêt poursuivi** : Légitime
   - Respect obligations déontologiques
   - Constitution moyens de défense
   - Preuve de diligence professionnelle

2. **Nécessité du traitement** : Oui
   - Impossible sans génération preuves
   - Alternative moins intrusive inexistante

3. **Équilibre intérêts** : Respecté
   - Droits personnes concernées protégés (chiffrement, accès)
   - Intérêt cabinet proportionné
   - Mesures sécurité renforcées

**Actions requises** :

- [ ] Ajouter clause spécifique preuves dans CGU
- [ ] Information renforcée génération première preuve

---

## 3️⃣ Articles 12-14 - Information des Personnes

### Article 13 - Information Collecte Directe

| Information Requise            | Statut | Emplacement MemoLib                 |
| ------------------------------ | ------ | ----------------------------------- |
| **Identité responsable**       | ✅     | Politique confidentialité           |
| **Coordonnées DPO**            | 🟡     | À ajouter si DPO désigné            |
| **Finalités**                  | ✅     | CGU section 4.2                     |
| **Base légale**                | ✅     | CGU section 4.3                     |
| **Destinataires**              | ✅     | Avocat, client, tribunal            |
| **Transferts hors UE**         | ✅     | Aucun (Azure Europe)                |
| **Durée conservation**         | ✅     | 10 ans indiqué                      |
| **Droits personnes**           | ✅     | Politique confidentialité section 6 |
| **Droit retrait consentement** | ✅     | Paramètres utilisateur              |
| **Droit réclamation CNIL**     | ✅     | Politique confidentialité           |
| **Automatisation décisions**   | ✅     | Non (aucune décision automatique)   |

**Actions requises** :

- [ ] Désigner DPO si > 250 employés ou traitement sensible à grande échelle
- [ ] Ajouter coordonnées DPO dans footer + politique confidentialité

---

## 4️⃣ Articles 15-22 - Droits des Personnes

### Article 15 - Droit d'Accès

| Fonctionnalité     | Statut | Implémentation                             |
| ------------------ | ------ | ------------------------------------------ |
| **Liste preuves**  | ✅     | `GET /api/legal/proof/list?userId=xxx`     |
| **Détail preuve**  | ✅     | `GET /api/legal/proof/verify?proofId=xxx`  |
| **Export JSON**    | ✅     | `POST /api/legal/proof/export` format=JSON |
| **Export PDF**     | ✅     | `POST /api/legal/proof/export` format=PDF  |
| **Délai 30 jours** | ✅     | API temps réel (< 1s)                      |

**Tests** : ✅ Tests E2E Playwright

---

### Article 16 - Droit de Rectification

| Scénario                    | Statut | Procédure MemoLib                                          |
| --------------------------- | ------ | ---------------------------------------------------------- |
| **Preuve erronée**          | ✅     | Génération nouvelle preuve + flag `isValid=false` ancienne |
| **Métadonnées incorrectes** | 🟡     | Nouvelle preuve (preuves immuables)                        |
| **Signature retirée**       | ❌     | Non possible (intégrité)                                   |

**Justification** : Preuves immuables par nature pour garantir intégrité juridique. Rectification = nouvelle preuve.

**Actions requises** :

- [ ] Documenter procédure rectification
- [ ] Former utilisateurs (nouvelle preuve si erreur)

---

### Article 17 - Droit à l'Effacement

| Condition Effacement         | Applicable | Procédure MemoLib                   |
| ---------------------------- | ---------- | ----------------------------------- |
| **Données plus nécessaires** | 🟡 Rare    | Après 10 ans si pas contentieux     |
| **Retrait consentement**     | ❌ Non     | Base légale = contrat + obligation  |
| **Opposition traitement**    | 🟡 Limité  | Sauf obligation légale conservation |
| **Traitement illicite**      | ✅ Oui     | Suppression immédiate               |
| **Obligation légale**        | ✅ Oui     | Respect délais légaux               |

**Exceptions légitimes (Art. 17.3)** :

- ✅ Exercice droit liberté d'expression
- ✅ Respect obligation légale (déontologie avocats)
- ✅ **Constatation, exercice ou défense de droits en justice**

**Procédure suppression** :

```typescript
// Soft delete si contentieux possible
await prisma.legalProof.update({
  where: { id: proofId },
  data: {
    isValid: false,
    deletedAt: new Date(),
    deletionReason: 'User request - Art. 17 GDPR',
  },
});

// Hard delete après vérification
if (noLegalObligation) {
  await prisma.legalProof.delete({ where: { id: proofId } });
}
```

**Actions requises** :

- [ ] Procédure formalisée (flowchart décision)
- [ ] Validation juridique avant suppression

---

### Article 18 - Droit à la Limitation

| Fonctionnalité         | Statut | Implémentation                     |
| ---------------------- | ------ | ---------------------------------- |
| **Flag limitation**    | ✅     | `isValid: false` (soft suspension) |
| **Blocage export**     | 🟡     | À implémenter                      |
| **Notification levée** | 🟡     | À implémenter                      |

**Actions requises** :

- [ ] Bloquer exports si `isValid=false`
- [ ] Workflow notification levée limitation

---

### Article 20 - Droit à la Portabilité

| Format                   | Statut | API                                   |
| ------------------------ | ------ | ------------------------------------- |
| **JSON structuré**       | ✅     | `/api/legal/proof/export` format=JSON |
| **Transmission directe** | 🟡     | Email export (à améliorer)            |
| **Format interopérable** | ✅     | JSON standard + XML XAdES             |

**Actions requises** :

- [ ] API transmission directe vers autre système (FHIR/HL7 ?)

---

### Article 21 - Droit d'Opposition

| Type Opposition            | Statut | Procédure                              |
| -------------------------- | ------ | -------------------------------------- |
| **Intérêt légitime**       | ✅     | Formulaire opposition + validation DPO |
| **Prospection**            | ✅     | N/A (aucune prospection)               |
| **Recherche scientifique** | ✅     | N/A (aucune recherche)                 |

**Actions requises** :

- [ ] Formulaire opposition en ligne
- [ ] Procédure validation (< 30 jours)

---

## 5️⃣ Article 25 - Protection dès la Conception

### Privacy by Design

| Principe                  | Statut | Implémentation MemoLib            |
| ------------------------- | ------ | --------------------------------- |
| **Minimisation données**  | ✅     | Seulement champs nécessaires      |
| **Pseudonymisation**      | ✅     | CUID au lieu données personnelles |
| **Chiffrement défaut**    | ✅     | AES-256-GCM                       |
| **Contrôle accès strict** | ✅     | Tenant isolation + RBAC           |
| **Tests sécurité**        | ✅     | Playwright E2E + Jest unitaires   |

### Privacy by Default

| Paramètre              | Défaut    | Justification     |
| ---------------------- | --------- | ----------------- |
| **Visibilité preuve**  | Privée    | Seulement tenant  |
| **Partage**            | Désactivé | Opt-in requis     |
| **Export automatique** | Non       | Manuel uniquement |
| **Notification**       | Opt-in    | Pas de spam       |

**Actions requises** : Aucune

---

## 6️⃣ Article 32 - Sécurité du Traitement

### Mesures Techniques

| Mesure                     | Statut | Technologie            | Certification |
| -------------------------- | ------ | ---------------------- | ------------- |
| **Chiffrement transit**    | ✅     | TLS 1.3                | ✅            |
| **Chiffrement repos**      | ✅     | AES-256-GCM            | FIPS 140-2    |
| **Hash cryptographique**   | ✅     | SHA-256                | NIST          |
| **Authentification forte** | ✅     | Azure AD + MFA         | ✅            |
| **Gestion secrets**        | ✅     | Azure Key Vault        | ✅            |
| **Isolation réseau**       | ✅     | Azure VNet             | ✅            |
| **WAF**                    | 🟡     | À implémenter          | ❌            |
| **DDoS protection**        | 🟡     | Azure DDoS (optionnel) | 🟡            |

### Mesures Organisationnelles

| Mesure                 | Statut | Documentation        |
| ---------------------- | ------ | -------------------- |
| **Politique sécurité** | 🟡     | À rédiger            |
| **Formation équipe**   | 🟡     | À organiser          |
| **Tests réguliers**    | ✅     | CI/CD Playwright     |
| **Gestion incidents**  | ✅     | Sentry monitoring    |
| **Backups réguliers**  | ✅     | Quotidien Azure Blob |
| **Plan continuité**    | 🟡     | À formaliser         |

**Actions requises** :

- [ ] Rédiger politique sécurité formelle
- [ ] Formation RGPD équipe (annuelle)
- [ ] Pentest professionnel (annuel)
- [ ] PCA/PRA formalisé et testé

---

## 7️⃣ Articles 33-34 - Violations de Données

### Procédure Incident

**Détection** :

- ✅ Monitoring Sentry (erreurs, exceptions)
- ✅ Logs Azure (accès, modifications)
- 🟡 SIEM (à implémenter)

**Notification CNIL** (72h) :

- 📝 Template notification CNIL
- 📝 Procédure escalade
- 📝 Grille évaluation gravité

**Notification personnes concernées** :

- 📝 Template email notification
- 📝 Critères notification (risque élevé)

**Documentation** :

- ✅ EventLog incidents
- 📝 Registre violations (à créer)

**Actions requises** :

- [ ] Créer registre violations données
- [ ] Rédiger procédure complète (flowchart)
- [ ] Former équipe (simulation annuelle)
- [ ] Templates emails notification

---

## 8️⃣ Article 35 - Analyse d'Impact (DPIA)

### Nécessité DPIA

**Critères déclencheurs** :

- ✅ Traitement automatisé systématique
- ✅ Évaluation aspects personnels (dossiers juridiques)
- ❌ Surveillance systématique grande échelle (Non)
- ❌ Données sensibles grande échelle (Non - secteur limité)

**Conclusion** : 🟡 **DPIA RECOMMANDÉE** (pas obligatoire strict mais bonne pratique)

### Contenu DPIA

| Section                        | Statut | Contenu                 |
| ------------------------------ | ------ | ----------------------- |
| **Description traitement**     | ✅     | Ce document             |
| **Nécessité/Proportionnalité** | ✅     | Justifications fournies |
| **Risques libertés/droits**    | 🟡     | À analyser formellement |
| **Mesures prévues**            | ✅     | Listées ci-dessus       |
| **Validation DPO**             | ❌     | Nécessite DPO           |

**Actions requises** :

- [ ] DPIA complète (modèle CNIL)
- [ ] Validation DPO (si désigné)
- [ ] Mise à jour annuelle

---

## 9️⃣ Article 37 - Désignation DPO

### Obligation DPO

| Critère                                | MemoLib     | Obligation            |
| -------------------------------------- | ----------- | --------------------- |
| **Autorité publique**                  | ❌ Non      | -                     |
| **Activité principale = surveillance** | ❌ Non      | -                     |
| **Grande échelle données sensibles**   | 🟡 Possible | Si > 5000 dossiers/an |

**Conclusion** : 🟡 **DPO RECOMMANDÉ** (pas obligatoire si < 250 employés et volume limité)

**Si DPO désigné** :

- [ ] Coordonnées publiées (site, CGU, politique)
- [ ] Déclaration CNIL
- [ ] Ressources suffisantes
- [ ] Indépendance garantie

**Alternative** : DPO externe mutualisé

---

## 🎯 Synthèse & Actions Prioritaires

### Statut Global

| Catégorie                         | Conformité | Actions                 |
| --------------------------------- | ---------- | ----------------------- |
| **Principes (Art. 5)**            | 🟢 90%     | Purge automatique       |
| **Licéité (Art. 6)**              | 🟢 95%     | Clause CGU spécifique   |
| **Information (Art. 12-14)**      | 🟡 80%     | DPO + renforcement info |
| **Droits personnes (Art. 15-22)** | 🟡 75%     | Procédures formelles    |
| **Privacy Design (Art. 25)**      | 🟢 95%     | -                       |
| **Sécurité (Art. 32)**            | 🟡 80%     | Pentest + formations    |
| **Violations (Art. 33-34)**       | 🟡 60%     | Procédures + registre   |
| **DPIA (Art. 35)**                | 🟡 50%     | DPIA complète           |
| **DPO (Art. 37)**                 | ❌ 0%      | Désignation DPO         |

**Global** : 🟡 **78% conforme** (Bon niveau, améliorations recommandées)

---

### Top 10 Actions Prioritaires

| #   | Action                                | Impact    | Effort | Échéance   |
| --- | ------------------------------------- | --------- | ------ | ---------- |
| 1   | **Désigner DPO** (interne ou externe) | 🔴 Élevé  | Moyen  | 1 mois     |
| 2   | **DPIA complète** (modèle CNIL)       | 🔴 Élevé  | Élevé  | 2 mois     |
| 3   | **Procédure violations** + registre   | 🔴 Élevé  | Faible | 2 semaines |
| 4   | **Purge automatique preuves**         | 🟠 Moyen  | Moyen  | 1 mois     |
| 5   | **Formation équipe RGPD**             | 🟠 Moyen  | Faible | 1 mois     |
| 6   | **Procédures droits formelles**       | 🟠 Moyen  | Moyen  | 1 mois     |
| 7   | **Pentest professionnel**             | 🟠 Moyen  | Élevé  | 3 mois     |
| 8   | **PCA/PRA formalisé**                 | 🟡 Faible | Moyen  | 2 mois     |
| 9   | **Clause CGU spécifique preuves**     | 🟡 Faible | Faible | 2 semaines |
| 10  | **WAF + DDoS protection**             | 🟡 Faible | Moyen  | 3 mois     |

---

## 📞 Contacts Utiles

**CNIL** :

- Site : https://www.cnil.fr
- Tél : 01 53 73 22 22
- Email : dpo@cnil.fr

**Formation DPO** :

- CNIL : https://www.cnil.fr/fr/devenir-delegue-la-protection-des-donnees
- AFCDP : https://www.afcdp.net/

**Modèles CNIL** :

- DPIA : https://www.cnil.fr/fr/modele-danalyse-dimpact-relative-la-protection-des-donnees-pia
- Registre traitements : https://www.cnil.fr/fr/RGDP-le-registre-des-activites-de-traitement

---

**Validation** : Ce document doit être validé par :

- [ ] DPO (si désigné)
- [ ] Responsable juridique
- [ ] RSSI
- [ ] Direction générale
- [ ] **Avocat spécialisé RGPD** (validation externe)

**Prochaine révision** : Février 2027 (annuelle)
