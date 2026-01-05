# POLITIQUE DE CONFIDENTIALITÉ

**IA Poste Manager**

*Conforme au Règlement Général sur la Protection des Données (RGPD)*

*Dernière mise à jour : Janvier 2026*

---

## 1. QUI SOMMES-NOUS ?

**Éditeur de la Plateforme :** [Votre Société SAS]  
**Adresse :** [Adresse complète]  
**SIRET :** [Numéro]  
**Email :** contact@votre-societe.com

**Délégué à la Protection des Données (DPO) :**  
Email : dpo@votre-societe.com  
Téléphone : [Numéro]

---

## 2. INTRODUCTION

La présente Politique de Confidentialité décrit comment **IA Poste Manager** collecte, utilise, stocke et protège vos données personnelles lors de l'utilisation de notre plateforme SaaS.

**Nous nous engageons à protéger votre vie privée et à garantir la sécurité de vos données conformément au RGPD (Règlement UE 2016/679).**

---

## 3. À QUI S'APPLIQUE CETTE POLITIQUE ?

Cette politique concerne :

### 👨‍💼 Utilisateurs professionnels (Avocats, Collaborateurs)
- Vous utilisez directement la plateforme pour gérer vos dossiers
- **Vous êtes responsable de traitement** pour les données de vos clients

### 👤 Clients finaux (Personnes physiques)
- Vos données sont traitées par votre cabinet d'avocat via notre plateforme
- **Votre avocat est le responsable de traitement**
- **Nous sommes sous-traitant** au sens du RGPD

---

## 4. QUELLES DONNÉES COLLECTONS-NOUS ?

### 4.1 Données des Utilisateurs Professionnels

| Catégorie | Exemples | Finalité | Base légale |
|-----------|----------|----------|-------------|
| **Identification** | Nom, prénom, email professionnel | Création et gestion du compte | Contrat (Art. 6.1.b RGPD) |
| **Coordonnées professionnelles** | Adresse cabinet, téléphone, Barreau | Communication, facturation | Contrat |
| **Connexion** | Email, mot de passe (hashé) | Authentification sécurisée | Contrat + Sécurité |
| **Logs techniques** | Adresse IP, navigateur, dates/heures connexion | Sécurité, traçabilité, support | Intérêt légitime (Art. 6.1.f) |
| **Facturation** | SIRET, adresse, TVA, RIB (si virement) | Facturation, obligations légales | Obligation légale (Art. 6.1.c) |

**Durée de conservation :** Pendant la durée du contrat + 2 ans (inactivité) + 10 ans (comptabilité)

---

### 4.2 Données des Clients Finaux (Utilisateurs Finaux)

> ⚠️ **Important :** Ces données sont traitées **pour le compte de votre avocat** (responsable de traitement). Nous agissons en tant que **sous-traitant**.

| Catégorie | Exemples | Traitement IA |
|-----------|----------|---------------|
| **Identité** | Nom, prénom, date de naissance, nationalité | ✅ Anonymisé |
| **Contact** | Email, téléphone, adresse | ✅ Anonymisé |
| **Documents d'identité** | Passeport, carte d'identité | ❌ Non envoyé à l'IA |
| **Situation juridique** | Type dossier CESEDA, statut, article de loi | ✅ Anonymisé (structure seule) |
| **Documents justificatifs** | OQTF, fiches de paie, justificatifs | ❌ Hash seulement |
| **Données biométriques** | Photos d'identité (si fournies) | ❌ Non traité |

**Finalité :** Gestion de votre dossier juridique par votre avocat

**Base légale :** Contrat entre vous et votre avocat + Consentement pour données sensibles

**Durée de conservation :** Définie par votre avocat (généralement 5 ans après clôture du dossier)

---

## 5. COMMENT UTILISONS-NOUS VOS DONNÉES ?

### 5.1 Fourniture du service

- Gestion de votre compte et accès à la plateforme
- Stockage sécurisé de vos dossiers et documents
- Fonctionnalités de recherche, calendrier, facturation
- Assistance et support technique

### 5.2 Intelligence Artificielle (IA)

**Principe fondamental :**

> **Les données personnelles sont ANONYMISÉES avant tout traitement IA.**

**Ce que l'IA reçoit :**
✅ Type de dossier (ex: "Titre de séjour")  
✅ Statut (ex: "en_cours")  
✅ Structure du dossier (nombre de documents, dates)  

**Ce que l'IA ne reçoit JAMAIS :**
❌ Noms, prénoms  
❌ Emails, téléphones  
❌ Numéros de passeport  
❌ Contenu des documents  

