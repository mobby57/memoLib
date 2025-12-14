# 🧪 Guide Complet de Test - IAPosteManager

## 🎯 Objectif
Ce guide vous permet de tester **TOUTES** les fonctionnalités de l'application de manière systématique.

---

## ✅ Checklist Rapide

### Core Features
- [ ] Login / Authentification
- [ ] Configuration Gmail + OpenAI
- [ ] Envoi d'email simple
- [ ] Génération IA d'email
- [ ] Historique des emails
- [ ] Templates d'email

### Nouvelles Features
- [ ] Analyse de documents
- [ ] Gestion des contacts
- [ ] Boîte de réception (Inbox)
- [ ] Transcription vocale temps réel

---

## 📋 Tests Détaillés par Fonctionnalité

### 1. 🔐 LOGIN / AUTHENTIFICATION

#### Test 1.1 : Première Connexion
```
URL: http://localhost:3000/login

Étapes:
1. Page s'affiche avec deux cartes
2. Cliquer "✨ Première utilisation"
3. Entrer mot de passe (min 8 caractères)
4. Confirmer le mot de passe (même valeur)
5. Cliquer "Créer mon compte"

✅ Résultat attendu:
- Message "Mot de passe créé avec succès"
- Redirection vers Dashboard
```

#### Test 1.2 : Connexion Existante
```
Étapes:
1. Actualiser page login
2. Cliquer "🔑 J'ai déjà un compte"
3. Entrer mot de passe correct
4. Cliquer "Se connecter"

✅ Résultat attendu:
- Message "Connexion réussie"
- Accès au Dashboard
```

#### Test 1.3 : Mot de Passe Incorrect
```
Étapes:
1. Cliquer "🔑 J'ai déjà un compte"
2. Entrer mauvais mot de passe
3. Cliquer "Se connecter"

✅ Résultat attendu:
- Message d'erreur "Mot de passe incorrect"
- Reste sur page login
```

---

### 2. ⚙️ CONFIGURATION

#### Test 2.1 : Configuration Gmail
```
URL: http://localhost:3000/config

Étapes:
1. Section "Configuration Gmail"
2. Cliquer lien "guide-app-password.html"
3. Vérifier ouverture du guide HTML
4. Revenir sur config
5. Entrer email: votre-email@gmail.com
6. Entrer App Password (16 caractères)
7. Cliquer "Enregistrer"

✅ Résultat attendu:
- Toast vert "Identifiants Gmail enregistrés"
- Badge vert "Configuré ✓"
```

#### Test 2.2 : Configuration OpenAI
```
Étapes:
1. Section "Configuration OpenAI API"
2. Entrer clé API: sk-...
3. (Optionnel) Entrer Organization ID
4. Cliquer "Enregistrer"

✅ Résultat attendu:
- Toast vert "Clé API enregistrée"
- Badge vert "Configuré ✓"
```

#### Test 2.3 : Test Connexion
```
Étapes:
1. Après config Gmail et OpenAI
2. Cliquer "Tester la connexion" (Gmail)
3. Cliquer "Tester l'API" (OpenAI)

✅ Résultat attendu:
- Gmail: "✓ Connexion réussie"
- OpenAI: "✓ API fonctionnelle"
```

---

### 3. 📧 ENVOI D'EMAIL

#### Test 3.1 : Email Simple
```
URL: http://localhost:3000/send

Étapes:
1. Destinataire: test@example.com
2. Sujet: Test email simple
3. Corps: Ceci est un test de base
4. Cliquer "Envoyer l'email"

✅ Résultat attendu:
- Loading pendant envoi
- Toast vert "Email envoyé avec succès"
- Formulaire réinitialisé
```

#### Test 3.2 : Email avec Pièce Jointe
```
Étapes:
1. Remplir destinataire, sujet, corps
2. Cliquer "Parcourir" (pièce jointe)
3. Sélectionner fichier (PDF, JPG, etc.)
4. Vérifier nom fichier affiché
5. Cliquer "Envoyer l'email"

✅ Résultat attendu:
- Fichier uploadé visible
- Email envoyé avec PJ
- Toast confirmation
```

