# 🎬 SCÉNARIOS DE DÉMO COMPLETS - MEMOLIB

**Date:** 27 Février 2025  
**Objectif:** Démonstration live avec vrais messages multi-canaux  
**Durée:** 15-30 minutes selon scénario

---

## 📋 TABLE DES SCÉNARIOS

1. **Scénario Avocat** - Divorce urgent
2. **Scénario Médecin** - Rendez-vous patient
3. **Scénario Consultant** - Nouveau projet
4. **Scénario Comptable** - Déclaration fiscale
5. **Scénario Architecte** - Permis de construire
6. **Scénario Agent Immobilier** - Visite bien
7. **Scénario Complet** - Multi-secteur
8. **Scénario Stress Test** - 50+ messages

---

## 🎯 SCÉNARIO 1: AVOCAT - DIVORCE URGENT

### Contexte
Cabinet d'avocats reçoit demande divorce urgente via multiple canaux

### Timeline (10 minutes)

#### Minute 0: Préparation
```powershell
# Lancer système
cd c:\Users\moros\Desktop\memolib\MemoLib.Api
.\start.ps1

# Ouvrir interfaces
start http://localhost:5078/app.html
start http://localhost:8091
```

#### Minute 1: Email Initial
**Vous envoyez depuis votre Gmail:**
```
À: sarraboudjellal57+legal@gmail.com
Sujet: URGENT - Demande divorce
Corps:
Bonjour Maître,

Je souhaite entamer une procédure de divorce en urgence.
Mon conjoint a vidé nos comptes bancaires hier.

Coordonnées:
Marie Dubois
06 12 34 56 78
15 rue de la Paix, 75001 Paris

Merci de me rappeler rapidement.
```

**Système détecte automatiquement:**
- ✅ Nouveau client créé (Marie Dubois)
- ✅ Dossier créé (Divorce - Marie Dubois)
- ✅ Téléphone extrait (06 12 34 56 78)
- ✅ Adresse extraite (15 rue de la Paix)
- ✅ Priorité détectée (URGENT)

#### Minute 3: SMS de Relance
**Vous envoyez SMS via Twilio/téléphone:**
```
De: +33612345678
À: Votre numéro Signal (+33603983709)
Message: "Maître, c'est Marie Dubois. Avez-vous reçu mon email? C'est très urgent!"
```

**Système:**
- ✅ Associe SMS au dossier existant
- ✅ Notification "Nouveau message sur dossier Divorce"
- ✅ Timeline mise à jour

#### Minute 5: WhatsApp
**Vous envoyez WhatsApp:**
```
Message: "Bonjour, je peux passer à votre cabinet cet après-midi?"
```

**Système:**
- ✅ 3ème message sur même dossier
- ✅ Alerte "Client insistant - 3 canaux"

#### Minute 7: Action Avocat
**Dans l'interface app.html:**

1. **Onglet Inbox** - Voir les 3 messages
2. **Clic sur dossier** - Voir timeline complète
3. **Définir priorité** - Urgent (5/5)
4. **Ajouter tags** - "divorce", "urgent", "famille"
5. **Assigner** - Me Dupont
6. **Statut** - IN_PROGRESS

#### Minute 9: Réponse Email
**Onglet Send:**
```
Canal: Email
À: marie.dubois@example.com
Sujet: RE: URGENT - Demande divorce
Message:
Madame Dubois,

J'ai bien reçu votre demande. Je vous propose un RDV demain 14h.

Merci de confirmer par retour.

Cordialement,
Me Dupont
```

**Système:**
- ✅ Email envoyé via SMTP
- ✅ Ajouté à timeline du dossier
- ✅ Statut "En attente réponse client"

#### Minute 10: Résultat
**Montrer:**
- Dashboard avec statistiques
- Timeline complète du dossier
- 4 événements (3 entrants + 1 sortant)
- Client créé automatiquement
- Recherche "divorce" trouve le dossier

---

## 🏥 SCÉNARIO 2: MÉDECIN - RENDEZ-VOUS PATIENT

### Timeline (8 minutes)

