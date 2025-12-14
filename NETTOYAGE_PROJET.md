# 🧹 Guide de Nettoyage - IAPosteManager

## Projet Principal (À CONSERVER)
```
src/                    # ✅ Code principal
templates/              # ✅ Templates HTML
static/                 # ✅ Assets CSS/JS
data/                   # ✅ Données chiffrées
requirements.txt        # ✅ Dépendances
docker-compose.yml      # ✅ Docker
README.md              # ✅ Documentation
```

## Dossiers à SUPPRIMER (Projets obsolètes)
```
assistant_demarches/    # ❌ Ancien projet
backend/               # ❌ Backend séparé non utilisé
backend_minimal/       # ❌ Version test
frontend/              # ❌ React non utilisé
frontend-react/        # ❌ Autre React
frontend-pro/          # ❌ Version pro
microservices/         # ❌ Architecture non utilisée
gui/                   # ❌ Interface Tkinter
chronology/            # ❌ Tests chronologiques
```

## Dossiers à ARCHIVER
```
archive/               # ✅ Déjà archivé
backup/                # ✅ Sauvegardes
logs/                  # ✅ Logs système
```

## Commandes de nettoyage
```bash
# Supprimer les projets obsolètes
rmdir /s assistant_demarches backend backend_minimal
rmdir /s frontend frontend-react frontend-pro
rmdir /s microservices gui chronology

# Garder uniquement le projet principal
```

## Structure finale recommandée
```
iaPostemanage/
├── src/               # Code principal
├── templates/         # Templates HTML  
├── static/           # Assets
├── data/             # Données
├── tests/            # Tests
├── docs/             # Documentation
├── deploy/           # Déploiement
├── archive/          # Archives
└── README.md         # Documentation
```