#### Test 3.3 : Validation Formulaire
```
Étapes:
1. Laisser destinataire vide
2. Cliquer "Envoyer"

✅ Résultat attendu:
- Message erreur "Destinataire requis"
- Email non envoyé
```

---

### 4. ✨ GÉNÉRATION IA

#### Test 4.1 : Génération Email Professionnel
```
URL: http://localhost:3000/ai-generate

Étapes:
1. Contexte: "Demande de congés pour vacances d'été"
2. Ton: Professionnel
3. Type: Demande
4. Destinataire: rh@entreprise.com
5. Cliquer "Générer l'email"

✅ Résultat attendu:
- Loading 2-5 secondes
- Email généré avec structure pro
- Sujet + Corps pré-remplis
- Bouton "Envoyer cet email" actif
```

#### Test 4.2 : Différents Tons
```
Étapes:
Tester avec:
- Ton: Amical → Email décontracté
- Ton: Formel → Email très structuré
- Ton: Concis → Email court

✅ Résultat attendu:
- Chaque ton produit style différent
- Adaptation vocabulaire
```

#### Test 4.3 : Utilisation Template
```
Étapes:
1. Ouvrir Templates
2. Sélectionner un template
3. Revenir sur AI Generate
4. Vérifier contexte pré-rempli
5. Générer

✅ Résultat attendu:
- Template utilisé comme base
- IA améliore le contenu
```

---

### 5. 📄 ANALYSE DE DOCUMENTS

#### Test 5.1 : Upload Document
```
URL: http://localhost:3000/document-analysis

Étapes:
1. Drag & drop fichier PDF/DOCX
   OU cliquer "Parcourir"
2. Sélectionner document (facture, lettre)
3. Vérifier nom fichier affiché
4. Contexte: "Facture impayée à régler"
5. Cliquer "Analyser le document"

✅ Résultat attendu:
- Loading pendant analyse
- Carte résultats avec 4 infos:
  * Type de document
  * Niveau d'urgence
  * Sujet principal
  * Action requise
```

#### Test 5.2 : Sélection Destinataire
```
Étapes:
1. Après analyse
2. Voir liste destinataires suggérés
3. Chaque carte affiche:
   - Nom institution/contact
   - Email
   - Badge catégorie
   - Badge ton recommandé
4. Cliquer sur un destinataire

✅ Résultat attendu:
- Destinataire sélectionné (checkmark)
- Bouton "Continuer" activé
```

#### Test 5.3 : Génération Email Final
```
Étapes:
1. Après sélection destinataire
2. Cliquer "Continuer"
3. Voir email généré:
   - Destinataire (lecture seule)
   - Sujet adapté
   - Corps personnalisé
4. Cliquer "Envoyer cet email"

✅ Résultat attendu:
- Redirection vers /send
- Tous champs pré-remplis
- Prêt à envoyer
```

---

### 6. 👥 GESTION DES CONTACTS

#### Test 6.1 : Ajouter Contact Manuel
```
URL: http://localhost:3000/contacts

Étapes:
1. Cliquer "Ajouter"
2. Modal s'ouvre
3. Nom: Jean Dupont
4. Email: jean.dupont@test.fr
5. Organisation: Entreprise Test
6. Cliquer "Ajouter"

✅ Résultat attendu:
- Modal se ferme
- Contact apparaît dans liste
- Stats "Contacts sauvegardés" +1
```

#### Test 6.2 : Rechercher Institution
```
Étapes:
1. Cliquer "Rechercher institution"
2. Prompt: "mairie de Paris"
3. Entrer recherche
4. Cliquer OK

✅ Résultat attendu:
- Recherche IA dans base institutions
- Résultats affichés si trouvés
- Ajout possible à contacts
```

