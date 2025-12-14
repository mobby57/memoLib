# 🚀 Guide Utilisateur - SecureVault v2.2

## 📋 Prérequis

### 1. Compte Gmail
- Avoir un compte Gmail actif
- Activer la validation en 2 étapes
- Générer un App Password

### 2. Clé OpenAI (Optionnel)
- Pour la génération IA d'emails
- Compte OpenAI avec API key

## 🎯 Démarrage en 5 Minutes

### Étape 1: Lancer l'Application
```bash
cd C:\Users\moros\Desktop\iaPostemanage
python src\web\app.py
```

### Étape 2: Première Connexion
1. Ouvrir http://127.0.0.1:5000
2. Vous serez redirigé vers `/login`
3. **Créer votre mot de passe maître** (ex: "MonMotDePasse123")
4. Cliquer "Se connecter"

### Étape 3: Configuration Gmail

#### A. Obtenir App Password Gmail
1. Aller sur https://myaccount.google.com/security
2. Activer "Validation en 2 étapes"
3. Aller sur https://myaccount.google.com/apppasswords
4. Créer un mot de passe pour "SecureVault"
5. Copier le code (16 caractères)

#### B. Configurer dans l'App
1. Sur la page d'accueil, onglet "Gmail"
2. Entrer votre email Gmail
3. Coller l'App Password
4. **Entrer le MÊME mot de passe maître** que l'étape 2
5. Cliquer "Valider"

### Étape 4: Configuration OpenAI (Optionnel)
1. Onglet "OpenAI"
2. Entrer votre clé API OpenAI
3. Entrer le mot de passe maître
4. Cliquer "Valider"

### Étape 5: Utiliser l'Application

#### Composer un Email avec IA
1. Cliquer "Composer IA" dans le menu
2. Décrire votre besoin (ex: "Demande de congés")
3. Choisir le type et le ton
4. Cliquer "Générer avec IA"
5. Entrer le destinataire
6. Cliquer "Envoyer"

#### Envoi Simple
1. Cliquer "Envoyer" dans le menu
2. Remplir destinataire, objet, message
3. Cliquer "Envoyer"

#### Voir l'Historique
1. Cliquer "Historique" dans le menu
2. Voir tous les emails envoyés

## 🔧 Utilisation Quotidienne

### Workflow Normal
```
1. Ouvrir http://127.0.0.1:5000
2. Login (si session expirée)
3. Composer/Envoyer emails
4. Déconnexion (optionnel)
```

### Raccourcis Clavier
- `Ctrl + N` : Nouveau email
- `Ctrl + E` : Envoi rapide
- `Ctrl + H` : Historique
- `Ctrl + T` : Templates

### Session
- Durée: 1 heure
- Auto-déconnexion après inactivité
- Reconnexion simple avec mot de passe maître

## 📱 Fonctionnalités

### 1. Composer IA
- Génération automatique d'emails
- Plusieurs tons (professionnel, amical, formel)
- Types variés (demande, relance, remerciement)

### 2. Templates
- Créer des modèles réutilisables
- Catégoriser par type
- Utilisation rapide

### 3. Historique
- Voir tous les emails envoyés
- Filtrer par date
- Statut d'envoi

### 4. Agent Assistant
- Actions rapides
- Raccourcis clavier
- Utilitaires système

## 🔐 Sécurité

### Mot de Passe Maître
- **IMPORTANT**: Ne jamais l'oublier
- Utilisé pour chiffrer vos credentials
- Aucune récupération possible

### Données Stockées
- Credentials Gmail: Chiffrés AES-256
- Clé OpenAI: Chiffrée AES-256
- Historique emails: Base de données locale

### Bonnes Pratiques
- Utiliser un mot de passe fort (8+ caractères)
- Ne pas partager votre mot de passe maître
- Se déconnecter sur ordinateur partagé

## ❓ Problèmes Courants

### "Session expirée"
**Solution**: Reconnectez-vous sur `/login`

### "Gmail non configuré"
**Solution**: Configurez Gmail dans l'onglet Configuration

### "Erreur 401"
**Solution**: 
1. Déconnexion
2. Reconnexion
3. Vérifier que le mot de passe maître est correct

### "Erreur envoi email"
**Causes possibles**:
- App Password Gmail incorrect
- Email destinataire invalide
- Connexion internet coupée

## 🎓 Exemples d'Utilisation

### Exemple 1: Email Professionnel
```
1. Aller sur /composer
2. Contexte: "Demande de réunion avec le client X"
3. Type: Demande
4. Ton: Professionnel
5. Générer → Envoyer
```

### Exemple 2: Relance Client
```
1. Aller sur /templates
2. Créer template "Relance Facture"
3. Utiliser le template
4. Personnaliser
5. Envoyer
```

### Exemple 3: Envoi Rapide
```
1. Ctrl + E
2. Entrer destinataire dans popup
3. Entrer objet
4. Entrer message
5. Valider
```

## 📊 Statistiques

### Voir vos Stats
1. Aller sur `/admin`
2. Voir:
   - Nombre d'emails envoyés
   - Générations IA utilisées
   - Taux de succès

## 🔄 Maintenance

### Vider le Cache
1. Aller sur `/agent`
2. Cliquer "Vider Cache"

### Export Données
1. Aller sur `/agent`
2. Cliquer "Export Données"

### Logs
- Fichier: `logs/app.log`
- Voir les erreurs et activités

## 📞 Support

### En cas de problème
1. Vérifier les logs: `logs/app.log`
2. Redémarrer l'application
3. Vérifier la configuration Gmail

## 🎯 Résumé Rapide

**Pour commencer:**
1. `python src\web\app.py`
2. http://127.0.0.1:5000/login
3. Créer mot de passe maître
4. Configurer Gmail
5. Utiliser!

**Mot de passe maître = Clé de tout**
- Ne jamais l'oublier
- Utilisé partout
- Aucune récupération

**Session = 1 heure**
- Reconnexion simple
- Données sécurisées

**Prêt à utiliser! 🚀**
