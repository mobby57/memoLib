# 🎯 COMMENCER ICI - iaPosteManager

## ✅ Migration PostgreSQL TERMINÉE!

Votre environnement est maintenant configuré avec **WSL2 + PostgreSQL**.

---

## 🚀 Démarrage (3 commandes)

### Étape 1: Infrastructure
```powershell
# Terminal PowerShell Windows
.\START_ALL_SIMPLE.ps1
```
✅ PostgreSQL démarré

### Étape 2: Backend
```powershell
# Dans le même terminal ou nouveau terminal PowerShell
wsl bash /mnt/c/Users/moros/Desktop/iaPostemanage/start-backend-wsl.sh
```
✅ Backend sur http://127.0.0.1:5000

### Étape 3: Frontend  
```powershell
# Nouveau terminal PowerShell
cd src/frontend
npm run dev
```
✅ Frontend sur http://localhost:3003

---

## 🌐 Accéder à l'application

Ouvrir dans votre navigateur:
- **Application:** http://localhost:3003
- **API Health:** http://127.0.0.1:5000/api/health
- **API Docs:** http://127.0.0.1:5000/api/docs

---

## ⚠️ ACTION URGENTE - SÉCURITÉ

**Révoquer clé OpenAI exposée (AVANT de commit!):**

1. Aller sur: https://platform.openai.com/api-keys
2. Supprimer la clé: `sk-proj-Jjy29lZ51Fbr...`
3. Générer une nouvelle clé
4. Mettre à jour `.env`:
   ```bash
   OPENAI_API_KEY=sk-proj-NOUVELLE_CLE
   ```

**Détails:** Voir [SECURITY_ALERT.md](./SECURITY_ALERT.md)

---

## 📚 Documentation

**Guides essentiels (dans l'ordre):**

1. **START_HERE.md** ⭐ (vous êtes ici)
2. **[DEMARRAGE_WSL2.md](./DEMARRAGE_WSL2.md)** - Guide quotidien complet
3. **[README_MIGRATION.md](./README_MIGRATION.md)** - Résumé migration PostgreSQL
4. **[UTILISER_WSL2.md](./UTILISER_WSL2.md)** - Installation WSL2

**Guides avancés:**
5. [DEPLOIEMENT_PRODUCTION.md](./DEPLOIEMENT_PRODUCTION.md) - Déploiement
6. [NETTOYAGE_RESUME.md](./NETTOYAGE_RESUME.md) - Cleanup projet

---

## 🔧 Problèmes Courants

### Backend ne démarre pas
```bash
# Vérifier que venv est activé
wsl
source /mnt/c/Users/moros/Desktop/iaPostemanage/venv-linux/bin/activate
```

### PostgreSQL non accessible
```powershell
# Vérifier Docker
docker ps | grep postgres

# Redémarrer si nécessaire
docker-compose -f docker-compose.production.yml restart postgres
```

### Frontend erreur
```powershell
# Réinstaller dépendances
cd src/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Plus de solutions:** Voir [DEMARRAGE_WSL2.md](./DEMARRAGE_WSL2.md) section "Dépannage"

---

## 📊 Structure du Projet

```
iaPostemanage/
├── START_HERE.md              ⭐ Ce fichier
├── START_ALL_SIMPLE.ps1       🚀 Script démarrage infrastructure
├── start-backend-wsl.sh       🐧 Script backend WSL2
├── .env                       🔐 Configuration (NE PAS COMMIT)
├── src/
│   ├── backend/               🐍 Backend Python Flask
│   │   ├── app.py            Point d'entrée
│   │   ├── models.py         SQLAlchemy models
│   │   └── tests/
│   └── frontend/              ⚛️ Frontend React
│       ├── package.json
│       └── src/
├── migrations/                📦 Alembic migrations PostgreSQL
├── docker-compose.production.yml  🐳 Infrastructure Docker
└── venv-linux/                🐧 Python virtualenv (WSL2)
```

---

## ✅ Checklist Première Utilisation

- [ ] PostgreSQL démarré (`.\START_ALL_SIMPLE.ps1`)
- [ ] Backend lancé dans WSL2
- [ ] Frontend lancé dans Windows
- [ ] Application accessible sur http://localhost:3003
- [ ] API répond sur http://127.0.0.1:5000/api/health
- [ ] ⚠️ Clé OpenAI révoquée et nouvelle générée
- [ ] Fichier `.env` mis à jour avec nouvelle clé
- [ ] Premier test d'envoi email réussi

---

## 🎓 Prochaines Étapes

### Développer
1. Modifier code dans `src/backend/` ou `src/frontend/`
2. Hot reload automatique (backend + frontend)
3. Tests: `pytest src/backend/tests/`

### Créer Migration Base de Données
```bash
# WSL2
cd /mnt/c/Users/moros/Desktop/iaPostemanage
source venv-linux/bin/activate
alembic revision --autogenerate -m "Description changement"
alembic upgrade head
```

### Déployer en Production
Suivre: [DEPLOIEMENT_PRODUCTION.md](./DEPLOIEMENT_PRODUCTION.md)

---

## 💡 Aide Rapide

**Où suis-je?**
- Windows PowerShell: `PS C:\Users\moros\Desktop\iaPostemanage>`
- WSL2 Ubuntu: `moros@DESKTOP-XXX:/mnt/c/Users/moros/Desktop/iaPostemanage$`

**Changer de terminal:**
```powershell
# Windows → WSL2
wsl

# WSL2 → Windows
exit
```

**Ouvrir VS Code dans WSL2:**
```bash
# Dans WSL2
code /mnt/c/Users/moros/Desktop/iaPostemanage
```

---

## 🏆 Vous êtes Prêt!

Votre stack complète est opérationnelle:
- ✅ PostgreSQL 15 (Docker)
- ✅ Python 3.12 + Flask (WSL2)
- ✅ React + Vite (Windows)
- ✅ Migrations Alembic
- ✅ Monitoring Prometheus + Grafana

**Happy coding! 🚀**

---

**Questions?** Voir [DEMARRAGE_WSL2.md](./DEMARRAGE_WSL2.md) pour guide complet (389 lignes)
