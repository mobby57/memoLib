# 🔒 DPIA - Data Protection Impact Assessment

**IA Poste Manager - Analyse d'Impact relative à la Protection des Données**

*Conformément à l'article 35 du RGPD*

---

## 📋 INFORMATIONS GÉNÉRALES

| Champ | Valeur |
|-------|--------|
| **Responsable du traitement** | [Votre Société SAS] |
| **DPO (si applicable)** | [Nom du DPO] |
| **Date de réalisation** | Janvier 2026 |
| **Version** | 1.0 |
| **Prochaine révision** | Janvier 2027 |

---

## 1️⃣ DESCRIPTION DU TRAITEMENT

### 🎯 Finalité

**IA Poste Manager** est une plateforme SaaS multi-tenant permettant aux cabinets d'avocats spécialisés en droit des étrangers (CESEDA) de gérer leurs dossiers clients avec l'assistance d'une intelligence artificielle.

**Finalités principales :**
- Gestion de dossiers juridiques (OQTF, naturalisation, titres de séjour, etc.)
- Assistance IA pour le tri, la structuration et la préparation de documents
- Traçabilité et audit des actions
- Facturation et gestion administrative

---

### 👥 Catégories de personnes concernées

1. **Clients finaux** (étrangers sollicitant une assistance juridique)
   - Demandeurs d'asile
   - Personnes sous OQTF
   - Candidats à la naturalisation
   - Détenteurs ou demandeurs de titres de séjour

2. **Utilisateurs de la plateforme**
   - Avocats
   - Collaborateurs de cabinet
   - Secrétaires juridiques
   - Super Admins (éditeur logiciel)

---

### 🗂️ Catégories de données traitées

#### Données des clients finaux

| Catégorie | Exemples | Sensibilité |
|-----------|----------|-------------|
| **Identité** | Nom, prénom, date de naissance, nationalité | 🔴 Élevée |
| **Contact** | Email, téléphone, adresse postale | 🟠 Moyenne |
| **Documents d'identité** | Passeport, carte d'identité, numéros | 🔴 Très élevée |
| **Situation juridique** | Type de dossier CESEDA, statut, article de loi | 🔴 Très élevée |
| **Documents joints** | OQTF, fiches de paie, justificatifs de domicile | 🔴 Très élevée |
| **Données biométriques** | Photos d'identité (si fournies) | 🔴 Très élevée |

#### Données des utilisateurs professionnels

| Catégorie | Exemples | Sensibilité |
|-----------|----------|-------------|
| **Compte utilisateur** | Email, nom, rôle, mot de passe (hashé) | 🟠 Moyenne |
| **Activité** | Logs de connexion, actions effectuées | 🟢 Faible |
| **Facturation** | Coordonnées bancaires (si paiement) | 🔴 Élevée |

---

### 🤖 Traitement automatisé (IA)

**Ollama (LLM local ou distant)**

| Fonction IA | Données d'entrée | Risque |
|-------------|------------------|--------|
| Tri de courriers | Objet, date, expéditeur **anonymisé** | 🟢 Faible |
| Génération de brouillons | Structure dossier **anonymisée** | 🟠 Moyen |
| Analyse risque juridique | Type dossier, article CESEDA | 🟠 Moyen |
| OCR documents | Images documents **hachées** | 🔴 Élevé |

**Mesure clé :** Toutes les données envoyées à l'IA sont **anonymisées** via le module `ai-isolation.ts`.

---

## 2️⃣ NÉCESSITÉ ET PROPORTIONNALITÉ

### ✅ Justification du traitement

| Question | Réponse |
|----------|---------|
| **Le traitement est-il nécessaire ?** | ✅ Oui, indispensable pour la gestion de dossiers juridiques |
| **Existe-t-il une alternative ?** | ❌ Non, traitement manuel impossible à cette échelle |
| **Les données collectées sont-elles limitées au strict nécessaire ?** | ✅ Oui, minimisation appliquée |
| **Les durées de conservation sont-elles justifiées ?** | ✅ Oui, alignées sur obligations légales (prescription) |

---

### ⏱️ Durées de conservation

