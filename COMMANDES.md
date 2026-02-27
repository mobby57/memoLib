# 🎯 MemoLib - Commandes Rapides

## 🚀 Démarrage (Choisissez UNE option)

### Option 1 : Double-clic (Le plus simple)
```
Double-cliquez sur : DEMARRER.bat
```

### Option 2 : PowerShell Ultra-Rapide
```powershell
.\scripts\start-all.ps1
```

### Option 3 : PowerShell avec Vérifications
```powershell
.\scripts\ensure-all-services.ps1
```

### Option 4 : Manuel
```powershell
dotnet run --urls http://localhost:5078
```

## 🔍 Diagnostic

### Vérifier tous les services
```powershell
.\scripts\check-all.ps1
```

### Vérifier uniquement l'API
```powershell
curl http://localhost:5078/health
```

## 🛑 Arrêt

### Arrêter l'API
```powershell
Get-Process -Name "MemoLib.Api" | Stop-Process -Force
```

### Arrêter tous les processus dotnet
```powershell
Get-Process -Name "dotnet" | Stop-Process -Force
```

## 🔧 Maintenance

### Recréer la base de données
```powershell
Remove-Item memolib.db
dotnet ef database update
```

### Nettoyer et recompiler
```powershell
dotnet clean
dotnet build
```

### Restaurer les packages
```powershell
dotnet restore
```

## 📊 Tests

### Tests automatisés complets
```powershell
.\scripts\demo-series-interactive.ps1 -AutoStartApi
```

### Test rapide de l'API
```powershell
.\scripts\demo-series-interactive.ps1 -RunAll
```

## 🌐 URLs Importantes

| Service | URL |
|---------|-----|
| Interface Web | http://localhost:5078/demo.html |
| API Health | http://localhost:5078/health |
| Swagger (si activé) | http://localhost:5078/swagger |

## 🆘 Dépannage Rapide

### Problème : Port déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr :5078

# Tuer le processus (remplacer <PID>)
taskkill /PID <PID> /F
```

### Problème : API ne démarre pas
```powershell
# Nettoyer tout
Get-Process -Name "MemoLib.Api","dotnet" | Stop-Process -Force
Remove-Item bin,obj -Recurse -Force
dotnet build
.\scripts\start-all.ps1
```

### Problème : Base de données corrompue
```powershell
Remove-Item memolib.db
dotnet ef database update
```

### Problème : Erreur de compilation
```powershell
dotnet clean
dotnet restore
dotnet build
```

## 📝 Ordre Recommandé (Première Utilisation)

1. **Vérifier** : `.\scripts\check-all.ps1`
2. **Démarrer** : `.\scripts\start-all.ps1`
3. **Tester** : Ouvrir http://localhost:5078/demo.html
4. **S'inscrire** : Créer un compte dans l'interface
5. **Scanner** : Cliquer sur "Scanner tous les emails"

## 🎓 Scripts Disponibles

| Script | Description | Quand l'utiliser |
|--------|-------------|------------------|
| `DEMARRER.bat` | Double-clic rapide | Tous les jours |
| `start-all.ps1` | Démarrage auto + navigateur | Première fois |
| `ensure-all-services.ps1` | Vérif + démarrage | Si problème |
| `check-all.ps1` | Diagnostic complet | Dépannage |
| `demo-series-interactive.ps1` | Tests automatisés | Validation |

## ✅ Checklist de Démarrage

- [ ] .NET 9.0 SDK installé
- [ ] PowerShell 5.1+ disponible
- [ ] Port 5078 libre
- [ ] Dossier MemoLib.Api accessible
- [ ] Exécuter `.\scripts\start-all.ps1`
- [ ] Ouvrir http://localhost:5078/demo.html
- [ ] Créer un compte
- [ ] Tester l'ingestion d'email

## 🎉 Tout Fonctionne ?

Si `.\scripts\check-all.ps1` affiche **100%**, vous êtes prêt ! 🚀

Accédez à : **http://localhost:5078/demo.html**
