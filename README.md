# 🚀 IA Poste Manager v2.3

**Système d'automatisation d'emails avec IA pour MS CONSEILS**

## Démarrage Rapide

### Windows

1. **Configurer la clé OpenAI:**
   - Éditer `.env` et ajouter votre clé OpenAI

2. **Lancer l'application:**
   ```
   start.bat
   ```

3. **Accéder à l'interface:**
   - http://localhost:5000

### Linux / Mac

1. **Configurer la clé OpenAI:**
   - Éditer `.env` et ajouter votre clé OpenAI

2. **Lancer l'application:**
   ```bash
   ./start.sh
   ```

3. **Accéder à l'interface:**
   - http://localhost:5000

### Scripts Disponibles

#### Windows
- `START.bat` - Démarrage simple de l'application
- `QUICK_START.bat` - Démarrage rapide avec vérifications
- `start_system.bat` - Démarrage du système complet (backend + frontend)
- `start_backend.bat` - Démarrage du backend uniquement

#### Linux / Mac
- `./start.sh` - Démarrage simple de l'application
- `./quick_start.sh` - Démarrage rapide avec vérifications
- `./start_system.sh` - Démarrage du système complet (backend + frontend)
- `./start_backend.sh` - Démarrage du backend uniquement

> **Note:** Les scripts shell (.sh) sont déjà exécutables. Si vous rencontrez des problèmes de permissions, utilisez `chmod +x *.sh`

## Fonctionnalités

- ✅ Génération d'emails avec IA (GPT-3.5)
- ✅ Gestion de templates
- ✅ Interface web intégrée
- ✅ API REST

## API Endpoints

- `GET /` - Interface web
- `POST /api/generate` - Génération IA
- `GET /api/templates` - Liste templates
- `POST /api/templates` - Créer template
- `GET /health` - Status santé

---
**MS CONSEILS - Sarra Boudjellal**