**Aucun apprentissage automatique sur vos données.**

### 5.3 Sécurité et audit

- Détection des accès non autorisés
- Journalisation des actions (audit immuable)
- Prévention des violations de données
- Conformité réglementaire

### 5.4 Communication

- Emails transactionnels (confirmation compte, facturation)
- Notifications importantes (maintenance, mises à jour)
- Support technique (si vous nous contactez)

**Nous n'envoyons PAS de emails marketing sans votre consentement préalable.**

---

## 6. AVEC QUI PARTAGEONS-NOUS VOS DONNÉES ?

### 6.1 Pas d'accès éditeur au contenu

> **"Même nous, éditeurs, ne pouvons pas lire vos dossiers."**

**Architecture Zero-Trust :** Nous n'avons accès qu'aux métadonnées techniques (nombre de dossiers, usage stockage), jamais au contenu.

### 6.2 Sous-traitants

Nous faisons appel à des sous-traitants **conformes RGPD** :

| Sous-traitant | Service | Localisation | Garanties |
|---------------|---------|--------------|-----------|
| **OVH / Azure** | Hébergement | 🇫🇷 France (UE) | DPA signé, ISO 27001 |
| **Stripe** | Paiement (si applicable) | 🇪🇺 UE | DPA signé, PCI-DSS |
| **Brevo** | Emails transactionnels | 🇪🇺 UE | DPA signé, RGPD |

**Aucun transfert hors Union Européenne** sans garanties appropriées (clauses contractuelles types).

### 6.3 Autorités légales

Nous pouvons être amenés à communiquer des données :
- Sur réquisition judiciaire
- Pour se conformer à une obligation légale
- Pour protéger nos droits (fraude, sécurité)

---

## 7. COMMENT PROTÉGEONS-NOUS VOS DONNÉES ?

### 🔐 Mesures techniques

✅ **Chiffrement :** AES-256 (repos) + TLS 1.3 (transit)  
✅ **Isolation multi-tenant :** aucun accès croisé entre cabinets  
✅ **Authentification forte :** Mot de passe hashé (bcrypt) + MFA disponible  
✅ **Audit immuable :** Journalisation de toutes les actions (append-only)  
✅ **Versioning documents :** Hash SHA-256 + historique complet  
✅ **Backups chiffrés :** Quotidiens, multi-zone géographique  
✅ **Middleware Zero-Trust :** Authentification + Autorisation + Audit sur chaque requête  

### 🧑‍💼 Mesures organisationnelles

✅ Accès limité au personnel habilité (principe du moindre privilège)  
✅ Clauses de confidentialité (NDA) pour tous les salariés  
✅ Formation RGPD annuelle obligatoire  
✅ Audits de sécurité réguliers (pentest annuel)  
✅ Procédure de gestion des incidents (notification < 72h)  

**Documentation complète :** [SECURITE_CONFORMITE.md](SECURITE_CONFORMITE.md)

---

## 8. VOS DROITS SUR VOS DONNÉES

Conformément au RGPD, vous disposez des droits suivants :

### ✅ Droit d'accès (Art. 15)
Obtenir une copie de vos données personnelles.

### ✅ Droit de rectification (Art. 16)
Corriger vos données inexactes ou incomplètes.

### ✅ Droit d'effacement (Art. 17)
Demander la suppression de vos données (sous conditions).

### ✅ Droit à la portabilité (Art. 20)
Récupérer vos données dans un format structuré (JSON, CSV).

### ✅ Droit d'opposition (Art. 21)
Vous opposer au traitement de vos données (sauf obligation légale).

### ✅ Droit à la limitation (Art. 18)
Demander la limitation du traitement (en cas de contestation).

### ✅ Droit de définir des directives post-mortem
Définir le sort de vos données après votre décès.

---

### 📧 Comment exercer vos droits ?

**Email :** rgpd@votre-societe.com  
**Formulaire en ligne :** [lien-vers-formulaire]  
**Courrier postal :** [Adresse complète]

**Délai de réponse :** 1 mois maximum (prolongeable à 3 mois si complexe)

**Pièce d'identité requise** pour vérifier votre identité.

---

### ⚖️ Droit de réclamation

Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la **CNIL** :

**Site web :** https://www.cnil.fr/fr/plaintes  
**Adresse :** CNIL - 3 Place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07

---

## 9. DURÉES DE CONSERVATION

