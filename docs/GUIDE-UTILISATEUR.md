# 📖 MemoLib — Guide de démarrage rapide

> Pour les avocats et collaborateurs. Temps de lecture : 5 minutes.

---

## 🚀 Première connexion

1. Rendez-vous sur **[votre-cabinet].memolib.fr**
2. Connectez-vous avec l'email et mot de passe fournis par votre administrateur
3. L'assistant d'onboarding vous guide pas-à-pas

---

## 📧 Analyser un email client

C'est le cœur de MemoLib : **transformez un email en dossier structuré en quelques secondes**.

### Comment faire :

1. Allez dans **Emails** (menu latéral)
2. Cliquez sur un email reçu
3. Cliquez sur **"Analyser avec l'IA"**

L'IA détecte automatiquement :
- 👤 **Le client** (nom, email, téléphone)
- ⚖️ **Le type de dossier** (OQTF, titre de séjour, asile, naturalisation...)
- 🚨 **L'urgence** (critique, haute, normale, basse)
- ⏰ **Les délais** (48h pour OQTF, 2 mois pour recours...)

### Créer le dossier en 1 clic

Après l'analyse, cliquez sur **"Créer le dossier"**. MemoLib :
- Crée le dossier avec un numéro automatique (D-2026-0001)
- Associe le client (ou le crée s'il est nouveau)
- Calcule les échéances légales
- Lance les alertes J-7, J-3, J-1

---

## 📁 Gérer vos dossiers

### Tableau de bord

Le dashboard affiche en un coup d'œil :
- Nombre de dossiers en cours
- Échéances critiques (code couleur rouge/orange/vert)
- Dernière activité

### Fiche dossier

Chaque dossier contient :
- **Timeline** — historique complet (emails, documents, échéances)
- **Documents** — pièces uploadées avec scan antivirus automatique
- **Délais légaux** — calculés automatiquement selon le type de procédure
- **Client** — fiche complète du client

### Statuts d'un dossier

| Statut | Signification |
|--------|--------------|
| 📝 En cours | Dossier actif, en instruction |
| ⏳ En attente | Attente de pièces ou de décision |
| ✅ Clôturé | Dossier terminé |
| 🔴 Urgent | Échéance < 48h |

---

## 📄 Générer un document juridique

1. Ouvrez un dossier
2. Cliquez sur **"Générer un document"**
3. Choisissez le template :
   - Accusé de réception
   - Mise en demeure
   - Recours gracieux
   - Recours contentieux
   - Convocation
   - Attestation
4. Les variables (nom client, date, référence) sont **auto-remplies**
5. Relisez, modifiez si besoin, puis **téléchargez**

---

## 🔍 Rechercher de la jurisprudence

1. Allez dans **Jurisprudence** (ou tapez `/` pour la recherche rapide)
2. Tapez votre recherche : "OQTF annulation vie privée familiale"
3. MemoLib interroge Légifrance et affiche les décisions pertinentes

---

## ⏰ Comprendre les alertes délais

MemoLib surveille **automatiquement** les échéances de chaque dossier :

| Alerte | Quand |
|--------|-------|
| 🟡 J-7 | 7 jours avant l'échéance |
| 🟠 J-3 | 3 jours avant |
| 🔴 J-1 | Demain ! Action immédiate requise |

Les alertes apparaissent :
- Sur votre **dashboard**
- Dans le **centre de notifications** (🔔)
- Par **email** (si configuré)

### Délais par type de procédure

| Procédure | Délai de recours |
|-----------|-----------------|
| OQTF sans délai | **48 heures** |
| OQTF avec délai | 30 jours |
| Refus titre séjour | 2 mois |
| Rejet asile (CNDA) | 1 mois |
| Naturalisation | 18 mois |
| Dublin | 15 jours / 2 mois |

---

## 👥 Gérer vos clients

### Créer un client

1. **Clients** → **Nouveau client**
2. Remplissez : nom, prénom, email, téléphone
3. Optionnel : date de naissance, nationalité, adresse

### Depuis un email

Si l'IA détecte un nouveau client dans un email, il est automatiquement proposé à la création lors du "Créer dossier en 1 clic".

---

## 🔐 Sécurité & Confidentialité

- 🔒 Vos données sont **chiffrées** (AES-256)
- 🇫🇷 Hébergement en **France** (Paris)
- 📋 Chaque action est **tracée** (audit trail RGPD)
- 🛡️ Antivirus sur chaque fichier uploadé
- 🔑 Authentification sécurisée (mot de passe fort + option 2FA)

---

## ❓ Besoin d'aide ?

- 📧 Support : support@memolib.fr
- 🐛 Signaler un bug : via le bouton "Feedback" en bas à droite
- 📚 Documentation complète : disponible dans `/docs`

---

## ⌨️ Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `/` ou `Ctrl+K` | Recherche rapide |
| `Ctrl+N` | Nouveau dossier |
| `Escape` | Fermer le panneau |

---

*MemoLib v1.0-beta — © 2026*
