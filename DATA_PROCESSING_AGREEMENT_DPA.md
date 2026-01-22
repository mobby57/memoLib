# DATA PROCESSING AGREEMENT (DPA)

**IA Poste Manager — Accord de Traitement des Données**

---

## PRÉAMBULE

Cet Accord de Traitement des Données (« **DPA** ») formalise la relation entre votre cabinet d'avocats (« **Responsable de Traitement** ») et l'Éditeur du Service (« **Sous-Traitant** ») conformément à l'Article 28 du Règlement Général sur la Protection des Données (RGPD).

**Effectif :** 1er février 2026  
**Durée :** Coextensive au Contrat de Service  
**Applicable à :** Tous les plans (Starter, Pro, Enterprise)

---

## 1. DÉFINITIONS

### 1.1 Termes RGPD

* **Données à caractère personnel :** Informations pouvant identifier une personne physique (noms, emails, documents d'identité, etc.)
* **Responsable de Traitement :** Votre cabinet qui détermine **finalités et moyens** du traitement
* **Sous-Traitant :** L'Éditeur qui traite les données **sur instruction** du Responsable
* **Traitement :** Toute opération sur les données (collecte, analyse, conservation, suppression)
* **Violations de données :** Accès non autorisé, perte ou divulgation accidentelle

### 1.2 Données couvertes

Les « **Données Client** » comprennent :

✅ Noms et prénoms des clients  
✅ Emails et téléphones  
✅ Adresses personnelles  
✅ Documents d'identité  
✅ Données de procédure (emails, documents, formulaires)  
✅ Historique de dossiers  

---

## 2. NATURE ET FINALITÉ DU TRAITEMENT

### 2.1 Instructions du Responsable de Traitement

Le Sous-Traitant traite les Données Client **exclusivement** sur instruction écrite du Responsable :

1. **Instruction initiale :** Contrat de Service
2. **Instructions supplémentaires :** Demandes de support ou configuration du compte
3. **Fin du traitement :** Suppression ou export à résiliation

### 2.2 Finalités autorisées

Le Sous-Traitant utilise les Données Client uniquement pour :

✅ Structurer les Information Units  
✅ Créer les audit trails immuables  
✅ Fournir le Service selon les conditions contractuelles  
✅ Respecter les obligations légales  

### 2.3 Finalités **interdites**

Le Sous-Traitant **ne peut pas** utiliser les Données Client pour :

❌ Formation de modèles IA sans anonymisation préalable  
❌ Profilage juridique ou prédiction  
❌ Vente à tiers  
❌ Marketing ou publicité  
❌ Évaluation de crédit  
❌ Prise de décision autonome  

---

## 3. RESPONSABILITÉS DU SOUS-TRAITANT

### 3.1 Obligations fondamentales

Le Sous-Traitant s'engage à :

✅ **Traiter les données uniquement sur instruction** (Art. 28.3.a)  
✅ **Garantir la confidentialité** des personnes autorisées (Art. 28.3.b)  
✅ **Implémenter des mesures de sécurité** (Art. 28.3.c)  
✅ **Obtenir préalable autorisation** avant sous-traitance (Art. 28.2 et 28.4)  
✅ **Assister le Responsable** dans l'exercice des droits RGPD (Art. 28.3.e)  
✅ **Supprimer ou retourner les données** à fin du contrat (Art. 28.3.g)  

### 3.2 Mesures de sécurité

Le Sous-Traitant implémente et maintient :

| Mesure | Détail | Status |
|--------|--------|--------|
| **Chiffrement au repos** | AES-256 | ✅ Implémenté |
| **Chiffrement en transit** | TLS 1.3 | ✅ Implémenté |
| **Authentification MFA** | Optionnel pour utilisateurs | ✅ Disponible |
| **Isolement tenant** | Zéro accès croisé | ✅ Architectural |
| **Logs d'accès** | Tous les accès tracés | ✅ Append-only |
| **Tests de sécurité** | Minimum annuels | ✅ Planifié |
| **Incident response** | Plan d'action < 4h | ✅ En place |
| **Sauvegarde décentralisée** | Multi-région UE | ✅ Configuré |

### 3.3 Assistance du Responsable

Le Sous-Traitant assiste le Responsable pour :

✅ **Exercice des droits RGPD** (accès, rectification, effacement, etc.)  
✅ **Évaluations d'impact** (DPIA si approprié)  
✅ **Notifications d'incidents** (violations de données)  
✅ **Audits de conformité** (accès aux logs, audit trails, tests)  

---

## 4. SOUS-TRAITANTS SECONDAIRES

### 4.1 Autorisation pour sous-traitants

Le Sous-Traitant s'engage à :

✅ **Notifier le Responsable** avant engagement d'un sous-traitant secondaire  
✅ **Obtenir consentement préalable** (droit à opposition)  
✅ **Imposer les mêmes obligations** via DPA approprié  
✅ **Rester responsable** des sous-traitants secondaires  

### 4.2 Sous-traitants actuellement engagés

| Sous-traitant | Service | Localisation | DPA |
|---------------|---------|--------------|-----|
| Cloudflare | Infrastructure cloud | UE | ✅ Signé |
| PostgreSQL/D1 | Base de données | UE | ✅ Inclus |
| Stripe | Paiement | UE | ✅ Signé |
| SendGrid | Email support | UE | ✅ Signé |

**Mise à jour :** Liste actualisée trimestriellement sur demande.

---

## 5. DURATIONS DE RÉTENTION

### 5.1 Periods de stockage

| Catégorie | Durée | Raison |
|-----------|-------|--------|
| Données actives | Durée du contrat + 1 an | Droit de rétention légal |
| Logs d'audit | Minimum 7 ans | Délai de prescription |
| Sauvegardes | 90 jours post-suppression | Récupération incident |
| Données anonymisées | Indéfini | Amélioration Service |

### 5.2 Suppression à résiliation

À la fin du contrat, le Sous-Traitant :

✅ **Exporte les données** en format standard (CSV/JSON) sous 30 jours  
✅ **Supprime les données brutes** selon calendrier convenu  
✅ **Archive les logs d'audit** pour conformité légale (7 ans)  
✅ **Certifie la suppression** sous 60 jours  

---

## 6. LOCALISATION DES DONNÉES

### 6.1 Localisation géographique

**Garantie :** Toutes les Données Client restent **en Union Européenne**.

* **Serveurs :** UE uniquement (Cloudflare FR/DE)
* **Sauvegardes :** Multi-région UE
* **Pas de transfert tiers :** Aucun towards USA/Asie
* **Transferts légaux :** Seulement sur ordre légal (CNIL, tribunal)

### 6.2 Transferts vers tiers pays

En cas de **demande légale** d'une autorité hors-UE :

1. Le Sous-Traitant **notifiera le Responsable** (sauf interdiction)
2. Le Sous-Traitant **opposera les garanties RGPD** (Standard Contractual Clauses)
3. Les données seront transférées **seulement si légalement obligatoire**

---

## 7. EXERCICE DES DROITS RGPD

### 7.1 Droits des personnes concernées

Le Responsable peut exercer les droits suivants au nom de ses clients :

| Droit | Procédure | Délai Sous-Traitant |
|-------|-----------|-------------------|
| **Accès** (Art. 15) | Email DPO | 30 jours |
| **Rectification** (Art. 16) | Modification self-service | Immédiat |
| **Effacement** (Art. 17) | Email DPO + justification | 30 jours |
| **Limitation** (Art. 18) | Email DPO | 30 jours |
| **Portabilité** (Art. 20) | Export automatisé | 30 jours |
| **Opposition** (Art. 21) | Email DPO | 30 jours |

### 7.2 Responsabilité pour droits

Le Sous-Traitant **assiste** le Responsable mais **ne peut pas** refuser un droit légitime.

En cas de demande conflictuelle, le Responsable reste responsable légal.

---

## 8. NOTIFICATIONS D'INCIDENTS

### 8.1 Violations de données (Data Breaches)

En cas de **violation avérée** de sécurité :

**Délai de notification :** Dès détection (maximum 72h)

**Contenu :** 

* Nature de la violation
* Données affectées (nombre, type)
* Personnes concernées
* Mesures correctives
* Contact pour questions

### 8.2 Incidents de sécurité (sans violation)

Incidents mineurs ou incidents en cours (ex: tentative accès non-autorisé) :

**Notification :** Sous 24 heures  
**Détail :** Impact, mesures de mitigation, timeline

### 8.3 Obligation du Responsable

Le Responsable doit :

✅ **Évaluer** si notification CNIL/personnes est requise (Article 33/34 RGPD)  
✅ **Notifier la CNIL** si obligation légale (sous 72h)  
✅ **Déclarer à l'assurance** si nécessaire (couverture cyber)  

---

## 9. AUDITS ET CONFORMITÉ

### 9.1 Audit par le Responsable

Le Responsable a le droit d'auditer le Sous-Traitant :

| Audit | Fréquence | Notice | Droit d'accès |
|-------|-----------|--------|--------------|
| Conformité RGPD | 1x/an | 30j | ✅ Logs, rapports |
| Sécurité | 1x/an | 30j | ✅ Résultats |
| Mesures techniques | Sur demande | 7j | ✅ Configuration |

### 9.2 Audit par tiers

Le Responsable peut faire auditer le Sous-Traitant par un tiers indépendant **à ses frais** :

* Auditeur externe doit signer NDA
* Accès aux éléments non-sensibles
* Rapport final partagé avec Responsable

### 9.3 Certificats de conformité

Le Sous-Traitant fournit sur demande :

✅ Certificat ISO 27001 (sécurité informatique)  
✅ Rapport SOC 2 Type II (contrôles de sécurité)  
✅ Résultats audit interne annuel (résumé)  

---

## 10. PERSONNEL AUTORISÉ

### 10.1 Accès aux Données Client

**Seul le personnel suivant** peut accéder aux Données Client :

| Rôle | Justification | Accès |
|-----|--------------|-------|
| Support technique | Dépannage utilisateur | Logs + métadonnées |
| DevOps (incident) | Récupération sinistre | Données brutes (urgence) |
| DPA / Conformité | Audit RGPD | Données pseudonymisées |
| Sécurité | Enquête incident | Données pertinentes seulement |

### 10.2 Confidentialité du personnel

Tous les employés ayant accès signent :

✅ **NDA confidentialité**  
✅ **Clauses de sécurité**  
✅ **Engagement RGPD**  

---

## 11. DURÉE ET RÉSILIATION

### 11.1 Durée du DPA

Le DPA est **coextensif** au Contrat de Service :

* **Début :** 1er février 2026 (ou date activation)
* **Fin :** À résiliation du Contrat de Service
* **Continuation :** Obligations restent applicables pour données archivées (7 ans)

### 11.2 Résiliation

Le Responsable peut **résilier ce DPA** en mêmes termes que le Contrat (30j pour mois-à-mois).

À résiliation, voir section 5.2 pour destruction de données.

---

## 12. MODIFICATIONS DU DPA

### 12.1 Initiatives du Sous-Traitant

L'Éditeur peut **améliorer** les mesures de sécurité sans préavis.

Réductions nécessitent **préavis de 60 jours** + droit de résiliation.

### 12.2 Obligations légales changeantes

En cas de **nouvelle obligation légale** (CNIL, IA Act, etc.) :

* Le Sous-Traitant ajustera le DPA
* Notification sous 30 jours
* Applicabilité : Immédiate pour conformité légale

---

## 13. STANDARD CONTRACTUAL CLAUSES (SCC)

### 13.1 Transferts hors UE (si applicable)

En cas de transfert de données vers tiers pays :

Le Responsable et Sous-Traitant adoptent les **Standard Contractual Clauses** (Article 46 RGPD) :

* Module One : Responsable → Sous-Traitant
* Module Two : Responsable → Sous-Traitant (multi-party)

### 13.2 Pays non-adéquats

Les SCC incluent **mécanismes supplémentaires** pour :

* USA : Évaluation d'impact, garanties légales
* Autres : Cas par cas

---

## 14. LIMITATION DE RESPONSABILITÉ

### 14.1 Responsabilité conjointe

Le Responsable accepte que **sa propre responsabilité** inclut :

❌ Instruction de traitement illégale  
❌ Fourniture de données sans consentement  
❌ Violation de secret professionnel  
❌ Non-respect des délais de prescription  

### 14.2 Responsabilité du Sous-Traitant

Le Sous-Traitant n'est responsable que pour :

✅ Manquement à ses **obligations RGPD explicites**  
✅ Violation de **sécurité imputable au Sous-Traitant**  
✅ Non-respect de l'instruction du Responsable  

---

## 15. CONTACTS

### 15.1 Délégué à la Protection des Données (DPO)

**Pour toute question RGPD :**

📧 dpo@iapostemanager.com  
📞 [Téléphone si applicable]  

---

## 16. VERSION & EFFECTIVITÉ

**VERSION 1.0**  
**Effectif :** 1er février 2026

Cet accord remplace toute version antérieure.

Signature implicite lors de l'acceptation du Contrat de Service.

---

## SIGNATURE

**Responsable de Traitement**

Nom du cabinet : _________________________

Représentant : _________________________

Signature : _________________________

Date : _________________________

---

**Sous-Traitant (IA Poste Manager)**

Acceptation lors de conclusion du contrat de service.

Signature électronique disponible : ✅

---

**✅ PRÊT POUR SIGNATURE** — Peut être personalisé avec vos coordonnées légales.
