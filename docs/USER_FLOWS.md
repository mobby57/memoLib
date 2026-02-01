# 🚀 PARCOURS UTILISATEUR — FLUX OPÉRATIONNELS

## PRINCIPE DIRECTEUR

> **"Documenter sans décider, alerter sans juger, tracer sans interpréter"**

---

## 👥 PERSONAS

### 1. ADMIN (Responsable cabinet/organisation)
- Gère les utilisateurs
- Supervise l'activité
- Valide les documents critiques
- Pilote les délais

### 2. USER (Collaborateur)
- Crée et suit les dossiers
- Charge les documents
- Enregistre les événements
- Répond aux alertes

### 3. READONLY (Stagiaire/Consultant)
- Consulte uniquement
- Pas de modification
- Accès limité

---

## 🎯 PARCOURS 1 : CRÉATION D'UN DOSSIER

### Déclencheur
Nouveau client → nouvelle affaire

### Étapes
1. **Créer le client** (si inexistant)
   - Formulaire minimal : nom, prénom, email
   - Validation unicité email dans le tenant
   - → Génération automatique ID client

2. **Créer le dossier**
   - Rattachement au client
   - Numéro auto : `DOS-2024-0001`
   - Type : contentieux / conseil / transaction
   - Domaine : civil / pénal / commercial / etc.
   - → Génération automatique ID dossier

3. **Premier événement automatique**
   - Type : "action"
   - Catégorie : "ouverture_dossier"
   - Date : now()
   - Acteur : userId
   - → Enregistré dans `Evenement`

4. **Audit log**
   - Action : "create"
   - Entity : "Dossier"
   - → Traçabilité complète

### Résultat
✅ Dossier créé, horodaté, tracé
✅ Client rattaché
✅ Historique initialisé

---

## 📄 PARCOURS 2 : AJOUT D'UN DOCUMENT

### Déclencheur
Réception d'une pièce (email, courrier, scan)

### Étapes
1. **Upload fichier**
   - Validation type MIME
   - Validation taille (< limite tenant)
   - → Stockage S3/local

2. **Calcul hash SHA256**
   - Détection doublon
   - Garantie intégrité
   - → Unicité absolue

3. **Métadonnées**
   - Nom du document
   - Type : pièce_identite / contrat / jugement / courrier
   - Date du document (≠ date upload)
   - Tags pour recherche
   - → Rattachement dossier/client

4. **Événement automatique**
   - Type : "document"
   - Catégorie : "depot_piece"
   - → Lien vers Document

5. **Mise à jour compteur**
   - `tenant.currentStorage += fileSize`
   - Vérification limite
   - → Transaction atomique

### Résultat
✅ Document stocké, hashé, tracé
✅ Événement enregistré
✅ Compteur mis à jour

---

## ⏰ PARCOURS 3 : CRÉATION D'UN DÉLAI

### Déclencheur
- Réception d'une décision de justice
- Signature d'un contrat
- Obligation légale identifiée

### Étapes
1. **Identification du délai**
   - Titre : "Appel jugement TJ Paris"
   - Type : judiciaire / légal / contractuel
   - Fondement : "Art. 538 CPC"
   - Date échéance : calculée ou saisie

2. **Calcul alertes automatiques**
   - Rappel 1 : J-7
   - Rappel 2 : J-3
   - Rappel 3 : J-1
   - → Dates figées

3. **Rattachement**
   - Dossier obligatoire
   - Document source (facultatif)
   - → Lien contextuel

4. **Événement automatique**
   - Type : "delai"
   - Catégorie : "creation_echeance"
   - → Traçabilité

### Résultat
✅ Délai créé, horodaté
✅ Alertes programmées
✅ Fondement juridique documenté

---

## 🔔 PARCOURS 4 : GESTION DES ALERTES

### Déclencheur
Cron job quotidien (ex: 8h00)

### Étapes
1. **Scan des délais**
   ```sql
   SELECT * FROM Delai 
   WHERE status = 'actif'
   AND (
     dateRappel1 <= NOW() AND alerteEnvoyee1 = false
     OR dateRappel2 <= NOW() AND alerteEnvoyee2 = false
     OR dateRappel3 <= NOW() AND alerteEnvoyee3 = false
   )
   ```

2. **Création notifications**
   - Pour chaque délai trouvé
   - Notification → User(s) concerné(s)
   - Type : "delai"
   - Message : "Échéance dans X jours : [titre]"

3. **Envoi email** (facultatif)
   - Si user.emailNotifications = true
   - Template standardisé
   - → Preuve d'envoi conservée

4. **Mise à jour flags**
   - `alerteEnvoyee1 = true`
   - → Pas de doublon

5. **Événement automatique**
   - Type : "delai"
   - Catégorie : "alerte_envoyee"
   - → Preuve opposable

### Résultat
✅ Alerte envoyée, tracée
✅ Preuve d'envoi conservée
✅ Pas de délai raté

---

## 📧 PARCOURS 5 : TRAITEMENT EMAIL ENTRANT

