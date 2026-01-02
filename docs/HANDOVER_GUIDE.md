# 📖 Guide de Reprise du Projet - IA Poste Manager

**Date** : 2 janvier 2026  
**Version** : 1.0  
**Objectif** : Permettre à un nouveau développeur/équipe de reprendre le projet

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Prérequis et compétences](#2-prérequis-et-compétences)
3. [Accès et permissions](#3-accès-et-permissions)
4. [Configuration de l'environnement de développement](#4-configuration-de-lenvironnement-de-développement)
5. [Architecture du code](#5-architecture-du-code)
6. [Workflows de développement](#6-workflows-de-développement)
7. [Ressources et documentation](#7-ressources-et-documentation)
8. [Contacts clés](#8-contacts-clés)

---

## 1. Vue d'ensemble du projet

### 1.1 Mission

**IA Poste Manager** est un système d'automatisation d'emails avec intelligence artificielle destiné aux cabinets d'avocats spécialisés en droit des étrangers.

**Problème résolu** :
- Gestion chronophage des emails clients
- Risque d'oubli de deadlines administratifs
- Processus répétitifs de rédaction

**Solution apportée** :
- Analyse automatique des emails entrants
- Détection intelligente des délais
- Génération de réponses contextuelles
- Workspaces dynamiques par dossier

### 1.2 Stack technique

**Backend** :
- Python 3.9+
- Flask/FastAPI
- PostgreSQL
- SQLAlchemy ORM

**Frontend** :
- React
- JavaScript/TypeScript
- HTML5/CSS3

**IA** :
- OpenAI GPT-3.5/GPT-4
- Modèles de NLP personnalisés

**Infrastructure** :
- Docker & Docker Compose
- Nginx (reverse proxy)
- Monitoring: Prometheus + Grafana

**Cloud/Déploiement** :
- Heroku
- PythonAnywhere
- Vercel (frontend)
- Options AWS/Azure

### 1.3 Métriques clés

- **Utilisateurs actifs** : ~50 beta-testers
- **Emails traités** : ~1000/mois
- **Temps de réponse API** : <500ms
- **Disponibilité** : 99%+

---

## 2. Prérequis et compétences

### 2.1 Compétences techniques requises

**Essentielles** :
- ✅ Python (intermédiaire à avancé)
- ✅ Développement web (Flask/FastAPI)
- ✅ SQL et bases de données relationnelles
- ✅ Git et GitHub

**Recommandées** :
- React/JavaScript pour le frontend
- Docker et conteneurisation
- API REST et design
- Sécurité applicative (OWASP)
- RGPD et conformité

**Souhaitables** :
- Intelligence artificielle / NLP
- DevOps (CI/CD, monitoring)
- Cloud computing (AWS/Azure)

### 2.2 Outils à installer

**Développement** :
```bash
# Python 3.9+
python --version

# pip
pip --version

# Git
git --version

# Docker
docker --version
docker-compose --version

# Node.js (pour frontend)
node --version
npm --version
```

**Éditeurs recommandés** :
- VS Code avec extensions Python
- PyCharm Professional
- Cursor

---

## 3. Accès et permissions

### 3.1 Comptes nécessaires

**GitHub** :
- Repository : `https://github.com/mobby57/iapostemanager`
- Demander accès à : admin@iapostemanager.com

**Services tiers** :
- OpenAI API : Clé dans le gestionnaire de secrets
- Email (SendGrid/SMTP) : Credentials dans Vault
- Cloud providers : Selon déploiement

**Gestionnaire de secrets** :
- HashiCorp Vault / AWS Secrets Manager
- Demander credentials au DevOps lead

### 3.2 Procédure d'onboarding

**Jour 1** :
1. [ ] Créer comptes email professionnel
2. [ ] Accès GitHub repository
3. [ ] Accès Slack/Teams
4. [ ] Lecture documentation principale

**Semaine 1** :
5. [ ] Configuration environnement local
6. [ ] Accès gestionnaire de secrets (dev)
7. [ ] Premier build et tests
8. [ ] Code review des modules principaux

**Mois 1** :
9. [ ] Accès staging environment
10. [ ] Première feature branch
11. [ ] Formation sécurité et RGPD
12. [ ] Accès production (lecture seule)

---

## 4. Configuration de l'environnement de développement

### 4.1 Clonage du repository

```bash
# Cloner le projet
git clone https://github.com/mobby57/iapostemanager.git
cd iapostemanager

# Vérifier les branches
git branch -a

# Créer sa branche de développement
git checkout -b feature/votre-nom-feature
```

### 4.2 Installation des dépendances

**Backend** :
```bash
# Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OU
venv\Scripts\activate  # Windows

# Installer dépendances
pip install -r requirements.txt

# Installer dépendances de développement
pip install -r requirements-dev.txt  # si existe
```

**Frontend** :
```bash
cd frontend
npm install
```

### 4.3 Configuration des variables d'environnement

```bash
# Copier le template
cp .env.example .env

# Éditer .env avec vos credentials
nano .env  # ou vim, code, etc.
```

**Contenu minimum de .env** :
```bash
# Application
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=your-secret-key-for-dev

# Database
DATABASE_URL=postgresql://localhost/iapostemanager_dev

# OpenAI (clé de développement)
OPENAI_API_KEY=sk-your-dev-key

# Email (optionnel en dev)
SMTP_HOST=localhost
SMTP_PORT=1025  # MailHog pour tests locaux
```

### 4.4 Base de données

**PostgreSQL local** :
```bash
# Installation PostgreSQL
sudo apt-get install postgresql postgresql-contrib  # Ubuntu
# OU
brew install postgresql  # Mac

# Créer base de données
createdb iapostemanager_dev

# Appliquer migrations
python manage.py db upgrade
# OU
alembic upgrade head
```

**Avec Docker** :
```bash
# Démarrer PostgreSQL
docker-compose up -d postgres

# Vérifier
docker ps
```

### 4.5 Premier lancement

```bash
# Option 1 : Direct
python app.py

# Option 2 : Avec Docker
docker-compose up

# Option 3 : Scripts de démarrage
./start_backend.bat  # Windows
bash deploy.sh       # Linux/Mac

# Vérifier le fonctionnement
curl http://localhost:5000/health
```

**Accès** :
- Interface web : `http://localhost:5000`
- API : `http://localhost:5000/api`
- Documentation API : `http://localhost:5000/docs` (si Swagger activé)

---

## 5. Architecture du code

### 5.1 Structure du projet

```
iapostemanager/
├── backend/               # Backend Python
│   ├── ai/               # Services IA
│   ├── api/              # Endpoints REST
│   ├── config/           # Configuration
│   ├── models.py         # Modèles de données
│   ├── routes.py         # Routes Flask
│   ├── security/         # Modules de sécurité
│   └── services/         # Logique métier
├── frontend/             # Frontend React
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages
│   │   └── services/     # API calls
│   └── public/
├── docs/                 # Documentation
├── tests/                # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/               # Configuration Docker
├── migrations/           # Migrations DB
├── scripts/              # Scripts utilitaires
├── .env.example          # Template env vars
├── requirements.txt      # Dépendances Python
├── docker-compose.yml    # Orchestration
└── README.md

### 5.2 Points d'entrée principaux

**Backend** :
- `app.py` - Application Flask principale
- `backend/routes.py` - Définition des routes
- `backend/models.py` - Modèles SQLAlchemy

**Frontend** :
- `frontend/src/App.js` - Composant React racine
- `frontend/src/index.js` - Point d'entrée

### 5.3 Flux de données

```
1. Client (browser/API) 
   ↓
2. Nginx (reverse proxy)
   ↓
3. Backend Flask
   ↓
4. Service Layer (business logic)
   ├→ AI Service (OpenAI)
   ├→ Email Service
   └→ Database (PostgreSQL)
   ↓
5. Response au client
```

---

## 6. Workflows de développement

### 6.1 Git workflow

**Branching strategy** :
```
main/master          # Production
  ├── develop        # Integration
  │   ├── feature/X  # Nouvelles features
  │   ├── bugfix/Y   # Corrections
  │   └── hotfix/Z   # Urgences
```

**Processus** :
```bash
# 1. Créer une branche feature
git checkout develop
git pull origin develop
git checkout -b feature/nom-feature

# 2. Développer et commit
git add .
git commit -m "feat: description de la feature"

# 3. Push et créer PR
git push origin feature/nom-feature
# Créer Pull Request sur GitHub

# 4. Code review + tests CI
# 5. Merge après approbation
```

**Convention de commits** :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 6.2 Tests

**Lancer les tests** :
```bash
# Tests unitaires
pytest tests/unit/

# Tests d'intégration
pytest tests/integration/

# Tests E2E
pytest tests/e2e/

# Avec couverture
pytest --cov=backend tests/

# Tests spécifiques
pytest tests/test_api.py::test_generate_email
```

**Écrire des tests** :
```python
# tests/unit/test_email_service.py
import pytest
from backend.services.email_service import EmailService

def test_generate_email():
    service = EmailService()
    result = service.generate(
        template="relance",
        context={"client_name": "Test"}
    )
    assert result is not None
    assert "Test" in result
```

### 6.3 Code review

**Checklist reviewer** :
- [ ] Code suit les conventions Python (PEP 8)
- [ ] Tests unitaires présents et passent
- [ ] Documentation à jour
- [ ] Pas de secrets dans le code
- [ ] Gestion d'erreurs appropriée
- [ ] Performance acceptable
- [ ] Sécurité vérifiée (OWASP)
- [ ] Conformité RGPD si données personnelles

### 6.4 Déploiement

**Environments** :
```
Development  → Branche feature (local)
Staging      → Branche develop (serveur de test)
Production   → Branche main (production)
```

**Processus de release** :
```bash
# 1. Merger develop dans main
git checkout main
git merge develop

# 2. Tagger la version
git tag -a v2.4.0 -m "Release v2.4.0"
git push origin v2.4.0

# 3. Déployer
# Automatique via CI/CD ou manuel
./deploy/deploy_prod.sh
```

---

## 7. Ressources et documentation

### 7.1 Documentation interne

**Essentiels** :
- `/README.md` - Introduction générale
- `/CONTINUITE_PROJET.md` - Ce document de continuité
- `/docs/ARCHITECTURE_GLOBALE.md` - Architecture détaillée
- `/docs/API_DOCUMENTATION.md` - Documentation API
- `/docs/SECURITY_GUIDE.md` - Guide de sécurité

**Guides pratiques** :
- `/docs/INSTALLATION_GUIDE.md` - Installation détaillée
- `/docs/DEPLOYMENT_GUIDE.md` - Guide de déploiement
- `/docs/guides/` - Guides utilisateur
- `/CHANGELOG.md` - Historique des versions

### 7.2 Documentation externe

**Technologies** :
- [Flask Documentation](https://flask.palletsprojects.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

**OpenAI** :
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)

**Sécurité & Conformité** :
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CNIL - RGPD](https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on)

### 7.3 Outils de collaboration

**Communication** :
- Slack/Teams : #iapostemanager-dev
- Email : dev@iapostemanager.com

**Gestion de projet** :
- GitHub Issues
- GitHub Projects
- Documentation wiki

**Monitoring** :
- Grafana : dashboard de métriques
- Logs : Centralisés (ELK/Graylog)

---

## 8. Contacts clés

### 8.1 Équipe technique

**Tech Lead** :
- Nom : [À compléter]
- Email : tech-lead@iapostemanager.com
- Responsabilités : Architecture, décisions techniques

**DevOps Lead** :
- Nom : [À compléter]
- Email : devops@iapostemanager.com
- Responsabilités : Infrastructure, déploiements

**Security Officer** :
- Nom : [À compléter]
- Email : security@iapostemanager.com
- Responsabilités : Sécurité, audits

### 8.2 Équipe métier

**Product Owner** :
- Nom : [À compléter]
- Email : product@iapostemanager.com
- Responsabilités : Priorités, roadmap

**DPO (Data Protection Officer)** :
- Nom : [À compléter]
- Email : dpo@iapostemanager.com
- Responsabilités : Conformité RGPD

**Customer Support** :
- Email : support@iapostemanager.com
- Responsabilités : Support utilisateurs

### 8.3 Escalade

**Niveaux d'escalade** :
1. **Questions techniques** → Tech Lead
2. **Problèmes de déploiement** → DevOps Lead
3. **Incidents de sécurité** → Security Officer
4. **Questions métier** → Product Owner
5. **Urgences critiques** → CTO

---

## Checklist de démarrage

### Premier jour
- [ ] Accès GitHub repository
- [ ] Accès Slack/Teams
- [ ] Lire README.md
- [ ] Lire CONTINUITE_PROJET.md

### Première semaine
- [ ] Environnement local configuré
- [ ] Premier build réussi
- [ ] Tests passent en local
- [ ] Première feature branch créée
- [ ] Code review d'un module

### Premier mois
- [ ] Première PR mergée
- [ ] Formation sécurité complétée
- [ ] Accès staging environment
- [ ] Participation à release

---

**Bon courage et bienvenue dans l'équipe !** 🚀

---

**Document maintenu par** : Tech Lead  
**Dernière mise à jour** : 2 janvier 2026  
**Prochaine révision** : 2 avril 2026
