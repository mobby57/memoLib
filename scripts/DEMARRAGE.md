# 🚀 Démarrage Rapide MemoLib

## Option 1 : Démarrage Ultra-Rapide (Recommandé)

```powershell
.\scripts\start-all.ps1
```

Ce script :
- ✅ Démarre automatiquement l'API
- ✅ Attend que tous les services soient prêts
- ✅ Ouvre automatiquement l'interface dans votre navigateur

## Option 2 : Vérification + Démarrage

```powershell
.\scripts\ensure-all-services.ps1
```

Ce script :
- ✅ Vérifie si l'API est déjà lancée
- ✅ Démarre l'API si nécessaire
- ✅ Vérifie la base de données
- ✅ Teste tous les endpoints critiques
- ✅ Affiche un rapport détaillé

## Option 3 : Démarrage Manuel

```powershell
# Dans le dossier MemoLib.Api
dotnet run --urls http://localhost:5078
```

Puis ouvrez : http://localhost:5078/demo.html

## Vérification Rapide

Pour vérifier que tout fonctionne :

```powershell
# Test de santé
curl http://localhost:5078/health

# Devrait retourner : "Healthy"
```

## Ports Utilisés

- **API** : http://localhost:5078
- **Interface** : http://localhost:5078/demo.html
- **Health Check** : http://localhost:5078/health

## Dépannage

### L'API ne démarre pas

```powershell
# Tuer les processus existants
Get-Process -Name "MemoLib.Api" | Stop-Process -Force

# Redémarrer
.\scripts\start-all.ps1
```

### Port déjà utilisé

```powershell
# Trouver le processus sur le port 5078
netstat -ano | findstr :5078

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Base de données corrompue

```powershell
# Supprimer et recréer
Remove-Item memolib.db
dotnet ef database update
```

## Scripts Disponibles

| Script | Description |
|--------|-------------|
| `start-all.ps1` | Démarrage ultra-rapide avec ouverture navigateur |
| `ensure-all-services.ps1` | Vérification complète + démarrage si nécessaire |
| `demo-series-interactive.ps1` | Tests automatisés complets |

## Ordre de Démarrage Automatique

1. 🔍 Vérification de l'API
2. 🚀 Démarrage si nécessaire
3. 💾 Vérification de la base de données
4. ✅ Test des endpoints
5. 🌐 Ouverture de l'interface

Tout est automatique ! 🎉
