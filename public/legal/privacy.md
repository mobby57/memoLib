# POLITIQUE DE CONFIDENTIALITÉ

**IA Poste Manager**  
**Version:** 1.0  
**Date d'entrée en vigueur:** 21 janvier 2026  
**Dernière mise à jour:** 21 janvier 2026

---

## 1. PRÉAMBULE

La présente Politique de Confidentialité décrit comment **IA Poste Manager** (ci-après "nous", "notre") collecte, utilise, stocke et protège les données personnelles des utilisateurs de la Plateforme, en conformité avec le **Règlement Général sur la Protection des Données (RGPD)**.

---

## 2. RESPONSABLE DU TRAITEMENT

**Identité du Responsable:**  
[RAISON SOCIALE À COMPLÉTER]  
[ADRESSE]  
[EMAIL: privacy@iapostemanager.com]  
[RCS/SIRET]

**Délégué à la Protection des Données (DPO):**  
[NOM DPO si applicable]  
[EMAIL: dpo@iapostemanager.com]

---

## 3. DONNÉES PERSONNELLES COLLECTÉES

### 3.1. Données des Cabinets d'Avocats (Admins)

**Lors de l'inscription:**
- Nom et prénom
- Email professionnel
- Nom du cabinet
- Adresse professionnelle
- Numéro de téléphone
- Informations de facturation (nom, adresse, TVA)

**Lors de l'utilisation:**
- Logs de connexion (IP, user-agent, date/heure)
- Actions réalisées sur la Plateforme (audit trail)
- Paramètres de compte

### 3.2. Données des Clients Finaux (Clients des Cabinets)

**Les cabinets d'avocats peuvent stocker sur la Plateforme:**
- Identité (nom, prénom, date de naissance, nationalité)
- Coordonnées (adresse, email, téléphone)
- Documents d'identité (passeport, titre de séjour, etc.)
- Informations juridiques (type de procédure, dates, décisions)
- Documents joints (courriers, attestations, etc.)

**Important:** Ces données sont la responsabilité exclusive du cabinet utilisateur. IA Poste Manager agit en tant que **sous-traitant au sens du RGPD**.

### 3.3. Données Techniques

- Cookies (voir section 9)
- Logs serveur
- Données de performance (temps de réponse, erreurs)
- Données d'utilisation (features utilisées, durée sessions)

---

## 4. FINALITÉS DU TRAITEMENT

Nous collectons et traitons les données personnelles pour les finalités suivantes:

| Finalité | Base légale | Données concernées |
|----------|-------------|-------------------|
| **Fourniture du service** | Exécution du contrat | Toutes données compte |
| **Facturation** | Exécution du contrat | Informations paiement |
| **Support client** | Exécution du contrat | Email, logs, tickets |
| **Amélioration du service** | Intérêt légitime | Données agrégées/anonymisées |
| **Sécurité** | Obligation légale | Logs, IP, audit trail |
| **Marketing** | Consentement | Email (opt-in uniquement) |

**Nous nous engageons à:**
- Ne jamais utiliser les données clients finaux pour nos propres finalités commerciales
- Ne jamais vendre ou louer les données personnelles à des tiers
- Ne jamais entraîner nos modèles IA sur des données métier non anonymisées

---

## 5. DESTINATAIRES DES DONNÉES

### 5.1. Accès Interne

**Strictement limité au personnel autorisé:**
- Équipe support (uniquement pour assistance technique)
- Équipe sécurité (uniquement pour prévention incidents)

**Principe:** Architecture "zero-knowledge" → même nos équipes ne voient pas le contenu des dossiers juridiques.

### 5.2. Sous-Traitants

Nous faisons appel aux sous-traitants suivants, tous liés par des DPA RGPD:

| Sous-traitant | Pays | Finalité | Garanties |
|---------------|------|----------|-----------|
| **Vercel** | USA/EU | Hébergement application | Privacy Shield, SCCs |
| **PostgreSQL (Vercel)** | EU | Base de données | Chiffrement AES-256 |
| **Stripe** | USA | Paiements | PCI-DSS certifié |
| **[Email provider]** | [Pays] | Emails transactionnels | [Garanties] |

### 5.3. Transferts Hors UE

Certains sous-traitants peuvent être situés hors Union Européenne.

**Garanties mises en place:**
- Clauses Contractuelles Types (SCCs) de la Commission Européenne
- Privacy Shield (pour USA, si applicable)
- Hébergement prioritaire dans l'UE lorsque possible

---

## 6. DURÉE DE CONSERVATION

| Type de données | Durée de conservation | Justification |
|-----------------|----------------------|---------------|
| **Données compte actif** | Durée abonnement | Exécution contrat |
| **Données compte résilié** | 30 jours après résiliation | Backup sécurité |
| **Logs d'audit** | 3 ans | Obligation légale (CNIL) |
| **Logs techniques** | 12 mois | Sécurité |
| **Données facturation** | 10 ans | Obligation fiscale |
| **Données marketing (opt-in)** | 3 ans inactivité | Intérêt légitime |

**Passé ces délais:** Suppression automatique définitive.

**Export avant résiliation:** L'utilisateur peut exporter toutes ses données (JSON/CSV) jusqu'à 30 jours après résiliation.

---

## 7. DROITS DES PERSONNES

### 7.1. Droits RGPD

Conformément au RGPD, vous disposez des droits suivants:

✅ **Droit d'accès** (Art. 15)  
Obtenir confirmation du traitement et copie de vos données.

✅ **Droit de rectification** (Art. 16)  
Corriger vos données inexactes ou incomplètes.

✅ **Droit à l'effacement** (Art. 17 - "Droit à l'oubli")  
Demander la suppression de vos données (sauf obligation légale).

