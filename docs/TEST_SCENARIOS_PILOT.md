# MATRICE DE TEST — SCÉNARIOS PILOTE MEMOLIB

**Objectif** : Valider que MemoLib répond aux besoins réels des 5 avocats pilotes  
**Durée** : 4 semaines (1er octobre — 1er novembre 2026)  
**Format** : 54 scénarios structurés par catégorie + priorité  

---

## 📊 RÉSUMÉ EXÉCUTIF

| Catégorie | Total | Critique | Important | Utilitaire | Bonus |
|-----------|-------|----------|-----------|-----------|-------|
| **1. Authentification** | 6 | 4 | 1 | 1 | 0 |
| **2. Gestion clients** | 6 | 1 | 2 | 2 | 1 |
| **3. Import dossier** | 6 | 3 | 2 | 1 | 0 |
| **4. Détection CESEDA** | 8 | 2 | 2 | 2 | 2 |
| **5. Délais & urgences** | 7 | 3 | 2 | 1 | 1 |
| **6. Checklists** | 6 | 1 | 2 | 2 | 1 |
| **7. Communications** | 6 | 1 | 2 | 2 | 1 |
| **8. Documents** | 5 | 1 | 1 | 2 | 1 |
| **9. Jurisprudence** | 5 | 1 | 1 | 2 | 1 |
| **10. Collaboration** | 4 | 0 | 1 | 2 | 1 |
| **11. Administration** | 5 | 1 | 1 | 1 | 2 |
| **12. Sécurité** | 5 | 3 | 0 | 1 | 1 |
| **13. Performance** | 5 | 2 | 1 | 1 | 1 |
| **14. UX/Accessibilité** | 5 | 0 | 1 | 1 | 3 |
| **TOTAL** | **84** | **23** | **19** | **21** | **16** |

---

## ✅ PLAN D'EXÉCUTION

### Phase 1 : Semaine 1 (Setup + Critiques)

**Objectif** : Valider les fonctionnalités bloquantes

**Scénarios à tester** : 23 scénarios 🔴 CRITIQUES

```
Jour 1 (lundi) : Authentification + Import
Jour 2 (mardi) : Détection OQTF + Asile
Jour 3 (mercredi) : Calcul délais + Urgences
Jour 4 (jeudi) : Review + Corrections
Jour 5 (vendredi) : Sign-off Phase 1
```

### Phase 2 : Semaine 2-3 (Important + Utilitaire)

**Objectif** : Fonctionnalités du workflow quotidien

**Scénarios à tester** : 40 scénarios 🟠🟡

### Phase 4 : Semaine 4 (Bonus + Polish)

**Objectif** : Expérience et accessibilité

**Scénarios à tester** : 16 scénarios 🟢

---

## 🔴 CATÉGORIE 1: AUTHENTIFICATION (6 scénarios)

### Scénario 1.1 : Email/Mot de passe
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : L'avocat se connecte avec ses identifiants
- **Steps** :
  1. Aller à https://memolib.space/login
  2. Entrer email + password
  3. Cliquer "Se connecter"
- **Validation** : 
  - ✅ Connecté au dashboard
  - ✅ Session cookie défini (check DevTools → Application → Cookies)
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 1.2 : Google OAuth
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : Connexion rapide via Google
- **Steps** :
  1. Cliquer "Se connecter avec Google"
  2. Autoriser l'app
- **Validation** :
  - ✅ Redirigé vers MemoLib
  - ✅ Connecté
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 1.3 : Accès non autorisé
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : Sécurité — empêcher accès pages protégées
- **Steps** :
  1. Modifier URL : https://memolib.space/dossiers (sans token)
  2. Ou utiliser DevTools → supprimer cookie
- **Validation** :
  - ✅ Redirigé vers login
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 1.4 : Déconnexion
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Quitter l'application proprement
- **Steps** :
  1. Menu utilisateur (coin haut droit)
  2. Cliquer "Déconnexion"
- **Validation** :
  - ✅ Redirigé vers login
  - ✅ Cookie détruit
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 1.5 : Modifier mot de passe
- **Priorité** : 🟠 IMPORTANT
- **Cas d'usage** : Gestion de compte
- **Steps** :
  1. Paramètres → Sécurité
  2. Entrer ancien + nouveau password
- **Validation** :
  - ✅ "Mot de passe mis à jour"
  - ✅ Reconnexion avec nouveau password fonctionne
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 1.6 : Activer 2FA
- **Priorité** : 🟢 BONUS
- **Cas d'usage** : Sécurité renforcée
- **Steps** :
  1. Paramètres → Sécurité → "Activer 2FA"
  2. Scanner QR code avec authenticateur
  3. Entrer code
