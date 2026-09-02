# SCÉNARIOS DE TEST PILOTE — 10 CAS D'USAGE RÉALISTES

## MemoLib — Phase pilote (1er octobre — 1er novembre 2026)

**Objectif** : Valider que MemoLib détecte, organise et assiste l'avocat sur 10 cas typiques du droit des étrangers.

**Critères de succès** :
- ✅ Cas détecté automatiquement (type CESEDA correct)
- ✅ Délai calculé et alerte générée
- ✅ Checklist générée et pertinente
- ✅ Aucune intervention manuelle requise (< 5 min)

---

## SCÉNARIO 1 : Demande d'asile — Notification CNDA urgente

**Contexte juridique** : Un client a reçu une décision de rejet d'asile. Il doit interjeter appel **dans les 30 jours calendaires** devant la CNDA (art. L. 521-1 CESEDA).

### Email entrant (exemple)

```
De : client@email.com
Objet : Rejet asile — besoin d'aide d'urgence
Corps :
"Maître, j'ai reçu ce matin une décision de rejet d'asile. 
L'OFPRA dit que ma demande ne respecte pas les conditions.
Qu'est-ce que je dois faire ? 
Le courrier est daté du 15 septembre 2026."
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | Asile / Appel CNDA | ☐ |
| **Deadline calculée** | 15 octobre 2026 (30j) | ☐ |
| **Urgence signalée** | J-7 alert (depuis 8 oct) | ☐ |
| **Checklist générée** | Appel CNDA, recours gracieux, documents à joindre | ☐ |
| **Action proposée** | Rédiger mémoire en défense | ☐ |

### Actions pilote

1. Forwarder cet email dans MemoLib
2. Vérifier que la détection est correcte
3. Valider la checklist (elle ne doit pas demander un recours administratif)
4. Confirmer l'alerte J-7

**Durée attendue** : 2 minutes

---

## SCÉNARIO 2 : OQTF — Recours administratif + Appel TJ

**Contexte juridique** : Client reçoit une Obligation de Quitter le Territoire Français (OQTF). Deux délais différents :
- **Recours gracieux** : 2 mois (art. L. 512-1)
- **Appel devant TJ** : 30 jours calendaires (art. L. 512-1)

### Email entrant

```
De : prefecture@email.com
Cc : client@email.com
Objet : Obligation de quitter le territoire — OQTF
Corps :
"Conformément à l'article L. 511-1 CESEDA, vous êtes obligé de quitter 
le territoire français dans un délai de 30 jours.
Décision datée du 20 septembre 2026.
Vous pouvez introduire un recours gracieux dans les 2 mois."
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | OQTF | ☐ |
| **Délais calculés** | Recours 2 mois (20 nov), Appel TJ 30j (20 oct) | ☐ |
| **Alerte prioritaire** | J-3 pour appel TJ (depuis 17 oct) | ☐ |
| **Checklist** | 1. Appel TJ (urgent), 2. Recours gracieux (préventif) | ☐ |
| **Séquençage** | Appel TJ avant recours gracieux | ☐ |

### Actions pilote

1. Créer un dossier depuis l'email
2. Valider que les DEUX délais sont bien détectés
3. Vérifier que l'appel TJ est prioritaire (30j < 2 mois)
4. Générer un recours gracieux (modèle)

**Durée attendue** : 3 minutes

---

## SCÉNARIO 3 : Titre de séjour — Renouvellement expiré

**Contexte juridique** : Client a un titre de séjour qui expire. Délai de renouvellement : avant l'expiration (art. L. 313-1).

### Email entrant

```
De : client@email.com
Objet : Mon titre de séjour expire dans 2 mois !
Corps :
"Maître, mon titre de séjour multi-annuel expire le 31 décembre 2026.
Je dois m'inscrire à la mairie avant cette date pour le renouveler.
Peux-tu me dire comment procéder ?"
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | Titre de séjour / Renouvellement | ☐ |
| **Deadline calculée** | 31 décembre 2026 (avant expiration) | ☐ |
| **Alerte** | J-30 (depuis 1er décembre) | ☐ |
| **Checklist** | Rendez-vous préfecture, documents nécessaires, délais | ☐ |
| **Juridiction** | Renouvellement administratif (pas contentieux) | ☐ |

### Actions pilote

1. Importer l'email
2. Vérifier que MemoLib suggère une deadline "avant 31/12"
3. Générer une checklist de renouvellement
4. Valider qu'aucun recours n'est proposé

**Durée attendue** : 2 minutes

---

## SCÉNARIO 4 : Naturalisation — Dossier complet

**Contexte juridique** : Client demande la naturalisation française. Procédure longue (~2 ans), mais délai de rejet/acceptation : 2 ans (art. L. 115-1).

### Email entrant

```
De : client@email.com
Objet : Je veux demander la nationalité française
Corps :
"Maître, je suis en France depuis 10 ans avec une carte de résident.
Je veux demander la nationalité française.
Quels sont les délais ?
Quels documents dois-je préparer ?"
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | Naturalisation | ☐ |
| **Deadline** | 2 ans à partir de dépôt (à définir) | ☐ |
| **Checklist** | Docs civiles (acte naissance, mariage), fiscalité, extrait casier | ☐ |
| **Étapes** | Dépôt préfecture → Instruction → Décision | ☐ |
| **Urgence** | Aucune (procédure administrative longue) | ☐ |

