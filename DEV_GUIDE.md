# 🚀 GUIDE DÉVELOPPEMENT - IAPosteManager

## DÉMARRAGE RAPIDE

### 1. Backend (Flask)
```bash
cd src/backend
python app.py
# → http://localhost:5000
```

### 2. Frontend React (Optionnel)
```bash
cd frontend-react
npm install
npm run dev
# → http://localhost:3000
```

### 3. Tests
```bash
pytest tests/
npm run test:e2e
```

## STRUCTURE PROJET

```
iaPostemanage/
├── src/backend/app.py          # 🔥 SERVEUR PRINCIPAL
├── *.html                      # 🎨 Pages web simples
├── frontend-react/             # ⚛️ React avancé
├── mobile-app/                 # 📱 App mobile
├── tests/                      # 🧪 Tests
└── requirements.txt            # 📦 Dépendances
```

## DÉVELOPPEMENT PAR DOMAINE

### 🎨 FRONTEND
- **Simple** : Modifier les fichiers .html
- **Avancé** : Développer dans frontend-react/
- **Mobile** : Développer dans mobile-app/

### 🔧 BACKEND
- **API** : src/backend/app.py
- **Services** : src/services/
- **Base** : SQLite → PostgreSQL

### 🤖 IA
- **Génération** : src/ai/
- **Analyse** : src/analytics/
- **Modèles** : Intégrer OpenAI/Anthropic

## NOUVELLES FONCTIONNALITÉS

### 📅 Calendrier d'envoi
```python
# src/services/scheduler.py
def schedule_email(email_data, send_time):
    # Programmer envoi différé
    pass
```

### 📊 Analytics avancées
```python
# src/analytics/email_analytics.py
def analyze_email_performance():
    # Taux ouverture, clics, etc.
    pass
```

### 🔗 Intégrations
```python
# src/integrations/slack.py
def send_to_slack(message):
    # Intégration Slack
    pass
```

## DÉPLOIEMENT

### Local
```bash
python src/backend/app.py
```

### Production
```bash
# Render.com
git push origin main
# Auto-deploy activé ✅
```

## OUTILS DÉVELOPPEMENT

### Debug
```bash
export FLASK_ENV=development
export FLASK_DEBUG=1
python src/backend/app.py
```

### Base de données
```bash
# Voir données
sqlite3 data/unified.db
.tables
SELECT * FROM emails;
```

### Logs
```bash
tail -f logs/app.log
```

## PROCHAINES ÉTAPES

1. **Choisir votre domaine** (Frontend/Backend/Mobile/IA)
2. **Créer une branche** : `git checkout -b feature/ma-fonctionnalite`
3. **Développer** dans le dossier approprié
4. **Tester** : `pytest` ou `npm test`
5. **Déployer** : `git push`

## AIDE RAPIDE

- **Structure** : Voir STRUCTURE_PROJET_COMPLETE.md
- **API** : Voir API_DOCUMENTATION.md
- **Tests** : Voir tests/README.md
- **Deploy** : Voir DEPLOY_RENDER_GUIDE.md

---

**🎯 PRÊT À DÉVELOPPER !**
Dites-moi quel domaine vous intéresse le plus.