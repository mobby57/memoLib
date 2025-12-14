# 🚀 Guide d'Utilisation - SecureVault

## Démarrage Rapide

### Option 1 : Avec Docker (Recommandé)

```powershell
# Démarrer l'application avec synchronisation automatique
.\START_DOCKER.bat

# OU directement
docker compose up --watch
```

**Avantages :**
- ✅ Environnement isolé et reproductible
- ✅ Synchronisation automatique du code
- ✅ Pas de configuration Python locale nécessaire
- ✅ Redis inclus pour les sessions

**Accès :** http://localhost:5000

---

### Option 2 : En Local (Sans Docker)

```powershell
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Lancer l'application
python app.py

# OU utiliser le script
.\START.bat
```

**Accès :** http://localhost:5000

---

## 📋 Configuration Initiale

### 1. Créer le fichier .env

```powershell
# Copier l'exemple
copy .env.example .env

# Éditer avec vos clés
notepad .env
```

Contenu du `.env` :
```env
SECRET_KEY=votre-cle-secrete-unique
OPENAI_API_KEY=sk-...votre-cle-openai
FLASK_ENV=development
FLASK_DEBUG=1
```

### 2. Configuration Gmail/Outlook

L'application utilise un **App Password** pour envoyer des emails :

#### Pour Gmail :
1. Aller sur https://myaccount.google.com/security
2. Activer la validation en 2 étapes
3. Créer un mot de passe d'application
4. Copier le mot de passe (16 caractères)

#### Pour Outlook/Hotmail :
1. Aller sur https://account.microsoft.com/security
2. Activer la validation en 2 étapes
3. Créer un mot de passe d'application
4. Copier le mot de passe

---

## 🎯 Fonctionnalités Principales

### 1. Inscription / Connexion

**Première utilisation :**
```
1. Ouvrir http://localhost:5000
2. Cliquer sur "S'inscrire"
3. Entrer votre email
4. Créer un mot de passe maître (min 8 caractères)
5. Sauvegarder votre App Password Gmail/Outlook
```

**Connexion suivante :**
```
1. Entrer votre mot de passe maître
2. ✅ Accès à toutes vos données chiffrées
```

---

### 2. Envoyer un Email Simple

**Interface Simple :** http://localhost:5000/simple

```
1. Destinataire : contact@exemple.fr
2. Sujet : Ma demande
3. Message : Votre texte
4. [Envoyer] ✉️
```

---

### 3. Génération IA d'Emails

**Interface Agent IA :** http://localhost:5000/agent

#### Méthode 1 : Texte
```
1. Écrire votre demande en langage naturel
   Exemple : "Je veux demander un rdv avec mon médecin"
2. Cliquer sur "Générer avec IA"
3. L'IA génère l'email professionnel
4. Réviser et envoyer
```

#### Méthode 2 : Vocal 🎤
```
1. Cliquer sur "Enregistrer"
2. Parler votre demande
3. L'IA transcrit + génère l'email
4. Réviser et envoyer
```

#### Méthode 3 : Document 📄
```
1. Upload un fichier (PDF, DOCX, TXT)
2. L'IA analyse et extrait les infos
3. Génère l'email correspondant
4. Envoyer
```

---

### 4. Envoi en Masse

**Pour envoyer à plusieurs destinataires :**

```powershell
# Lancer l'interface d'envoi en masse
python envoi_masse_gui.py
```

**Format CSV :**
```csv
nom,email
Jean Dupont,jean@exemple.fr
Marie Martin,marie@exemple.fr
```

**Avec variables :**
```
Sujet : Bonjour {nom}
Message : Cher {nom}, votre email est {email}...
```

---

### 5. Templates d'Emails

**Créer un template :**
```
1. Interface principale > "Templates"
2. Nom : Demande administrative
3. Sujet : Demande de {type}
4. Corps : Variables {nom}, {date}, etc.
5. Sauvegarder
```

**Utiliser un template :**
```
1. Sélectionner dans la liste
2. Remplir les variables
3. Envoyer
```

---

## 🔐 Sécurité

### Données Chiffrées

Toutes les données sensibles sont chiffrées avec :
- **Fernet** (cryptographie symétrique)
- **PBKDF2HMAC** (dérivation de clé, 100k itérations)
- **Master Password** (jamais stocké en clair)

### Fichiers de données

```
credentials.enc     → App Password chiffré
salt.bin           → Sel cryptographique (16 bytes)
metadata.json      → Métadonnées (non sensibles)
history.db         → Historique des emails (SQLite)
```

⚠️ **Ne jamais partager ces fichiers !**

