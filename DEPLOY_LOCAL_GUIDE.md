# 🚀 DÉPLOIEMENT LOCAL - GUIDE RAPIDE

## ✅ Déploiement Réussi!

L'application a été compilée et publiée dans le dossier `publish/`

---

## 🎯 DÉMARRAGE RAPIDE

### Option 1: Script Automatique (Recommandé)
```cmd
START_LOCAL.bat
```

### Option 2: Manuel
```cmd
cd publish
MemoLib.Api.exe
```

### Option 3: PowerShell
```powershell
cd publish
.\MemoLib.Api.exe
```

---

## 🌐 ACCÈS

Une fois démarré, accédez à:

- **API**: http://localhost:5078/api
- **Demo Principale**: http://localhost:5078/demo.html
- **Demo Sprint 3**: http://localhost:5078/sprint3-demo.html
- **Health Check**: http://localhost:5078/health

---

## 📁 STRUCTURE DÉPLOIEMENT

```
publish/
├── MemoLib.Api.exe          # Application principale
├── MemoLib.Api.dll          # Bibliothèque .NET
├── appsettings.json         # Configuration
├── memolib.db              # Base de données SQLite
├── wwwroot/                # Fichiers statiques
│   ├── demo.html
│   └── sprint3-demo.html
└── logs/                   # Logs application
```

---

## ⚙️ CONFIGURATION

### Base de Données
- **Type**: SQLite
- **Fichier**: `memolib.db`
- **Backup**: Copier `memolib.db` régulièrement

### Port
- **Par défaut**: 5078
- **Modifier**: Éditer `appsettings.json`

### Logs
- **Emplacement**: `logs/memolib-YYYY-MM-DD.txt`
- **Rotation**: Quotidienne

---

## 🔒 SÉCURITÉ

### Secrets Utilisateur
```powershell
# Configurer email
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe"

# Configurer JWT
dotnet user-secrets set "JwtSettings:SecretKey" "votre-cle-secrete-32-caracteres-minimum"
```

### HTTPS (Production)
Éditer `appsettings.json`:
```json
{
  "DisableHttpsRedirection": false
}
```

---

## 🛠️ MAINTENANCE

### Backup Base de Données
```cmd
copy publish\memolib.db backup\memolib_%date:~-4,4%%date:~-7,2%%date:~-10,2%.db
```

### Mise à Jour
```powershell
# 1. Arrêter l'application (Ctrl+C)
# 2. Backup base de données
# 3. Recompiler
dotnet publish -c Release -o ./publish
# 4. Redémarrer
START_LOCAL.bat
```

### Logs
```powershell
# Voir logs en temps réel
Get-Content publish\logs\memolib-*.txt -Wait -Tail 50
```

---

## 🐛 DÉPANNAGE

### Port déjà utilisé
```cmd
# Trouver processus
netstat -ano | findstr :5078

# Tuer processus
taskkill /PID <PID> /F
```

### Base de données corrompue
```cmd
# Restaurer backup
copy backup\memolib_YYYYMMDD.db publish\memolib.db
```

### Erreur démarrage
```cmd
# Vérifier logs
type publish\logs\memolib-*.txt
```

---

## 📊 MONITORING

### Health Check
```powershell
# Vérifier santé
curl http://localhost:5078/health
```

### Métriques
- CPU: Gestionnaire des tâches
- RAM: Gestionnaire des tâches
- Disk: Propriétés du dossier

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Application déployée
2. ⏭️ Tester les endpoints
3. ⏭️ Créer utilisateur test
4. ⏭️ Tester fonctionnalités
5. ⏭️ Configurer backup automatique

---

## 📞 SUPPORT

### Problème?
1. Vérifier logs: `publish/logs/`
2. Vérifier health: http://localhost:5078/health
3. Consulter documentation: `README.md`

---

## ✅ CHECKLIST DÉPLOIEMENT

- [x] Application compilée
- [x] Fichiers publiés dans `publish/`
- [x] Script démarrage créé
- [ ] Application démarrée
- [ ] Health check OK
- [ ] Tests endpoints OK
- [ ] Backup configuré

---

**🎉 DÉPLOIEMENT LOCAL RÉUSSI!**

Pour démarrer: `START_LOCAL.bat`
