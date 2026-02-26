# 🚨 Procédure de Gestion des Violations de Données (RGPD Art. 33-34)

**Version** : 1.0
**Date** : 3 février 2026
**Responsable** : DPO + RSSI
**Classification** : CONFIDENTIEL

---

## 📌 Définition

Une **violation de données** (data breach) est une violation de la sécurité entraînant la destruction, la perte, l'altération, la divulgation non autorisée de données personnelles, ou l'accès non autorisé à de telles données.

**Exemples** :

- ❌ Accès non autorisé à la base de données
- ❌ Fuite de preuves légales (export non chiffré)
- ❌ Vol d'ordinateur portable contenant données clients
- ❌ Email envoyé à mauvais destinataire
- ❌ Ransomware chiffrant les dossiers
- ❌ Employé malveillant exfiltrant données

---

## ⚡ Délais RGPD

| Obligation                            | Délai                            | Article   |
| ------------------------------------- | -------------------------------- | --------- |
| **Notification CNIL**                 | **72 heures** après connaissance | Art. 33   |
| **Notification personnes concernées** | **Sans délai** si risque élevé   | Art. 34   |
| **Documentation interne**             | Immédiat                         | Art. 33.5 |

⚠️ **ATTENTION** : Les délais sont **stricts** et **non négociables**.

---

## 🔍 Phase 1 : Détection & Alerte (0-1h)

### Canaux de Détection

1. **Monitoring automatique** (Sentry, Azure Monitor)
   - Erreurs serveur inhabituelles
   - Accès massifs à données
   - Téléchargements suspects

2. **Signalement interne**
   - Email : security@memolib.fr
   - Téléphone : +33 X XX XX XX XX (24/7)

3. **Signalement externe**
   - Client/utilisateur
   - Partenaire/fournisseur
   - Autorité (CNIL, gendarmerie)

### Action Immédiate

```markdown
1. ✅ Noter l'heure exacte de découverte (H0)
2. ✅ Prévenir DPO + RSSI immédiatement
3. ✅ Ne PAS communiquer publiquement
4. ✅ Préserver les preuves (logs, screenshots)
5. ✅ Isoler le système compromis (si applicable)
```

**Template Email Alerte Interne** :

```
Objet: 🚨 VIOLATION DONNÉES SUSPECTÉE - URGENT

À: dpo@memolib.fr, rssi@memolib.fr, direction@memolib.fr
CC: security@memolib.fr

Heure découverte: [JJ/MM/AAAA HH:MM]
Découvert par: [Nom + Fonction]
Nature suspectée: [Accès non autorisé / Fuite / Perte / etc.]
Périmètre estimé: [Nombre personnes concernées / Type données]
Actions immédiates prises: [Isolation système / Blocage accès / etc.]

Description détaillée:
[...]

Pièces jointes:
- Screenshots logs
- Rapport monitoring
- etc.

Merci de confirmer réception et activation procédure.
```

---

## 📊 Phase 2 : Évaluation de Gravité (1-4h)

### Grille d'Évaluation

| Critère               | Faible    | Moyen            | Élevé           | Critique                      |
| --------------------- | --------- | ---------------- | --------------- | ----------------------------- |
| **Nombre personnes**  | < 10      | 10-100           | 100-1000        | > 1000                        |
| **Type données**      | Publiques | Professionnelles | Santé/Juridique | Sensibles (origine, religion) |
| **Risque identité**   | Faible    | Moyen            | Élevé           | Vol identité probable         |
| **Risque financier**  | Aucun     | < 1000€          | 1000-10000€     | > 10000€                      |
| **Risque réputation** | Faible    | Moyen            | Élevé           | Destruction cabinet           |
| **Chiffrement**       | ✅ Oui    | Partiel          | ❌ Non          | ❌ Non + fuite publique       |

**Score global** : Moyenne pondérée (santé/juridique = 2x poids)

**Décision notification** :

- Score < 2 : Notification CNIL **recommandée** (pas obligatoire)
- Score 2-3 : Notification CNIL **obligatoire**
- Score > 3 : Notification CNIL + **personnes concernées obligatoire**

### Exemples MemoLib

**Scénario A** : Email MDPH envoyé à mauvais client

- Personnes: 1 (Faible)
- Données: Santé (Élevé x2)
- Risque identité: Moyen
- **Score: 2.5 → Notification CNIL + personne**

**Scénario B** : Base données preuves légales fuitée en clair

