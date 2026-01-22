# CONDITIONS GÉNÉRALES D'UTILISATION

**IA Poste Manager**  
**Version:** 1.0  
**Date d'entrée en vigueur:** 21 janvier 2026  
**Dernière mise à jour:** 21 janvier 2026

---

## 1. OBJET

Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation de la plateforme SaaS **IA Poste Manager** (ci-après "la Plateforme"), éditée par [RAISON SOCIALE À COMPLÉTER], destinée aux cabinets d'avocats spécialisés en droit des étrangers (CESEDA).

L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU par l'Utilisateur.

---

## 2. DÉFINITIONS

- **Éditeur:** [RAISON SOCIALE À COMPLÉTER], [ADRESSE], [RCS/SIRET]
- **Plateforme:** Application web IA Poste Manager accessible via iapostemanager.com
- **Utilisateur:** Cabinet d'avocat souscrivant à un abonnement (niveau Admin) ou client final du cabinet (niveau Client)
- **Tenant:** Espace dédié et isolé de chaque cabinet d'avocat abonné
- **IA:** Intelligence artificielle intégrée à la Plateforme (modèle Ollama llama3.2)
- **Workspace:** Dossier juridique numérique géré par la Plateforme
- **Données Personnelles:** Informations relatives aux clients finaux des cabinets

---

## 3. ACCEPTATION DES CGU

L'utilisation de la Plateforme vaut acceptation des présentes CGU.

L'Utilisateur reconnaît avoir pris connaissance et accepté les CGU avant toute utilisation de la Plateforme.

En cas de désaccord avec les présentes CGU, l'Utilisateur doit s'abstenir d'utiliser la Plateforme.

---

## 4. DESCRIPTION DES SERVICES

### 4.1. Services Proposés

La Plateforme offre les services suivants:

1. **Gestion de dossiers CESEDA** (OQTF, Naturalisation, Asile, Titres de séjour)
2. **Assistance par intelligence artificielle** pour:
   - Classification et triage d'emails
   - Extraction de faits et contextes juridiques
   - Identification d'obligations légales et risques
   - Génération de brouillons de documents
   - Alertes sur délais critiques
3. **Gestion clients et facturation**
4. **Veille juridique** (jurisprudence CNDA, Légifrance)
5. **Collaboration équipe** (multi-utilisateurs)
6. **Intégrations tierces** (Stripe, Gmail, GitHub)

### 4.2. Plans et Fonctionnalités

| Plan | Prix | Fonctionnalités |
|------|------|-----------------|
| **Basic** | 49€/mois HT | 5 workspaces, IA basic, Support email |
| **Premium** | 149€/mois HT | 50 workspaces, IA avancée, Support prioritaire |
| **Enterprise** | Sur devis | Illimité, API, Support 24/7, Training |

Les fonctionnalités détaillées par plan sont disponibles sur la page Pricing.

---

## 5. RÔLE ET LIMITES DE L'INTELLIGENCE ARTIFICIELLE

### 5.1. Nature de l'IA

L'IA intégrée à la Plateforme est un **assistant juridique de premier niveau** dont le rôle est de:

✅ **CE QUE L'IA FAIT:**
- Structurer les données entrantes (emails, documents)
- Extraire des informations factuelles
- Identifier des contextes juridiques possibles
- Générer des brouillons et suggestions
- Alerter sur délais et risques

❌ **CE QUE L'IA NE FAIT PAS:**
- Prendre des décisions juridiques finales
- Valider ou envoyer des actes juridiques
- Choisir des stratégies juridiques
- Interpréter le droit de manière autonome
- Engager la responsabilité du cabinet

### 5.2. Système de Validation Humaine

Tous les outputs de l'IA sont soumis à un système de validation à 3 niveaux:

1. **VERT (Automatique):** Classification emails, extraction métadonnées
2. **ORANGE (Semi-automatique):** Génération brouillons → validation rapide recommandée
3. **ROUGE (Manuel obligatoire):** Conseils juridiques, documents officiels, stratégies → validation humaine OBLIGATOIRE