#### Minute 0: Email RDV
```
À: sarraboudjellal57+medical@gmail.com
Sujet: Demande rendez-vous
Corps:
Bonjour Docteur,

Je souhaite prendre RDV pour des douleurs abdominales depuis 3 jours.

Jean Martin
06 98 76 54 32
Mutuelle: MGEN
```

#### Minute 2: Telegram Urgent
```
Message Telegram: "Docteur, les douleurs s'aggravent. Possible aujourd'hui?"
```

#### Minute 4: Appel Téléphonique (simulé)
```
Note manuelle dans système:
"Appel reçu 14h23 - Patient très inquiet - Proposé RDV 16h"
```

#### Minute 6: Confirmation SMS
```
Envoi SMS depuis système:
"M. Martin, RDV confirmé aujourd'hui 16h. Cabinet Dr Durand, 10 av Victor Hugo."
```

#### Minute 8: Résultat
- Dossier patient complet
- 4 interactions tracées
- RDV dans calendrier (si intégré)
- Alerte "Patient à risque" si mots-clés détectés

---

## 💼 SCÉNARIO 3: CONSULTANT - NOUVEAU PROJET

### Timeline (12 minutes)

#### Minute 0: Email Prospect
```
À: sarraboudjellal57+consulting@gmail.com
Sujet: Transformation digitale PME
Corps:
Bonjour,

Nous cherchons consultant pour accompagner notre transformation digitale.
Budget: 50k€
Délai: 6 mois

Sophie Bernard
Directrice - TechCorp SAS
sophie.bernard@techcorp.fr
01 23 45 67 89
```

#### Minute 3: LinkedIn Message (simulé via web)
```
Message: "J'ai envoyé un email. Disponible pour call cette semaine?"
```

#### Minute 5: WhatsApp Business
```
Message: "Voici notre cahier des charges [PDF joint]"
```

#### Minute 7: Réponse Consultant
```
Email:
"Madame Bernard,

Merci pour votre confiance. Je vous propose:
- Audit initial: 2 jours
- Roadmap: 1 semaine
- Accompagnement: 5 mois

Proposition commerciale en PJ.

Cordialement"
```

#### Minute 10: Suivi
- Créer tâche "Relancer dans 3 jours"
- Ajouter note "Budget validé par COMEX"
- Statut "Proposition envoyée"

---

## 📊 SCÉNARIO 4: COMPTABLE - DÉCLARATION FISCALE

### Timeline (10 minutes)

#### Minute 0: Email Client Paniqué
```
À: sarraboudjellal57+accounting@gmail.com
Sujet: URGENT - Déclaration TVA demain!
Corps:
Bonjour,

J'ai oublié ma déclaration TVA qui est due demain!
Pouvez-vous m'aider en urgence?

Documents en pièces jointes (3 PDF)

Pierre Leroy
SARL Leroy & Fils
```

#### Minute 2: SMS
```
"J'ai envoyé email avec docs. Vous pouvez traiter aujourd'hui?"
```

#### Minute 4: Appel (noté)
```
Note: "Client très stressé. Promis traitement avant 18h."
```

#### Minute 6: Traitement Comptable
```
Actions dans système:
- Upload documents reçus
- Créer tâche "Déclaration TVA - URGENT"
- Assigner à comptable senior
- Priorité MAX
- Échéance: Aujourd'hui 18h
```

#### Minute 8: Confirmation
```
Email envoi:
"M. Leroy,

Déclaration TVA traitée et télétransmise.
Récépissé en PJ.

Montant: 12,450€ à payer avant le 15.

Cordialement"
```

---

## 🏗️ SCÉNARIO 5: ARCHITECTE - PERMIS DE CONSTRUIRE

### Timeline (15 minutes)

#### Minute 0: Email Initial
```
À: sarraboudjellal57+architecture@gmail.com
Sujet: Projet extension maison
Corps:
Bonjour,

Nous souhaitons agrandir notre maison (30m²).
Besoin plans + dépôt permis de construire.

Plans actuels en PJ.

Famille Rousseau
12 chemin des Vignes, 69000 Lyon
```

#### Minute 3: WhatsApp Photos
```
Message: "Voici photos actuelles de la maison"
[5 photos envoyées]
```

