# MemoLib - Demarrage Rapide

## Status Actuel : 88% Operationnel

```
[OK] API operationnelle
[OK] Base de donnees (4.8 MB)
[OK] Endpoints clients, dossiers, ingestion, recherche
[OK] Interface web accessible
```

## Demarrage en 1 Clic

### Windows (Recommande)
```
Double-cliquez sur : DEMARRER.bat
```

### PowerShell
```powershell
.\scripts\start-all.ps1
```

## Verification Rapide

```powershell
.\scripts\check-all.ps1
```

## Acces

- **Interface** : http://localhost:5078/demo.html
- **API** : http://localhost:5078
- **Health** : http://localhost:5078/health

## Tous les Scripts Disponibles

| Script | Description |
|--------|-------------|
| `DEMARRER.bat` | Demarrage ultra-rapide (double-clic) |
| `scripts\start-all.ps1` | Demarrage auto + navigateur |
| `scripts\check-all.ps1` | Diagnostic complet (8 tests) |
| `scripts\ensure-all-services.ps1` | Verif + demarrage si necessaire |

## Premiere Utilisation

1. Lancez `DEMARRER.bat`
2. Attendez l'ouverture du navigateur
3. Creez un compte dans l'interface
4. Cliquez sur "Scanner tous les emails"
5. Explorez vos dossiers et clients

## Depannage

### API ne demarre pas
```powershell
Get-Process -Name "MemoLib.Api" | Stop-Process -Force
.\scripts\start-all.ps1
```

### Port deja utilise
```powershell
netstat -ano | findstr :5078
taskkill /PID <PID> /F
```

### Base de donnees corrompue
```powershell
Remove-Item memolib.db
dotnet ef database update
```

## Documentation Complete

- `COMMANDES.md` - Toutes les commandes disponibles
- `scripts\DEMARRAGE.md` - Guide detaille de demarrage
- `README.md` - Documentation complete du projet

## Support

Tous les services sont automatiquement verifies et demarres.
Si un probleme persiste, consultez `COMMANDES.md` pour le depannage.
