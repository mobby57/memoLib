# 📧 Configuration Gmail API pour Email Monitor

Ce guide vous aide à configurer Gmail API pour un monitoring sécurisé et sans vulnérabilités.

## ✅ Avantages de Gmail API

- ✅ **0 vulnérabilités** (vs 3-4 avec IMAP)
- ✅ Plus rapide et plus fiable
- ✅ Meilleure gestion des pièces jointes
- ✅ Support officiel de Google
- ✅ Fonctionnalités avancées (labels, filtres, etc.)

## 🚀 Configuration (5 minutes)

### Étape 1 : Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquer sur **"Sélectionner un projet"** → **"Nouveau projet"**
3. Nom du projet : `iaposte-email-monitor` (ou autre)
4. Cliquer sur **"Créer"**

### Étape 2 : Activer Gmail API

1. Dans le menu, aller sur **"API et services"** → **"Bibliothèque"**
2. Rechercher **"Gmail API"**
3. Cliquer sur **"Gmail API"** puis **"Activer"**

### Étape 3 : Créer les credentials OAuth 2.0

1. Aller dans **"API et services"** → **"Identifiants"**
2. Cliquer sur **"+ CRÉER DES IDENTIFIANTS"** → **"ID client OAuth"**
3. Si demandé, configurer l'écran de consentement :
   - Type d'utilisateur : **Externe**
   - Nom de l'application : `Email Monitor`
   - E-mail d'assistance : votre email Gmail
   - Cliquer sur **"Enregistrer et continuer"**
   
4. **Portées (IMPORTANT)** :
   - Cliquer sur **"Ajouter ou supprimer des portées"**
   - Rechercher et cocher : `https://www.googleapis.com/auth/gmail.readonly`
   - Cliquer sur **"Mettre à jour"**
   - Cliquer sur **"Enregistrer et continuer"**
   
5. **Utilisateurs test (CRITIQUE)** :
   - Cliquer sur **"+ ADD USERS"**
   - Entrer VOTRE adresse email Gmail (celle que vous allez surveiller)
   - Cliquer sur **"Ajouter"**
   - Cliquer sur **"Enregistrer et continuer"**
   
6. Cliquer sur **"Retour au tableau de bord"**

7. Retourner dans **"Identifiants"** → **"+ CRÉER DES IDENTIFIANTS"** → **"ID client OAuth"**
8. Type d'application : **Application de bureau**
9. Nom : `Email Monitor Desktop`
10. Cliquer sur **"Créer"**

### Étape 4 : Télécharger le fichier JSON

1. Dans la liste des identifiants OAuth 2.0, cliquer sur l'icône **télécharger** (↓)
2. Le fichier téléchargé s'appelle `client_secret_xxx.json`
3. **Renommer** ce fichier en `credentials.json`
4. **Déplacer** `credentials.json` à la racine du projet iaPostemanage

```
iaPostemanage/
├── credentials.json  ← ICI
├── package.json
├── scripts/
│   └── email-monitor.ts
└── ...
```

### Étape 5 : Première exécution

```bash
npm run email:monitor
```