✅ **Droit à la limitation du traitement** (Art. 18)  
Limiter temporairement l'utilisation de vos données.

✅ **Droit à la portabilité** (Art. 20)  
Recevoir vos données dans un format structuré et interopérable (JSON/CSV).

✅ **Droit d'opposition** (Art. 21)  
Vous opposer au traitement de vos données pour motif légitime.

✅ **Droit de retirer votre consentement** (Art. 7.3)  
Retirer votre consentement marketing à tout moment.

✅ **Droit de définir des directives post-mortem** (CNIL)  
Définir le sort de vos données après décès.

### 7.2. Exercice des Droits

**Comment exercer vos droits:**

1. **Email:** privacy@iapostemanager.com
2. **Formulaire web:** [Lien formulaire RGPD]
3. **Courrier:** [Adresse postale]

**Pièces justificatives:**  
Copie pièce d'identité requise pour éviter usurpation.

**Délai de réponse:** 1 mois maximum (prorogeable à 3 mois si complexe, avec notification).

**Coût:** Gratuit (sauf demandes manifestement infondées ou excessives).

### 7.3. Droit de Réclamation

En cas de désaccord, vous pouvez introduire une réclamation auprès de l'autorité de contrôle compétente:

**CNIL (France):**  
Commission Nationale de l'Informatique et des Libertés  
3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07  
Tél: 01 53 73 22 22  
https://www.cnil.fr

---

## 8. SÉCURITÉ DES DONNÉES

### 8.1. Mesures Techniques

Nous mettons en œuvre les mesures de sécurité suivantes:

🔒 **Chiffrement:**
- TLS 1.3 pour toutes les communications (HTTPS)
- AES-256 pour données au repos (base de données)
- SHA-256 pour audit trail (inaltérabilité)

🔒 **Authentification:**
- Mots de passe hachés (bcrypt)
- Authentification à deux facteurs (2FA) disponible
- Sessions sécurisées avec rotation tokens

🔒 **Infrastructure:**
- Isolation multi-tenant stricte (aucun accès croisé)
- Firewall applicatif (WAF)
- Surveillance temps réel (monitoring 24/7)
- Sauvegardes chiffrées quotidiennes

🔒 **Accès:**
- Principe du moindre privilège
- Logs d'accès inaltérables
- Revue trimestrielle des habilitations

### 8.2. Mesures Organisationnelles

- **Formation RGPD:** Équipe sensibilisée annuellement
- **Politique de sécurité:** Documentée et appliquée
- **Tests d'intrusion:** Annuels (pentests externes)
- **Plan de reprise d'activité (PRA):** Testé semestriellement
- **Notification violations:** Sous 72h à CNIL si applicable

### 8.3. IA et Confidentialité

**Architecture "Privacy by Design":**
- IA locale (Ollama) → aucune donnée envoyée à OpenAI/Anthropic/etc.
- Anonymisation automatique avant traitement IA (noms → [NOM], emails → [EMAIL])
- Aucun apprentissage sur données métier
- Aucune conservation logs IA au-delà de 30 jours

---

## 9. COOKIES ET TRACEURS

### 9.1. Qu'est-ce qu'un Cookie?

Un cookie est un petit fichier texte déposé sur votre appareil lors de la navigation.

### 9.2. Types de Cookies Utilisés

| Type | Finalité | Durée | Consentement requis |
|------|----------|-------|---------------------|
| **Strictement nécessaires** | Authentification, sécurité | Session | ❌ Non (exception légale) |
| **Fonctionnels** | Préférences utilisateur (langue, thème) | 1 an | ⚠️ Recommandé |
| **Analytiques** | Statistiques agrégées (Vercel Analytics) | 1 an | ✅ Oui |
| **Marketing** | Publicité (si applicable) | Variable | ✅ Oui |

### 9.3. Gestion des Cookies

**Vous pouvez:**
- Accepter/refuser via notre bandeau cookies (premier accès)
- Modifier vos choix: Paramètres → Cookies
- Supprimer les cookies via votre navigateur

**Conséquences du refus:**  
Fonctionnalités de personnalisation limitées (langue, thème), mais service accessible.

---

## 10. DONNÉES DES MINEURS

La Plateforme n'est **pas destinée aux mineurs de moins de 16 ans**.

Si nous découvrons qu'un mineur a fourni des données sans consentement parental:
- Suppression immédiate des données
- Notification aux représentants légaux

---

## 11. MODIFICATIONS DE LA POLITIQUE

Nous nous réservons le droit de modifier la présente Politique de Confidentialité.

**En cas de modification substantielle:**
- Notification par email 30 jours avant
- Publication nouvelle version sur le site
- Date de mise à jour actualisée

**Recommandation:** Consulter régulièrement cette page.

---

## 12. CONTACT

**Questions sur la confidentialité:**  
Email: privacy@iapostemanager.com

**Délégué à la Protection des Données (DPO):**  
Email: dpo@iapostemanager.com

**Support général:**  
Email: support@iapostemanager.com

---

## 13. ANNEXE: REGISTRE DES TRAITEMENTS (EXTRAIT)

Conformément à l'article 30 du RGPD, nous tenons un registre des activités de traitement.

**Extrait simplifié:**

| Traitement | Finalité | Base légale | Durée |
|------------|----------|-------------|-------|
| Gestion comptes | Fourniture service | Contrat | Durée abonnement |
| Facturation | Comptabilité | Obligation légale | 10 ans |
| Support | Assistance client | Contrat | 3 ans |
| Sécurité | Prévention incidents | Obligation légale | 12 mois |
| Marketing | Newsletter | Consentement | 3 ans inactivité |

**Registre complet disponible sur demande.**

---

**Dernière mise à jour:** 21 janvier 2026

*Nous prenons votre vie privée au sérieux. Cette politique est notre engagement envers vous.*
