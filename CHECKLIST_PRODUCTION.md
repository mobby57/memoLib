# ✅ CHECKLIST DÉPLOIEMENT PRODUCTION

Date: _______________  
Responsable: _______________

## Phase 1: Préparation (2h)

### Infrastructure
- [ ] Serveur Linux configuré (Ubuntu 20.04+ ou Debian 11+)
- [ ] Docker 20.10+ installé
- [ ] Docker Compose 2.0+ installé
- [ ] Domaine enregistré et DNS configuré
- [ ] Certificats SSH configurés
- [ ] Accès sudo disponible
- [ ] Firewall configuré (ufw)
- [ ] Minimum 2GB RAM, 20GB disque

### Repository
- [ ] Code pushé sur GitHub
- [ ] Secrets GitHub configurés (DOCKER_*, SSH_*, PRODUCTION_*)
- [ ] .env.production créé avec valeurs réelles
- [ ] Tests E2E passent localement (6/6)
- [ ] Frontend build sans erreurs
- [ ] Documentation à jour

---

## Phase 2: Déploiement Application (1h)

### Docker
- [ ] Cloner repo sur serveur: `git clone ...`
- [ ] Copier .env.production: `cp .env.example .env.production`
- [ ] Éditer variables: `nano .env.production`
- [ ] Build image: `docker-compose -f docker-compose.prod.yml build`
- [ ] Démarrer: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Vérifier logs: `docker-compose logs -f backend`
- [ ] Test health: `curl http://localhost:5000/api/health`
- [ ] Test login: `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"password":"test"}'`

### Validation
- [ ] Application accessible sur http://IP:5000
- [ ] Page d'accueil charge correctement
- [ ] Login fonctionne
- [ ] API répond correctement
- [ ] Pas d'erreurs dans logs

---

## Phase 3: SSL/HTTPS (30min)

### Let's Encrypt
- [ ] Copier script: `chmod +x ssl/setup-ssl.sh`
- [ ] Exécuter: `sudo ./ssl/setup-ssl.sh votre-domaine.com`
- [ ] Vérifier certificat: `ls /etc/letsencrypt/live/votre-domaine.com/`
- [ ] Test HTTPS: `curl -I https://votre-domaine.com`
- [ ] Vérifier auto-renewal: `sudo certbot renew --dry-run`

### Nginx
- [ ] Copier config: `sudo cp security/nginx-secure.conf /etc/nginx/sites-available/iapostemanager`
- [ ] Activer site: `sudo ln -s /etc/nginx/sites-available/iapostemanager /etc/nginx/sites-enabled/`
- [ ] Éditer domaine dans config si nécessaire
- [ ] Test config: `sudo nginx -t`
- [ ] Recharger: `sudo systemctl reload nginx`
- [ ] Vérifier redirection HTTP→HTTPS
- [ ] Test SSL Labs: https://www.ssllabs.com/ssltest/

---

## Phase 4: Monitoring (45min)

### Prometheus + Grafana
- [ ] Démarrer stack: `docker-compose -f monitoring/docker-compose.monitoring.yml up -d`
- [ ] Vérifier containers: `docker ps | grep monitoring`
- [ ] Accès Prometheus: http://IP:9090
- [ ] Vérifier targets: http://IP:9090/targets (tous UP)
- [ ] Accès Grafana: http://IP:3000
- [ ] Login Grafana (admin/admin)
- [ ] Changer mot de passe admin
- [ ] Ajouter data source Prometheus
- [ ] Importer dashboard 1860 (Node Exporter)
- [ ] Importer dashboard 893 (Docker)
- [ ] Vérifier métriques s'affichent
- [ ] Configurer alertes email (optionnel)

---

## Phase 5: CI/CD (30min)

### GitHub Actions
- [ ] Vérifier workflow: `.github/workflows/ci-cd.yml`
- [ ] Configurer secrets GitHub (8 secrets requis)
- [ ] Test workflow: Push sur main
- [ ] Vérifier exécution dans Actions tab
- [ ] Valider tests E2E passent
- [ ] Valider build Docker réussit
- [ ] Valider déploiement fonctionne
- [ ] Configurer Slack webhook (optionnel)

---

## Phase 6: Backups (20min)