### Actions pilote

1. Importer l'email
2. Générer une checklist complète (10+ items)
3. Valider qu'aucun délai urgent n'est créé
4. Proposer un modèle de dossier de naturalization

**Durée attendue** : 3 minutes

---

## SCÉNARIO 5 : Mariage mixte — Visa de long séjour

**Contexte juridique** : Ressortissant étrangers marie à un Français demande un visa de long séjour. Délais : variable selon consulat (45-90 jours en général).

### Email entrant

```
De : spouse@email.com
Objet : Mariage en préparation — Visa épouse
Corps :
"Maître, je suis tunisienne et je me marie avec un Français en décembre.
Je dois demander un visa de long séjour avant le mariage.
On a un délai pour le demander ?"
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | Visa / Regroupement familial | ☐ |
| **Deadline** | Avant le mariage (à définir avec date mariage) | ☐ |
| **Checklist** | Dossier consulaire, preuves mariage, ressources, logement | ☐ |
| **Notes** | Visa + mariage = conditions spécifiques | ☐ |
| **Urgence** | Moyenne (délai consulaire variable) | ☐ |

### Actions pilote

1. Importer l'email
2. Demander la date du mariage
3. Générer deadline = date mariage - 90 jours (prudent)
4. Créer checklist documentaire

**Durée attendue** : 3 minutes

---

## SCÉNARIO 6 : Recours pour excès de pouvoir — Arrêté maire

**Contexte juridique** : Arrêté de polices du maire (interdiction de territoire, expulsion, etc.). Recours pour excès de pouvoir auprès du TA : 2 mois (art. L. 6 CJA).

### Email entrant

```
De : client@email.com
Objet : Arrêté d'expulsion du maire — URGENT
Corps :
"Maître, j'ai reçu un arrêté du maire me d'expulsion d'urgence 
(publique et continue du territoire de la ville).
Délivré le 25 septembre 2026.
C'est abusif ! Qu'est-ce que je peux faire ?"
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | Excès de pouvoir / TA | ☐ |
| **Deadline** | 25 novembre 2026 (2 mois) | ☐ |
| **Alerte** | J-3 (depuis 22 novembre) | ☐ |
| **Checklist** | Recours TA, constituer avocat, moyens juridiques | ☐ |
| **Juridiction** | Tribunal Administratif (pas civil) | ☐ |
| **Urgence** | 🔴 CRITIQUE (risque expulsion) | ☐ |

### Actions pilote

1. Importer l'email
2. Vérifier deadline = 2 mois
3. Générer alerte URGENCE
4. Proposer rédaction recours TA

**Durée attendue** : 2 minutes

---

## SCÉNARIO 7 : VLS-TS — Changement de situation (divorce, perte emploi)

**Contexte juridique** : Client en Visiteur, Long Séjour, Titre de Séjour (VLS-TS) signale un changement : divorce, perte d'emploi. Obligations de notification à la préfecture : 3 mois (art. R. 311-6).

### Email entrant

