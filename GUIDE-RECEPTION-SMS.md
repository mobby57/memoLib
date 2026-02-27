# Configuration Reception SMS dans MemoLib

## Probleme
Vous voulez que les SMS envoyes a VOTRE numero (0603983709) remontent dans MemoLib.

## Solutions

### Option 1 : Utiliser le numero Twilio comme numero professionnel
**Le plus simple et recommande**

1. Communiquez le numero Twilio (+19564490871) a vos clients
2. Configurez ngrok + webhook Twilio
3. Les SMS arrivent directement dans MemoLib

**Avantages :**
- Automatique
- Gratuit (hors cout Twilio)
- Separation vie pro/perso

### Option 2 : Transfert manuel depuis votre telephone
**Pour garder votre numero 0603983709**

1. Installez une app de transfert SMS (ex: SMS Forwarder)
2. Configurez pour transferer vers le numero Twilio
3. Le SMS arrive dans MemoLib

**Inconvenients :**
- Necessite une app tierce
- Cout double (reception + transfert)
- Delai de quelques secondes

### Option 3 : API de votre operateur (Orange/SFR/Free)
**Technique avancee**

Certains operateurs proposent des API pour recuperer les SMS.
Necessite un compte entreprise.

### Option 4 : Acheter un numero francais Twilio
**Solution professionnelle**

1. Achetez un numero +33 sur Twilio (1€/mois)
2. Configurez le webhook
3. Communiquez ce nouveau numero

**Commande :**
```powershell
# Mettre a jour le numero Twilio
dotnet user-secrets set "Twilio:PhoneNumber" "+33XXXXXXXXX"
```

## Recommandation

Pour MemoLib (cabinet avocat), utilisez **Option 1 ou 4** :
- Numero professionnel dedie
- Separation claire pro/perso
- Automatisation complete
- Traçabilite juridique

## Configuration actuelle

Votre numero : +33603983709 (personnel)
Numero Twilio : +19564490871 (professionnel)

Pour recevoir dans MemoLib, utilisez le numero Twilio !
