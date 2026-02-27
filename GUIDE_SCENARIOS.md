# 🚀 GUIDE RAPIDE - EXÉCUTION SCÉNARIOS

## Démarrage Rapide

### 1. Lancer l'application
```powershell
.\start.ps1
```

## Scénarios Disponibles

### Scénario Avocat (10 min)
```powershell
.\scripts\run-scenario.ps1 -Scenario avocat
```
- Email divorce urgent
- SMS relance
- WhatsApp question
- **Résultat**: 1 dossier, 3 messages, client créé

### Scénario Médecin (8 min)
```powershell
.\scripts\run-scenario.ps1 -Scenario medecin
```
- Email RDV
- Telegram urgent
- **Résultat**: 1 dossier médical, 2 messages

### Scénario Consultant (12 min)
```powershell
.\scripts\run-scenario.ps1 -Scenario consultant
```
- Email prospect 50k€
- LinkedIn message
- **Résultat**: 1 dossier projet, 2 messages

### Scénario Complet (30 min)
```powershell
.\scripts\run-scenario.ps1 -Scenario complet
```
- 6 secteurs différents
- 6 dossiers créés
- **Résultat**: Vue complète multi-secteur

### Stress Test (20 min)
```powershell
.\scripts\run-scenario.ps1 -Scenario stress
```
- 50 messages automatiques
- Test performance
- **Résultat**: Métriques de performance

## Personnalisation

### Changer l'URL de l'API
```powershell
.\scripts\run-scenario.ps1 -Scenario avocat -ApiUrl "http://localhost:8091"
```

### Stress test avec 100 messages
```powershell
.\scripts\demo-stress-test.ps1 -Count 100
```

## Vérification des Résultats

Après chaque scénario, ouvrez:
- **Demo Pro**: http://localhost:5078/demo-pro.html
- **App**: http://localhost:5078/app.html

## Dépannage

### Port déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr :5078

# Tuer le processus
taskkill /PID <PID> /F

# Relancer
.\start.ps1
```

### API ne répond pas
```powershell
# Vérifier que l'API tourne
Get-Process -Name "MemoLib.Api"

# Relancer si nécessaire
dotnet run
```

## Commandes Utiles

### Nettoyer la base de données
```powershell
Remove-Item memolib.db
dotnet ef database update
```

### Voir les logs en temps réel
```powershell
dotnet run --verbosity detailed
```

### Compiler en mode Release
```powershell
dotnet build -c Release
```

## Métriques de Succès

Après chaque scénario, vérifiez:
- ✅ Dossiers créés automatiquement
- ✅ Clients créés avec coordonnées
- ✅ Messages associés aux bons dossiers
- ✅ Timeline complète visible
- ✅ Recherche fonctionne
- ✅ Filtres opérationnels

## Support

Pour toute question, consultez:
- **README.md** - Documentation complète
- **SCENARIOS_DEMO_COMPLETS.md** - Détails des scénarios
- **FLUX_COMPLETS_TOUTES_FONCTIONS.md** - Tous les flux possibles
