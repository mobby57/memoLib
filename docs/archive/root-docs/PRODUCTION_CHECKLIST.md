# ✅ CHECKLIST DÉPLOIEMENT PRODUCTION

## Phase 1: Préparation (30 min)

### Base de données
- [x] Migration Sprint3CompleteFeatures appliquée
- [ ] Backup base de données
- [ ] Vérifier indexes
- [ ] Tester rollback

### Configuration
- [ ] Variables d'environnement production
- [ ] Secrets sécurisés (JWT, Email)
- [ ] CORS origins production
- [ ] HTTPS activé
- [ ] Rate limiting configuré

### Tests
- [ ] Tester tous les endpoints Sprint 3
- [ ] Vérifier authentification JWT
- [ ] Tester permissions RBAC
- [ ] Vérifier SignalR WebSocket
- [ ] Tester upload fichiers

## Phase 2: Build Production (15 min)

```powershell
# Build Release
dotnet publish -c Release -o ./publish

# Vérifier
cd publish
dir
```

### Vérifications
- [ ] Tous les DLLs présents
- [ ] appsettings.Production.json
- [ ] wwwroot/ complet
- [ ] Taille raisonnable (<100MB)

## Phase 3: Déploiement (30 min)

### Option A: Local/VPS
```powershell
# Copier vers serveur
scp -r publish/ user@server:/var/www/memolib/

# Sur serveur
cd /var/www/memolib
./MemoLib.Api

# Ou avec systemd
sudo systemctl start memolib
```

### Option B: Azure
```powershell
# Azure CLI
az webapp up --name memolib-api --resource-group memolib-rg
```

### Option C: Docker
```powershell
# Build image
docker build -t memolib-api .

# Run
docker run -p 5078:5078 memolib-api
```

## Phase 4: Vérification (15 min)

### Health Checks
- [ ] GET /health → 200 OK
- [ ] GET /api → 200 OK
- [ ] POST /api/auth/login → 200 OK
- [ ] WebSocket /realtimeHub → Connected

### Fonctionnalités Critiques
- [ ] Créer template → OK
- [ ] Demander signature → OK
- [ ] Créer formulaire → OK
- [ ] Soumettre formulaire public → OK
- [ ] Notification temps réel → OK

### Performance
- [ ] Temps réponse API < 200ms
- [ ] SignalR latence < 100ms
- [ ] Upload fichier < 5s
- [ ] Recherche full-text < 500ms

## Phase 5: Monitoring (Continu)

### Logs
```powershell
# Vérifier logs
tail -f logs/memolib-*.txt
```

### Métriques
- [ ] CPU < 50%
- [ ] RAM < 2GB
- [ ] Disk < 80%
- [ ] Requêtes/sec < 1000

### Alertes
- [ ] Email si erreur 500
- [ ] SMS si downtime > 5min
- [ ] Slack si CPU > 80%

## Phase 6: Documentation (15 min)

### Pour utilisateurs
- [ ] Guide démarrage rapide
- [ ] Vidéos tutoriels
- [ ] FAQ
- [ ] Support contact

### Pour développeurs
- [ ] API documentation (Swagger)
- [ ] Exemples code
- [ ] Webhooks guide
- [ ] Changelog

## Rollback Plan

### Si problème critique
```powershell
# 1. Arrêter nouvelle version
sudo systemctl stop memolib

# 2. Restaurer backup
cp backup/memolib.db memolib.db

# 3. Redémarrer ancienne version
sudo systemctl start memolib-old

# 4. Vérifier
curl http://localhost:5078/health
```

## Post-Déploiement

### Jour 1
- [ ] Surveiller logs toutes les heures
- [ ] Vérifier métriques
- [ ] Tester fonctionnalités clés
- [ ] Répondre aux tickets support

### Semaine 1
- [ ] Analyser usage
- [ ] Optimiser performances
- [ ] Corriger bugs mineurs
- [ ] Collecter feedback

### Mois 1
- [ ] Rapport utilisation
- [ ] Planifier améliorations
- [ ] Mettre à jour documentation
- [ ] Célébrer succès! 🎉

## Contacts Urgence

- **DevOps**: devops@memolib.com
- **Support**: support@memolib.com
- **Urgence**: +33 6 XX XX XX XX

---

**✅ PRÊT POUR PRODUCTION - 10/10 FEATURES COMPLÈTES!**