#### Minute 5: Messenger Questions
```
"Quel est le délai pour obtenir le permis?"
"Coût estimé des travaux?"
```

#### Minute 8: Réponse Architecte
```
Email détaillé:
"Famille Rousseau,

Projet étudié. Voici notre proposition:

Phase 1: Plans (3 semaines) - 2,500€
Phase 2: Dépôt permis (1 semaine) - 800€
Phase 3: Suivi travaux (6 mois) - 5,000€

Délai permis: 2-3 mois après dépôt.

RDV sur site la semaine prochaine?

Cordialement"
```

#### Minute 12: Organisation
```
Dans système:
- Créer projet "Extension Rousseau"
- Ajouter 8 photos en pièces jointes
- Créer 3 tâches (Plans, Permis, Suivi)
- Calendrier: RDV site
- Budget: 8,300€
```

---

## 🏠 SCÉNARIO 6: AGENT IMMOBILIER - VISITE BIEN

### Timeline (8 minutes)

#### Minute 0: Email Demande
```
À: sarraboudjellal57+realty@gmail.com
Sujet: Visite appartement 3 pièces Lyon 6
Corps:
Bonjour,

Intéressé par l'appartement ref: LY6-2025-042
Disponible samedi matin?

Thomas Petit
06 11 22 33 44
```

#### Minute 2: SMS Rapide
```
"Toujours dispo samedi 10h?"
```

#### Minute 4: WhatsApp
```
"Voici mon dossier locataire [PDF]"
```

#### Minute 6: Réponse Agent
```
SMS envoyé:
"M. Petit, visite confirmée samedi 10h.
RDV devant l'immeuble, 15 rue Garibaldi.
À samedi!"
```

#### Minute 8: Suivi
```
Système:
- Visite planifiée (calendrier)
- Dossier locataire reçu
- Statut "Visite programmée"
- Rappel automatique J-1
```

---

## 🎯 SCÉNARIO 7: COMPLET MULTI-SECTEUR (30 min)

### Démonstration Complète de la Plateforme

#### Phase 1: Réception Multi-Canaux (10 min)
```
Envoyer simultanément:
1. Email avocat (divorce)
2. SMS médecin (urgence)
3. WhatsApp consultant (projet)
4. Telegram comptable (facture)
5. Messenger architecte (plans)
6. Signal agent immobilier (visite)
```

**Montrer:**
- Inbox unifiée avec 6 messages
- 6 dossiers créés automatiquement
- 6 clients créés
- Détection automatique secteur (via email alias)

#### Phase 2: Organisation (10 min)
```
Pour chaque dossier:
1. Définir priorité (1-5)
2. Ajouter tags pertinents
3. Assigner à utilisateur
4. Changer statut
5. Ajouter note
```

**Montrer:**
- Filtres par priorité
- Filtres par tag
- Filtres par statut
- Recherche textuelle
- Recherche sémantique

#### Phase 3: Réponses & Automatisation (10 min)
```
1. Répondre par email (template)
2. Envoyer SMS
3. Créer tâches automatiques
4. Générer documents
5. Planifier rappels
```

**Montrer:**
- Templates personnalisés
- Variables dynamiques
- Workflow automatique
- Notifications
- Dashboard analytics

---

## 🔥 SCÉNARIO 8: STRESS TEST (20 min)

### Objectif: Tester Performance & Scalabilité

#### Préparation
```powershell
# Lancer l'API
cd c:\Users\moros\Desktop\memolib\MemoLib.Api
dotnet run
```

#### Phase 1: Envoi Massif (5 min)
```powershell
# Envoyer 50 messages
.\scripts\demo-stress-test.ps1 -Count 50

# OU envoyer 100 messages
.\scripts\demo-stress-test.ps1 -Count 100
```

**Résultats attendus:**
- ✅ 50-100 emails ingérés
- ✅ 50-100 clients créés
- ✅ 50-100 dossiers créés
- ✅ Temps < 30 secondes
- ✅ Débit > 3 msg/s
- ✅ 0 erreur