- Personnes: 500 (Élevé)
- Données: Juridique + Santé (Élevé x2)
- Chiffrement: Non (Critique)
- **Score: 4.0 → CNIL + toutes personnes + autorités**

---

## 📝 Phase 3 : Documentation (4-24h)

### Registre des Violations

**Fichier** : `docs/violations-donnees-registre.md` (CONFIDENTIEL)

```markdown
## Violation #2026-001

**Date découverte** : 03/02/2026 14:32
**Date probable incident** : 03/02/2026 10:00 (estimation logs)
**Découvert par** : Système monitoring Sentry
**Responsable gestion** : DPO (dupont@memolib.fr)

### Nature de la violation

- [x] Accès non autorisé
- [ ] Perte de données
- [ ] Altération de données
- [ ] Divulgation non autorisée
- [ ] Destruction de données

### Périmètre

- Personnes concernées: 15 clients
- Données compromises:
  - Preuves légales (3 dossiers MDPH)
  - Métadonnées (raison juridique, juridiction)
  - Signatures électroniques (hashes)
- Origine: Bug API export non authentifié (route /api/legal/proof/export)
- Vecteur: Accès public temporaire (30 min)

### Actions immédiates (0-4h)

- [x] 14:35 - Isolation route API (403 Forbidden)
- [x] 14:40 - Analyse logs accès (7 requêtes externes)
- [x] 14:50 - Identification personnes concernées (15 clients)
- [x] 15:00 - Notification DPO + RSSI
- [x] 15:30 - Patch sécurité déployé
- [x] 16:00 - Tests sécurité validation

### Évaluation gravité

- Score: 2.8 (Moyen-Élevé)
- Risque identité: Moyen (noms + raisons juridiques)
- Risque santé: Élevé (dossiers MDPH = données santé)
- Chiffrement: Partiel (hashes oui, métadonnées non)
- **Décision: Notification CNIL + personnes concernées**

### Notification CNIL (< 72h)

- [x] 05/02/2026 11:00 - Formulaire CNIL envoyé (confirmation #CNIL-2026-12345)
- [ ] Retour CNIL attendu (délai habituel 1-2 semaines)

### Notification personnes (< 72h)

- [x] 05/02/2026 14:00 - 15 emails envoyés (voir template ci-dessous)
- [x] 05/02/2026 15:00 - Ligne téléphonique dédiée ouverte
- [ ] 06/02/2026 - Réponses clients (3/15 reçues)

### Mesures correctives

- [x] Authentification obligatoire route export (JWT)
- [x] Rate limiting (5 requêtes/min/IP)
- [x] Audit logs enrichis (IP + User-Agent)
- [x] Tests sécurité automatisés (Playwright)
- [ ] Pentest professionnel planifié (mars 2026)

### Coûts

- Temps équipe: 12h (DPO 4h, Dev 6h, RSSI 2h)
- Avocat: 800€ (validation notification)
- Pentest: 2500€ (à venir)
- **Total: 3300€ + temps interne**

### Leçons apprises

1. Routes API export doivent TOUJOURS être authentifiées
2. Tests E2E doivent inclure tests sécurité (accès non autorisé)
3. Monitoring temps réel essentiel (détection 32 min)
4. Template notification personnes à améliorer (trop technique)

### Pièces jointes

- logs-acces-20260203.txt
- email-notification-clients.pdf
- formulaire-cnil-confirmation.pdf
- patch-securite-diff.txt
```

---

## 📧 Phase 4 : Notification CNIL (< 72h)

### Formulaire en ligne CNIL

**URL** : https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles

### Informations Requises

1. **Identité responsable traitement**
   - Raison sociale: [Cabinet/Entreprise]
   - SIREN/SIRET: [...]
   - Adresse: [...]
   - DPO: [Nom + Email + Tél]

2. **Nature de la violation**
   - Date découverte
   - Date probable incident
   - Type (accès / perte / altération / divulgation / destruction)
   - Origine (humaine / technique / malveillance)

3. **Données concernées**
   - Catégories (identité, santé, juridique, financier, etc.)
   - Nombre approximatif personnes
   - Volume données (Go, nombre fichiers)

4. **Conséquences**
   - Risques pour personnes (vol identité, discrimination, préjudice physique, etc.)
   - Gravité (faible / moyen / élevé)
   - Mesures atténuation prises

5. **Mesures correctives**
   - Actions techniques (patch, isolation, chiffrement)
   - Actions organisationnelles (formation, procédure)
   - Délais mise en œuvre