### Configuration
- [ ] Rendre exécutable: `chmod +x scripts/backup.sh scripts/restore.sh`
- [ ] Test backup manuel: `./scripts/backup.sh`
- [ ] Vérifier backup créé: `ls -lh backups/`
- [ ] Test restauration: `./scripts/restore.sh backups/backup-*.tar.gz`
- [ ] Configurer cron: `crontab -e`
- [ ] Ajouter ligne: `0 2 * * * /chemin/complet/scripts/backup.sh`
- [ ] Vérifier cron: `crontab -l`
- [ ] Configurer backup distant (AWS S3 / rsync) - RECOMMANDÉ

---

## Phase 7: Email (30min)

### Configuration SMTP
- [ ] Choisir provider (Gmail/SendGrid/AWS SES)
- [ ] Créer compte et obtenir credentials
- [ ] Éditer `config/email-config.env`
- [ ] Copier config dans `.env.production`
- [ ] Redémarrer app: `docker-compose restart`
- [ ] Test envoi email: Utiliser interface ou API
- [ ] Vérifier email reçu
- [ ] Tester templates (welcome, password_reset)
- [ ] Configurer webhooks SendGrid (optionnel)

---

## Phase 8: Sécurité (1h)

### Headers & SSL
- [ ] Vérifier headers: `curl -I https://votre-domaine.com`
- [ ] HSTS présent
- [ ] X-Frame-Options présent
- [ ] Content-Security-Policy présent
- [ ] Score SSL Labs A ou A+

### ModSecurity (WAF)
- [ ] Installer: `sudo bash security/install-waf.sh`
- [ ] Vérifier config: `cat /etc/nginx/modsec/main.conf`
- [ ] Test règle XSS: `curl "https://votre-domaine.com/?test=<script>alert(1)</script>"`
- [ ] Vérifier logs: `sudo tail /var/log/nginx/modsec_audit.log`

### Fail2Ban
- [ ] Installer: `sudo bash security/setup-fail2ban.sh`
- [ ] Vérifier jails: `sudo fail2ban-client status`
- [ ] Test ban login: 6 tentatives échouées
- [ ] Vérifier IP bannée: `sudo fail2ban-client status nginx-login`

### Firewall
- [ ] Configurer ufw: `sudo ufw enable`
- [ ] Autoriser SSH: `sudo ufw allow 22/tcp`
- [ ] Autoriser HTTP: `sudo ufw allow 80/tcp`
- [ ] Autoriser HTTPS: `sudo ufw allow 443/tcp`
- [ ] Vérifier status: `sudo ufw status verbose`
- [ ] Fermer ports monitoring si non nécessaires en externe

---

## Phase 9: Tests (1h)

### Tests API
- [ ] Exécuter: `bash tests/test-api.sh https://votre-domaine.com`
- [ ] Tous endpoints passent (7/7)
- [ ] Vérifier rapport: `test-results-*.txt`

### Tests de Charge
- [ ] Test léger: `bash tests/load-test.sh 10 60 https://votre-domaine.com`
- [ ] Vérifier: >100 req/sec
- [ ] Temps réponse: <200ms
- [ ] Taux erreur: 0%
- [ ] Consulter rapport: `load-test-report.html`
- [ ] Test intensif: `bash tests/load-test.sh 50 300 https://votre-domaine.com`

### Audit Sécurité
- [ ] Exécuter: `bash tests/security-audit.sh https://votre-domaine.com`
- [ ] Consulter rapport: `security-reports-*/report.html`
- [ ] Corriger vulnérabilités trouvées
- [ ] Re-scanner après corrections

---

## Phase 10: PWA (30min)

### Configuration
- [ ] Vérifier manifest.json accessible: `curl https://votre-domaine.com/manifest.json`
- [ ] Vérifier service-worker.js: `curl https://votre-domaine.com/service-worker.js`
- [ ] Test installation Desktop (Chrome)
- [ ] Test installation Mobile (Android/iOS)
- [ ] Vérifier mode offline
- [ ] Test notifications push (si configuré)
- [ ] Lighthouse PWA score: >90

### Validation
- [ ] Chrome DevTools → Application → Service Workers (actif)
- [ ] Manifest affiché correctement
- [ ] Icônes chargent
- [ ] Offline.html s'affiche sans connexion

---