```
De : client@email.com
Objet : J'ai perdu mon CDI — Impact visa ?
Corps :
"Maître, je suis en VLS-TS salarié.
Je viens de perdre mon CDI suite à une fermeture d'usine.
Je dois le signaler à la préfecture ?
Y a-t-il un risque de retrait ?"
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | VLS-TS / Changement situation | ☐ |
| **Obligation** | Notification préfecture dans 3 mois | ☐ |
| **Deadline** | +3 mois (calcul automatique) | ☐ |
| **Checklist** | Démarches, documents, risques légaux | ☐ |
| **Alerte** | J-30 avant deadline | ☐ |
| **Avertissement** | Risque de retrait si non-déclaration | ☐ |

### Actions pilote

1. Importer l'email
2. Valider deadline = 3 mois
3. Générer avertissement légal
4. Créer checklist de notification

**Durée attendue** : 3 minutes

---

## SCÉNARIO 8 : Recours gracieux — Avant action judiciaire

**Contexte juridique** : Avant d'intenter une action, l'avocat envisage un recours gracieux (demande à l'administration de réviser sa décision). Délai variable.

### Email entrant

```
De : client@email.com
Objet : Refus de titre de séjour — Recours possible ?
Corps :
"Maître, ma demande de carte de résident a été refusée 
le 10 septembre.
La préfecture dit que je ne justifie pas les revenus.
Qu'est-ce que je peux faire ?"
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Type détecté** | Refus titre / Recours gracieux | ☐ |
| **Option 1** | Recours gracieux (ex: 1 mois, pas d'urgence) | ☐ |
| **Option 2** | Appel contentieux TA (ex: 2 mois) | ☐ |
| **Checklist** | Lettre recours gracieux, documents manquants, TA | ☐ |
| **Conseil IA** | Suggérer recours gracieux comme première étape | ☐ |

### Actions pilote

1. Importer l'email
2. Vérifier que MemoLib propose recours gracieux (non-urgent)
3. Générer modèle recours gracieux
4. Expliquer délai TA en cas de rejet

**Durée attendue** : 3 minutes

---

## SCÉNARIO 9 : Incident de sécurité — Email ambigu (ambigu deadline)

**Contexte juridique** : Email avec deadline imprécise (ex: « dans les plus brefs délais »). MemoLib **doit signaler ambiguïté**.

### Email entrant

```
De : tribunal@email.com
Objet : Notif audience — Appel rejet titre de séjour
Corps :
"Vous êtes convoqué pour l'audience d'appel 
concernant votre client, affaire [DOSSIER].
Audience : 15 novembre 2026 à 14h00.
Vous devez notifier votre comparution dans les plus brefs délais."
```

### Attentes MemoLib

| Vérification | Attendu | Validé ? |
|---|---|---|
| **Deadline claire** | 15 novembre 2026 (audience) | ☐ |
| **Ambiguïté détectée** | « plus brefs délais » ≠ précision | ☐ |
| **Status** | ⚠️ À VALIDER — pas auto-accepté | ☐ |
| **Alerte** | J-3 avant audience (12 nov) | ☐ |
| **Checklist** | Notifier comparution IMMÉDIATEMENT, préparer défense | ☐ |

### Actions pilote

1. Importer l'email
2. Vérifier que MemoLib signale l'ambiguïté
3. Valider qu'aucune action n'est prise sans validation
4. Demander confirmation manuelle

**Durée attendue** : 1 minute (validation rapide)

---

## SCÉNARIO 10 : Suivi multi-étapes — Dossier complexe OQTF + recours gracieux + appel TA

**Contexte juridique** : Client reçoit OQTF. Interjette appel TA dans les 30 jours. Parallèlement, recours gracieux préfecture dans les 2 mois. Deux procédures simultanées.

### Cas d'usage

**J0 (15 sept)** : OQTF reçue
```
De : prefecture@email.com
Objet : OQTF — Obligation de quitter territoire français
Corps :
"Décision datée 15 septembre 2026.
Délai : 30 jours.
Recours gracieux possible : 2 mois."
```

**J+5 (20 sept)** : Appel interjeté
```
De : lawyer@email.com
À : client@email.com
Objet : Appel déposé devant TA
Corps :
"J'ai déposé votre appel à l'audience du 25 octobre."
```

**J+30 (15 octobre)** : Recours gracieux non retiré
```
De : prefecture@email.com
Objet : Recours gracieux — Rejet
Corps :
"Votre recours gracieux a été examiné et rejeté."
```

### Attentes MemoLib

| Checkpoint | Attendu | Validé ? |
|---|---|---|
| **J0 : Type OQTF** | Détecté automatiquement | ☐ |
| **J0 : Deux délais** | Appel TA (30j) + Recours gracieux (2m) | ☐ |
| **J+5 : Lien email appel** | Email lié au dossier original | ☐ |
| **J+15 : Alerte J-3** | Appel TA prévu pour 25 oct, alerte depuis 22 oct | ☐ |
| **J+30 : Mise à jour** | Recours gracieux marqué rejeté | ☐ |
| **Status final** | Dossier = « Appel TA en attente » | ☐ |
| **Historique** | Timeline complète : création → appel → rejet recours | ☐ |

### Actions pilote

1. Importer email OQTF
2. Vérifier création dossier complet
3. Forwarder email appel → voir s'il se lie automatiquement
4. Forwarder rejet recours gracieux
5. Valider que timeline suit correctement

**Durée attendue** : 5 minutes (prise en charge complète du dossier)

---

## RÉCAPITULATIF — Métriques de succès

### À la fin du pilote (1er novembre 2026), valider :

| Métrique | Cible | Validé ? |
|---|---|---|
| **Taux de détection correcte** | 10/10 scénarios = 100% | ☐ |
| **Délais calculés** | Tous précis (0 erreur) | ☐ |
| **Checklists pertinentes** | 8/10 minimum utiles | ☐ |
| **Temps moyen par cas** | < 3 minutes | ☐ |
| **Alertes générées** | 8/10 minimum pertinentes | ☐ |
| **Satisfaction UX** | > 7/10 (sondage) | ☐ |
| **Bugs rencontrés** | < 5 bloquants | ☐ |
| **Avocats ayant testé** | 5 (objectif) | ☐ |
| **Dossiers créés** | > 5 par avocat | ☐ |
| **Intention paiement** | 2+/5 acceptent | ☐ |

---

## GUIDE DE NAVIGATION

Pour tester chaque scénario :

1. **Préparez l'email** (copier le texte fourni)
2. **Forwardez à MemoLib** (via Gmail intégré)
3. **Observez la détection** (type CESEDA, deadline, checklist)
4. **Validez** (comparer avec "Attendu")
5. **Notez les bugs/améliorations**
6. **Contactez support** si problème

---

**Support pilote** : support@memolib.space  
**Urgent** : +33 [TEL] (Slack #pilote-memolib)

*Merci de tester MemoLib ! 🚀*
