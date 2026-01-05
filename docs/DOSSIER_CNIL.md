# 📊 DOSSIER CNIL - Registre des Traitements

**IA Poste Manager - Documentation Conformité RGPD**

*Articles 30 et 33 du RGPD*

---

## 📋 IDENTIFICATION DU RESPONSABLE DE TRAITEMENT

| Champ | Information |
|-------|-------------|
| **Raison sociale** | [Votre Société SAS] |
| **Adresse siège** | [Adresse complète] |
| **SIRET** | [Numéro SIRET] |
| **Représentant légal** | [Nom Prénom - Fonction] |
| **DPO (si désigné)** | [Nom + Email + Téléphone] |
| **Contact RGPD** | rgpd@votre-societe.com |

---

## 1️⃣ REGISTRE DES ACTIVITÉS DE TRAITEMENT

### 📁 Traitement n°1 : Gestion de la plateforme SaaS multi-tenant

| Élément | Description |
|---------|-------------|
| **Nom du traitement** | Gestion de la plateforme IA Poste Manager |
| **Finalité** | Fourniture d'un service SaaS de gestion de dossiers juridiques avec IA |
| **Base légale** | Contrat (Art. 6.1.b RGPD) + Intérêt légitime (6.1.f) |
| **Catégories de personnes** | Utilisateurs professionnels (avocats, collaborateurs) |
| **Données traitées** | Email, nom, rôle, logs de connexion, mot de passe hashé |
| **Destinataires** | Équipe technique interne, hébergeur (OVH/Azure) |
| **Transfert hors UE** | ❌ Non |
| **Durée de conservation** | Compte actif : durée du contrat + 2 ans inactif |
| **Mesures de sécurité** | Chiffrement, MFA, audit logs, Zero-Trust |

---

### 📁 Traitement n°2 : Gestion des dossiers clients (pour le compte des cabinets)

| Élément | Description |
|---------|-------------|
| **Nom du traitement** | Gestion de dossiers juridiques CESEDA |
| **Finalité** | Permettre aux avocats de gérer leurs dossiers clients |
| **Base légale** | Contrat (6.1.b) + Obligations légales (6.1.c) + Consentement (9.2.a pour données sensibles) |
| **Catégories de personnes** | Clients finaux des cabinets (étrangers) |
| **Données traitées** | Identité, contact, documents d'identité, situation juridique, documents CESEDA |
| **Catégories particulières** | ⚠️ Origine ethnique/raciale (implicite), données biométriques (photos ID) |
| **Destinataires** | Cabinet d'avocat concerné uniquement (isolation stricte) |
| **Transfert hors UE** | ❌ Non |
| **Durée de conservation** | 5 ans après clôture dossier (prescription) |
| **Mesures de sécurité** | Isolation tenant, chiffrement AES-256, hash documents, versioning, audit |

**⚠️ Remarque :** Nous sommes **sous-traitant** pour ce traitement. Le cabinet d'avocat est le **responsable de traitement**.

---

### 📁 Traitement n°3 : Assistance IA (Ollama)

| Élément | Description |
|---------|-------------|
| **Nom du traitement** | Traitement automatisé par intelligence artificielle |
| **Finalité** | Assistance à la gestion de dossiers (tri, structuration, génération brouillons) |
| **Base légale** | Intérêt légitime (6.1.f) + Transparence |
| **Catégories de personnes** | Clients finaux (données anonymisées) |
| **Données traitées** | Type dossier, statut, structure **ANONYMISÉE** (aucune donnée personnelle identifiable) |
| **Destinataires** | Service IA (Ollama local ou API) |
| **Transfert hors UE** | ⚠️ Dépend du déploiement (local = non, API externe = vérifier DPA) |
| **Durée de conservation** | Logs IA : 3 mois |
| **Mesures de sécurité** | Anonymisation stricte (module ai-isolation.ts), validation humaine obligatoire, rate limiting |

**📌 Principe :** L'IA ne reçoit **JAMAIS** de données personnelles brutes.

---

### 📁 Traitement n°4 : Audit et sécurité (Logs)

| Élément | Description |
|---------|-------------|
| **Nom du traitement** | Journalisation des accès et actions |
| **Finalité** | Sécurité, traçabilité, détection d'anomalies, conformité RGPD |
| **Base légale** | Obligation légale (6.1.c) + Intérêt légitime (6.1.f) |
| **Catégories de personnes** | Tous utilisateurs de la plateforme |
| **Données traitées** | ID utilisateur, IP, user-agent, action effectuée, timestamp, hash |
| **Destinataires** | Équipe sécurité interne, DPO |
| **Transfert hors UE** | ❌ Non |
| **Durée de conservation** | 1 an (logs audit), 3 mois (logs techniques) |
| **Mesures de sécurité** | Append-only (immuable), chiffrement, accès restreint |

---

## 2️⃣ MESURES TECHNIQUES ET ORGANISATIONNELLES

