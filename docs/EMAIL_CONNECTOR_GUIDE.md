# 📧 EMAIL CONNECTOR - GUIDE COMPLET

**Date** : 28 Décembre 2025  
**Statut** : ✅ **OPÉRATIONNEL**  
**Version** : 1.0.0

---

## 🎯 OBJECTIF

Connecteur email IMAP/SMTP permettant de :
- ✅ Récupérer automatiquement les emails entrants
- ✅ Parser et extraire les informations
- ✅ Créer des workspaces depuis les emails
- ✅ Générer des réponses intelligentes via IA
- ✅ Envoyer les réponses automatiquement

---

## 📁 FICHIERS CRÉÉS

### 1. Service Email Connector
**Fichier** : `src/backend/services/email_connector.py`

**Contenu** :
- `EmailMessage` : Dataclass pour représenter un email
- `EmailConnector` : Classe principale IMAP/SMTP
  - `connect_imap()` : Connexion IMAP sécurisée
  - `fetch_new_emails()` : Récupération emails non lus
  - `send_email()` : Envoi email SMTP
  - `test_connection()` : Test IMAP + SMTP
  - Parsing email (headers, body, HTML, pièces jointes)

### 2. Service Polling
**Fichier** : `src/backend/services/email_poller.py`

**Contenu** :
- `EmailPoller` : Service de polling automatique
  - Boucle infinie toutes les 60s
  - Intégration MVP Orchestrator
  - Création workspace par email
  - Envoi réponse automatique

### 3. Tests
**Fichier** : `tests/integration/test_email_integration.py`

**Tests** :
- Initialisation connector
- Connexion IMAP/SMTP
- Parsing emails
- Conversion HTML → texte
- Dataclass EmailMessage

### 4. Script Démarrage
**Fichier** : `scripts/start_email_poller.py`

**Usage** :
```bash
python scripts/start_email_poller.py
```

---

## ⚙️ CONFIGURATION

### 1. Variables d'environnement (.env)

```env
# SMTP Configuration (Envoi)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_USE_TLS=true
SMTP_FROM_NAME=IA Poste Manager

# IMAP Configuration (Réception)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USERNAME=your-email@gmail.com
IMAP_PASSWORD=your-app-password-here
IMAP_USE_SSL=true
IMAP_POLL_INTERVAL=60
IMAP_FOLDER=INBOX
```

### 2. Obtenir un App Password Gmail

#### Étape 1 : Activer la validation en 2 étapes
1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en 2 étapes"

#### Étape 2 : Générer un App Password
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Autre (nom personnalisé)"
3. Entrez "IA Poste Manager"
4. Cliquez "Générer"
5. Copiez le mot de passe de 16 caractères
6. Utilisez-le dans `IMAP_PASSWORD` et `SMTP_PASSWORD`

---

## 🚀 UTILISATION

### 1. Test du Connector

```bash
# Test direct du connector
python src/backend/services/email_connector.py
```

**Résultat attendu** :
```
============================================================
🧪 TEST EMAIL CONNECTOR
============================================================

   IMAP: ✅
   SMTP: ✅

📬 Test récupération emails...
   3 nouveaux emails

   Email 1:
   De: client@example.com
   Sujet: Demande de renseignement
   Corps: Bonjour, je voudrais savoir...

============================================================
✅ Tests terminés
============================================================
```

### 2. Lancer le Poller

```bash
# Démarrer le polling automatique
python scripts/start_email_poller.py
```

**Workflow** :
1. Connexion IMAP établie
2. Polling toutes les 60s
3. Pour chaque nouvel email :
   - Création workspace
   - Analyse IA
   - Génération réponse
   - Envoi réponse automatique

### 3. Tests Automatisés

```bash
# Lancer les tests d'intégration
pytest tests/integration/test_email_integration.py -v
```

---

## 📊 FONCTIONNALITÉS

### 1. Récupération Emails (IMAP)

```python
from src.backend.services.email_connector import EmailConnector

connector = EmailConnector()

# Récupérer nouveaux emails
emails = connector.fetch_new_emails(
    folder='INBOX',
    mark_as_read=False  # Ne pas marquer comme lu
)

for email in emails:
    print(f"De: {email.from_address}")
    print(f"Sujet: {email.subject}")
    print(f"Corps: {email.body}")
```

### 2. Envoi Email (SMTP)

```python
# Envoyer une réponse
success = connector.send_email(
    to='client@example.com',
    subject='Re: Demande de renseignement',
    body='Voici la réponse à votre demande...',
    html=False
)

if success:
    print("✅ Email envoyé")
```

### 3. Threading Email (Réponses)

```python
# Répondre en conservant le thread
success = connector.send_email(
    to=original_email.from_address,
    subject=f"Re: {original_email.subject}",
    body=response_text,
    in_reply_to=original_email.message_id,  # Threading
    references=original_email.references    # Références
)
```

### 4. Polling Automatique

```python
from src.backend.services.email_poller import EmailPoller
import asyncio

# Créer poller (60s intervalle)
poller = EmailPoller(interval=60)

# Démarrer
await poller.start()
```

