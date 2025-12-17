# 🚀 GUIDE D'UTILISATION - SCRIPT PARCOURS UTILISATEUR

## 📋 Vue d'Ensemble

Le script `PARCOURS_UTILISATEUR_EMAIL.ps1` automatise **tout le parcours utilisateur** pour le provisioning d'emails cloud. Il couvre les 6 étapes principales de l'expérience utilisateur.

---

## 🎯 Modes d'Exécution

### 1️⃣ Mode INTERACTIF (Recommandé pour débuter)

**Lancement :**
```batch
.\PARCOURS_UTILISATEUR.bat
# Choisir option 1
```

**Ou directement :**
```powershell
.\PARCOURS_UTILISATEUR_EMAIL.ps1
```

**Ce que fait le script :**
- ✅ Vous guide étape par étape
- ✅ Demande chaque information (username, provider, etc.)
- ✅ Affiche des explications détaillées
- ✅ Attend votre validation entre chaque étape
- ✅ Propose des valeurs par défaut

**Exemple d'interaction :**
```
[1/6] Verification de la disponibilite de l'email
Entrez le nom d'utilisateur desire (ex: contact, support, info): contact

  ✓ Verification reussie
    Email demande: contact@iapostemanager.com
    Disponible: True

Voulez-vous creer ce compte maintenant? (O/n): o
Provider a utiliser (sendgrid/aws/microsoft/google) [sendgrid]: sendgrid
Nom d'affichage [laisser vide pour auto]: Support Client
Description [optionnel]: Compte principal pour le support

[2/6] Creation du compte email
  ✓ Compte cree avec succes!
    Email: contact@iapostemanager.com
    Status: active
    ID: 12345
```

---

### 2️⃣ Mode AUTOMATIQUE (Test rapide)

**Lancement avec username prédéfini :**
```powershell
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "contact" -Provider "sendgrid"
```

**Via le batch :**
```batch
.\PARCOURS_UTILISATEUR.bat
# Choisir option 2 ou 3
```

**Ce que fait le script :**
- ⚡ Exécution complète automatique
- ⚡ Aucune interaction requise
- ⚡ Teste tous les endpoints
- ⚡ Affiche un résumé final

**Exemples :**
```powershell
# Username "support" avec AWS SES
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "support" -Provider "aws"

# Username "info" avec Microsoft 365
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "info" -Provider "microsoft"

# Username "contact" avec Google Workspace
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "contact" -Provider "google"
```

---

### 3️⃣ Mode VALIDATION UNIQUEMENT

**Lancement :**
```batch
.\PARCOURS_UTILISATEUR.bat
# Choisir option 4
```

**Ce que fait le script :**
- 🔍 Vérifie le serveur (health check)
- 🔍 Teste l'endpoint check-availability
- 🔍 Teste l'endpoint my-accounts
- 🔍 Affiche le résultat (3/3 tests)

**Sortie attendue :**
```
[TEST 1/3] Health check...
  ✓ OK

[TEST 2/3] Check availability...
  ✓ OK

[TEST 3/3] List accounts...
  ✓ OK

========================================
  RESULTAT: 3/3 tests reussis
========================================
```

---

## 📊 Les 6 Étapes du Parcours

### Étape 1 : Vérification de Disponibilité
```
[1/6] Verification de la disponibilite de l'email

  ✓ Verification reussie
    Email demande: admin@iapostemanager.com
    Disponible: True
```

**Endpoint testé :** `POST /api/email/check-availability`

---

### Étape 2 : Création du Compte
```
[2/6] Creation du compte email
    Configuration:
      Username: admin
      Provider: sendgrid
      Nom d'affichage: Admin

  ✓ Compte cree avec succes!
    Email: admin@iapostemanager.com
    Status: active
    ID: abc123
```

**Endpoint testé :** `POST /api/email/create`

---

### Étape 3 : Liste des Comptes
```
[3/6] Liste de vos comptes emails

  ✓ Comptes recuperes
    Total: 2

    Vos comptes:
      --------------------------------------------------
        Email: contact@iapostemanager.com
        Provider: sendgrid
        Status: active
        Cree le: 2025-12-17 14:30:00
      --------------------------------------------------
```

**Endpoint testé :** `GET /api/email/my-accounts`

---

### Étape 4 : Envoi d'Email Test (Optionnel)
```
[4/6] Envoi d'un email de test
    De: contact@iapostemanager.com
    A: test@example.com
    Sujet: Test depuis iaPostemanage

  ✓ Email envoye avec succes!
    Message ID: msg_abc123xyz
```

**Endpoint testé :** `POST /api/email/send`

---

### Étape 5 : Statistiques
```
[5/6] Statistiques d'utilisation

  ✓ Statistiques recuperees

    Vos statistiques:
      Total comptes: 3
      Comptes actifs: 3
      Emails envoyes: 12
      Emails recus: 5

    Par provider:
      sendgrid: 2
      aws: 1
```

**Endpoint testé :** `GET /api/email/stats`

---

### Étape 6 : Validation Finale
```
[6/6] Validation complete du systeme

    Test 1: Health check...
  ✓ Health check OK

    Test 2: Endpoint check-availability...
  ✓ Endpoint check-availability OK

    Test 3: Endpoint my-accounts...
  ✓ Endpoint my-accounts OK

    Test 4: Caracteres speciaux...
  ✓ Support caracteres speciaux OK

    --------------------------------------------------
    RESULTAT: 4/4 tests reussis
    --------------------------------------------------
```

