# 🚀 SecureVault Sans Docker - Solution Simple

## ⚡ Démarrage Immédiat

### Option 1: Script Automatique
```cmd
# Double-cliquez sur:
START_LOCAL.bat
```

### Option 2: Manuel
```cmd
# 1. Installer Python (si pas déjà fait)
python --version

# 2. Installer dépendances minimales
pip install flask flask-cors python-dotenv

# 3. Lancer l'application
python app_simple.py
```

## 🌐 Accès Application

Après démarrage:
- **Application**: http://localhost:5000
- **Connexion**: http://localhost:5000/login
- **Compositeur**: http://localhost:5000/composer
- **API Health**: http://localhost:5000/api/health

## 📋 Fonctionnalités Disponibles

### ✅ Fonctionnel
- Interface web de base
- Système de connexion simple
- Compositeur d'emails (simulation)
- API REST basique
- Health checks

### ⚠️ Simplifié (sans Docker)
- Pas de base de données (session mémoire)
- Pas d'envoi SMTP réel
- Pas de génération IA
- Pas de monitoring avancé

## 🔧 Si Python n'est pas installé

### Installation Python
1. Télécharger: https://python.org/downloads/
2. Installer avec "Add to PATH" coché
3. Redémarrer terminal
4. Vérifier: `python --version`

### Installation pip (si erreur)
```cmd
python -m ensurepip --upgrade
python -m pip install --upgrade pip
```

## 🐛 Dépannage

### Port 5000 occupé
```cmd
# Changer le port dans app_simple.py ligne finale:
app.run(debug=True, host='127.0.0.1', port=5001)
```

### Erreur dépendances
```cmd
# Installation utilisateur
pip install --user flask flask-cors python-dotenv
```

### Permission refusée
```cmd
# Exécuter en tant qu'administrateur
# Ou installer avec --user
```

## 🎯 Test Rapide

1. Lancer `START_LOCAL.bat`
2. Ouvrir http://localhost:5000
3. Tester connexion avec mot de passe 8+ caractères
4. Essayer le compositeur d'emails

**SecureVault fonctionne maintenant sans Docker!** 🎉

Cette version simple vous permet de tester l'application immédiatement sans configuration complexe.