#### Test 6.3 : Supprimer Contact
```
Étapes:
1. Dans liste contacts
2. Hover sur contact
3. Icône poubelle rouge apparaît
4. Cliquer poubelle
5. Confirmer suppression

✅ Résultat attendu:
- Contact retiré de la liste
- Stats mise à jour
```

#### Test 6.4 : Filtrer Contacts
```
Étapes:
1. Barre de recherche en haut
2. Taper: "dupont"
3. Voir filtrage en temps réel

✅ Résultat attendu:
- Seuls contacts correspondants affichés
- Recherche sur nom + email + org
```

---

### 7. 📥 BOÎTE DE RÉCEPTION

#### Test 7.1 : Synchronisation Initiale
```
URL: http://localhost:3000/inbox

Étapes:
1. Cliquer "Synchroniser"
2. Attendre 10-30 secondes
3. Observer loading

✅ Résultat attendu:
- Icône rotation pendant sync
- Alert: "X nouveaux emails synchronisés"
- Statistiques mises à jour
- Liste emails affichée
```

#### Test 7.2 : Statistiques Dashboard
```
Étapes:
1. Observer 7 cartes statistiques:
   - Total emails
   - Non lus
   - Sans réponse
   - Importants
   - En retard
   - Discussions
   - Temps moyen réponse

✅ Résultat attendu:
- Chiffres corrects
- Couleurs adaptées (rouge = en retard, etc.)
```

#### Test 7.3 : Filtres Basiques
```
Étapes:
1. Barre recherche: "facture"
2. Voir résultats filtrés en temps réel
3. Effacer recherche
4. Cliquer "Filtres"

✅ Résultat attendu:
- Filtrage instantané
- Panneau filtres avancés s'ouvre
```

#### Test 7.4 : Filtres Avancés
```
Étapes:
1. Ouvrir filtres
2. Date début: 01/12/2025
3. Date fin: 10/12/2025
4. Domaine: gmail.com
5. Type: Facture
6. ☑ Importants uniquement
7. ☑ Sans réponse

✅ Résultat attendu:
- Liste emails filtrée selon critères
- Nombre résultats affiché
- Combinaison de filtres
```

#### Test 7.5 : Actions sur Email
```
Étapes:
1. Cliquer sur un email
2. Modal détails s'ouvre
3. Tester boutons:
   - "Répondre" → Redirect /send
   - "Marquer répondu" → Badge ✓
   - (Sur liste) Œil → Marquer lu
   - (Sur liste) ✓ → Marquer répondu

✅ Résultat attendu:
- Chaque action fonctionne
- État email mis à jour
- Badges visuels corrects
```

#### Test 7.6 : Threads (Fils Discussion)
```
Étapes:
1. Mode vue: "Discussions"
2. Voir emails regroupés
3. Cliquer sur thread
4. Voir messages chronologiques

✅ Résultat attendu:
- Emails même sujet regroupés
- Compteur messages
- Participants listés
```

---

### 8. 🎤 TRANSCRIPTION VOCALE

#### Test 8.1 : Vérification Connexion
```
URL: http://localhost:3000/voice-transcription

Étapes:
1. Observer badge connexion en haut
2. Devrait être VERT "Connecté"
3. Si rouge → Vérifier backend

✅ Résultat attendu:
- Badge vert
- WebSocket actif
```

#### Test 8.2 : Sélection Microphone
```
Étapes:
1. Cliquer icône ⚙️ (engrenage)
2. Panneau paramètres s'ouvre
3. Liste déroulante micros
4. Voir tous micros système
5. Sélectionner micro préféré

✅ Résultat attendu:
- Détection automatique micros
- Infos: canaux, fréquence
- Sélection sauvegardée
```

#### Test 8.3 : Enregistrement Simple
```
Étapes:
1. Cliquer micro (bouton bleu géant)
2. Bouton devient rouge avec "⏹"
3. Parler: "Bonjour ceci est un test"
4. Attendre 3 secondes
5. Observer zone "Flux temps réel"

✅ Résultat attendu:
- Texte apparaît dans flux
- Horodatage affiché
- Transcription complète mise à jour
- Timer avance (00:XX)
```