| Type de donnée | Durée | Justification |
|----------------|-------|---------------|
| **Dossiers clients** | 5 ans après clôture | Prescription quinquennale (droit civil) |
| **Documents justificatifs** | Idem dossier | Obligation légale |
| **Logs d'audit** | 1 an | Sécurité + conformité |
| **Logs techniques** | 3 mois | Troubleshooting |
| **Comptes utilisateurs inactifs** | Suppression après 2 ans | RGPD (minimisation) |

---

## 3️⃣ RISQUES IDENTIFIÉS

### 🔴 Risque 1 : Fuite de données sensibles

**Description :**  
Accès non autorisé à des données clients (passeports, OQTF, situations juridiques).

**Impact :**  
- ⚖️ **Juridique :** Violation secret professionnel, sanctions CNIL (jusqu'à 20M€)
- 👤 **Personnes concernées :** Préjudice grave (discrimination, expulsion)
- 💼 **Réputationnel :** Perte de confiance, clients, faillite cabinet

**Probabilité avant mesures :** 🔴 Élevée (données attractives, multi-tenant)

---

### 🟠 Risque 2 : Utilisation abusive de l'IA

**Description :**  
L'IA génère un conseil juridique erroné ou utilise des données non anonymisées.

**Impact :**  
- ⚖️ **Juridique :** Responsabilité avocat engagée, faute professionnelle
- 👤 **Personnes concernées :** Décision administrative défavorable (refus titre)
- 🤖 **Éthique :** Confiance en l'IA compromise

**Probabilité avant mesures :** 🟠 Moyenne

---

### 🟠 Risque 3 : Accès croisé entre cabinets (cross-tenant)

**Description :**  
Un avocat du cabinet A accède aux dossiers du cabinet B.

**Impact :**  
- ⚖️ **Juridique :** Violation RGPD + secret professionnel
- 💼 **Commercial :** Perte de tous les clients

**Probabilité avant mesures :** 🟠 Moyenne (erreur dev, faille)

---

### 🟡 Risque 4 : Ransomware / Perte de données

**Description :**  
Chiffrement malveillant de la base de données ou corruption.

**Impact :**  
- ⚖️ **Juridique :** Violation RGPD (disponibilité), plaintes clients
- 💼 **Opérationnel :** Paralysie totale des cabinets
- 💰 **Financier :** Rançon, perte revenus

**Probabilité avant mesures :** 🟡 Faible à moyenne

---

## 4️⃣ MESURES DE SÉCURITÉ MISES EN ŒUVRE

### 🔐 Mesures techniques

| Mesure | Description | Risque atténué |
|--------|-------------|----------------|
| **Isolation multi-tenant stricte** | `tenantId` obligatoire sur CHAQUE requête | Risque 1, 3 |
| **Audit Log immuable** | Journalisation append-only avec hash SHA-256 | Risque 1, 2, 3 |
| **Versioning documents** | Hash + historique complet, intégrité vérifiable | Risque 4 |
| **Anonymisation IA** | Module `ai-isolation.ts` : aucune donnée sensible envoyée | Risque 2 |
| **Chiffrement au repos** | Base de données chiffrée (AES-256) | Risque 1, 4 |
| **Chiffrement en transit** | HTTPS/TLS 1.3 obligatoire | Risque 1 |
| **Authentification forte** | NextAuth + MFA pour admins | Risque 1, 3 |
| **Middleware Zero-Trust** | Auth + Authz + Audit sur chaque requête | Risque 1, 2, 3 |
| **Backups chiffrés** | Quotidiens, multi-zone, hash vérifié | Risque 4 |
| **Super Admin sans accès contenu** | Métadonnées uniquement, jamais les documents | Risque 1 |

---

### 🧑‍💼 Mesures organisationnelles

| Mesure | Description |
|--------|-------------|
| **Politique de sécurité** | Charte interne éditeur + CGU cabinets |
| **Formation équipe** | Sensibilisation RGPD, Zero-Trust, sécurité |
| **Procédure violation données** | Plan de réponse incident (< 72h notification CNIL) |
| **Audits réguliers** | Pentest annuel, revue code sécurité |
| **DPA fournisseurs** | Contrats sous-traitance (Ollama, hébergeur) |
| **Droit des personnes** | Portail libre-service (accès, rectification, suppression) |

---

### 🎯 Validation humaine obligatoire

| Action IA | Validation requise | Niveau |
|-----------|-------------------|--------|
| Tri courriers | ❌ Non (tâche administrative) | - |
| Brouillon réponse | ✅ Oui | Avocat |
| Analyse risque | ✅ Oui | Avocat |
| Envoi document | ✅ Oui | Avocat + double-check |

**Principe :** L'IA **prépare**, l'humain **décide**.

---

## 5️⃣ ÉVALUATION RÉSIDUELLE DES RISQUES

### Après application des mesures

| Risque | Impact | Probabilité | Niveau résiduel | Acceptable ? |
|--------|--------|-------------|-----------------|--------------|
| **1. Fuite données** | Très élevé | 🟢 Très faible | 🟡 Modéré | ✅ Oui |
| **2. IA abusive** | Élevé | 🟢 Très faible | 🟢 Faible | ✅ Oui |
| **3. Cross-tenant** | Très élevé | 🟢 Très faible | 🟡 Modéré | ✅ Oui |
| **4. Ransomware** | Élevé | 🟢 Faible | 🟢 Faible | ✅ Oui |

**Conclusion :** Tous les risques résiduels sont **acceptables** sous réserve du maintien des mesures.

---

## 6️⃣ AVIS DES PARTIES PRENANTES

### 👨‍💼 Consultation DPO

> "L'architecture Zero-Trust et l'anonymisation IA sont conformes aux exigences RGPD. Le principe de validation humaine systématique pour les actes juridiques est essentiel et bien implémenté."

**Date :** [À compléter]  
**Signature DPO :** [À compléter]

---

### 🧑‍⚖️ Avis avocats (utilisateurs finaux)

**Retours cabinets pilotes :**
- ✅ "La traçabilité est rassurante"
- ✅ "L'impossibilité pour l'éditeur de lire nos dossiers est un vrai + commercial"
- ⚠️ "Besoin de formation sur la partie IA pour bien comprendre les limites"

---

## 7️⃣ PLAN D'ACTION

### ✅ Mesures déjà mises en œuvre

- [x] Isolation multi-tenant
- [x] Audit log immuable
- [x] Anonymisation IA
- [x] Middleware Zero-Trust
- [x] Versioning documents

---

### 🔄 Mesures à déployer (Roadmap)

| Action | Priorité | Échéance | Responsable |
|--------|----------|----------|-------------|
| **Pentesting externe** | 🔴 Haute | Q1 2026 | CTO |
| **Certification ISO 27001** | 🟠 Moyenne | Q3 2026 | DPO |
| **Chiffrement E2E (optionnel clients)** | 🟢 Basse | Q4 2026 | Dev Team |
| **SOC 2 Type II** | 🟠 Moyenne | 2027 | DPO + CTO |
| **Formation avocats (IA éthique)** | 🔴 Haute | Q1 2026 | Support |

---

## 8️⃣ VALIDATION FINALE

### ✅ Décision

**Le traitement peut-il être mis en œuvre ?**

☑️ **OUI**, sous réserve de :
1. Maintien de toutes les mesures techniques listées
2. Revue annuelle de cette DPIA
3. Notification CNIL en cas de modification majeure
4. Formation continue des équipes

**Date de validation :** [À compléter]  
**Responsable du traitement :** [Nom, Fonction, Signature]

---

## 📎 ANNEXES

### A. Architecture technique

Voir : [docs/SECURITE_CONFORMITE.md](SECURITE_CONFORMITE.md)

### B. Registre des traitements

Voir : [docs/DOSSIER_CNIL.md](DOSSIER_CNIL.md) *(à créer)*

### C. Procédure violation de données

**Étapes en cas d'incident :**
1. Détection (monitoring, alerte)
2. Confinement (isolation, blocage accès)
3. Évaluation risque (impact personnes)
4. Notification CNIL (< 72h si risque élevé)
5. Communication personnes concernées (si risque élevé)
6. Correction et post-mortem

---

## 🔄 HISTORIQUE DES RÉVISIONS

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | Janvier 2026 | Super Admin | Création initiale |

---

**📧 Contact DPO :** [dpo@votre-societe.com]  
**📄 Document confidentiel - Usage interne et autorités de contrôle uniquement**