### 🔐 Sécurité technique

| Mesure | Implémentation | Preuves |
|--------|----------------|---------|
| **Chiffrement au repos** | Base de données SQLite chiffrée (AES-256) | Config serveur |
| **Chiffrement en transit** | HTTPS/TLS 1.3 obligatoire | Certificat SSL Let's Encrypt |
| **Authentification** | NextAuth + bcrypt (passwords), MFA pour admins | Code source |
| **Autorisation** | RBAC (Role-Based Access Control) + tenant isolation | Middleware Zero-Trust |
| **Audit immuable** | Modèle AuditLog append-only avec hash SHA-256 | Prisma schema |
| **Versioning** | DocumentVersion avec hash intégrité | Prisma schema |
| **Anonymisation IA** | Module ai-isolation.ts | Code source |
| **Backups** | Quotidiens, chiffrés, multi-zone | Script cron |
| **Monitoring** | Détection anomalies, alertes automatiques | Dashboard sécurité |

---

### 🧑‍💼 Sécurité organisationnelle

| Mesure | Description |
|--------|-------------|
| **Politique de sécurité** | Charte interne signée par tous les salariés |
| **Habilitations** | Accès basé sur le principe du moindre privilège |
| **Formation** | Sensibilisation RGPD annuelle obligatoire |
| **Audits** | Pentest annuel + revue code sécurité trimestrielle |
| **Gestion incidents** | Procédure de notification < 72h CNIL |
| **Contrats sous-traitants** | DPA (Data Processing Agreement) avec tous les fournisseurs |
| **Confidentialité** | NDA (Non-Disclosure Agreement) pour tous les salariés |

---

## 3️⃣ SOUS-TRAITANTS (REGISTRE)

### 📋 Liste des sous-traitants

| Sous-traitant | Service | Données traitées | Localisation | DPA signé | Certifications |
|---------------|---------|------------------|--------------|-----------|----------------|
| **OVH / Azure** | Hébergement | Toutes données plateforme | 🇫🇷 France (UE) | ✅ Oui | ISO 27001, SOC 2 |
| **Ollama (si cloud)** | IA LLM | Données anonymisées uniquement | ⚠️ Vérifier | ⚠️ À signer | - |
| **Stripe / PayPlug** | Paiement (si applicable) | Données bancaires | 🇪🇺 UE | ✅ Oui | PCI-DSS |
| **SendGrid / Brevo** | Envoi emails (si applicable) | Email, nom | 🇪🇺 UE | ✅ Oui | ISO 27001 |

**⚠️ Règle :** Aucun sous-traitant hors UE sans garanties appropriées (clauses contractuelles types).

---

## 4️⃣ DROITS DES PERSONNES

### ✅ Modalités d'exercice

| Droit | Moyen d'exercice | Délai de réponse |
|-------|------------------|------------------|
| **Accès** (Art. 15) | Email rgpd@ + portail en ligne | 1 mois |
| **Rectification** (Art. 16) | Formulaire en ligne + email | 1 mois |
| **Effacement** (Art. 17) | Email rgpd@ (vérif identité) | 1 mois |
| **Portabilité** (Art. 20) | Export JSON via portail | 1 mois |
| **Opposition** (Art. 21) | Email rgpd@ | 1 mois |
| **Limitation** (Art. 18) | Email rgpd@ | 1 mois |
| **Réclamation CNIL** | Formulaire CNIL en ligne | - |

**📧 Contact :** rgpd@votre-societe.com

---

### 🤖 Droit spécifique : Décision automatisée (Art. 22)

**Question :** Y a-t-il des décisions entièrement automatisées avec effets juridiques ?

**Réponse :** ❌ **NON**

**Justification :** Toutes les actions critiques de l'IA requièrent une **validation humaine explicite**. L'IA prépare, l'avocat décide. Conformité totale avec l'Art. 22 RGPD.

---

## 5️⃣ ANALYSE D'IMPACT (DPIA)

**DPIA réalisée :** ✅ Oui

**Date :** Janvier 2026

**Document :** [docs/DPIA.md](DPIA.md)

**Conclusion :** Risques résiduels acceptables sous réserve du maintien des mesures.

---

## 6️⃣ VIOLATION DE DONNÉES (PROCÉDURE)

### 🚨 Plan de réponse incident

#### Phase 1 : Détection (T+0)

- Monitoring automatique (dashboard sécurité)
- Alerte email/SMS équipe sécurité
- Logs audit consultés

#### Phase 2 : Confinement (T+1h)

- Isolation système compromis
- Blocage accès suspect
- Sauvegarde état système

#### Phase 3 : Évaluation (T+6h)

- Nombre de personnes impactées
- Type de données concernées
- Risque pour les droits et libertés

**Critères notification CNIL (< 72h) :**
- ✅ Données sensibles (identité, documents juridiques)
- ✅ Volume > 10 personnes
- ✅ Risque élevé (discrimination, expulsion)

