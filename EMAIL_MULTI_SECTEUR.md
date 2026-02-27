# Configuration Email Multi-Secteurs

## Email Principal (Monitoring)
**sarraboudjellal57@gmail.com**

## Aliases Gmail par Secteur

Gmail permet d'utiliser le format `+secteur` pour router les emails :

### Legal (Avocats)
```
sarraboudjellal57+legal@gmail.com
```

### Medical (Médecins)
```
sarraboudjellal57+medical@gmail.com
```

### Consulting (Consultants)
```
sarraboudjellal57+consulting@gmail.com
```

### Accounting (Comptables)
```
sarraboudjellal57+accounting@gmail.com
```

### Architecture (Architectes)
```
sarraboudjellal57+architecture@gmail.com
```

### Realty (Agents immobiliers)
```
sarraboudjellal57+realty@gmail.com
```

### Insurance (Assureurs)
```
sarraboudjellal57+insurance@gmail.com
```

### Engineering (Ingénieurs)
```
sarraboudjellal57+engineering@gmail.com
```

---

## Configuration appsettings.json

```json
{
  "EmailMonitor": {
    "Enabled": true,
    "ImapHost": "imap.gmail.com",
    "ImapPort": 993,
    "Username": "sarraboudjellal57@gmail.com",
    "Password": "VOTRE_MOT_DE_PASSE_APP",
    "IntervalSeconds": 60,
    "SectorRouting": {
      "legal": "sarraboudjellal57+legal@gmail.com",
      "medical": "sarraboudjellal57+medical@gmail.com",
      "consulting": "sarraboudjellal57+consulting@gmail.com",
      "accounting": "sarraboudjellal57+accounting@gmail.com",
      "architecture": "sarraboudjellal57+architecture@gmail.com",
      "realty": "sarraboudjellal57+realty@gmail.com",
      "insurance": "sarraboudjellal57+insurance@gmail.com",
      "engineering": "sarraboudjellal57+engineering@gmail.com"
    }
  }
}
```

---

## Comment ça marche

1. **Un seul compte Gmail** : sarraboudjellal57@gmail.com
2. **Monitoring unique** : L'API scanne cette boîte mail
3. **Routing automatique** : Selon l'adresse de destination (+legal, +medical, etc.)
4. **Attribution secteur** : Chaque email est assigné au bon secteur

---

## Avantages

✅ Un seul compte Gmail à gérer
✅ Pas besoin de créer 8 comptes
✅ Tous les emails arrivent au même endroit
✅ Routing automatique par alias
✅ Facile à tester

---

## Configuration User Secrets

```powershell
dotnet user-secrets set "EmailMonitor:Username" "sarraboudjellal57@gmail.com"
dotnet user-secrets set "EmailMonitor:Password" "VOTRE_MOT_DE_PASSE_APP"
```

---

## Test

Envoyez un email à :
- `sarraboudjellal57+legal@gmail.com` → Secteur Legal
- `sarraboudjellal57+medical@gmail.com` → Secteur Medical
- etc.

Tous arrivent dans la même boîte, mais sont routés automatiquement !