- **Validation** :
  - ✅ 2FA activé
  - ✅ Prochaine connexion demande code
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

---

## 🔴 CATÉGORIE 3: IMPORT & CRÉATION DOSSIER (6 scénarios)

### Scénario 3.1 : Créer dossier manuel
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : Créer un dossier sans email source
- **Steps** :
  1. Cliquez "+ Nouveau dossier"
  2. Remplissez : Nom client, Type (ex: OQTF), Deadline
  3. Cliquez "Créer"
- **Validation** :
  - ✅ Dossier créé avec ID
  - ✅ Dashboard montre le nouveau dossier
  - ✅ Accédez au dossier → voir details
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 3.2 : Importer email → créer dossier
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : **The wow moment** — Email → Dossier en 1 clic
- **Steps** :
  1. Aller à "Emails"
  2. Cliquez sur email (ex: "Rejet OFPRA")
  3. À droite : analysis IA montre Type = "Asile"
  4. Cliquez "Créer dossier"
- **Validation** :
  - ✅ Dossier créé automatiquement
  - ✅ Type détecté correct (Asile)
  - ✅ Client créé from email From header
  - ✅ Deadline calculée (30 jours)
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 3.3 : Coller texte OQTF → détecter
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Avocat copie texte d'une notification préfecture
- **Steps** :
  1. Dossier → "+ Ajouter texte"
  2. Coller texte OQTF complet
  3. Cliquez "Analyser"
- **Validation** :
  - ✅ Type détecté = "OQTF"
  - ✅ Délai = 30 jours ou 48h (selon DV)
  - ✅ Confidence score affiché (ex: 95%)
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 3.4 : OCR - Télécharger PDF décision
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Avocat scan une décision papier
- **Steps** :
  1. Dossier → "+ Ajouter document"
  2. Sélectionner PDF (ex: OQTF.pdf)
  3. MemoLib extrait les dates
- **Validation** :
  - ✅ PDF analysé
  - ✅ Dates extraites (ex: "Date décision: 15/09/2026")
  - ✅ Type détecté
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 3.5 : Associer dossier ↔ Client
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Lier un dossier à un client existant
- **Steps** :
  1. Nouveau dossier (manuel ou email)
  2. Champ "Client" → Sélectionner ou créer
  3. Sauvegarder
- **Validation** :
  - ✅ Client lié
  - ✅ Dashboard client montre ce dossier
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 3.6 : Filtrer dossiers par statut
- **Priorité** : 🟠 IMPORTANT
- **Cas d'usage** : Voir tous les dossiers actifs vs. clôturés
- **Steps** :
  1. Aller à "Dossiers"
  2. Filtrer : Statut = "Actif"
  3. Vérifier liste
- **Validation** :
  - ✅ Seuls dossiers "Actif" affichés
  - ✅ Filtrer par "Clôs" montre les autres
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

---

## 🔴 CATÉGORIE 4: DÉTECTION CESEDA (8 scénarios)

### Scénario 4.1 : Analyser OQTF
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : Détecter une Obligation de Quitter
- **Input** : Email contenant "Obligation de quitter le territoire français"
- **Validation** :
  - ✅ Type = "OQTF"
  - ✅ Confiance ≥ 90%
  - ✅ Délai proposé (30j ou 48h)
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.2 : Analyser rejet OFPRA → Asile
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : Détecter un rejet de demande d'asile
- **Input** : Email OFPRA "Votre demande d'asile a été rejetée"
- **Validation** :
  - ✅ Type = "Asile"
  - ✅ Proposition recours CNDA
  - ✅ Délai = 30 jours
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.3 : Analyser refus titre de séjour
- **Priorité** : 🟠 IMPORTANT
- **Cas d'usage** : Détecter un refus de renouvellement
- **Input** : Texte refus TS
- **Validation** :
  - ✅ Type = "Titre de séjour"
  - ✅ Options: recours gracieux + appel TA
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.4 : Analyser demande naturalisation
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Dossier complet de naturalisation
- **Validation** :
  - ✅ Type = "Naturalisation"
  - ✅ Pas d'urgence (procédure longue)
  - ✅ Checklist documentaire proposée
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.5 : Analyser regroupement familial
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Demande de reunion familiale
- **Validation** :
  - ✅ Type = "Regroupement familial"
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.6 : Texte non-juridique
- **Priorité** : 🟡 UTILITAIRE
- **Cas d'usage** : Email random (ex: facture électricité)
- **Input** : Email non juridique
- **Validation** :
  - ✅ Type = "Non détecté" (pas de faux positif)
  - ✅ Message clair: "Ce document ne semble pas juridique"
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.7 : Extraire articles de loi
- **Priorité** : 🟢 BONUS
- **Cas d'usage** : Articles cités sont identifiés
- **Validation** :
  - ✅ "Article 66-5 (secret professionnel)" identifié
  - ✅ Articles listés en bas du dossier
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 4.8 : NER juridique (parties)
- **Priorité** : 🟢 BONUS
- **Cas d'usage** : Identifier OFPRA, CNDA, Préfet, etc.
- **Validation** :
  - ✅ Parties identifiées et listées
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