#### Test 8.4 : Enregistrement Long
```
Étapes:
1. Démarrer enregistrement
2. Parler 30-60 secondes:
   "Bonjour, je vous écris pour discuter
    de notre projet commun. J'aimerais
    organiser une réunion la semaine
    prochaine pour faire le point..."
3. Voir phrases apparaître progressivement
4. Cliquer "Stop"

✅ Résultat attendu:
- Plusieurs phrases dans flux temps réel
- Transcription complète cohérente
- Durée enregistrée correcte
- Stats: mots, caractères
```

#### Test 8.5 : Actions Post-Enregistrement
```
Étapes:
Après enregistrement:
1. "Copier" → Vérifier presse-papiers
2. "Télécharger Audio" → Fichier WAV téléchargé
3. "Utiliser dans Email" → Redirect /send avec texte

✅ Résultat attendu:
- Chaque action fonctionne
- Texte préservé
- Audio jouable
```

---

### 9. 📜 HISTORIQUE

#### Test 9.1 : Visualisation Historique
```
URL: http://localhost:3000/history

Étapes:
1. Voir liste emails envoyés
2. Ordre chronologique (récent → ancien)
3. Chaque email affiche:
   - Destinataire
   - Sujet
   - Date/heure
   - Statut

✅ Résultat attendu:
- Tous emails envoyés listés
- Informations complètes
- Design cohérent
```

#### Test 9.2 : Détails Email
```
Étapes:
1. Cliquer sur email dans historique
2. Modal/page détails
3. Voir contenu complet
4. Bouton "Renvoyer" disponible

✅ Résultat attendu:
- Détails complets affichés
- Corps email visible
- Action renvoyer possible
```

---

### 10. 📋 TEMPLATES

#### Test 10.1 : Créer Template
```
URL: http://localhost:3000/templates

Étapes:
1. Cliquer "Nouveau template"
2. Nom: "Demande Congés"
3. Catégorie: Professionnel
4. Contenu: Structure email type
5. Cliquer "Enregistrer"

✅ Résultat attendu:
- Template sauvegardé
- Apparaît dans liste
- Badge catégorie affiché
```

#### Test 10.2 : Utiliser Template
```
Étapes:
1. Dans liste templates
2. Cliquer "Utiliser"
3. Redirection vers /send OU /ai-generate
4. Contenu pré-rempli

✅ Résultat attendu:
- Template chargé
- Champs remplis
- Éditable avant envoi
```

---

## 🔄 Tests d'Intégration

### Test I1 : Workflow Complet Document → Email
```
Scénario: Recevoir facture → Analyser → Générer réponse → Envoyer

Étapes:
1. Inbox: Synchroniser emails
2. Trouver email avec PJ (facture)
3. Document Analysis: Upload même fichier
4. Analyser document
5. Sélectionner destinataire suggéré
6. Générer email
7. Envoyer depuis /send

✅ Résultat attendu:
- Workflow fluide sans interruption
- Contexte préservé entre pages
- Email envoyé correctement
```

### Test I2 : Workflow Voice → Email
```
Scénario: Dicter email par voix

Étapes:
1. Voice Transcription: Enregistrer dictée
2. Parler email complet
3. Arrêter enregistrement
4. "Utiliser dans Email"
5. Vérifier pré-remplissage /send
6. Ajuster si besoin
7. Envoyer

✅ Résultat attendu:
- Transcription précise (85%+)
- Texte transféré correctement
- Envoi réussi
```

### Test I3 : Contact → Template → IA → Send
```
Scénario: Utiliser contact + template pour email IA

Étapes:
1. Contacts: Ajouter/sélectionner contact
2. Templates: Choisir template adapté
3. AI Generate: Utiliser template comme base
4. Destinataire = contact sélectionné
5. Générer + Envoyer

✅ Résultat attendu:
- Données réutilisées intelligemment
- Email cohérent
- Gain de temps significatif
```

---

## 🐛 Tests d'Erreur