### Backup

```powershell
# Exporter vos credentials
# Via l'interface : Menu > Exporter Backup
```

---

## 📊 Historique et Statistiques

**Voir l'historique :**
```
1. Interface > "Historique"
2. Filtrer par date, destinataire, statut
3. Exporter en CSV
```

**Statistiques disponibles :**
- 📧 Nombre d'emails envoyés
- ✅ Taux de succès
- 📅 Activité par période
- 👥 Destinataires fréquents

---

## 🛠️ Mode Développement (Docker Watch)

**Pour les développeurs :**

```powershell
# Démarrer avec watch
docker compose up --watch
```

**Workflow :**
```
1. Modifier app.py dans VSCode
2. Sauvegarder (Ctrl+S)
3. Docker synchronise automatiquement
4. Flask recharge le code
5. Tester immédiatement
```

**Modifier les dépendances :**
```
1. Éditer requirements.txt
2. Sauvegarder
3. Docker reconstruit automatiquement
```

---

## 🐛 Dépannage

### L'application ne démarre pas

```powershell
# Vérifier les dépendances
pip install -r requirements.txt

# Vérifier le port 5000
netstat -an | findstr 5000

# Tuer le processus si occupé
taskkill /F /IM python.exe
```

### Erreur "Module not found"

```powershell
# Réinstaller toutes les dépendances
pip install --upgrade -r requirements.txt
```

### Docker : "Port 5000 already in use"

```powershell
# Arrêter tous les conteneurs
docker compose down

# Libérer le port
taskkill /F /IM python.exe
```

### Mot de passe maître oublié

⚠️ **Impossible à récupérer** (chiffrement)

**Solution :**
```powershell
# Supprimer les credentials (perte de données)
del credentials.enc
del salt.bin
del metadata.json

# Créer un nouveau compte
```

---

## 📁 Structure des Fichiers

```
iaPostemanage/
├── app.py                      → Application Flask principale
├── crypto_utils.py             → Chiffrement des credentials
├── google_drive_utils.py       → Gestion Google Drive
├── envoi_masse_gui.py          → Interface envoi en masse
│
├── templates/                  → Templates d'emails
│   ├── demande_administrative.json
│   └── relance.json
│
├── scripts_personnalises/      → Scripts Python custom
│   ├── exemple_impots.py
│   └── exemple_plainte.py
│
├── data/                       → Données (ignoré par Git)
│   ├── credentials.enc
│   ├── salt.bin
│   └── history.db
│
├── Dockerfile                  → Configuration Docker
├── docker-compose.yml          → Orchestration
├── requirements.txt            → Dépendances Python
└── .env                        → Variables d'environnement
```

---

## 🎓 Cas d'Usage

### Exemple 1 : Demande Administrative

```
Input IA : "Je veux demander un rendez-vous à la mairie pour 
            renouveler ma carte d'identité"

IA génère :
Sujet : Demande de rendez-vous - Renouvellement CNI
Corps : Madame, Monsieur,
        Je souhaite prendre rendez-vous pour le renouvellement 
        de ma carte nationale d'identité...
```

### Exemple 2 : Réclamation

```
Input vocal : "Je veux me plaindre du bruit de mon voisin"

IA génère :
Sujet : Réclamation - Nuisances sonores
Corps : Madame, Monsieur,
        Je me permets de vous contacter concernant des nuisances 
        sonores répétées émanant de l'appartement voisin...
```

### Exemple 3 : Envoi en Masse

```
CSV : 10 contacts
Template : Invitation événement
Variables : {nom}, {date}, {lieu}
→ 10 emails personnalisés envoyés automatiquement
```

---

## 🔗 Liens Utiles

- **Documentation complète** : README_COMPLET.txt
- **Guide Docker** : DOCKER_GUIDE.md
- **Guide App Password** : GUIDE_APP_PASSWORD.md
- **API Reference** : http://localhost:5000/api/health

---

## 💡 Conseils

✅ **Utilisez Docker** pour un environnement propre  
✅ **Sauvegardez régulièrement** vos credentials  
✅ **Utilisez des templates** pour gagner du temps  
✅ **Activez le mode watch** en développement  
✅ **Testez avec un email perso** avant envoi en masse  

---

## 🆘 Support

**Problème avec :**
- Configuration : Voir GUIDE_APP_PASSWORD.md
- Docker : Voir DOCKER_GUIDE.md
- API OpenAI : Voir README_COMPLET.txt section IA
- Google Drive : Voir README_COMPLET.txt section 8

---

**Bon usage ! 🎉**