**L'Utilisateur reconnaît et accepte que:**
- L'IA ne remplace pas le jugement professionnel de l'avocat
- Toute décision finale relève de la responsabilité exclusive de l'Utilisateur
- L'Éditeur ne peut être tenu responsable des décisions prises par l'Utilisateur sur base des suggestions de l'IA

### 5.3. Transparence et Traçabilité

Toutes les actions de l'IA sont:
- Tracées dans un journal d'audit inaltérable
- Accompagnées d'un score de confiance (0-1)
- Révisables et modifiables par l'Utilisateur
- Consultables dans l'historique du Workspace

---

## 6. INSCRIPTION ET COMPTE UTILISATEUR

### 6.1. Création de Compte

Pour utiliser la Plateforme, l'Utilisateur doit:
1. Créer un compte avec email professionnel
2. Choisir un plan d'abonnement
3. Fournir les informations de facturation
4. Accepter les présentes CGU

### 6.2. Sécurité du Compte

L'Utilisateur est responsable de:
- La confidentialité de ses identifiants
- Toutes les activités réalisées via son compte
- Informer immédiatement l'Éditeur en cas d'utilisation non autorisée

L'Éditeur recommande fortement l'activation de l'authentification à deux facteurs (2FA).

### 6.3. Multi-Utilisateurs

Le plan d'abonnement détermine le nombre d'utilisateurs autorisés.

L'Utilisateur principal (Admin) peut:
- Créer/supprimer des comptes secondaires
- Gérer les permissions
- Accéder à tous les Workspaces de son Tenant

---

## 7. DONNÉES ET CONFIDENTIALITÉ

### 7.1. Isolation Multi-Tenant

Chaque cabinet dispose d'un **Tenant isolé**:
- Aucun accès croisé entre cabinets
- Données cloisonnées au niveau base de données
- Chiffrement TLS/HTTPS pour toutes communications

### 7.2. Confidentialité

**L'Éditeur garantit que:**
- Aucune donnée métier n'est accessible à l'Éditeur (architecture "zero-knowledge")
- L'IA fonctionne localement (Ollama) - aucune donnée envoyée à des tiers
- Les données ne sont jamais utilisées pour entraîner des modèles commerciaux
- Le secret professionnel est respecté par design technique

### 7.3. Conformité RGPD

La Plateforme est conforme au Règlement Général sur la Protection des Données (RGPD).

L'Utilisateur dispose des droits suivants:
- Accès aux données
- Rectification
- Effacement ("droit à l'oubli")
- Portabilité
- Limitation du traitement
- Opposition

Pour exercer ces droits: privacy@iapostemanager.com

Voir la [Politique de Confidentialité](./privacy.md) pour plus de détails.

### 7.4. Sous-Traitance

L'Éditeur fait appel aux sous-traitants suivants:
- **Hébergement:** Vercel/Cloudflare (EU/US - Privacy Shield)
- **Paiements:** Stripe (certifié PCI-DSS)
- **Email:** [À compléter si applicable]

Tous les sous-traitants sont liés par des DPA (Data Processing Agreements) conformes RGPD.

---

## 8. TARIFICATION ET PAIEMENT

### 8.1. Prix

Les prix sont indiqués en Euros Hors Taxes (€ HT).

TVA française applicable: 20% (pour clients français).

### 8.2. Facturation

- **Période de facturation:** Mensuelle ou Annuelle (selon choix)
- **Mode de paiement:** Carte bancaire via Stripe
- **Paiement automatique:** Renouvelable par tacite reconduction
- **Factures:** Disponibles dans l'espace client

### 8.3. Essai Gratuit

Un essai gratuit de **30 jours** est disponible (plan Premium):
- Accès complet aux fonctionnalités
- Aucune carte bancaire requise
- Conversion automatique en abonnement payant si non annulé

### 8.4. Retard de Paiement

En cas de retard de paiement:
- Suspension immédiate du service après 7 jours de retard
- Pénalités de retard: 3 fois le taux d'intérêt légal
- Indemnité forfaitaire de recouvrement: 40€

---

## 9. DURÉE ET RÉSILIATION

### 9.1. Durée

