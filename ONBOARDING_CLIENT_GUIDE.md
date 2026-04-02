# 🚀 Guide d'Onboarding MemoLib (Après Essai)

**Pour: Nouveaux clients qui passent de l'essai gratuit au plan Pro/Enterprise**

---

## 📋 Table des Matières

1. [Bienvenue](#bienvenue)
2. [Jour 1 - Setup Initial](#jour1)
3. [Jour 1-3 - Import Données](#import)
4. [Semaine 1 - Premiers Dossiers](#semaine1)
5. [Semaine 2 - Optimisation](#semaine2)
6. [Semaine 3 - Équipe & Collaboration](#semaine3)
7. [Semaine 4 - Go Production](#semaine4)
8. [Support & Escalade](#support)

---

## 🎉 Bienvenue! {#bienvenue}

**Vous avez choisi MemoLib Pro/Enterprise!**

Félicitations 🎊
Vous avez accès à tous les outils pour gérer 50+ dossiers CESEDA proprement.

**Ce guide = roadmap 4 semaines**

Suivez ces étapes, vous serez productif immédiatement.

### ✅ Checklist Prérequis

Avant de commencer, vérifiez:
- [ ] Compte MemoLib créé et activé
- [ ] Email de bienvenue reçu
- [ ] Accès à https://memolib.fly.dev/dashboard
- [ ] Browser modernes (Chrome, Firefox, Safari, Edge)
- [ ] Internet stable (ne marche pas offline YET)

---

## 📅 Jour 1 - Setup Initial {#jour1}

**Durée: 30-45 min**

### Étape 1: Email de Bienvenue

Vous devez recevoir email avec:
- ✅ Confirmation activé Pro/Enterprise
- ✅ Lien accès dashboard
- ✅ Credentials temporaires (si nécessaire)
- ✅ Guide rapide PDF
- ✅ Contact support

**Action:** Ouvrez l'email, cliquez lien, loggez-vous.

### Étape 2: Premier Login

<img alt="Login flow" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext x='200' y='50' font-size='20' text-anchor='middle' font-weight='bold'%3ELogin MemoLib%3C/text%3E%3Crect x='50' y='80' width='300' height='40' fill='white' stroke='%23ccc' rx='5'/%3E%3Ctext x='60' y='105' font-size='14'%3EEmail%3C/text%3E%3Crect x='50' y='130' width='300' height='40' fill='white' stroke='%23ccc' rx='5'/%3E%3Ctext x='60' y='155' font-size='14'%3EPassword%3C/text%3E%3Crect x='50' y='190' width='300' height='40' fill='%234285F4' rx='5'/%3E%3Ctext x='200' y='215' font-size='14' text-anchor='middle' fill='white' font-weight='bold'%3ELogin%3C/text%3E%3C/svg%3E" />

1. Allez sur https://memolib.fly.dev
2. Cliquez "Login" (haut droit)
3. Entrez email + password
4. Validez 2FA si actif (Azure AD)
5. **Vous arrivez sur Dashboard**

### Étape 3: Premier Look Dashboard

```
Dashboard MemoLib
├── 📊 Statistiques (top)
│   ├── Clients: 0 (vous êtes neuf)
│   ├── Dossiers: 0
│   └── Stockage utilisé: 0 Go
│
├── 🎯 Actions rapides (boutons)
│   ├── + Ajouter client
│   ├── + Créer dossier
│   └── 📋 Importer depuis fichier
│
├── ⚙️ Paramètres (menu)
│   ├── Profil
│   ├── Équipe (invite collègues)
│   ├── Intégrations (Outlook, Google)
│   ├── Notifications
│   └── Facturation (voir plan active)
│
└── 📱 Sidebar nav
    ├── Clients
    ├── Dossiers
    ├── Documents
    ├── Rapports
    └── Support
```

**À faire maintenant:**
1. Cliquez "Profil" → mettez photo + bio
2. Cliquez "Paramètres" → activez notifications email
3. Cliquez "Facturation" → confirmez plan Pro/Enterprise

### Étape 4: Inviter Équipe (Optional)

Si vous êtes pas seul:

1. Allez "Équipe" dans settings
2. Cliquez "+ Inviter collèque"
3. Entrez email
4. Choisissez role:
   - **Admin** = tout accès (invite/delete users)
   - **Editor** = voir + modifier dossiers
   - **Viewer** = lecture seule (audit, rapports)
5. Envoyez invit

Collègues reçoivent email avec lien d'acceptation.

---

## 📥 Jour 1-3 - Import Données {#import}

**Durée: 2-4h (dépend volume)**

### Option A: Import Manuel (Rapide & Recommandé)

**Cas:** <20 clients, <50 dossiers

1. Allez "Clients" → "+ Ajouter client"
2. Tapez: Name, Email, Phone, Notes
3. Sauvegardez (auto-save)
4. Créez nouveau client (repeat)

**Tip:** Si vous avez fichier Excel:

1. File → "+ Importer fichier"
2. Téléchargez CSV (format: name, email, phone)
3. MemoLib fait matching automatique
4. Vérifiez doublons → remove si needed

### Option B: Import Bulk (Gros Volume)

**Cas:** >50 clients, >100 dossiers

Contactez support pour:
- Migration API (gratuit)
- Import PDF/Excel propre
- Mapping personnalisé

**Email:** contact@memolib.fr
**Subject:** "Demande migration bulk clients"

---

## 👥 Semaine 1 - Premiers Dossiers {#semaine1}

**Durée: 5-10 dossiers pour vous familiariser**

### Étape 1: Créez Vos Premiers Clients

1. Allez "Clients"
2. Cliquez "+ Ajouter client"
3. Remplissez form:
   - **Nom complet** (ex: "Fatima K.")
   - **Email** (vérifiez, important)
   - **Téléphone** (avec +33 format France)
   - **Genre** (pour correspondance correct)
   - **Date de naissance** (utile CESEDA)
   - **Notes** (situation, langues parlées, etc.)
4. Sauvegardez

### Étape 2: Créez Vos Premiers Dossiers

1. Allez "Dossiers"
2. Cliquez "+ Créer dossier"
3. Sélectionnez **Type de dossier**:
   - 📋 Demande asile (+ courant)
   - 📋 Recours CNDA
   - 📋 Renouvellement titre séjour
   - 📋 Aide social/logement
   - 📋 Custom (si votre type)
4. Remplissez infos:
   - **Client** (dropdown, auto-fill)
   - **Date création** (auto-aujourd'hui)
   - **Description** (ex: "Syrie, Damas, persécution religieuse")
5. Sauvegardez

### Étape 3: Explorez Template Automatique

Chaque dossier novo a sections:

```
Dossier Template
├── 📋 Faits (résumé du cas)
├── ⚖️ Fondements juridiques (lois applicables)
├── 📚 Jurisprudence (cas similaires)
├── 🎯 Arguments principaux
├── ⚠️ Contres-arguments (honête!)
├── 🔗 Preuves annexées (documents liés)
└── 📝 Notes privées (secretaire, stratégie)
```

**À faire:** Remplissez ces sections votre propre cas (1 dossier complet).

### Étape 4: Lancez Analyse IA

Une fois dossier rempli:

1. Allez "Dossiers" → ouvrez cas
2. Cliquez bouton "🤖 Analyser avec IA"
3. Attendez 10-30 sec (API OpenAI)
4. Revenez sur page → AI analysis visible

**Vous verrez:**
- ✅ Points forts (convention 1951 applicable, jurisprudence)
- ⚠️ Points faibles (manque preuves documentaires)
- 📈 Taux acceptation estimé (ex: 78%)
- 💡 Suggestions stratégie (relier faits + droit)

**À faire:** Lisez analyse, notez points clés dans "Notes privées".

---

## ⚙️ Semaine 2 - Optimisation {#semaine2}

**Durée: Customisation = 3-5h**

### Étape 1: Customisez Le Workflow

MemoLib arrive avec defaults. Customisez pour vous:

1. Allez "Paramètres" → "Workflow"
2. **Section statuts dossier:**
   - [ ] En cours
   - [ ] Écrit + analyse (votre nom?)
   - [ ] Attente client feedback
   - [ ] Prêt audience
   - [ ] Rejeté
   - [ ] Accepté (archive)
   - [ ] Appel (nouveau dossier)

3. **Définissez** vos statuts courants
4. **Assignez** couleurs (vert/rouge/orange pour urgence)

### Étape 2: Setup Notifications

1. Allez "Paramètres" → "Notifications"
2. Activer:
   - [ ] Email pour dossiers nouveaux (+1 jour)
   - [ ] Alertes échéances (-7j, -3j, -1j)
   - [ ] Dossiers escaladés (urgent)
   - [ ] Audience demain (reminder)
4. Définissez time: "Matin 8h" vs. "Soir 17h"

### Étape 3: Intégrations Externes

**Office 365/Outlook:**
1. Settings → Intégrations
2. Cliquez "Connect Outlook"
3. Authentifiez avec Microsoft
4. Sélectionnez calendrier MemoLib
5. → Audiences auto-créées dans Outlook

**Google Services:**
1. Settings → Intégrations
2. Cliquez "Connect Google"
3. Authentifiez
4. → Docs/Drive peuvent être liés aux dossiers

### Étape 4: Templates Personnalisés

1. Allez "Dossiers" → "Templates"
2. Créer template custom:
   - **Cabinet Durand Spécialité Asile:**
     - Sections: Faits, Fondement Convention, Jurisprudence CNDA, Pro-bono note
     - Style (logo, footer)
3. Sauvegardez
4. Prochains "Demande asile" = utilisent ce template

---

## 👥 Semaine 3 - Équipe & Collaboration {#semaine3}

**Durée: 2-3h si équipe, 1h si solo**

### Étape 1: Invite Collègues (Si Applicable)

1. Allez "Équipe" → "+ Inviter"
2. Entrez email collègue
3. Choisissez role:
   - **Admin** = invite/remove users, change settings
   - **Editor** = créer/modifier dossiers
   - **Viewer** = voir rapports uniquement
4. Envoyer invitation

Collègue reçoit email "Vous êtes invité à MemoLib".

### Étape 2: Partage Dossiers

1. Ouvrez un dossier
2. Cliquez "Partager" (bouton droit)
3. Sélectionnez qui voir:
   - Collègue A = read-only
   - Collègue B = peut éditer
   - Tout le monde = can view
4. Sauvegardez

**Utilisabilité:** Chaque collègue voit ses dossiers + dossiers partagés.

### Étape 3: Commentaires & Collaboration

Dans un dossier partagé:

1. Allez section "Faits"
2. Cliquez "+ Ajouter commentaire"
3. Tapez: "@Collègue Qu'en penses-tu de cette jurisprudence?"
4. Sauvegardez

Collègue reçoit notification, peut répondre.

**Use case:** Avocat principal écrit mémoire, junior fait audio-revue = collaboration real-time.

### Étape 4: Audit Historique

1. Allez "Rapports" → "Audit"
2. Sélectionnez dossier
3. Voyez timeline:
   - Qui a changé quoi
   - Quand
   - Version précédente (restore disponible)

**Utilité:** Compliance, audit, tracking changements.

---

## 🎯 Semaine 4 - Go Production {#semaine4}

**Durée: 4-8h (testing final)**

### Étape 1: Full Workflow Test

Prenez 1 vrai dossier, faites-le complet:

```
Workflow Test
1. Créer client (Maria, Éthiopie)
2. Créer dossier (Demande asile)
3. Remplir Faits
4. Lancer IA analysis
5. Générer "Mémoire réponse"
6. Download DOCX → éditer Word
7. Set dossier "Prêt audience"
8. Créer audio/reminder dans Outlook
9. Marquer dossier "Résolu" après décision
```

**Check:** Chaque étape = smooth? Quoi manque?

### Étape 2: Générear Documents Réels

Testez génération pour chaque type:

- [ ] Mémoire en réponse
- [ ] Demande délai supplémentaire
- [ ] Lettre à préfecture
- [ ] Aide juridictionnelle

Download chaque doc → ouvrez Word → vérifiez format.

**Si problèmes:** Contactez support, on corriges ASAP.

### Étape 3: Testing Rapports

1. Allez "Rapports"
2. Générez "Dashboard personnel" (30 derniers jours)
3. Vérifiez chiffres (client count, dossier count, etc.)
4. Exportez PDF

**Check:** Stats font sense? Besoin modifications?

### Étape 4: Scaling Décision

Après 4 semaines, demandez-vous:

**Q1: Est-ce que MemoLib aide mon workflow?**
- OUI → Continue Plan Pro/Enterprise
- NON → Let us know, on améliore

**Q2: Combien de temps j'ai saved?**
- Estimez: (ancienne procédure temps - nouvelle temps) x dossiers/mois
- Partagez nombre avec nous (feedback)

**Q3: Besoin features additionnelles?**
- Slack integration?
- API custom?
- Multi-user avancé?
- → Email: feature-request@memolib.fr

---

## 🆘 Support & Escalade {#support}

### Niveaux de Support

**Gratuit (inclus tous plans):**
- 📧 Email support (response 24h)
- 📚 Base KB 200+ articles
- 💬 In-app help chats

**Pro (Plan Pro):**
- ☝️ Tout gratuit +
- 📞 Phone support Lun-Ven 9h-17h
- 🎓 Webinaires mensuels
- ⚡ Priority response (8h)

**Enterprise (Plan Enterprise):**
- ☝️ Tout Pro +
- 📞 Phone 24/7
- 🤝 Dedicated account manager
- 🔧 Custom integrations setup
- 📊 Quarterly business reviews

### Comment Contacter Support

| Besoin | Canal | Temps Réponse |
|--------|-------|---------------|
| Question rapide | In-app chat (?) button | 1-4h |
| Issue tech | Email support@memolib.fr | 8-24h |
| Urgent dépannage | Phone +33 (pro/enterprise) | Immédiat |
| Feature request | feature-request@memolib.fr | 24h |
| Billing issue | billing@memolib.fr | 4h |
| Confidentiality/Legal | legal@memolib.fr | 24h |

### Escalade Process

Si probème persiste:

1. **T+0:** Contactez support via preferred channel
2. **T+4h:** Support répond, diagnostic
3. **T+24h:** Si non-résolve, escalade à l'équipe tech
4. **T+48h:** Follow-up management call

**Enterprise SLA:** Response 1h, resolution 24h garanti

---

## 📚 Ressources Utiles

### Documentation
- 👉 https://docs.memolib.fr (si dispo)
- 📖 PDF "Guide Complet" (emailed)
- 🎓 Video tutorials (YouTube channel)

### Community
- 💬 Slack workspace (si setup)
- 🌐 Forum utilisateurs (soon!)
- 📧 user@memolib.fr (contact other users)

### Training & Webinars
- **Weekly:** Lundi 14h "MemoLib Tips & Tricks"
- **Monthly:** Jeudi 18h "Case Study Workflows"
- **Custom:** Demandez onboarding privée (gratuit Pro+)

---

## 🎉 Checklist Onboarding Complète

### Week 1 ✅

- [ ] Account créé + login réussi
- [ ] Profile rempli (photo, bio)
- [ ] 5+ clients importés
- [ ] 5+ dossiers créés
- [ ] 1 dossier complet avec IA analysis
- [ ] Collègues invités (if applicable)

### Week 2 ✅

- [ ] Workflow customisé (statuts)
- [ ] Notifications activées
- [ ] Intégrations Outlook/Google setup
- [ ] Templates personnalisés créés

### Week 3 ✅

- [ ] Équipe collaborant (if applicable)
- [ ] Dossiers partagés + commentaires
- [ ] Audit logs vérifiés
- [ ] 10+ dossiers actifs

### Week 4 ✅

- [ ] 1 full workflow test réussi
- [ ] Documents générés + testés
- [ ] Rapports vérifiés
- [ ] Décision: continue ou feedback?

---

## 💡 Pro Tips Before You Go

1. **Backup:** Export dossiers en PDF régulièrement (paranoia, mais utile)

2. **Keyboard shortcuts:** Apprenez:
   - Cmd/Ctrl+N = nouveau dossier
   - Cmd/Ctrl+/ = montre toutes shortcuts

3. **Mobile:** App disponible bientôt (Phase 8)
   - Pour maintenant: web responsive marche bien

4. **Password:** Utilisez gestionnaire (1Password, Bitwarden)
   - Authentification 2FA recommandée (Azure AD setup)

5. **Feedback:** Nous ADORONS feedback!
   - Feature request → feature-request@memolib.fr
   - Bug → bug@memolib.fr
   - General feedback → hello@memolib.fr

---

## 🆘 Je Suis Bloqué!

**Troubleshooting courant:**

### Q: "Je peux pas login"
- [ ] Vérifier email utilisé (case sensitive)
- [ ] Reset password: "Forgot password" link
- [ ] Vérifier 2FA (code email/phone)
- [ ] Contact support si toujours non

### Q: "Page dashboards pas loader"
- [ ] Rafraîchir (Cmd/Ctrl+R)
- [ ] Vider cache (Cmd/Ctrl+Shift+Delete)
- [ ] Essayer autre navigateur (Firefox vs Chrome)
- [ ] Vérifiez internet stable

### Q: "Dossier pas appearing après création"
- [ ] Rafraîchissez page
- [ ] Allez "Tous les dossiers" (pas filtre actif)
- [ ] Check que c'était pas créé collègue (permissions)

### Q: "IA analysis prend trop long"
- [ ] Normal = 10-30 sec (API OpenAI)
- [ ] Si >1 min: rafraîchissez, retry
- [ ] Contact support si persiste

---

## 🎊 Congratulations!

Vous êtes maintnant productif avec MemoLib!

**Prochaines étapes:**

1. **Utilizer chaque jour** (plus le temps, plus smooth)
2. **Partager feedback** (nous improve grâce à vous)
3. **Inviter autres avocats** (network grows, ecosystem value grows)
4. **Attend webinaires** (learn advanced features)

---

**Questions?** hello@memolib.fr
**Bug à reporter?** bug@memolib.fr
**Feature vous voulez?** feature-request@memolib.fr

**Bienvenue à bord! 🚀**

*MemoLib - Assistant Juridique CESEDA Intelligent*
*Hébergé en France 🇫🇷 | Confidentiel | Secure*