## Phase 11: Validation Finale (30min)

### Tests Utilisateur
- [ ] Créer compte / Login
- [ ] Rédiger email avec IA
- [ ] Envoyer email test
- [ ] Vérifier historique emails
- [ ] Tester templates prédéfinis
- [ ] Tester commande vocale (si audio configuré)
- [ ] Tester accessibilité (lecteur écran)
- [ ] Tester sur mobile
- [ ] Tester en mode offline (PWA)

### Performance
- [ ] PageSpeed Insights: >90
- [ ] Lighthouse Performance: >90
- [ ] Temps chargement <2s
- [ ] Pas d'erreurs console
- [ ] Responsive sur tous écrans

### Monitoring
- [ ] Grafana dashboards fonctionnels
- [ ] Métriques remontent correctement
- [ ] Alertes configurées
- [ ] Logs accessibles et lisibles

---

## Phase 12: Documentation & Formation (1h)

### Documentation
- [ ] README.md à jour
- [ ] GUIDE_PRODUCTION_COMPLET.md disponible
- [ ] Procédures de maintenance documentées
- [ ] Procédures de rollback documentées
- [ ] Contacts support définis

### Formation Équipe
- [ ] Accès serveurs distribués
- [ ] Procédure de déploiement expliquée
- [ ] Dashboard monitoring expliqué
- [ ] Procédure d'urgence définie
- [ ] On-call rotation planifiée

---

## Phase 13: Go Live! 🚀

### Communication
- [ ] Annonce mise en production
- [ ] URL partagée avec utilisateurs
- [ ] Support disponible
- [ ] Monitoring actif

### Surveillance Post-Déploiement (premières 24h)
- [ ] Vérifier logs toutes les heures
- [ ] Surveiller Grafana dashboards
- [ ] Vérifier aucune alerte
- [ ] Monitoring utilisation utilisateurs
- [ ] Temps réponse < 500ms
- [ ] Taux erreur < 1%
- [ ] Pas de crash

---

## Métriques de Succès

### Performance
- ✅ Uptime: >99.9%
- ✅ Temps réponse API: <200ms
- ✅ Temps chargement page: <2s
- ✅ Score Lighthouse: >90

### Sécurité
- ✅ SSL Labs: A ou A+
- ✅ Aucune vulnérabilité critique
- ✅ WAF actif et logs propres
- ✅ Fail2Ban 0 intrusion

### Disponibilité
- ✅ Health check: 200 OK
- ✅ Tous services Docker UP
- ✅ Monitoring fonctionnel
- ✅ Backups quotidiens OK

---

## Rollback Plan (En cas de problème)

### Étapes Rollback
1. [ ] Stop nouveau déploiement: `docker-compose down`
2. [ ] Restaurer backup: `./scripts/restore.sh backups/backup-dernier.tar.gz`
3. [ ] Vérifier santé: `curl http://localhost:5000/api/health`
4. [ ] Communiquer avec équipe
5. [ ] Analyser logs pour debug
6. [ ] Fixer problème
7. [ ] Re-tester en staging
8. [ ] Redéployer

---

## Contacts Urgence

**Hébergeur:**  
Support: _______________  
Téléphone: _______________

**DNS:**  
Provider: _______________  
Accès: _______________

**Email Provider:**  
Support: _______________  
API Key: _______________

**Équipe:**  
DevOps: _______________  
Dev Lead: _______________  
On-call: _______________

---

## Signature

✅ **Déploiement Validé Par:**

Nom: _______________  
Date: _______________  
Signature: _______________

---

