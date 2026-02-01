# Registre des Traitements de Données - RGPD

## Informations Générales

| Champ | Valeur |
|-------|--------|
| **Responsable de traitement** | [Nom de l'entreprise] |
| **Adresse** | [Adresse] |
| **DPO** | [À désigner] |
| **Contact DPO** | dpo@memoLib.com |
| **Date de mise à jour** | 26/01/2026 |

---

## Traitement 1: Gestion des Comptes Utilisateurs

| Élément | Description |
|---------|-------------|
| **Finalité** | Création et gestion des comptes utilisateurs pour l'accès à l'application |
| **Base légale** | Exécution du contrat (Art. 6.1.b RGPD) |
| **Catégories de personnes** | Clients (avocats, cabinets) |
| **Catégories de données** | Email, nom, prénom, mot de passe hashé, date d'inscription |
| **Destinataires** | Personnel habilité, hébergeur (Vercel), BDD (Neon) |
| **Transferts hors UE** | Oui - USA (Vercel, Neon) - Clauses contractuelles types |
| **Durée de conservation** | Durée du contrat + 3 ans |
| **Mesures de sécurité** | Chiffrement, hashing bcrypt, HTTPS, RBAC |

---

## Traitement 2: Gestion des Dossiers CESEDA

| Élément | Description |
|---------|-------------|
| **Finalité** | Suivi des dossiers d'étrangers (OQTF, visas, titres de séjour) |
| **Base légale** | Exécution du contrat (Art. 6.1.b RGPD) |
| **Catégories de personnes** | Clients des avocats (personnes étrangères) |
| **Catégories de données** | Numéro dossier, type procédure, dates, notes, documents |
| **Données sensibles** | Oui - origine ethnique implicite, situation administrative |
| **Destinataires** | Avocat responsable du dossier uniquement |
| **Transferts hors UE** | Oui - USA (Neon) - Clauses contractuelles types |
| **Durée de conservation** | 10 ans (obligation légale avocats) |
| **Mesures de sécurité** | Chiffrement AES-256, accès restreint, audit logs |

---

## Traitement 3: Logs et Sécurité

| Élément | Description |
|---------|-------------|
| **Finalité** | Sécurité du système, détection des intrusions |
| **Base légale** | Intérêt légitime (Art. 6.1.f RGPD) |
| **Catégories de personnes** | Tous les utilisateurs |
| **Catégories de données** | IP (pseudonymisée), actions, timestamps, user-agent hashé |
| **Destinataires** | Administrateurs système |
| **Transferts hors UE** | Non |
| **Durée de conservation** | 1 an |
| **Mesures de sécurité** | Pseudonymisation IP, accès restreint |

---

## Traitement 4: Analytics

| Élément | Description |
|---------|-------------|
| **Finalité** | Amélioration du service, statistiques d'usage |
| **Base légale** | Consentement (Art. 6.1.a RGPD) |
| **Catégories de personnes** | Utilisateurs ayant consenti |
| **Catégories de données** | Pages visitées, durée sessions, fonctionnalités utilisées |
| **Destinataires** | Équipe produit |
| **Transferts hors UE** | Non |
| **Durée de conservation** | 2 ans |
| **Mesures de sécurité** | Anonymisation, agrégation |

---

## Traitement 5: Assistance IA

| Élément | Description |
|---------|-------------|
| **Finalité** | Génération de suggestions et analyses via IA |
| **Base légale** | Exécution du contrat (Art. 6.1.b RGPD) |
| **Catégories de personnes** | Utilisateurs avec abonnement IA |
| **Catégories de données** | Contenu des requêtes, résultats générés |
| **Destinataires** | OpenAI (sous-traitant) |
| **Transferts hors UE** | Oui - USA (OpenAI) - Clauses contractuelles types |
| **Durée de conservation** | 30 jours (cache), puis suppression |
| **Mesures de sécurité** | Pas de données nominatives envoyées, isolation par tenant |

---

## Traitement 6: Facturation

| Élément | Description |
|---------|-------------|
| **Finalité** | Gestion des abonnements et paiements |
| **Base légale** | Exécution du contrat + obligation légale |
| **Catégories de personnes** | Clients payants |
| **Catégories de données** | Coordonnées facturation, historique paiements |
| **Destinataires** | Stripe (sous-traitant paiement) |
| **Transferts hors UE** | Oui - USA (Stripe) - Certification adéquate |
| **Durée de conservation** | 10 ans (obligation fiscale) |
| **Mesures de sécurité** | Données carte non stockées (Stripe) |

---

## Sous-traitants

| Sous-traitant | Rôle | Localisation | Garanties |
|---------------|------|--------------|-----------|
| Vercel Inc. | Hébergement | USA | SCCs, SOC 2 |
| Neon Inc. | Base de données | USA | SCCs, chiffrement |
| Stripe Inc. | Paiements | USA | PCI-DSS, SCCs |
| OpenAI | IA | USA | DPA, SCCs |
| GitHub | Code source | USA | SCCs |

---

## Droits des Personnes

### Procédures Implémentées

| Droit | Délai | Procédure |
|-------|-------|-----------|
| Accès | 1 mois | API `/api/rgpd/export` + validation email |
| Rectification | Immédiat | Interface utilisateur |
| Effacement | 1 mois | API `/api/rgpd/delete` + confirmation |
| Portabilité | 1 mois | Export JSON/PDF |
| Opposition | Immédiat | Paramètres compte |
| Limitation | 1 mois | Ticket support |

### Contact
- **Email**: rgpd@memoLib.com
- **Formulaire**: `/contact?subject=rgpd`

---

## Mesures de Sécurité Techniques

### Infrastructure
- [x] HTTPS obligatoire (TLS 1.3)
- [x] Chiffrement au repos (AES-256)
- [x] Sauvegardes chiffrées quotidiennes
- [x] Isolation réseau

### Accès
- [x] Authentification MFA disponible
- [x] RBAC (Role-Based Access Control)
- [x] Secrets dans Azure Key Vault
- [x] Rotation des secrets 90 jours

### Monitoring
- [x] Logs d'accès aux données
- [x] Alertes intrusion
- [x] Audit trail modifications

---

## Violations de Données

### Procédure de Notification

1. **Détection**: Monitoring automatique + signalement utilisateur
2. **Évaluation**: Analyse impact < 24h
3. **Notification CNIL**: < 72h si risque pour les droits
4. **Notification personnes**: Sans délai si risque élevé
5. **Documentation**: Registre des violations

### Historique des Violations
| Date | Description | Impact | Actions |
|------|-------------|--------|---------|
| - | Aucune violation à ce jour | - | - |

---

## Mises à Jour du Registre

| Date | Version | Modifications |
|------|---------|---------------|
| 26/01/2026 | 1.0 | Création initiale |

---

*Ce registre est mis à jour à chaque modification des traitements ou au minimum annuellement.*
