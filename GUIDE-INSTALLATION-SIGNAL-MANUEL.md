# GUIDE INSTALLATION MANUELLE SIGNAL - 5 MINUTES

## Étape 1 : Télécharger signal-cli (2 min)

1. Allez sur : https://github.com/AsamK/signal-cli/releases/latest
2. Téléchargez : `signal-cli-X.X.X.tar.gz` (version Windows)
3. Extrayez dans `C:\signal-cli`

## Étape 2 : Enregistrer votre numéro (2 min)

```powershell
# Ouvrez PowerShell et exécutez :
cd C:\signal-cli\bin

# (Option recommandé Windows) forcer Java 21 dans cette session
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jre-21.0.10.7-hotspot'
$env:Path="$env:JAVA_HOME\bin;$env:Path"

# Vérification rapide
java -version
.\signal-cli.bat --version

# Enregistrer votre numéro
.\signal-cli.bat -u +33603983709 register

# Si vous voyez : "Captcha required for verification"
# 1) Ouvrez : https://signalcaptchas.org/registration/generate.html
# 2) Résolvez le captcha
# 3) Copiez le lien "Open Signal" (signal://signalcaptcha/...) 
# 4) Relancez avec ce lien :
.\signal-cli.bat -u +33603983709 register --captcha "signal://signalcaptcha/XXXXXXXX"

# Vous recevez un code par SMS
# Vérifiez avec le code reçu :
.\signal-cli.bat -u +33603983709 verify VOTRE_CODE
```

## Étape 3 : Configurer MemoLib (1 min)

```powershell
cd c:\Users\moros\Desktop\memolib\MemoLib.Api

dotnet user-secrets set "Signal:PhoneNumber" "+33603983709"
dotnet user-secrets set "Signal:CliUrl" "http://localhost:8080"
```

## Étape 4 : Démarrer signal-cli daemon

```powershell
# Dans une nouvelle fenêtre PowerShell :
cd C:\signal-cli\bin
.\signal-cli.bat -u +33603983709 daemon --http 127.0.0.1:8080
```

**Laissez cette fenêtre ouverte !**

## Étape 5 : Démarrer MemoLib

```powershell
# Dans une autre fenêtre PowerShell :
cd c:\Users\moros\Desktop\memolib\MemoLib.Api
dotnet run
```

## Étape 6 : Tester

Envoyez-vous un message Signal : `/help`

Vous devriez recevoir la liste des commandes !

## 🎮 Commandes disponibles

```
/help - Aide
/inbox - Voir tous les messages
/send telegram 123 Bonjour - Envoyer
/stats - Statistiques
/search divorce - Rechercher
/status - État système
```

## 📱 Prochaine étape : SMS Forwarder

1. Installez SMS Forwarder sur Android
2. Configurez les règles :
   - SMS → Signal (+33603983709)
   - WhatsApp → Signal
   - Messenger → Signal
3. Format : `[SMS] De: {sender}\n{message}`

## ✅ Résultat

**TOUS LES CANAUX → Signal → MemoLib**

- 0€ de coût
- Sécurité maximale
- Contrôle total

C'est tout ! 🎉