### Test E1 : Connexion Perdue
```
Étapes:
1. Arrêter backend (CTRL+C)
2. Tenter action (envoi email, sync, etc.)
3. Observer gestion erreur

✅ Résultat attendu:
- Toast rouge avec message clair
- Pas de crash frontend
- Possibilité de réessayer
```

### Test E2 : Credentials Invalides
```
Étapes:
1. Config: Entrer mauvais App Password Gmail
2. Tenter envoi email
3. Observer erreur

✅ Résultat attendu:
- Message explicite "Identifiants invalides"
- Suggestion vérifier config
```

### Test E3 : API OpenAI Épuisée
```
Étapes:
1. Clé API sans crédit/invalide
2. Tenter génération IA
3. Observer fallback

✅ Résultat attendu:
- Message erreur API
- OU Template générique utilisé
- Pas de crash
```

---

## 📊 Checklist Performance

### Temps de Chargement
- [ ] Page Login: < 1s
- [ ] Dashboard: < 2s
- [ ] Inbox première sync: < 30s (selon nb emails)
- [ ] AI Generate: 2-5s
- [ ] Document Analysis: 3-8s
- [ ] Voice Transcription: ~3s délai

### Réactivité UI
- [ ] Navigation instantanée (< 200ms)
- [ ] Formulaires réactifs
- [ ] Animations fluides (60fps)
- [ ] Pas de freezes

### Mémoire
- [ ] RAM Frontend: < 200MB
- [ ] RAM Backend: < 300MB
- [ ] Pas de fuites mémoire (test 30min)

---

## 🎯 Checklist Finale

Après avoir testé tout :

### Fonctionnalités Core ✅
- [ ] Login fonctionne
- [ ] Config Gmail OK
- [ ] Config OpenAI OK
- [ ] Envoi email basique
- [ ] Génération IA
- [ ] Historique accessible
- [ ] Templates utilisables

### Nouvelles Features ✅
- [ ] Document Analysis complète
- [ ] Contacts gestion
- [ ] Inbox sync + filtres
- [ ] Voice transcription temps réel

### Intégrations ✅
- [ ] Workflow Document → Email
- [ ] Workflow Voice → Email
- [ ] Réutilisation contacts
- [ ] Templates dans IA

### UX/UI ✅
- [ ] Design cohérent
- [ ] Responsive mobile
- [ ] Animations fluides
- [ ] Messages clairs

### Robustesse ✅
- [ ] Gestion erreurs
- [ ] Fallbacks en place
- [ ] Pas de crashes
- [ ] Logs utiles

---

## 📝 Rapport de Test

### Format Recommandé

Pour chaque test effectué :

```
Test: [Nom du test]
Date: [Date/heure]
Statut: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

Résultat:
- [Description résultat obtenu]
- [Écarts par rapport à l'attendu]

Problèmes rencontrés:
- [Liste problèmes]

Suggestions:
- [Améliorations possibles]
```

### Exemple

```
Test: Voice Transcription - Enregistrement Simple
Date: 10/12/2025 15:30
Statut: ⚠️ PARTIAL

Résultat:
- Enregistrement fonctionne
- Transcription précise à 90%
- Délai 3-4s (acceptable)
- "ceci" transcrit "ses si" (erreur mineure)

Problèmes rencontrés:
- Mots courts parfois mal transcrits
- Bruit ambiant perturbe

Suggestions:
- Ajouter filtre anti-bruit
- Option corriger texte après
```

---

## 🎉 Conclusion

Ce guide permet de tester **100% des fonctionnalités** de l'application.

**Durée estimée test complet**: 45-60 minutes

**Priorités**:
1. ⭐ Core Features (login, config, send)
2. ⭐ Nouvelles features majeures (inbox, voice)
3. ⭐ Intégrations
4. Tests erreurs
5. Performance

**En cas de problème**:
- Consulter console navigateur (F12)
- Vérifier logs backend
- Lire documentation respective (MD files)
- Vérifier dépendances installées

Bonne chance ! 🚀
