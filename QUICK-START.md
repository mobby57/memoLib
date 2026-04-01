# DEMARRAGE RAPIDE MEMOLIB

## 1. Lancer l'API (30 secondes)
```powershell
.\START.bat
```

## 2. Ouvrir l'interface
```
http://localhost:5078/demo.html
```

## 3. Creer un compte
Cliquez sur "S'inscrire" dans l'interface

## 4. Configurer Gmail (optionnel)
```powershell
# 1. Creer mot de passe app: https://myaccount.google.com/apppasswords
# 2. Configurer:
dotnet user-secrets set "EmailMonitor:Password" "votre-mdp-app"
# 3. Redemarrer
.\START.bat
```

## 5. Deployer en cloud (optionnel)
```powershell
.\DEPLOY-FLY.ps1 -Init
.\DEPLOY-FLY.ps1
```

C'est tout! Votre systeme est operationnel.
