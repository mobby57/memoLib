# 🚀 DÉMARRAGE RAPIDE - IA POSTE MANAGER ÉDITION AVOCAT

## ⚡ Installation en 30 secondes

### Windows

```bash
# Double-cliquez sur le fichier :
INSTALL.bat
```

✅ Ce script va :
1. Créer environnement virtuel
2. Installer toutes les dépendances
3. Valider l'installation
4. Afficher les instructions

## 🎯 Lancement de l'application

### Windows

```bash
# Double-cliquez sur le fichier :
LANCER_APP.bat
```

### Mac/Linux

```bash
# Activer l'environnement
source venv/bin/activate

# Lancer l'app
python app.py
```

## 🌐 Accès à l'application

Une fois lancée, ouvrez votre navigateur :

```
http://localhost:5000/login
```

**Compte démo :**
- Username : `admin`
- Password : `admin123`

## 📍 Pages disponibles

Après connexion, vous avez accès à :

1. **Dashboard juridique**
   ```
   http://localhost:5000/legal/dashboard
   ```
   Vue d'ensemble : délais, factures, statistiques

2. **Gestion des délais**
   ```
   http://localhost:5000/legal/deadlines
   ```
   Calcul délais, alertes urgentes, jours ouvrables

3. **Facturation**
   ```
   http://localhost:5000/legal/billing
   ```
   Suivi temps, génération factures, top clients

4. **Conformité**
   ```
   http://localhost:5000/legal/compliance
   ```
   Registre chronologique, vérification conflits

5. **Rapports**
   ```
   http://localhost:5000/legal/reports
   ```
   Templates juridiques, statistiques

## 🧪 Tests

Vérifier que tout fonctionne :

```bash
python test_installation.py
```

Vous devriez voir :
```
✅ INSTALLATION VALIDÉE - TOUS LES TESTS PASSENT
```

## 📚 API REST

L'application expose 30 endpoints REST :

### Exemple : Créer un délai

```bash
curl -X POST http://localhost:5000/api/legal/deadlines \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Appel Cour d'\''Appel",
    "case_id": "CASE-2024-001",
    "start_date": "2024-01-01",
    "days": 30,
    "business_days": true
  }'
```

### Exemple : Lister les délais urgents

```bash
curl http://localhost:5000/api/legal/deadlines/urgent?days=7
```

### Exemple : Créer saisie de temps

```bash
curl -X POST http://localhost:5000/api/legal/billing/time \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "CASE-2024-001",
    "description": "Rédaction mémoire",
    "hours": 2.5,
    "hourly_rate": 150
  }'
```

### Exemple : Générer facture

```bash
curl -X POST http://localhost:5000/api/legal/billing/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "CLIENT-001",
    "client_name": "Cabinet Dupont",
    "case_id": "CASE-2024-001",
    "time_entries": ["entry1", "entry2"]
  }'
```

## 🎨 Notifications toast

Dans vos scripts JavaScript, utilisez :

```javascript
// Succès
toast.success('Délai créé avec succès !');

// Erreur
toast.error('Une erreur est survenue');

// Avertissement
toast.warning('Le délai expire dans 2 jours');

// Information
toast.info('Nouvelle facture disponible');

// Confirmation
toast.confirm('Supprimer ce délai ?', () => {
    // Action si confirmé
    deleteDeadline();
});
```

## 🔧 Dépannage rapide

### Problème : "Module not found"

**Solution :**
```bash
pip install -r requirements.txt
```

### Problème : "Port 5000 déjà utilisé"

**Solution :** Modifier dans `app.py` :
```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Changez le port
```

### Problème : "Static files 404"

**Vérification :** Dans `app.py`, assurez-vous que :
```python
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
```

### Problème : "Login ne fonctionne pas"

**Vérification :**
1. SECRET_KEY est défini dans `app.py`
2. Flask-Login est installé : `pip install Flask-Login`

## 📦 Déploiement production

### Option 1 : PythonAnywhere (Gratuit)

Voir le guide complet : [`DEPLOIEMENT_PRODUCTION.md`](DEPLOIEMENT_PRODUCTION.md)

**Résumé :**
1. Créer compte sur pythonanywhere.com
2. Upload fichiers
3. Configurer WSGI
4. Mapper static files
5. Reload webapp

### Option 2 : Vercel (Gratuit)

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel --prod

# Configurer secrets
vercel secrets add secret_key "<votre-clé>"
```

### Option 3 : Render (Gratuit)

1. Connecter GitHub repo
2. Créer nouveau Web Service
3. Environnement : Python 3
4. Build command : `pip install -r requirements.txt`
5. Start command : `gunicorn app:app`

## 📊 Statistiques projet

| Métrique | Valeur |
|----------|--------|
| Modules backend | 4 |
| Lignes Python backend | 1,245 |
| Endpoints API | 30 |
| Pages HTML | 5 |
| Notifications toast | Système complet |
| Tests automatiques | ✅ Tous passent |
| Documentation | 3 guides |

## ⚡ Raccourcis clavier

### Dans l'application

- `Ctrl + N` : Nouveau délai (page délais)
- `Ctrl + S` : Sauvegarder (formulaires)
- `Esc` : Fermer modal/toast
- `Ctrl + P` : Imprimer (rapports)

## 🆘 Support

**Documentation complète :**
- [`CONSOLIDATION_FINALE.md`](CONSOLIDATION_FINALE.md) - Vue d'ensemble
- [`DEPLOIEMENT_PRODUCTION.md`](DEPLOIEMENT_PRODUCTION.md) - Déploiement
- [`CONSOLIDATION_V3.md`](CONSOLIDATION_V3.md) - Détails techniques

**Tests d'installation :**
```bash
python test_installation.py
```

**Health check :**
```bash
curl http://localhost:5000/health
```

Retour attendu :
```json
{
  "status": "healthy",
  "version": "3.0.0",
  "modules": {
    "authentication": true,
    "legal_modules": true,
    "api_routes": true
  }
}
```

## 🎉 C'est tout !

Votre application juridique professionnelle est prête à l'emploi !

**Commencez maintenant :**
```bash
# Windows
LANCER_APP.bat

# Mac/Linux
source venv/bin/activate && python app.py
```

Puis ouvrez : **http://localhost:5000/login** 🚀