6. **Notification personnes**
   - Réalisée: Oui/Non
   - Si non: Justification (chiffrement, mesures techniques, effort disproportionné)
   - Modalités (email, courrier, site web, presse)

### Template Notification CNIL

```markdown
## NOTIFICATION VIOLATION DONNÉES - CNIL

**Date notification**: 05/02/2026
**Date découverte**: 03/02/2026 14:32
**Date probable incident**: 03/02/2026 10:00

### 1. RESPONSABLE TRAITEMENT

Cabinet [Nom]
SIRET: [...]
Adresse: [...]
DPO: Me. [Nom] (dpo@memolib.fr)

### 2. NATURE VIOLATION

**Type**: Accès non autorisé (divulgation)
**Origine**: Erreur technique (route API non sécurisée)
**Durée exposition**: 30 minutes (10:00-10:30)
**Vecteur**: Internet public (7 requêtes HTTP)

### 3. DONNÉES CONCERNÉES

**Catégories**:

- Données identification (noms, prénoms)
- Données santé (dossiers MDPH)
- Données juridiques (preuves, raisons contentieux)

**Personnes**: 15 clients
**Volume**: ~150 Ko JSON (3 dossiers complets)

### 4. CONSÉQUENCES & RISQUES

**Risques identifiés**:

- Discrimination potentielle (handicap révélé)
- Préjudice moral (contentieux juridique exposé)
- Atteinte vie privée (raisons médicales)

**Gravité**: Moyen-Élevé (score 2.8/4)
**Probabilité réalisation**: Faible (7 accès, aucune réutilisation détectée)

### 5. MESURES CORRECTIVES

**Techniques** (réalisées):

- Authentification JWT obligatoire (route sécurisée)
- Rate limiting 5 req/min/IP
- Audit logs enrichis
- Tests sécurité automatisés

**Organisationnelles** (en cours):

- Formation équipe développement (sécurité API)
- Revue code sécurité mensuelle
- Pentest professionnel (mars 2026)

### 6. NOTIFICATION PERSONNES

**Réalisée**: Oui (05/02/2026 14:00)
**Modalités**: Email individuel + ligne téléphonique
**Contenu**: Nature violation, données concernées, mesures prises, contacts

### 7. PIÈCES JOINTES

- Analyse logs (logs-acces-20260203.txt)
- Email notification clients (email-notification-clients.pdf)
- Patch sécurité (patch-securite-diff.txt)

---

**Contact DPO**: dpo@memolib.fr / +33 X XX XX XX XX
```

---

## 📱 Phase 5 : Notification Personnes Concernées (< 72h si risque élevé)

### Critères Notification Obligatoire (Art. 34)

Notifier SI risque élevé pour droits et libertés:

- ✅ Données sensibles (santé, religion, origine)
- ✅ Données financières (fraude possible)
- ✅ Vol identité probable
- ✅ Préjudice physique/moral grave
- ✅ Discrimination/stigmatisation
- ✅ Atteinte réputation/dignité

### Exceptions (Pas de notification)

Notification **NON requise** SI:

1. **Chiffrement robuste** (AES-256, clés sécurisées)
2. **Mesures techniques compensatoires** (données rendues inintelligibles)
3. **Effort disproportionné** (> 1000 personnes, coût prohibitif)
   - Alternative: Communication publique (site web, presse)

### Template Email Notification

**Objet**: Information importante concernant vos données personnelles

```
Madame, Monsieur,

Nous vous informons qu'un incident de sécurité a affecté certaines de vos données personnelles conservées par notre cabinet.

**1. NATURE DE L'INCIDENT**

Le 3 février 2026, un accès non autorisé temporaire (30 minutes) à notre système de gestion de preuves légales a été détecté. Cet accès a concerné 15 clients, dont vous-même.

**2. DONNÉES CONCERNÉES**

Les données potentiellement consultées sont:
- Votre nom et prénom
- Les métadonnées de votre dossier juridique (raison du contentieux, juridiction)
- Les preuves légales générées dans le cadre de votre dossier

Aucune coordonnée bancaire, mot de passe ou pièce d'identité n'a été exposée.

**3. MESURES PRISES**

- L'accès non autorisé a été bloqué immédiatement (3 février 14:35)
- Un patch de sécurité a été déployé le jour même
- Une notification à la CNIL a été effectuée (obligation légale)
- Un audit de sécurité complet est en cours

**4. RISQUES & RECOMMANDATIONS**

Les risques pour vous sont limités. Nous n'avons détecté aucune réutilisation malveillante des données.

Par précaution, nous vous recommandons:
- De rester vigilant(e) sur toute communication suspecte liée à votre dossier
- De nous signaler toute activité inhabituelle

**5. VOS DROITS**

Conformément au RGPD, vous pouvez:
- Accéder à l'ensemble de vos données (gratuitement)
- Demander la rectification ou suppression de vos données
- Déposer une réclamation auprès de la CNIL (https://www.cnil.fr)

**6. CONTACT**

Pour toute question:
- Email: dpo@memolib.fr
- Téléphone: +33 X XX XX XX XX (ligne dédiée, 9h-18h)

Nous vous présentons nos sincères excuses pour ce désagrément et vous assurons que la sécurité de vos données reste notre priorité absolue.

Cordialement,

[Signature]
[Nom DPO]
Délégué à la Protection des Données
Cabinet [Nom]
```