1. Une fenêtre de navigateur va s'ouvrir
2. Sélectionnez votre compte Gmail
3. Cliquez sur **"Continuer"** (ignorer l'avertissement "Application non vérifiée")
4. Cliquez sur **"Autoriser"**
5. Le fichier `token.json` sera créé automatiquement

**Important** : Les prochaines exécutions ne nécessiteront plus d'authentification !

## 🔒 Sécurité

### Fichiers à NE PAS committer sur Git

Ajoutez dans `.gitignore` :

```
credentials.json
token.json
```

Ces fichiers contiennent des informations sensibles et sont déjà ignorés.

### Révoquer l'accès

Si besoin, vous pouvez révoquer l'accès ici :
https://myaccount.google.com/permissions

## 📊 Utilisation

### Démarrer le monitoring

```bash
npm run email:monitor
```

### Ce que fait le script

- ✅ Vérifie les emails non lus toutes les 30 secondes
- ✅ Affiche les détails de chaque email (expéditeur, sujet, pièces jointes)
- ✅ Classifie automatiquement les emails (La Poste, urgent, etc.)
- ✅ Sauvegarde les métadonnées dans `logs/emails/`

### Arrêter le monitoring

Appuyez sur `Ctrl+C`

## 🆘 Dépannage

### Erreur "Login Required" après authentification

**C'est le problème le plus fréquent !** Le token ne contient pas les permissions Gmail.

**Solution complète :**

1. **Supprimer les fichiers existants :**
   ```powershell
   Remove-Item token.json, credentials.json
   ```

2. **Sur [Google Cloud Console](https://console.cloud.google.com/) :**
   - Menu → **"API et services"** → **"Écran de consentement OAuth"**
   - Cliquez sur **"MODIFIER L'APPLICATION"**
   - Allez à l'étape **"Portées"** (2/4)
   - Cliquez sur **"AJOUTER OU SUPPRIMER DES PORTÉES"**
   - Dans la recherche, tapez `gmail`
   - **COCHEZ** : `https://www.googleapis.com/auth/gmail.readonly`
   - Cliquez sur **"METTRE À JOUR"** (en bas)
   - **"ENREGISTRER ET CONTINUER"** → **"ENREGISTRER ET CONTINUER"**
   - Vérifiez que votre email est dans **"Utilisateurs test"**

3. **Créer de nouveaux credentials :**
   - Menu → **"Identifiants"**
   - Supprimez l'ancien ID client OAuth (corbeille)
   - **"+ CRÉER DES IDENTIFIANTS"** → **"ID client OAuth"**
   - Type : **"Application de bureau"**
   - Nom : `Email Monitor Desktop`
   - **"CRÉER"** → **Télécharger le JSON**
   - Renommer en `credentials.json` et placer à la racine du projet

4. **Relancer :**
   ```powershell
   npm run email:monitor
   ```

**Important :** Cette fois, lors de l'autorisation, vous verrez explicitement la permission "Afficher vos e-mails et paramètres". Si vous ne voyez pas cette permission, recommencez l'étape 2.

### Erreur 403: access_denied

**C'est l'erreur la plus courante !** Elle signifie que vous n'êtes pas autorisé à utiliser l'application.

**Solution :**
1. Retournez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans **"API et services"** → **"Écran de consentement OAuth"**
3. Vérifiez que vous êtes bien dans la section **"Utilisateurs test"**
4. **Ajoutez votre adresse email Gmail** (celle que vous voulez surveiller)
5. Cliquez sur **"Enregistrer"**
6. Supprimez le fichier `token.json` s'il existe
7. Relancez `npm run email:monitor`

**Note :** L'application est en mode "Test", donc SEULS les utilisateurs test listés peuvent se connecter.

### Erreur "credentials.json not found"

→ Vérifiez que `credentials.json` est bien à la racine du projet (pas `credentials.json.json`)

### Erreur "Access blocked: This app's request is invalid"

→ Vérifiez que vous avez bien activé Gmail API dans Google Cloud Console

### Erreur "redirect_uri_mismatch"

→ Dans Google Cloud Console, vérifiez que le type d'application est "Application de bureau"

### Le navigateur ne s'ouvre pas

→ Copiez l'URL affichée dans le terminal et ouvrez-la manuellement

## 📝 Prochaines fonctionnalités possibles

- [ ] Envoi d'emails de réponse
- [ ] Gestion des labels Gmail
- [ ] Webhook pour notifications en temps réel
- [ ] Intégration avec l'IA pour réponses automatiques
- [ ] Support Outlook/Office 365 API

## 📚 Ressources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Node.js Quickstart](https://developers.google.com/gmail/api/quickstart/nodejs)
- [API Reference](https://developers.google.com/gmail/api/reference/rest)
