# 🚀 Démarrage Rapide - IAPosteManager v2.2

## ✅ Prérequis Vérifiés
- ✅ Python 3.11.9 installé
- ✅ Dépendances installées
- ✅ Structure du projet complète
- ✅ Services configurés

## 🎯 Démarrage Immédiat

### Option 1: Script Windows (Recommandé)
```bash
START_SIMPLE.bat
```

### Option 2: Ligne de commande
```bash
python src\web\app.py
```

### Option 3: Docker
```bash
docker compose up --watch
```

## 🌐 Accès à l'Application

**URL:** http://127.0.0.1:5000

## 📋 Première Utilisation

1. **Accédez à l'application** dans votre navigateur
2. **Créez votre mot de passe maître** (8+ caractères)
3. **Configurez Gmail** (optionnel):
   - Email: votre.email@gmail.com
   - App Password: généré depuis Google
4. **Configurez OpenAI** (optionnel):
   - Clé API OpenAI pour la génération IA

## 🎨 Interfaces Disponibles

### Interface Standard
- `/` - Dashboard principal
- `/composer` - Compositeur d'emails avec IA
- `/send` - Envoi simple d'emails
- `/templates` - Gestion des templates

### Interface Accessible
- `/accessible/` - Interface universelle
- Navigation vocale complète
- Support TTS et transcription
- Auto-ajustements utilisateur

### Agent IA Vocal
- `/agent` - Interface vocale complète
- Commandes vocales
- Transcription temps réel

## 🔧 Fonctionnalités Principales

### ✅ Fonctionnalités Actives
- ✅ Envoi d'emails SMTP (Gmail, Outlook)
- ✅ Génération IA d'emails (avec clé OpenAI)
- ✅ Templates personnalisables
- ✅ Chiffrement AES-256 des credentials
- ✅ Interface web responsive
- ✅ Base de données SQLite
- ✅ Historique des emails
- ✅ Gestion des contacts
- ✅ API REST (/api/v1/)

### 🎤 Fonctionnalités Vocales
- Interface vocale complète
- Text-to-Speech (TTS)
- Reconnaissance vocale
- Transcription temps réel

### 🔐 Sécurité
- Chiffrement AES-256 avec Fernet
- Dérivation clé PBKDF2HMAC (600k itérations)
- Sessions sécurisées
- Validation des entrées

## 📊 Monitoring

- `/metrics` - Métriques Prometheus
- `/api/health` - Vérification de santé
- Logs dans `logs/app.log`

## 🛠️ Dépannage

### Problème de démarrage
```bash
python test_startup.py
```

### Réinstaller les dépendances
```bash
pip install -r requirements.txt --force-reinstall
```

### Nettoyer les données
```bash
# Supprimer le dossier data pour reset complet
rmdir /s data
```

## 📚 Documentation

- [Guide d'utilisation](GUIDE_UTILISATION.md)
- [Documentation API](docs/API_DOCUMENTATION.md)
- [Guide accessibilité](GUIDE_ACCESSIBILITE_RAPIDE.md)

## 🎉 Prêt à Utiliser !

L'application IAPosteManager v2.2 est maintenant **100% fonctionnelle** avec :

- ✅ Tous les services configurés
- ✅ Base de données initialisée
- ✅ Interface web complète
- ✅ Sécurité implémentée
- ✅ APIs fonctionnelles

**Lancez `START_SIMPLE.bat` et commencez à utiliser l'application !**