---

## 📋 Phase 6 : Suivi & Clôture

### Checklist Post-Incident

**Technique** :

- [ ] Patch sécurité validé en production
- [ ] Tests regression passés
- [ ] Pentest externe programmé
- [ ] Monitoring renforcé activé

**Organisationnel** :

- [ ] Registre violations mis à jour
- [ ] Retour CNIL traité
- [ ] Réponses clients complètes
- [ ] Formation équipe réalisée

**Juridique** :

- [ ] Documentation complète archivée (10 ans)
- [ ] Assurance cyber informée
- [ ] Avocat consulté (responsabilité)
- [ ] Budget amendement voté

### Délais Conservation

| Document            | Durée         | Base légale           |
| ------------------- | ------------- | --------------------- |
| Registre violation  | **Permanent** | RGPD Art. 33.5        |
| Notification CNIL   | 10 ans        | Archive légale        |
| Emails personnes    | 5 ans         | Prescription          |
| Logs techniques     | 1 an          | CNIL                  |
| Analyse post-mortem | Permanent     | Amélioration continue |

---

## 🎓 Formation & Sensibilisation

### Sessions Obligatoires

**Annuelles** (tous employés):

- Identification violations (exemples concrets)
- Canaux signalement (email, tél)
- Procédure d'urgence (H0 à H72)

**Trimestrielles** (équipe technique):

- Sécurité développement (OWASP Top 10)
- Tests intrusion (pentest interne)
- Revue code sécurité

### Simulations

**Fréquence**: 1x/an minimum
**Scénarios**:

1. Ransomware chiffrant base données
2. Employé malveillant exfiltrant dossiers
3. Email phishing avec vol credentials
4. Perte laptop non chiffré

**Évaluation**:

- Délai détection < 1h ✅
- Notification DPO < 2h ✅
- Isolation système < 30 min ✅
- Documentation < 24h ✅

---

## 📞 Contacts d'Urgence

| Rôle              | Nom       | Email                | Téléphone         | Disponibilité     |
| ----------------- | --------- | -------------------- | ----------------- | ----------------- |
| **DPO**           | [Nom]     | dpo@memolib.fr       | +33 X XX XX XX XX | 24/7              |
| **RSSI**          | [Nom]     | rssi@memolib.fr      | +33 X XX XX XX XX | 24/7              |
| **Direction**     | [Nom]     | direction@memolib.fr | +33 X XX XX XX XX | 9h-20h            |
| **Avocat**        | Me. [Nom] | avocat@cabinet.fr    | +33 X XX XX XX XX | 9h-18h            |
| **Support Azure** | -         | -                    | Azure Portal      | 24/7              |
| **CNIL**          | -         | -                    | 01 53 73 22 22    | 9h30-12h, 14h-17h |

**Email urgence** : security@memolib.fr (redirection DPO + RSSI)

---

## 📚 Références

- **RGPD Art. 33** : https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4#Article33
- **RGPD Art. 34** : https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4#Article34
- **Guide CNIL violations** : https://www.cnil.fr/fr/violations-de-donnees-personnelles
- **Formulaire notification CNIL** : https://www.cnil.fr/fr/notifier-une-violation-de-donnees-personnelles
- **G29 Guidelines** : https://ec.europa.eu/newsroom/article29/items/612052

---

**Document validé par** :

- [ ] DPO
- [ ] RSSI
- [ ] Direction
- [ ] Avocat spécialisé RGPD

**Prochaine révision** : Février 2027
