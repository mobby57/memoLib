# 🚀 Démarrage SecureVault sur Windows

## ⚡ Démarrage Rapide

### 1. Démarrage Production
```cmd
# Double-cliquer ou exécuter:
START_PRODUCTION.bat
```

### 2. Démarrage Monitoring (Optionnel)
```cmd
# Double-cliquer ou exécuter:
START_MONITORING.bat
```

## 🌐 Accès Application

Après démarrage, accédez à:
- **Application**: http://localhost:5000
- **Monitoring**: http://localhost:9090 
- **Dashboards**: http://localhost:3001

## 📋 Prérequis

### Docker Desktop
1. Télécharger: https://docker.com/products/docker-desktop
2. Installer et redémarrer
3. Vérifier: `docker --version`

### Configuration
1. Copier `.env.example` vers `.env`
2. Modifier les variables si nécessaire

## 🔧 Commandes Manuelles

### Si les scripts .bat ne fonctionnent pas:

```powershell
# Démarrage application
docker compose up -d --build

# Vérification
docker compose ps
curl http://localhost:5000/api/health

# Arrêt
docker compose down
```

### Monitoring séparé:
```powershell
# Démarrage monitoring
docker compose -f docker-compose.monitoring.yml up -d

# Vérification
docker ps
```

## 🐛 Dépannage

### Port occupé
```powershell
# Vérifier ports utilisés
netstat -an | findstr :5000
netstat -an | findstr :9090

# Arrêter processus si nécessaire
taskkill /F /IM docker.exe
```

### Docker non démarré
```powershell
# Démarrer Docker Desktop manuellement
# Attendre que l'icône Docker soit verte
```

### Erreur de build
```powershell
# Nettoyer et reconstruire
docker system prune -f
docker compose build --no-cache
docker compose up -d
```

## ✅ Vérification Fonctionnement

1. **Application**: http://localhost:5000 doit afficher la page de connexion
2. **API**: http://localhost:5000/api/health doit retourner `{"status": "ok"}`
3. **Monitoring**: http://localhost:9090 doit afficher Prometheus
4. **Dashboards**: http://localhost:3001 doit afficher Grafana

## 🎯 Première Utilisation

1. Ouvrir http://localhost:5000
2. Créer mot de passe maître (8+ caractères)
3. Configurer Gmail App Password
4. Tester envoi d'email
5. Explorer les fonctionnalités IA

**SecureVault est maintenant opérationnel!** 🎉