*Checklist iaPosteManager v3.5*  
*Production Ready - Décembre 2025*
- [ ] Headers sécurité configurés :
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Content-Type-Options`
  - [ ] `X-Frame-Options`
  - [ ] `Content-Security-Policy`
- [ ] Protection CSRF active
- [ ] Protection XSS active
- [ ] SQL injection tests passés
- [ ] Authentification forte (2FA optionnel)

---

## 📝 Documentation

- [ ] ✅ API documentée (`docs/API_ENDPOINTS.md`)
- [ ] ✅ Guide utilisateur créé (`docs/GUIDE_DICTEE_VOCALE.md`)
- [ ] ✅ Guide démarrage rapide (`DEMARRAGE_RAPIDE.md`)
- [ ] README.md à jour
- [ ] Changelog maintenu
- [ ] Architecture documentée

---

## 🧪 Tests de Production

### Avant lancement

1. [ ] Test connexion base de données
2. [ ] Test envoi email réel
3. [ ] Test génération IA
4. [ ] Test dictée vocale
5. [ ] Test charge (100+ utilisateurs simultanés)
6. [ ] Test failover/backup
7. [ ] Test récupération après crash

### Validation fonctionnelle

- [ ] Authentification fonctionne
- [ ] Envoi email simple OK
- [ ] Envoi batch (100 emails) OK
- [ ] Génération IA OK
- [ ] Dictée vocale + amélioration IA OK
- [ ] Accessibilité TTS OK
- [ ] Transcriptions sauvegardées OK
- [ ] Dashboard stats OK

---

## 📦 Backup & Recovery

### Stratégie

- [ ] Backup quotidien automatique
- [ ] Backup base de données
- [ ] Backup fichiers de configuration
- [ ] Plan de récupération documenté
- [ ] Test de restauration effectué

### Rétention

- [ ] Backups quotidiens : 7 jours
- [ ] Backups hebdomadaires : 4 semaines
- [ ] Backups mensuels : 12 mois

---

## 🔄 Mise à jour

### Process

1. [ ] Backup complet avant MAJ
2. [ ] Tests en environnement staging
3. [ ] Validation équipe
4. [ ] Déploiement hors heures de pointe
5. [ ] Monitoring post-déploiement
6. [ ] Rollback plan prêt

---

## ✅ Checklist Finale

### Jour J - 7

- [ ] Tous les tests passent
- [ ] Documentation complète
- [ ] Environnement staging validé
- [ ] Équipe formée
- [ ] Plan de communication prêt

### Jour J - 1

- [ ] Backup complet effectué
- [ ] Monitoring actif
- [ ] Équipe de support disponible
- [ ] Rollback testé

### Jour J

- [ ] Déploiement effectué
- [ ] Health checks OK
- [ ] Tests smoke production OK
- [ ] Monitoring nominal
- [ ] Communication envoyée

### Jour J + 1

- [ ] Aucun incident majeur
- [ ] Performance nominale
- [ ] Feedback utilisateurs collecté
- [ ] Post-mortem planifié

---

## 📈 KPIs à Surveiller

### Performance
- Temps de réponse API (< 200ms)
- Temps de chargement page (< 3s)
- Disponibilité (> 99.9%)
- Taux d'erreur (< 0.1%)

### Utilisation
- Nombre d'utilisateurs actifs
- Emails envoyés / jour
- Utilisation dictée vocale
- Génération IA / jour

### Qualité
- Taux de satisfaction (> 4/5)
- Bugs critiques (0)
- Tickets support / jour
- Temps de résolution

---

## 🎯 Succès de Production

✅ **Critères de réussite :**

1. ✅ Tous les tests E2E passent (39/39)
2. ✅ Aucune erreur critique en 48h
3. ✅ Performance nominale
4. ✅ Feedback utilisateurs positif
5. ✅ Monitoring opérationnel
6. ✅ Documentation complète

---

## 🚨 Plan d'Urgence

### Incidents Critiques

1. **Backend down**
   - Check logs : `src/backend/logs/app.log`
   - Restart : `.\start-backend.ps1`
   - Rollback si nécessaire

2. **Base de données corrompue**
   - Restore depuis backup
   - Vérifier intégrité
   - Redémarrer services

3. **Performance dégradée**
   - Vérifier charge serveur
   - Analyser logs
   - Scaler si nécessaire

### Contacts d'Urgence

- [ ] Admin système : _____________
- [ ] Développeur senior : _____________
- [ ] DevOps : _____________
- [ ] Support : _____________

---

## 📞 Support Post-Déploiement

### Première semaine

- Monitoring 24/7
- Équipe disponible
- Hotfix possible
- Feedback quotidien

### Premier mois

- Monitoring renforcé
- Optimisations
- Formation utilisateurs
- Documentation FAQ

---

**Date de déploiement prévu : ___/___/_____**

**Responsable déploiement : _____________**

**Validation finale : ☐ Oui ☐ Non**

---

✨ **Système prêt pour production !** ✨
