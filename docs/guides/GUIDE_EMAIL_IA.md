# 🤖 Guide : Générer et Envoyer des Emails avec IA

## 🚀 Démarrage Rapide

### 1. Lancer l'application

```powershell
python app_minimal.py
```

### 2. Accéder au générateur IA

Ouvrez votre navigateur : **http://localhost:5000/generator**

---

## 📝 Utilisation Pas-à-Pas

### Méthode 1 : Génération puis Envoi

1. **Décrire votre besoin** en langage naturel :
   ```
   "Je veux demander un rendez-vous avec mon médecin pour la semaine prochaine"
   ```

2. **Choisir le ton** : Professionnel / Amical / Très formel

3. **Cliquer sur "Générer"** - L'IA crée l'email

4. **Relire** l'aperçu généré

5. **Entrer l'email du destinataire**

6. **Cliquer sur "Envoyer"**

### Méthode 2 : Génération et Envoi Direct

1. Décrire votre besoin
2. Entrer l'email du destinataire
3. Cliquer sur "Générer et Envoyer" ⚡

---

## 💡 Exemples de Prompts

### 🏛️ Démarches Administratives

```
Je veux demander un rendez-vous à la mairie pour renouveler ma carte d'identité
```

**Résultat IA** :
```
Objet: Demande de rendez-vous - Renouvellement CNI

Madame, Monsieur,

Je souhaite prendre rendez-vous pour le renouvellement de ma carte 
nationale d'identité.

Pourriez-vous me proposer un créneau la semaine prochaine ?

Je vous remercie par avance.

Cordialement,
[Votre nom]
```

### 🔊 Réclamations

```
Je souhaite me plaindre du bruit de mon voisin qui fait des travaux tous les soirs
```

**Résultat IA** :
```
Objet: Réclamation - Nuisances sonores

Madame, Monsieur,

Je me permets de vous contacter concernant des nuisances sonores 
répétées émanant de l'appartement voisin.

Des travaux bruyants ont lieu tous les soirs, perturbant mon repos.

Je vous serais reconnaissant(e) d'intervenir pour faire cesser 
ces désagréments.

Cordialement,
[Votre nom]
```

### 💰 Demandes Financières

```
Je veux demander une prolongation de délai pour payer mes impôts
```

### 📡 Résiliations

```
Je souhaite résilier mon abonnement internet suite à mon déménagement
```

---

## 🎯 API Disponibles

### 1. Générer un Email

**Endpoint** : `POST /api/generate-email`

```javascript
fetch('/api/generate-email', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        context: "Je veux demander un RDV",
        tone: "professionnel",
        master_password: "SESSION_STORED"
    })
})
```

**Réponse** :
```json
{
    "success": true,
    "subject": "Demande de rendez-vous",
    "body": "Madame, Monsieur,\n\n..."
}
```

### 2. Envoyer un Email

**Endpoint** : `POST /api/send-email`

```javascript
fetch('/api/send-email', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        to_email: "contact@exemple.fr",
        subject: "Demande de rendez-vous",
        body: "Madame, Monsieur...",
        master_password: "SESSION_STORED"
    })
})
```

### 3. Générer ET Envoyer (Tout-en-un)

**Endpoint** : `POST /api/generate-and-send`

```javascript
fetch('/api/generate-and-send', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        context: "Je veux demander un RDV",
        to_email: "contact@exemple.fr",
        tone: "professionnel",
        master_password: "SESSION_STORED"
    })
})
```

---

## ⚙️ Configuration Requise

### 1. Configurer Gmail/Outlook

Vous devez d'abord configurer vos credentials via l'API :

```javascript
// Sauvegarder Gmail
fetch('/api/save-gmail', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        email: "votre@gmail.com",
        app_password: "xxxx xxxx xxxx xxxx",
        master_password: "votre_mot_de_passe_maitre"
    })
})
```

### 2. Configurer OpenAI (pour IA)