#### Phase 2: Vérification Interface (5 min)
```
Ouvrir: http://localhost:5078/demo-pro.html

1. Onglet Cases:
   → Voir 50-100 dossiers
   → Filtrer par secteur
   → Rechercher par nom

2. Onglet Clients:
   → Voir 50-100 clients
   → Vérifier extraction téléphone
   → Vérifier extraction adresse

3. Performance:
   → Chargement < 2s
   → Recherche < 500ms
   → Filtres instantanés
```

#### Phase 3: Opérations Masse (5 min)
```
Actions sur tous les dossiers:

1. Filtrer par priorité
2. Sélectionner 10 dossiers
3. Changer statut en masse → IN_PROGRESS
4. Ajouter tag en masse → "stress-test"
5. Assigner en masse → Utilisateur test
```

#### Phase 4: Analytics (5 min)
```
Dashboard:
→ Voir statistiques mises à jour
→ 50-100 dossiers créés aujourd'hui
→ Graphiques temps réel
→ Répartition par secteur
→ Répartition par priorité
```

#### Métriques de Performance
```
✅ Ingestion: > 3 msg/s
✅ Création client: < 100ms/client
✅ Création dossier: < 150ms/dossier
✅ Recherche: < 500ms
✅ Filtres: < 200ms
✅ Chargement page: < 2s
✅ Mémoire: < 500MB
✅ CPU: < 50%
```

---

## 🎬 SCÉNARIO 9: AUTOMATISATION COMPLÈTE

### Objectif: Workflow Automatique de A à Z

#### Configuration Règles
```
Règle 1: Email avec "URGENT" → Priorité 5
Règle 2: Client VIP → Notification immédiate
Règle 3: Dossier > 7 jours → Alerte
Règle 4: Document reçu → Extraction auto
Règle 5: Statut CLOSED → Facture auto
```

#### Test Automatisation
```
1. Envoyer email avec "URGENT"
   → Vérifier priorité = 5
   → Vérifier notification

2. Email de client VIP
   → Vérifier alerte immédiate
   → Vérifier assignation auto

3. Attendre 7 jours (simulé)
   → Vérifier alerte dossier ancien

4. Upload document
   → Vérifier extraction texte
   → Vérifier indexation

5. Clôturer dossier
   → Vérifier facture générée
   → Vérifier email satisfaction
```

---

## 📊 MÉTRIQUES DE SUCCÈS

### Performance
- ✅ Ingestion: > 3 messages/seconde
- ✅ Recherche: < 500ms
- ✅ Chargement: < 2s
- ✅ Disponibilité: > 99%

### Fonctionnel
- ✅ Détection client: 100%
- ✅ Extraction téléphone: > 95%
- ✅ Extraction adresse: > 90%
- ✅ Association dossier: 100%

### Utilisateur
- ✅ Temps réponse: < 2h
- ✅ Satisfaction: > 4/5
- ✅ Adoption: > 80%
- ✅ Erreurs: < 1%

---

**🎯 FIN DES SCÉNARIOS**## Envoi Massif
```
50 emails simultanés:
- 10 avocats (divorce, contrat, succession)
- 10 médecins (RDV, urgence, résultats)
- 10 consultants (audit, formation, coaching)
- 10 comptables (déclaration, bilan, paie)
- 10 architectes (permis, plans, suivi)
```

#### Vérifications
```
✅ Tous les emails reçus (< 2 min)
✅ 50 dossiers créés
✅ 50 clients créés
✅ Aucun doublon
✅ Performance API < 500ms
✅ Interface réactive
✅ Recherche fonctionne
✅ Statistiques correctes
```

---

## 📱 GUIDE D'ENVOI DES MESSAGES

### Email
```
Gmail → sarraboudjellal57+[secteur]@gmail.com

Secteurs disponibles:
- legal (avocat)
- medical (médecin)
- consulting (consultant)
- accounting (comptable)
- architecture (architecte)
- realty (immobilier)
- insurance (assurance)
- engineering (ingénieur)
```

### SMS
```
Twilio ou téléphone réel → +33603983709 (Signal)
Format: "Texte du message"
```

### WhatsApp
```
WhatsApp Business → +33603983709
Ou via Twilio API
```