### Déclencheur
Email reçu sur adresse surveillée

### Étapes
1. **Parsing email**
   - Extraction : from, to, subject, body
   - Détection pièces jointes
   - → Stockage brut

2. **Détection client**
   - Recherche par email expéditeur
   - Si trouvé → rattachement automatique
   - Si non trouvé → file d'attente manuelle

3. **Extraction pièces jointes**
   - Pour chaque PJ
   - → Création Document
   - → Hash SHA256

4. **Création Email**
   - messageId unique
   - direction : "inbound"
   - status : "non_traite"
   - → Rattachement client

5. **Notification utilisateur**
   - "Nouvel email de [client]"
   - → Action requise

### Résultat
✅ Email conservé intégralement
✅ PJ extraites et hashées
✅ Rattachement automatique si possible

---

## 🔍 PARCOURS 6 : RECHERCHE HISTORIQUE

### Déclencheur
User cherche un précédent / une décision

### Étapes
1. **Interface de recherche**
   - Champs : article de loi, juridiction, date, mots-clés
   - Filtres : domaine, type de décision
   - → Requête structurée

2. **Recherche dans base locale**
   - Index sur `Evenement` + `Document`
   - Filtrage par tags
   - → Résultats pertinents

3. **Affichage résultats**
   - Liste chronologique
   - Résumé factuel neutre
   - Lien vers document source
   - → Aucune analogie avec dossier actuel

4. **Événement de consultation**
   - Type : "action"
   - Catégorie : "recherche_historique"
   - → Traçabilité usage

### Résultat
✅ Accès mémoire documentaire
✅ Pas d'interprétation
✅ Usage tracé

---

## 📊 PARCOURS 7 : TABLEAU DE BORD

### Déclencheur
Connexion utilisateur

### Affichage
1. **Délais urgents**
   - Échéances < 7 jours
   - Triés par priorité
   - → Action immédiate

2. **Dossiers actifs**
   - Status : "ouvert" | "en_cours"
   - Dernière activité
   - → Vue d'ensemble

3. **Notifications non lues**
   - Badge compteur
   - → Alertes manquées

4. **Activité récente**
   - Derniers événements
   - Timeline chronologique
   - → Contexte immédiat

### Résultat
✅ Vision opérationnelle claire
✅ Priorisation automatique
✅ Aucune info perdue

---

## 🔐 PARCOURS 8 : AUDIT & EXPORT

### Déclencheur
- Contrôle interne
- Demande RGPD
- Contentieux

### Étapes
1. **Sélection périmètre**
   - Par client
   - Par dossier
   - Par période
   - → Filtrage précis

2. **Génération export**
   - Format : JSON / PDF / ZIP
   - Contenu :
     - Tous les événements
     - Tous les documents (+ hash)
     - Tous les délais
     - Audit logs complets
   - → Package complet

3. **Horodatage export**
   - Date génération
   - User demandeur
   - → Traçabilité export

4. **Événement automatique**
   - Type : "action"
   - Catégorie : "export_donnees"
   - → Preuve opposable

### Résultat
✅ Export complet, horodaté
✅ Conformité RGPD
✅ Preuve opposable

---

## 🎨 PRINCIPES UX

### Simplicité
- Formulaires minimaux
- Champs obligatoires clairs
- Validation en temps réel

### Feedback immédiat
- Confirmation visuelle
- Messages explicites
- Pas d'ambiguïté

### Prévention erreur
- Validation avant soumission
- Détection doublons
- Alertes limites

### Accessibilité
- Contraste élevé
- Navigation clavier
- Responsive mobile

---

## 🚨 GESTION ERREURS

### Erreur utilisateur
- Message clair, non technique
- Suggestion correction
- Pas de perte de données

### Erreur système
- Log automatique
- Notification admin
- Fallback gracieux

### Erreur critique
- Rollback transaction
- Alerte immédiate
- Mode dégradé si nécessaire

---

## 📱 RESPONSIVE

### Mobile
- Consultation prioritaire
- Ajout événement rapide
- Notifications push

### Tablet
- Formulaires complets
- Upload documents
- Signature électronique

### Desktop
- Toutes fonctionnalités
- Multi-fenêtres
- Raccourcis clavier

---

## 🎯 MÉTRIQUES DE SUCCÈS

### Opérationnelles
- 0 délai raté
- < 2 min pour créer un dossier
- < 30 sec pour ajouter un document

### Qualité
- 100% événements tracés
- 100% documents hashés
- 100% actions auditées

### Satisfaction
- Réduction stress utilisateur
- Temps libéré mesurable
- Confiance dans le système

---

## 🔥 PROCHAINE ÉTAPE

Maintenant que le modèle de données ET les parcours sont définis, je peux :

1. **Générer le schéma Prisma complet**
2. **Créer les migrations**
3. **Implémenter les API routes**
4. **Construire les composants UI**

👉 Tape "go" pour que je génère le schéma Prisma prêt à l'emploi