Le contrat est conclu pour une durée indéterminée à compter de la souscription.

### 9.2. Résiliation par l'Utilisateur

L'Utilisateur peut résilier à tout moment:
- Depuis l'espace client (paramètres → abonnement → résilier)
- Par email: support@iapostemanager.com

**Préavis:** Aucun (résiliation immédiate)

**Remboursement:** Aucun remboursement pro rata (période payée jusqu'au terme)

### 9.3. Résiliation par l'Éditeur

L'Éditeur peut résilier en cas de:
- Violation des CGU
- Impayés après mise en demeure
- Utilisation frauduleuse de la Plateforme
- Cessation d'activité

**Préavis:** 30 jours (sauf faute grave: immédiat)

### 9.4. Conséquences de la Résiliation

À la résiliation:
- L'accès à la Plateforme est immédiatement suspendu
- Les données sont conservées 30 jours (backup sécurisé)
- L'Utilisateur peut exporter ses données (format JSON/CSV)
- Passé 30 jours: suppression définitive des données

---

## 10. PROPRIÉTÉ INTELLECTUELLE

### 10.1. Propriété de la Plateforme

La Plateforme (code source, design, logos, marques) est la propriété exclusive de l'Éditeur.

Toute reproduction, adaptation ou exploitation non autorisée est strictement interdite.

### 10.2. Licence d'Utilisation

L'Éditeur concède à l'Utilisateur une licence:
- Non exclusive
- Non transférable
- Limitée à la durée de l'abonnement
- Pour un usage professionnel uniquement

### 10.3. Propriété des Données

**Les données métier de l'Utilisateur lui appartiennent.**

L'Éditeur:
- N'a aucun droit sur les données clients/dossiers
- Ne peut exploiter commercialement ces données
- Agit uniquement en tant qu'hébergeur/processeur

---

## 11. RESPONSABILITÉ

### 11.1. Limitation de Responsabilité

L'Éditeur ne saurait être tenu responsable:
- Des décisions prises par l'Utilisateur sur base des suggestions de l'IA
- Des erreurs de l'IA non détectées par l'Utilisateur
- Des préjudices indirects (perte de clientèle, manque à gagner, etc.)
- Des actes de tiers (piratage, malveillance)

### 11.2. Disponibilité

**SLA (Service Level Agreement):**
- Disponibilité cible: 99.5% mensuelle
- Maintenance planifiée: notifiée 7 jours à l'avance
- Incidents: notification temps réel via status.iapostemanager.com

En cas de non-respect du SLA:
- Premium/Enterprise: crédit de 10% sur mois suivant si < 99%

### 11.3. Force Majeure

L'Éditeur ne peut être tenu responsable en cas de force majeure (catastrophe naturelle, grève, cyberattaque, etc.).

---

## 12. SUPPORT

| Plan | Support | Délai de réponse |
|------|---------|------------------|
| **Basic** | Email | 24-48h ouvrées |
| **Premium** | Email + Chat | 4h ouvrées |
| **Enterprise** | Téléphone 24/7 | 1h |

Contact support: support@iapostemanager.com

---

## 13. MODIFICATIONS DES CGU

L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment.

En cas de modification substantielle:
- Notification par email 30 jours avant
- Acceptation implicite en cas de poursuite d'utilisation
- Droit de résiliation sans frais si désaccord

---

## 14. LOI APPLICABLE ET JURIDICTION

Les présentes CGU sont soumises au **droit français**.

En cas de litige, compétence exclusive des tribunaux de [VILLE À COMPLÉTER].

Clause de médiation préalable: avant toute action judiciaire, les parties s'engagent à tenter une médiation amiable.

---

## 15. CONTACT

**Éditeur:**  
[RAISON SOCIALE]  
[ADRESSE COMPLÈTE]  
[RCS/SIRET]  

**Email:** legal@iapostemanager.com  
**Support:** support@iapostemanager.com  
**Site:** https://iapostemanager.com

---

**Dernière mise à jour:** 21 janvier 2026

*L'Utilisateur est invité à sauvegarder et imprimer les présentes CGU pour conservation.*