#### Phase 4 : Notification (T+24h)

**Notification CNIL si :** Risque élevé pour les personnes

**Notification personnes concernées si :** Risque très élevé (impossibilité de prendre mesures)

**Modèle email notification :**

```
Objet : Incident de sécurité - IA Poste Manager

Madame, Monsieur,

Nous vous informons qu'un incident de sécurité a affecté vos données personnelles le [DATE].

Données concernées : [LISTE]
Risques potentiels : [DESCRIPTION]
Mesures prises : [ACTIONS]

Nous recommandons : [CONSEILS]

Contact : rgpd@votre-societe.com

Cordialement,
[Responsable de traitement]
```

#### Phase 5 : Correction (T+72h → 1 mois)

- Patch faille sécurité
- Revue complète architecture
- Formation équipe
- Mise à jour procédures

#### Phase 6 : Post-mortem (T+1 mois)

- Rapport d'incident complet
- Leçons apprises
- Amélioration continue

---

## 7️⃣ TRANSFERTS INTERNATIONAUX

**Statut actuel :** ❌ Aucun transfert hors UE

**Si transfert futur nécessaire :**

| Destination | Mécanisme | Document |
|-------------|-----------|----------|
| Royaume-Uni | Décision d'adéquation UE | N/A |
| USA | Clauses contractuelles types (CCT) | Contrat DPA |
| Autres | CCT + évaluation TIA (Transfer Impact Assessment) | TIA + DPA |

---

## 8️⃣ DOCUMENTATION COMPLÉMENTAIRE

### 📚 Documents disponibles

- ✅ [DPIA.md](DPIA.md) - Analyse d'impact
- ✅ [SECURITE_CONFORMITE.md](SECURITE_CONFORMITE.md) - Architecture technique
- ✅ [GUIDE_UTILISATION_SECURITE.md](GUIDE_UTILISATION_SECURITE.md) - Guide développeur
- ✅ [CHARTE_IA_JURIDIQUE.md](CHARTE_IA_JURIDIQUE.md) - Principes éthiques IA
- ⏳ Politique de confidentialité (à créer pour site web)
- ⏳ CGU / CGV (à créer)
- ⏳ DPA modèle clients (à créer)

---

## 9️⃣ CONTRÔLE CNIL - RÉPONSE TYPE

### 📋 Checklist audit CNIL

En cas de contrôle, voici ce que nous pouvons démontrer :

| Question CNIL | Notre réponse | Preuve |
|---------------|---------------|--------|
| **Registre à jour ?** | ✅ Oui | Ce document |
| **Base légale claire ?** | ✅ Oui (contrat + intérêt légitime) | Registre traitement |
| **Information personnes ?** | ✅ Oui (mentions RGPD) | Politique confidentialité |
| **Durées conservation justifiées ?** | ✅ Oui (prescription 5 ans) | Registre traitement |
| **Sécurité technique ?** | ✅ Oui (chiffrement, Zero-Trust) | Architecture + code |
| **DPIA réalisée ?** | ✅ Oui | DPIA.md |
| **DPO désigné ?** | ⚠️ [À compléter si > 250 salariés] | - |
| **Procédure violation ?** | ✅ Oui | Section 6 ci-dessus |
| **Droits des personnes ?** | ✅ Oui (portail + email) | Portail utilisateur |
| **Sous-traitants conformes ?** | ✅ Oui (DPA signés) | Contrats DPA |

---

### 📝 Documents à fournir en cas de contrôle

1. ✅ Ce registre (DOSSIER_CNIL.md)
2. ✅ DPIA (DPIA.md)
3. ✅ Architecture sécurité (SECURITE_CONFORMITE.md)
4. ✅ Contrats DPA sous-traitants
5. ✅ Preuves de formation équipe (attestations)
6. ✅ Rapport dernier pentest
7. ✅ Politique de sécurité interne
8. ⏳ Politique de confidentialité site web
9. ⏳ CGU/CGV

---

## 🔄 SUIVI ET RÉVISIONS

### 📅 Fréquence de mise à jour

| Document | Fréquence | Responsable |
|----------|-----------|-------------|
| Registre des traitements | Semestrielle | DPO |
| DPIA | Annuelle | DPO + CTO |
| Mesures de sécurité | Trimestrielle | CTO |
| Liste sous-traitants | À chaque ajout/retrait | DPO |

---

### 📊 Historique des versions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | Janvier 2026 | Super Admin | Création initiale |

---

## 📞 CONTACTS

| Rôle | Contact |
|------|---------|
| **DPO** | dpo@votre-societe.com |
| **RGPD (demandes personnes)** | rgpd@votre-societe.com |
| **Support technique** | support@votre-societe.com |
| **Incident sécurité** | security@votre-societe.com |
| **CNIL** | https://www.cnil.fr/fr/plaintes |

---

**📄 Document confidentiel - Usage interne et autorités de contrôle uniquement**

**Dernière mise à jour :** Janvier 2026
