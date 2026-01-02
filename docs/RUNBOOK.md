# 🔧 RUNBOOK Opérationnel - IA Poste Manager

**Date** : 2 janvier 2026  
**Version** : 1.0  
**Classification** : Usage opérationnel

---

## Table des matières

1. [Build et déploiement](#1-build-et-déploiement)
2. [Opérations courantes](#2-opérations-courantes)
3. [Incidents et dépannage](#3-incidents-et-dépannage)
4. [Maintenance](#4-maintenance)
5. [Procédures d'urgence](#5-procédures-durgence)

---

## 1. Build et déploiement

### 1.1 Build local

**Prérequis** :
```bash
# Vérifier versions
python --version  # 3.9+
docker --version
docker-compose --version
```

**Build backend** :
```bash
# Activer environnement virtuel
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt

# Vérifier imports
python -c "import flask; import sqlalchemy; print('OK')"
```

**Build frontend** :
```bash
cd frontend
npm install
npm run build
```

**Build Docker** :
```bash
# Build toutes les images
docker-compose build

# Build image spécifique
docker-compose build backend
docker-compose build frontend
```

### 1.2 Déploiement staging

**Prérequis** :
- Accès au serveur staging
- Variables d'environnement configurées
- Secrets disponibles dans Vault

**Procédure** :
```bash
# 1. Connexion au serveur
ssh user@staging.iapostemanager.com

# 2. Pull derniers changements
cd /opt/iapostemanager
git fetch origin
git checkout develop
git pull origin develop

# 3. Backup base de données
pg_dump iapostemanager_staging > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Mettre à jour dépendances
pip install -r requirements.txt --upgrade

# 5. Appliquer migrations
alembic upgrade head

# 6. Redémarrer services
docker-compose down
docker-compose up -d

# 7. Vérifier health checks
curl http://localhost:5000/health

# 8. Vérifier logs
docker-compose logs -f --tail=100
```

**Rollback si problème** :
```bash
# Revenir à la version précédente
git checkout <previous-commit>
docker-compose down
docker-compose up -d

# Restaurer base de données si nécessaire
psql iapostemanager_staging < backup_YYYYMMDD_HHMMSS.sql
```

### 1.3 Déploiement production

**⚠️ Fenêtre de maintenance recommandée** : Dimanche 2h-4h du matin

**Checklist pré-déploiement** :
- [ ] Tests passent en staging
- [ ] Code review approuvé
- [ ] CHANGELOG.md mis à jour
- [ ] Backup de la base de données
- [ ] Communication aux utilisateurs
- [ ] Équipe disponible pour support

**Procédure** :
```bash
# 1. Notification utilisateurs
# Envoyer email de maintenance prévue

# 2. Backup complet
ssh user@prod.iapostemanager.com
cd /opt/iapostemanager
./scripts/backup_full.sh

# 3. Mode maintenance
cp maintenance.html /var/www/html/index.html
# Nginx redirige vers page de maintenance

# 4. Déploiement
git fetch origin
git checkout main
git pull origin main

# 5. Stop services
docker-compose down

# 6. Build nouvelles images
docker-compose build

# 7. Migrations base de données
alembic upgrade head

# 8. Start services
docker-compose up -d

# 9. Health checks
sleep 30
curl http://localhost:5000/health
curl http://localhost:5000/api/templates

# 10. Vérifier logs (pas d'erreurs)
docker-compose logs backend --tail=100 | grep -i error

# 11. Tests smoke
./tests/smoke_tests.sh

# 12. Désactiver mode maintenance
rm /var/www/html/index.html

# 13. Monitoring 24h
# Surveiller métriques, logs, alertes
```

**Rollback d'urgence** :
```bash
# Si problème détecté
docker-compose down
git checkout <previous-tag>
docker-compose up -d

# Restaurer DB si migrations incompatibles
psql iapostemanager_prod < backup_YYYYMMDD.sql

# Notification équipe
curl -X POST webhook-slack -d "Rollback production effectué"
```

### 1.4 Déploiement PythonAnywhere

**Procédure** :
```bash
# 1. Connexion console PythonAnywhere
# Via web interface

# 2. Pull changements
cd /home/username/iapostemanager
git pull origin main

# 3. Activer venv
source venv/bin/activate

# 4. Update dépendances
pip install -r requirements.txt --upgrade

# 5. Migrations
alembic upgrade head

# 6. Reload web app
# Via PythonAnywhere web interface
# Ou
touch /var/www/username_pythonanywhere_com_wsgi.py

# 7. Vérifier
curl https://username.pythonanywhere.com/health
```

### 1.5 Déploiement Heroku

**Procédure** :
```bash
# 1. Login Heroku
heroku login

# 2. Déploiement
git push heroku main

# 3. Migrations
heroku run alembic upgrade head

# 4. Restart dyno
heroku restart

# 5. Vérifier logs
heroku logs --tail

# 6. Health check
curl https://iapostemanager.herokuapp.com/health
```

---

## 2. Opérations courantes

### 2.1 Vérifier l'état du système

**Health checks** :
```bash
# Backend API
curl http://localhost:5000/health
# Attendu: {"status": "healthy", "timestamp": "..."}

# Base de données
docker-compose exec postgres psql -U postgres -c "SELECT 1;"

# Services Docker
docker-compose ps

# Espace disque
df -h

# Mémoire
free -h

# Processus
ps aux | grep python
```

**Métriques système** :
```bash
# CPU usage
top -n 1 | grep "Cpu(s)"

# Connexions actives
netstat -an | grep :5000 | wc -l

# Logs récents (erreurs)
docker-compose logs backend --tail=100 | grep ERROR
```

### 2.2 Gestion de la base de données

**Connexion** :
```bash
# Via Docker
docker-compose exec postgres psql -U iaposte_user iapostemanager

# Direct
psql -h localhost -U iaposte_user -d iapostemanager
```

**Requêtes utiles** :
```sql
-- Nombre d'utilisateurs
SELECT COUNT(*) FROM users;

-- Workspaces actifs
SELECT COUNT(*) FROM workspaces WHERE created_at > NOW() - INTERVAL '30 days';

-- Emails traités aujourd'hui
SELECT COUNT(*) FROM analytics 
WHERE event_type = 'EMAIL_PROCESSED' 
  AND DATE(created_at) = CURRENT_DATE;

-- Taille de la base
SELECT pg_size_pretty(pg_database_size('iapostemanager'));

-- Tables les plus volumineuses
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Backup manuel** :
```bash
# Backup complet
pg_dump iapostemanager > backup_$(date +%Y%m%d).sql

# Backup compressé
pg_dump iapostemanager | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup schéma uniquement
pg_dump -s iapostemanager > schema_$(date +%Y%m%d).sql

# Restore
psql iapostemanager < backup_YYYYMMDD.sql
```

**Migrations** :
```bash
# Créer une migration
alembic revision -m "description"

# Voir historique
alembic history

# Appliquer migrations
alembic upgrade head

# Rollback 1 migration
alembic downgrade -1

# Voir SQL sans exécuter
alembic upgrade head --sql
```

### 2.3 Gestion des logs

**Accéder aux logs** :
```bash
# Logs Docker
docker-compose logs -f

# Logs backend uniquement
docker-compose logs -f backend

# Logs avec timestamps
docker-compose logs -f --timestamps

# Dernières 100 lignes
docker-compose logs --tail=100

# Grep pour erreurs
docker-compose logs backend | grep -i error
```

**Logs applicatifs** :
```bash
# Logs Python (si configuré file handler)
tail -f /var/log/iapostemanager/app.log

# Logs nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Rotation des logs** :
```bash
# Vérifier config logrotate
cat /etc/logrotate.d/iapostemanager

# Forcer rotation
logrotate -f /etc/logrotate.d/iapostemanager
```

### 2.4 Monitoring

**Prometheus queries** :
```promql
# Taux de requêtes
rate(http_requests_total[5m])

# Latence moyenne
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Taux d'erreur
rate(http_requests_total{status=~"5.."}[5m])

# Utilisation mémoire
process_resident_memory_bytes
```

**Grafana dashboards** :
- Vue d'ensemble système
- Performance API
- Métriques métier
- Alertes actives

### 2.5 Gestion des utilisateurs

**Créer un utilisateur** :
```python
# Via Python shell
from backend.models import db, User
from werkzeug.security import generate_password_hash

user = User(
    email='nouveau@example.com',
    password_hash=generate_password_hash('password123'),
    name='Nouveau User',
    is_active=True
)
db.session.add(user)
db.session.commit()
```

**Réinitialiser mot de passe** :
```python
from backend.models import User
from werkzeug.security import generate_password_hash

user = User.query.filter_by(email='user@example.com').first()
user.password_hash = generate_password_hash('nouveau_password')
db.session.commit()
```

**Désactiver un utilisateur** :
```python
user = User.query.filter_by(email='user@example.com').first()
user.is_active = False
db.session.commit()
```

---

## 3. Incidents et dépannage

### 3.1 Service ne démarre pas

**Symptômes** :
- Container docker s'arrête immédiatement
- Erreur au démarrage
- Port déjà utilisé

**Diagnostic** :
```bash
# Vérifier logs
docker-compose logs backend

# Vérifier ports
netstat -tulpn | grep :5000

# Vérifier variables d'environnement
docker-compose config

# Tester manuellement
docker-compose run backend python app.py
```

**Solutions courantes** :
```bash
# Port occupé
# → Tuer le processus ou changer le port
lsof -ti:5000 | xargs kill -9

# Variable d'environnement manquante
# → Vérifier .env
cat .env | grep OPENAI_API_KEY

# Migration non appliquée
# → Appliquer migrations
alembic upgrade head

# Base de données inaccessible
# → Vérifier connexion
docker-compose up postgres
psql -h localhost -U iaposte_user -d iapostemanager -c "SELECT 1;"
```

### 3.2 Performance dégradée

**Symptômes** :
- API lente (>2s response time)
- Timeouts fréquents
- CPU/RAM élevé

**Diagnostic** :
```bash
# Métriques système
top
htop

# Connexions DB
docker-compose exec postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
docker-compose exec postgres psql -U postgres -c \
  "SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;"

# Logs de performance
docker-compose logs backend | grep "slow request"
```

**Solutions** :
```bash
# Redémarrer services
docker-compose restart

# Augmenter workers (si Gunicorn)
# Éditer docker-compose.yml
# command: gunicorn -w 4 -b 0.0.0.0:5000

# Nettoyer cache
docker-compose exec backend python -c \
  "from backend import cache; cache.clear()"

# Optimiser DB
docker-compose exec postgres psql -U postgres -c "VACUUM ANALYZE;"
```

### 3.3 Erreurs 500

**Diagnostic** :
```bash
# Logs d'erreur
docker-compose logs backend | grep -A 10 "ERROR"

# Exceptions Python
docker-compose logs backend | grep -A 20 "Traceback"

# Vérifier Sentry (si configuré)
# → Accéder au dashboard Sentry
```

**Causes courantes** :
1. **Clé API invalide** : Vérifier OpenAI API key
2. **DB disconnect** : Redémarrer PostgreSQL
3. **Out of memory** : Augmenter limite mémoire Docker
4. **Bug dans le code** : Rollback ou hotfix

### 3.4 Problèmes de sécurité

**Tentatives d'intrusion** :
```bash
# Logs nginx (tentatives suspectes)
grep "401\|403" /var/log/nginx/access.log | tail -100

# Vérifier logs d'authentification
docker-compose logs backend | grep "authentication failed"

# Bloquer IP
# Éditer /etc/nginx/conf.d/block.conf
deny 192.168.1.100;
sudo nginx -s reload
```

**Secret compromis** :
```bash
# Voir /docs/SECRETS_MANAGEMENT.md
# Section "Secret compromis"

# Résumé rapide:
# 1. Révoquer immédiatement
# 2. Générer nouveau secret
# 3. Déployer
# 4. Analyser logs
# 5. Postmortem
```

---

## 4. Maintenance

### 4.1 Maintenance préventive

**Hebdomadaire** :
- [ ] Vérifier espace disque
- [ ] Vérifier logs pour erreurs
- [ ] Backup de la base de données
- [ ] Vérifier alertes Grafana

**Mensuel** :
- [ ] Mettre à jour dépendances (patch)
- [ ] Rotation des logs
- [ ] Test de restoration de backup
- [ ] Revue des métriques de performance
- [ ] Audit des comptes utilisateurs

**Trimestriel** :
- [ ] Mettre à jour dépendances (minor)
- [ ] Rotation des secrets
- [ ] Audit de sécurité
- [ ] Test du plan de disaster recovery
- [ ] Revue de la documentation

**Annuel** :
- [ ] Mettre à jour dépendances (major)
- [ ] Renouvellement certificats SSL
- [ ] Audit complet de sécurité
- [ ] Test complet de disaster recovery
- [ ] Revue architecture

### 4.2 Mises à jour de dépendances

**Vérifier dépendances obsolètes** :
```bash
# Python
pip list --outdated

# Vérifier vulnérabilités
pip-audit
```

**Mettre à jour** :
```bash
# Patchs de sécurité (PATCH version)
pip install --upgrade <package>

# Tester en dev
pytest

# Tester en staging
# Déployer en staging et tester

# Si OK, déployer en production
```

**Mettre à jour Python** :
```bash
# Vérifier version actuelle
python --version

# Installer nouvelle version
# Selon OS (apt, brew, etc.)

# Recréer venv
python3.10 -m venv venv_new
source venv_new/bin/activate
pip install -r requirements.txt

# Tester
pytest

# Basculer
mv venv venv_old
mv venv_new venv
```

### 4.3 Nettoyage

**Nettoyer Docker** :
```bash
# Images non utilisées
docker image prune

# Volumes non utilisés
docker volume prune

# Tout nettoyer (ATTENTION)
docker system prune -a
```

**Nettoyer base de données** :
```sql
-- Supprimer anciennes analytics (>1 an)
DELETE FROM analytics WHERE created_at < NOW() - INTERVAL '1 year';

-- Vacuum
VACUUM ANALYZE;
```

**Nettoyer logs** :
```bash
# Supprimer logs >30 jours
find /var/log/iapostemanager/ -name "*.log" -mtime +30 -delete

# Compresser vieux logs
find /var/log/iapostemanager/ -name "*.log" -mtime +7 -exec gzip {} \;
```

---

## 5. Procédures d'urgence

### 5.1 Incident critique - Service down

**Niveau 1 - Detection** :
```bash
# 1. Confirmer le problème
curl https://iapostemanager.com/health
# Si timeout ou erreur → incident confirmé

# 2. Vérifier monitoring
# → Accéder Grafana pour métriques

# 3. Notifier équipe
curl -X POST slack-webhook \
  -d '{"text": "🚨 Service DOWN - investigating"}'
```

**Niveau 2 - Diagnostic rapide** :
```bash
# Services Docker
docker-compose ps

# Si container arrêté
docker-compose logs <service>

# CPU/RAM
top

# Disque plein?
df -h
```

**Niveau 3 - Actions correctives** :
```bash
# Option A: Restart simple
docker-compose restart

# Option B: Rebuild
docker-compose down
docker-compose up -d

# Option C: Rollback
git checkout <previous-stable-tag>
docker-compose up -d
```

**Niveau 4 - Communication** :
```bash
# Notifier utilisateurs
# → Envoyer email via SendGrid

# Mettre à jour status page
# → Si existe (status.iapostemanager.com)

# Escalade si non résolu en 15min
# → Appeler CTO
```

### 5.2 Fuite de données suspectée

**URGENT - Dans les 15 minutes** :
```bash
# 1. Isoler le système
# Couper accès externe si nécessaire
sudo iptables -A INPUT -j DROP

# 2. Capturer l'état
docker-compose logs > incident_logs_$(date +%Y%m%d_%H%M%S).txt
docker-compose exec postgres pg_dump iapostemanager > \
  incident_db_$(date +%Y%m%d_%H%M%S).sql

# 3. Notifier
# → Security Officer immédiatement
# → DPO immédiatement
# → CTO immédiatement
```

**OBLIGATOIRE - Dans les 72 heures** :
- [ ] Notification CNIL (si données UE)
- [ ] Notification utilisateurs affectés
- [ ] Rapport d'incident complet

**Investigation** :
```bash
# Analyser logs d'accès
docker-compose exec postgres psql -U postgres -c \
  "SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '24 hours';"

# Vérifier accès non autorisés
grep "401\|403" /var/log/nginx/access.log

# Forensics
# → Conserver tous les logs
# → Ne PAS modifier le système avant analyse
```

### 5.3 Panne base de données

**Diagnostic** :
```bash
# DB accessible?
docker-compose exec postgres pg_isready

# Si non, vérifier container
docker-compose ps postgres
docker-compose logs postgres
```

**Restauration** :
```bash
# Option A: Restart PostgreSQL
docker-compose restart postgres

# Option B: Restore depuis backup
docker-compose exec postgres psql -U postgres \
  -c "DROP DATABASE iapostemanager;"
docker-compose exec postgres psql -U postgres \
  -c "CREATE DATABASE iapostemanager;"
cat backup_latest.sql | \
  docker-compose exec -T postgres psql -U postgres iapostemanager

# Option C: Failover (si réplication configurée)
# → Promouvoir replica en primary
```

### 5.4 Désastre complet (data center down)

**Plan de reprise d'activité (PRA)** :

```bash
# 1. Activer site de secours
# → Cloud backup région différente

# 2. Restaurer dernière sauvegarde
# → Depuis S3/Azure Blob

# 3. Mettre à jour DNS
# → Pointer vers nouveau serveur

# 4. Vérifier fonctionnement
curl https://iapostemanager.com/health

# 5. Communication
# → Notifier utilisateurs du changement
```

**RTO (Recovery Time Objective)** : 4 heures  
**RPO (Recovery Point Objective)** : 4 heures

---

## Contacts d'urgence

**Escalade technique** :
1. DevOps On-Call : +33 X XX XX XX XX
2. Tech Lead : +33 X XX XX XX XX
3. CTO : +33 X XX XX XX XX

**Escalade sécurité** :
1. Security Officer : +33 X XX XX XX XX
2. CISO : +33 X XX XX XX XX

**Escalade métier** :
1. Product Owner : +33 X XX XX XX XX
2. CEO : +33 X XX XX XX XX

---

**Document maintenu par** : DevOps Lead  
**Dernière mise à jour** : 2 janvier 2026  
**Prochaine révision** : 2 avril 2026
