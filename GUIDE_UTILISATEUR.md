# Guide Configuration MemoLib - Monitoring Email

## Pour un nouvel utilisateur

### Étape 1: Créer un mot de passe d'application Gmail
1. Allez sur https://myaccount.google.com/apppasswords
2. Connectez-vous avec votre compte Gmail
3. Créez un nouveau mot de passe pour "MemoLib"
4. Copiez le mot de passe (16 caractères, exemple: `abcdéfghijklmnop`)

### Étape 2: Configurer MemoLib
1. Ouvrez le fichier `appsettings.json`
2. Modifiez la section `EmailMonitor`:
```json
"EmailMonitor": {
  "Enabled": true,
  "Username": "VOTRE_EMAIL@gmail.com",
  "Password": "votre_mot_de_passe_app_sans_espaces"
}
```

### Étape 3: Créer votre compte
1. Démarrez l'API: `dotnet run`
2. Ouvrez http://localhost:5078/demo.html
3. Dans l'onglet "🔐 Authentification":
   - Email: VOTRE_EMAIL@gmail.com
   - Mot de passe: SecurePass123! (ou votre choix)
   - Nom: Votre Nom
4. Cliquez "S'inscrire"
5. Cliquez "Se connecter"

### Étape 4: Vérifier
- En haut de la page, vous verrez: **👤 VOTRE_EMAIL@gmail.com**
- Envoyez-vous un email de test
- Dans 60 secondes max, il apparaîtra dans l'onglet "📁 Gestion Dossiers"

## Configuration actuelle
- Email monitoré: **sarraboudjellal57@gmail.com**
- Compte connecté visible en haut de demo.html
- Monitoring: Actif (vérifie toutes les 60 secondes)

## Bloquer les spams
Les emails de ces expéditeurs sont automatiquement ignorés:
- noreply@, no-reply@
- newsletter@, notifications@
- marketing@, promo@
- spam@, unsubscribe@

Pour ajouter d'autres filtres, modifiez `"Blacklist"` dans appsettings.json