| Type de donnée | Durée | Justification |
|----------------|-------|---------------|
| **Compte utilisateur actif** | Durée du contrat | Fourniture du service |
| **Compte inactif** | 2 ans puis suppression | RGPD (minimisation) |
| **Dossiers clients** | 5 ans après clôture | Prescription quinquennale |
| **Documents justificatifs** | Idem dossiers | Obligation légale |
| **Logs d'audit sécurité** | 1 an | Sécurité + conformité |
| **Logs techniques** | 3 mois | Troubleshooting |
| **Données comptables** | 10 ans | Obligation légale (Code commerce) |

**À l'expiration :** Suppression définitive ou anonymisation irréversible.

---

## 10. COOKIES ET TECHNOLOGIES SIMILAIRES

### 🍪 Cookies utilisés

| Type | Nom | Finalité | Durée | Consentement requis |
|------|-----|----------|-------|---------------------|
| **Strictement nécessaires** | `session_id` | Authentification | Session | ❌ Non (exemptés) |
| **Statistiques** | `_ga` (Google Analytics) | Analyse d'audience | 13 mois | ✅ Oui |
| **Préférences** | `theme`, `lang` | Personnalisation | 1 an | ❌ Non |

**Gestion des cookies :** Vous pouvez accepter/refuser via le bandeau cookie ou dans vos paramètres.

**Refuser :** Paramètres navigateur ou [lien-gestion-cookies]

---

## 11. TRANSFERTS INTERNATIONAUX

**Aucun transfert hors Union Européenne** dans le cadre normal du service.

**Si transfert futur nécessaire :**
- Décision d'adéquation de la Commission européenne, OU
- Clauses contractuelles types (CCT) approuvées par la CNIL, OU
- Votre consentement explicite

---

## 12. MINEURS

La plateforme est destinée aux **professionnels du droit** uniquement.

Si des données de mineurs sont traitées (ex: dossier regroupement familial), c'est sous la responsabilité du cabinet d'avocat (responsable de traitement).

---

## 13. MODIFICATIONS DE CETTE POLITIQUE

Nous pouvons modifier cette Politique de Confidentialité pour refléter des évolutions légales ou techniques.

**Notification :** Email + bannière sur la plateforme **30 jours avant** l'entrée en vigueur.

**Historique des versions :** Disponible en bas de cette page.

---

## 14. CONTACT

### Pour toute question sur vos données :

**DPO (Délégué à la Protection des Données) :**  
Email : dpo@votre-societe.com  
Téléphone : [Numéro]  
Adresse : [Adresse complète]

**Support général :**  
Email : support@votre-societe.com

---

## 15. GLOSSAIRE

**RGPD** : Règlement Général sur la Protection des Données (UE 2016/679)

**Responsable de traitement** : Entité qui détermine les finalités et moyens du traitement (ex: votre cabinet d'avocat)

**Sous-traitant** : Entité qui traite des données pour le compte du responsable (ex: IA Poste Manager)

**Donnée personnelle** : Toute information relative à une personne physique identifiée ou identifiable

**Anonymisation** : Traitement rendant impossible l'identification de la personne

**Hash** : Empreinte numérique unique d'un fichier (SHA-256)

---

## 16. CAS PRATIQUES (FAQ)

### ❓ Qui peut voir mes dossiers ?

**Réponse :** Uniquement les utilisateurs de votre cabinet (isolation stricte). Même l'éditeur ne peut pas y accéder.

---

### ❓ L'IA apprend-elle sur mes données ?

**Réponse :** Non. Aucun apprentissage automatique. Les données sont anonymisées et non conservées par l'IA.

---

### ❓ Que se passe-t-il si je résilie ?

**Réponse :** Vous avez 30 jours pour exporter vos données. Après, suppression définitive et irréversible.

---

### ❓ Mes données sont-elles sauvegardées ?

**Réponse :** Oui, backups quotidiens chiffrés, multi-zone géographique (UE).

---

### ❓ Comment puis-je supprimer mon compte ?

**Réponse :** Depuis votre espace client > Paramètres > Supprimer mon compte. Ou par email à rgpd@votre-societe.com

---

### ❓ Où sont stockées mes données ?

**Réponse :** En Union Européenne (France ou Allemagne) uniquement. Aucun transfert hors UE.

---

## 17. HISTORIQUE DES VERSIONS

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | Janvier 2026 | Version initiale |

---

## 18. ACCEPTATION

En utilisant la plateforme IA Poste Manager, vous reconnaissez avoir lu et compris cette Politique de Confidentialité.

---

**📧 Contact RGPD : dpo@votre-societe.com**

*Document téléchargeable au format PDF : [lien-politique-confidentialite.pdf]*

**Conforme RGPD (UE 2016/679) - Version 1.0 - Janvier 2026**