### Telegram
```
Bot Telegram: @MemoLibBot
Commande: /start puis message
```

### Messenger
```
Page Facebook MemoLib
Message direct
```

### Signal
```
Signal → +33603983709
Message direct (relayé automatiquement)
```

---

## 🎬 SCRIPT DE PRÉSENTATION TYPE

### Introduction (2 min)
```
"Bonjour, je suis [Nom], et je vais vous montrer MemoLib,
la plateforme qui centralise TOUTES vos communications professionnelles.

Aujourd'hui, je vais recevoir de VRAIS messages par email, SMS, WhatsApp,
et vous allez voir en temps réel comment le système les traite."
```

### Démonstration Live (15 min)
```
1. "Je vais maintenant envoyer un email depuis mon téléphone..."
   [Envoyer email]
   
2. "Regardez, en moins de 30 secondes, le message apparaît ici..."
   [Montrer inbox]
   
3. "Le système a automatiquement créé le client et le dossier..."
   [Montrer client + dossier]
   
4. "Maintenant je vais envoyer un SMS..."
   [Envoyer SMS]
   
5. "Voyez, il s'ajoute au même dossier automatiquement..."
   [Montrer timeline]
   
6. "Je peux répondre directement depuis l'interface..."
   [Envoyer réponse]
   
7. "Et organiser avec priorités, tags, assignation..."
   [Montrer organisation]
```

### Questions & Réponses (5 min)
```
Questions fréquentes:
- "Combien de canaux supportés?" → 8 canaux
- "Sécurité des données?" → RGPD, chiffrement, audit
- "Prix?" → 20-40€/mois selon secteur
- "Installation?" → 5 minutes, cloud ou local
- "Support?" → Email, chat, téléphone
```

### Conclusion (3 min)
```
"Vous avez vu en direct:
✅ Réception multi-canaux
✅ Organisation automatique
✅ Réponse unifiée
✅ Traçabilité complète

MemoLib, c'est:
- Gain de temps: 2h/jour
- Zéro message perdu
- Conformité RGPD
- 36 secteurs supportés

Questions?"
```

---

## 📋 CHECKLIST AVANT DÉMO

### Technique
- [ ] API démarrée (localhost:5078)
- [ ] Frontend ouvert (localhost:5078/app.html)
- [ ] Admin ouvert (localhost:8091)
- [ ] Base de données propre
- [ ] User Secrets configurés
- [ ] Email monitoring actif
- [ ] Connexion internet stable

### Contenu
- [ ] Compte test créé
- [ ] Templates préparés
- [ ] Téléphone chargé
- [ ] WhatsApp connecté
- [ ] Telegram configuré
- [ ] Signal actif

### Présentation
- [ ] Écran partagé configuré
- [ ] Micro testé
- [ ] Caméra testée
- [ ] Slides prêtes
- [ ] Démo répétée 3x
- [ ] Plan B si problème réseau

---

## 🚨 PLAN B SI PROBLÈME

### Si Email ne marche pas
```
→ Utiliser ingestion manuelle:
POST /api/ingest/email
{
  "from": "client@example.com",
  "subject": "Test",
  "body": "Message de test"
}
```

### Si SMS ne marche pas
```
→ Utiliser gateway:
POST /api/gateway/ingest
X-API-Key: memolib-gateway-2025-secure-key
{
  "channel": "sms",
  "from": "+33612345678",
  "text": "Message test"
}
```

### Si Internet coupe
```
→ Mode démo offline:
- Utiliser données pré-chargées
- Montrer captures d'écran
- Expliquer le flow théorique
```

---

## 📊 MÉTRIQUES À MONTRER

### Performance
- Temps réception email: < 60s
- Temps traitement: < 1s
- Temps recherche: < 200ms
- Uptime: 99.9%

### Fonctionnel
- 8 canaux supportés
- 36 secteurs configurés
- Détection auto client: 95%
- Extraction coordonnées: 90%

### Business
- Gain temps: 2h/jour
- ROI: 300% an 1
- Satisfaction: 4.8/5
- Rétention: 95%

---

**Prêt pour démo live!** 🚀