---

## 🔍 PARSING EMAIL

### Informations extraites

```python
@dataclass
class EmailMessage:
    message_id: str        # ID unique
    from_address: str      # Expéditeur
    to_address: str        # Destinataire
    subject: str           # Sujet
    body: str              # Corps texte
    html_body: str         # Corps HTML (optionnel)
    date: str              # Date
    attachments: List[str] # Pièces jointes
    in_reply_to: str       # Thread parent
    references: str        # Références thread
```

### Gestion multipart

- ✅ Texte brut (text/plain)
- ✅ HTML (text/html)
- ✅ Pièces jointes
- ✅ Conversion HTML → texte si nécessaire

### Encodage

- ✅ Décodage headers (UTF-8, ISO-8859-1, etc.)
- ✅ Gestion caractères spéciaux
- ✅ Entités HTML (&nbsp;, &amp;, etc.)

---

## 🔐 SÉCURITÉ

### 1. App Passwords

✅ **Utilisez App Passwords Gmail**, pas le mot de passe principal
- Plus sécurisé
- Révocable à tout moment
- Spécifique à l'application

### 2. Variables d'environnement

✅ **Ne jamais commit .env**
- Ajouté à .gitignore
- Utilisez .env.example pour template

### 3. Connexions sécurisées

✅ **SSL/TLS activé**
- IMAP: SSL port 993
- SMTP: TLS port 587

---

## 🐛 TROUBLESHOOTING

### Erreur "IMAP connection failed"

**Causes** :
1. App Password incorrect
2. Validation 2 étapes non activée
3. Accès IMAP désactivé

**Solutions** :
```bash
# 1. Vérifier credentials
echo $IMAP_USERNAME
echo $IMAP_PASSWORD

# 2. Vérifier paramètres Gmail
# https://mail.google.com/mail/u/0/#settings/fwdandpop
# Activer "IMAP access"

# 3. Tester connexion
python src/backend/services/email_connector.py
```

### Erreur "SMTP authentication failed"

**Causes** :
1. App Password incorrect
2. Accès SMTP bloqué

**Solutions** :
```bash
# Régénérer App Password
# https://myaccount.google.com/apppasswords

# Vérifier SMTP settings
echo $SMTP_HOST
echo $SMTP_PORT
echo $SMTP_USE_TLS
```

### Aucun email récupéré

**Causes** :
1. Pas de nouveaux emails
2. Mauvais dossier (folder)

**Solutions** :
```python
# Lister dossiers IMAP
mail = connector.connect_imap()
status, folders = mail.list()
for folder in folders:
    print(folder)

# Chercher dans SPAM
emails = connector.fetch_new_emails(folder='[Gmail]/Spam')
```

---

## 📈 PERFORMANCE

### Recommandations

**Intervalle polling** :
- Développement : 60s
- Production : 30-120s selon volume

**Limites Gmail** :
- 2,500 emails/jour max
- 500 destinataires/email max

**Optimisations** :
- Marquer emails comme lus après traitement
- Filtrer par dossier
- Gérer pièces jointes grandes tailles

---

## 🧪 TESTS

### Tests unitaires

```bash
# Tous les tests
pytest tests/integration/test_email_integration.py -v

# Tests spécifiques
pytest tests/integration/test_email_integration.py::TestEmailConnector -v

# Avec coverage
pytest tests/integration/test_email_integration.py --cov
```

### Tests manuels

```bash
# 1. Test connexions
python -c "from src.backend.services.email_connector import EmailConnector; c = EmailConnector(); print(c.test_connection())"

# 2. Test fetch emails
python -c "from src.backend.services.email_connector import EmailConnector; c = EmailConnector(); emails = c.fetch_new_emails(); print(f'{len(emails)} emails')"

# 3. Test send email (ATTENTION: envoie réellement)
# python -c "from src.backend.services.email_connector import EmailConnector; c = EmailConnector(); c.send_email('test@example.com', 'Test', 'Test body')"
```

---

## 🚀 PROCHAINES ÉTAPES

### Améliorations futures

- [ ] Support Outlook/Office 365
- [ ] Gestion pièces jointes (téléchargement)
- [ ] Filtres emails (expéditeurs autorisés)
- [ ] Templates réponses HTML
- [ ] Signature email automatique
- [ ] Retry logic (envoi failed)
- [ ] Queue emails (traitement asynchrone)
- [ ] Métriques (emails traités, temps réponse)
- [ ] Webhooks notifications
- [ ] Multi-comptes email

---

## 📞 SUPPORT

### Logs

```bash
# Afficher logs en temps réel
tail -f data/logs/app.log | grep EMAIL

# Derniers 100 emails traités
grep "Email traité" data/logs/app.log | tail -100
```

### Debug

```python
# Activer logging détaillé
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

**Créé le** : 28 Décembre 2025  
**Status** : ✅ Production Ready  
**Next** : PostgreSQL Migration (US-006)

---

# ✅ EMAIL CONNECTOR : MISSION ACCOMPLIE ! 📧