```javascript
fetch('/api/save-openai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        api_key: "sk-...",
        org_id: "org-...",
        master_password: "votre_mot_de_passe_maitre"
    })
})
```

**Sans clé OpenAI** : L'application fonctionne quand même avec un mode fallback basique.

---

## 🔐 Sécurité

- ✅ Mot de passe maître **jamais stocké en clair**
- ✅ Credentials **chiffrés** avec Fernet + PBKDF2HMAC (100k iterations)
- ✅ Session sécurisée pour éviter de re-saisir le mot de passe
- ✅ Validation des emails
- ✅ Protection SMTP

---

## 📊 Serveurs SMTP Supportés

### Gmail
- Serveur : `smtp.gmail.com`
- Port : `465` (SSL)
- Nécessite : App Password

### Hotmail/Outlook
- Serveur : `smtp-mail.outlook.com`
- Port : `587` (TLS)
- Nécessite : App Password

---

## 🛠️ Fonctionnalités

### ✅ Génération IA
- Génère des emails professionnels
- Adapte le ton (professionnel, amical, formel)
- Comprend le contexte en français
- Fallback sans OpenAI

### ✅ Envoi d'Emails
- Support Gmail et Hotmail/Outlook
- Auto-détection du serveur SMTP
- Retry automatique
- Validation des destinataires

### ✅ Interface Utilisateur
- Design moderne et responsive
- Exemples de prompts
- Aperçu avant envoi
- Copie dans le presse-papier
- Loading states

---

## 🐛 Dépannage

### Erreur "Credentials non configurés"

**Solution** : Configurez d'abord Gmail/Outlook via `/api/save-gmail`

### Erreur "Clé API OpenAI non configurée"

**Solution 1** : Configurez OpenAI via `/api/save-openai`  
**Solution 2** : L'app fonctionne en mode basique sans IA

### Erreur d'authentification SMTP

**Gmail** : Créez un App Password sur https://myaccount.google.com/security  
**Outlook** : Créez un App Password sur https://account.microsoft.com/security

### Email non envoyé

- Vérifiez l'email du destinataire
- Vérifiez votre connexion internet
- Vérifiez que l'App Password est valide

---

## 🎨 Personnalisation

### Modifier les tons disponibles

Éditez `templates/generator.html` :

```html
<button class="tone-btn" data-tone="urgent">
    Urgent
</button>
```

### Ajouter des exemples

```html
<button class="example-btn" onclick="setExample('Votre texte')">
    🎯 Votre exemple
</button>
```

### Modifier le prompt IA

Éditez `app_minimal.py`, fonction `generate_email_with_ai()` :

```python
prompt = f"""Vos instructions personnalisées...
Contexte: {context}
Ton: {tone}
..."""
```

---

## 📈 Améliorations Futures

- [ ] Support de pièces jointes
- [ ] Templates d'emails pré-définis
- [ ] Historique des emails envoyés
- [ ] Analyse de sentiment
- [ ] Traduction automatique
- [ ] Synthèse vocale
- [ ] Mode brouillon

---

## 💬 Exemples d'Utilisation

### Cas 1 : Email simple

```python
import requests

response = requests.post('http://localhost:5000/api/generate-and-send', json={
    'context': 'Je veux annuler mon RDV de demain',
    'to_email': 'contact@exemple.fr',
    'tone': 'professionnel',
    'master_password': 'SESSION_STORED'
})

print(response.json())
```

### Cas 2 : Génération puis modification

```python
# 1. Générer
gen_response = requests.post('http://localhost:5000/api/generate-email', json={
    'context': 'Demande de congés',
    'tone': 'formel'
})
email = gen_response.json()

# 2. Modifier le body si besoin
email['body'] += "\n\nPS: Merci de me répondre rapidement."

# 3. Envoyer
send_response = requests.post('http://localhost:5000/api/send-email', json={
    'to_email': 'rh@entreprise.fr',
    'subject': email['subject'],
    'body': email['body']
})
```

---

**Application prête ! Accédez à http://localhost:5000/generator** 🎉