---

## 🔴 CATÉGORIE 5: DÉLAIS & URGENCES (7 scénarios)

### Scénario 5.1 : Délai OQTF standard (30j)
- **Priorité** : 🔴 CRITIQUE
- **Input** : OQTF reçue le 15 septembre
- **Validation** :
  - ✅ Deadline calculée = 15 octobre (30 jours)
  - ✅ Affichage correct dans le dossier
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 5.2 : Délai OQTF urgence (48h)
- **Priorité** : 🔴 CRITIQUE
- **Input** : OQTF mention "décision immédiate"
- **Validation** :
  - ✅ Délai = 48h (reconnu comme urgent)
  - ✅ Alerte 🔴 URGENCE CRITIQUE affichée
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 5.3 : Délai CNDA (1 mois)
- **Priorité** : 🟠 IMPORTANT
- **Input** : Rejet OFPRA reçu le 1er septembre
- **Validation** :
  - ✅ Deadline = 1er octobre (recours CNDA)
  - ✅ Alerte = "1 mois"
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 5.4 : Délai avec week-end
- **Priorité** : 🟡 UTILITAIRE
- **Input** : Deadline tombe vendredi 17h
- **Validation** :
  - ✅ Système reconnaît week-end
  - ✅ Report au lundi?? (OR same day? — à confirmer avec jurisprudence)
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 5.5 : Délai avec suspension (congé)
- **Priorité** : 🟡 UTILITAIRE
- **Input** : Dossier en congé (ex: août)
- **Validation** :
  - ✅ Délai suspendu pendant congé
  - ✅ Reprendre après retour
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 5.6 : Niveau d'urgence affiché
- **Priorité** : 🟠 IMPORTANT
- **Cas d'usage** : Dashboard montre urgence par couleur
- **Validation** :
  - ✅ 🔴 Critique (J-1)
  - ✅ 🟠 Élevé (J-3 à J-7)
  - ✅ 🟡 Moyen (J-7 à J-15)
  - ✅ 🟢 Faible (> J-15)
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

### Scénario 5.7 : Alertes (J-7, J-3, J-1)
- **Priorité** : 🔴 CRITIQUE
- **Cas d'usage** : Notifications rapprochement deadline
- **Setup** : Créer dossier avec deadline J+30 (ex: 15 octobre)
- **Validation** :
  - ✅ J-7 (8 octobre) : Notification "J-7"
  - ✅ J-3 (12 octobre) : Notification "J-3"
  - ✅ J-1 (14 octobre) : Notification "J-1"
- **Résultat** : ☐ PASS ☐ FAIL | **Testé par** : ______ | **Date** : ______

---

## 📝 TEMPLATE RÉSUMÉ SEMAINE

À remplir chaque vendredi 17h :

```
SEMAINE DU : ________

Avocat 1 (_____) :
  ✅ Scénarios testés : ___/10
  ⏸️  Bloquants trouvés : [ ] OQTF [ ] Asile [ ] Délai [ ] Autre ___
  💬 Satisfaction : 1-10 = ____
  📝 Commentaires : _________________

Avocat 2 (_____) :
  ✅ Scénarios testés : ___/10
  ⏸️  Bloquants trouvés : _________________
  💬 Satisfaction : 1-10 = ____
  📝 Commentaires : _________________

... (x5 avocats)

🎯 RÉSUMÉ PILOTE :
  Total scénarios testés : ___/50
  % Réussis : ___%
  Bugs bloquants : [ ] 0 [ ] 1-2 [ ] 3+ 
  Action items pour semaine prochaine : _________________
```

---

## ✅ SIGN-OFF

**Pilot lead signature** : _________________ **Date** : _______

**Tech Lead signature** : _________________ **Date** : _______

---

**Document éditable** : À copier dans Notion ou Google Sheets pour collaboration en temps réel.

