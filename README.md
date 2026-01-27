# 🚀 IA Poste Manager v2.3

**Système d'automatisation d'emails avec IA pour MS CONSEILS**

## Démarrage Rapide

1. **Configurer la clé OpenAI:**
   - Éditer `.env` et ajouter votre clé OpenAI

2. **Lancer l'application:**
   ```
   **Windows:**
   start.bat
   
   **Linux/Mac:**
   ./start.sh
   ```
   
   **Démarrage rapide (avec vérification):**
   - Windows: `QUICK_START.bat`
   - Linux/Mac: `./quick_start.sh`

3. **Accéder à l'interface:**
   - http://localhost:5000

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

## Scripts de démarrage disponibles

### Scripts Windows (.bat)
- `START.bat` - Démarrage simple
- `QUICK_START.bat` - Démarrage avec vérification
- `start_backend.bat` - Démarrage backend uniquement
- `start_system.bat` - Système complet (backend + frontend)
- `start_complete_system.bat` - Système complet avec tests

### Scripts Linux/Mac (.sh)
- `./start.sh` - Démarrage simple
- `./quick_start.sh` - Démarrage avec vérification
- `./start_backend.sh` - Démarrage backend uniquement
- `./start_system.sh` - Système complet (backend + frontend)
- `./start_complete_system.sh` - Système complet avec tests

**Note:** Les scripts .sh nécessitent les permissions d'exécution. Si nécessaire, exécutez:
```bash
chmod +x *.sh
```

---
**MS CONSEILS - Sarra Boudjellal**