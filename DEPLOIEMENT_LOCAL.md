# 🚀 DÉPLOIEMENT LOCAL - Guide Rapide

## ⚡ Démarrage en 1 Commande

```bash
# Option 1: Script automatique
.\start.bat

# Option 2: Manuel
dotnet run
```

---

## 🌐 URLs d'Accès

Une fois démarré, accédez à:

- **🎨 Interface Refactorisée**: http://localhost:5078/demo-refactored.html
- **📊 Interface Complète**: http://localhost:5078/demo.html
- **🏠 Page d'Accueil**: http://localhost:5078/index.html
- **📡 API**: http://localhost:5078/api
- **📚 Swagger**: http://localhost:5078/swagger (si activé)

---

## 📋 Prérequis

✅ .NET 9.0 SDK installé  
✅ Port 5078 disponible  
✅ Base de données SQLite (créée automatiquement)

---

## 🔧 Commandes Utiles

### Démarrage
```bash
dotnet run                    # Mode développement
dotnet run --configuration Release  # Mode production
```

### Build
```bash
dotnet build                  # Compilation
dotnet build -c Release       # Compilation optimisée
```

### Base de données
```bash
dotnet ef database update     # Créer/mettre à jour DB
dotnet ef migrations add NomMigration  # Nouvelle migration
```

### Tests
```bash
npm test                      # Tests JavaScript
npm run test:coverage         # Avec couverture
```

---

## 🎯 Première Utilisation

1. **Démarrer l'application**
   ```bash
   .\start.bat
   ```

2. **Ouvrir l'interface**
   - Navigateur s'ouvre automatiquement
   - Ou aller sur: http://localhost:5078/demo-refactored.html

3. **Se connecter**
   - Email: `sarraboudjellal57@gmail.com`
   - Mot de passe: `SecurePass123!`

4. **Tester les fonctionnalités**
   - 📁 Dossiers
   - 👥 Clients
   - 🔍 Recherche

---

## 🛑 Arrêter l'Application

```bash
# Dans le terminal
Ctrl + C

# Ou fermer la fenêtre
```

---

## 🐛 Dépannage

### Port déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :5078

# Tuer le processus
taskkill /PID <PID> /F
```

### Base de données corrompue
```bash
# Supprimer et recréer
del memolib.db
dotnet ef database update
```

### Erreur de compilation
```bash
# Nettoyer et rebuilder
dotnet clean
dotnet build
```

---

## 📦 Structure Déployée

```
MemoLib.Api/
├── bin/Debug/net9.0/
│   └── MemoLib.Api.dll ✅
├── wwwroot/
│   ├── demo-refactored.html ✅
│   └── js/services/ ✅
├── memolib.db ✅
└── start.bat ✅
```

---

## ✅ Vérification

L'application est prête quand vous voyez:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5078
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

---

## 🎉 Succès !

✅ Application compilée  
✅ Base de données créée  
✅ Serveur démarré sur port 5078  
✅ Interface accessible  

**Prêt à utiliser !** 🚀