**Validation complète du système**

---

## ⚙️ Options Avancées

### Paramètres du script PowerShell

```powershell
# Tous les paramètres disponibles
.\PARCOURS_UTILISATEUR_EMAIL.ps1 `
    -Username "contact" `
    -Provider "sendgrid" `
    -SkipServerCheck `
    -Verbose
```

**Paramètres :**
- `-Username` : Nom d'utilisateur pour le test (ex: "contact")
- `-Provider` : Provider à utiliser (sendgrid/aws/microsoft/google)
- `-SkipServerCheck` : Sauter la vérification initiale du serveur
- `-Verbose` : Affichage détaillé (mode debug)

---

## 🎨 Personnalisation

### Modifier les couleurs
Éditez le script et changez `$script:Colors` :

```powershell
$script:Colors = @{
    Header = "Cyan"      # Cyan, Blue, Magenta, etc.
    Success = "Green"    # Green, DarkGreen
    Warning = "Yellow"   # Yellow, DarkYellow
    Error = "Red"        # Red, DarkRed
    Info = "Gray"        # Gray, White
    Highlight = "Magenta" # Magenta, Blue
}
```

### Modifier l'URL du serveur
```powershell
$script:BaseUrl = "http://localhost:5000"  # Changez si nécessaire
```

---

## 🐛 Dépannage

### ❌ "Serveur non disponible"

**Solution :**
```batch
# Terminal 1 : Démarrer le serveur
.\RUN_SERVER.bat

# Terminal 2 : Lancer le parcours
.\PARCOURS_UTILISATEUR.bat
```

---

### ❌ "Echec de la creation: API key"

**Solution :**
1. Créez le fichier `.env.email` :
```env
SENDGRID_API_KEY=SG.votre_cle_ici
SENDGRID_FROM_EMAIL=noreply@iapostemanager.com
```

2. Redémarrez le serveur

---

### ❌ "Les scripts sont désactivés sur ce système"

**Solution :**
```powershell
# Exécuter en mode Bypass
powershell -ExecutionPolicy Bypass -File "PARCOURS_UTILISATEUR_EMAIL.ps1"

# OU activer les scripts (admin)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### ❌ Caractères spéciaux mal affichés

**Solution :**
```batch
# Ajouter au début du fichier .bat
chcp 65001 > nul
```

---

## 📈 Cas d'Usage

### 1. Démonstration Client
```powershell
# Mode interactif avec explications détaillées
.\PARCOURS_UTILISATEUR_EMAIL.ps1
```

### 2. Tests Automatisés CI/CD
```powershell
# Mode automatique silencieux
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "ci-test" -Provider "sendgrid" -SkipServerCheck
```

### 3. Validation Rapide Après Déploiement
```batch
# Via le batch, option 4
.\PARCOURS_UTILISATEUR.bat
```

### 4. Tests de Charge
```powershell
# Créer plusieurs comptes
$usernames = @("contact", "support", "info", "sales", "admin")
foreach ($user in $usernames) {
    .\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username $user -Provider "sendgrid"
    Start-Sleep -Seconds 2
}
```

---

## 📚 Scripts Complémentaires

### Script de Nettoyage
```powershell
# Supprimer tous les comptes de test
Invoke-RestMethod -Uri 'http://localhost:5000/api/email/cleanup' -Method POST
```

### Script de Monitoring
```powershell
# Vérifier le statut toutes les 30 secondes
while ($true) {
    $health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health'
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Status: $($health.status)" -ForegroundColor Green
    Start-Sleep -Seconds 30
}
```

---

## 🎯 Résultat Final Attendu

### ✅ Succès Complet
```
╔═══════════════════════════════════════════════════════════════╗
║                     PARCOURS TERMINE                          ║
╚═══════════════════════════════════════════════════════════════╝

  SUCCES COMPLET!
  Le systeme de provisioning d'emails est pleinement operationnel.

  Prochaines etapes:
    1. Configurez vos cles API
    2. Integrez le composant React
    3. Configurez votre domaine personnalise

  Documentation complete:
    - DEMARRAGE_RAPIDE_EMAIL_CLOUD.md
    - RECAPITULATIF_EMAIL_CLOUD.md
    - GUIDE_PRODUCTION_COMPLET.md (Section 8)
```

---

## 🚀 Commandes Rapides

```powershell
# Parcours complet interactif
.\PARCOURS_UTILISATEUR.bat

# Test automatique rapide
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "contact" -Provider "sendgrid"

# Validation seule
.\PARCOURS_UTILISATEUR.bat    # Option 4

# Test avec provider spécifique
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "support" -Provider "aws"

# Mode verbose pour debug
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "test" -Verbose
```

---

## 📞 Support

En cas de problème, consultez :
1. **DEMARRAGE_RAPIDE_EMAIL_CLOUD.md** - Troubleshooting rapide
2. **RECAPITULATIF_EMAIL_CLOUD.md** - Architecture complète
3. **GUIDE_PRODUCTION_COMPLET.md** - Section 8 détaillée

---

## 🎉 Conclusion

Ce script automatise **100% du parcours utilisateur** :
- ✅ 6 étapes couvertes
- ✅ Mode interactif + automatique
- ✅ Validation complète
- ✅ Gestion d'erreurs robuste
- ✅ Interface colorée et claire
- ✅ Documentation inline

**Prêt pour la production !** 🚀
