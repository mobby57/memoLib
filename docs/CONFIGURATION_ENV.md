# 🎯 Configuration IAPosteManager - Guide Complet

## 📁 Fichiers .env à conserver

### ✅ Fichier principal : `.env`

**Créez ce fichier depuis le template :**

```bash
cp .env.template .env
```

Puis éditez `.env` avec vos valeurs réelles.

### ✅ Fichier de référence : `.env.template`

Ne PAS modifier. C'est le modèle avec des valeurs d'exemple.

## 🗑️ Fichiers .env obsolètes (à supprimer)

Ces fichiers sont maintenant consolidés dans `.env.template` :

- ❌ `.env.production` - Fusionné dans .env.template (section FLASK_ENV=production)
- ❌ `.env.minimal` - Configuration de base incluse
- ❌ `.env.local` - Variables locales déplacées
- ❌ `.env.licorne` - Mode innovation intégré (LICORNE_MODE=True)
- ❌ `.env.example` - Remplacé par .env.template
- ❌ `.env.docker` - Configuration Docker dans docker-compose.production.yml
- ❌ `frontend-react/.env.example` - Variables frontend dans .env.template
- ❌ `src/frontend/.env.example` - Dupliqué, supprimé

## 🔄 Comment migrer

### 1. Sauvegarder vos valeurs actuelles

```bash
# Si vous avez un .env existant avec vos clés
cp .env .env.backup
```

### 2. Copier le nouveau template

```bash
cp .env.template .env
```

### 3. Transférer vos valeurs

Éditez `.env` et ajoutez vos vraies valeurs :

```bash
# Obligatoire
OPENAI_API_KEY=sk-proj-VOTRE_VRAIE_CLE_ICI
SECRET_KEY=votre-secret-genere

# Optionnel selon vos besoins
SENDGRID_API_KEY=SG.votre_cle
DATABASE_URL_POSTGRES=postgresql://user:pass@localhost/db
```

### 4. Supprimer les anciens fichiers

```bash
# ATTENTION: Vérifiez d'abord que vous avez bien tout migré!

# Sauvegarder au cas où
mkdir -p archive/env-old
mv .env.production .env.minimal .env.local .env.licorne .env.example .env.docker archive/env-old/

# Nettoyer les doublons frontend
rm -f frontend-react/.env.example src/frontend/.env.example
```

## 📋 Structure finale

Après nettoyage, vous devriez avoir :

```
iaPostemanager/
├── .env                    # ✅ VOS valeurs réelles (gitignore)
├── .env.template           # ✅ Modèle avec exemples (versionné)
├── .gitignore              # ✅ Contient .env
└── archive/
    └── env-old/            # 🗄️ Anciens fichiers (sauvegarde)
        ├── .env.production
        ├── .env.minimal
        ├── .env.local
        ├── .env.licorne
        └── ...
```

## 🔑 Variables essentielles par environnement

### Développement

```bash
FLASK_ENV=development
DEBUG=True
DATABASE_URL=sqlite:///iapostemanager.db
OPENAI_API_KEY=sk-proj-...
```

### Production

```bash
FLASK_ENV=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@localhost/iapostemanager
SECRET_KEY=$(openssl rand -hex 32)
OPENAI_API_KEY=sk-proj-...
SESSION_COOKIE_SECURE=True
```

### Mode Licorne (Innovation)

```bash
# Activer toutes les fonctionnalités expérimentales
LICORNE_MODE=True
OPENAI_ENABLE_AGENTS=True
OPENAI_ENABLE_BATCH=True
ACCESSIBILITY_ENABLED=True
```

## 🛡️ Sécurité

### Vérifier que .env est ignoré

```bash
# .env NE DOIT PAS apparaître dans:
git status

# Si .env apparaît:
git rm --cached .env
git commit -m "Remove .env from version control"
```

### Générer des secrets sécurisés

```bash
# Secret Flask
openssl rand -hex 32

# Password PostgreSQL
openssl rand -base64 32

# API Key test (NE JAMAIS utiliser en production)
# Toujours générer depuis le dashboard du service
```

## 📖 Documentation des variables

Consultez [.env.template](../.env.template) pour :
- Description de chaque variable
- Valeurs d'exemple
- Variables obligatoires vs optionnelles
- Sections par fonctionnalité

## ✅ Checklist de migration

- [ ] `.env.template` créé avec toutes les variables
- [ ] `.env` créé depuis le template avec vos vraies valeurs
- [ ] Anciens `.env.*` sauvegardés dans `archive/env-old/`
- [ ] `.env` bien présent dans `.gitignore`
- [ ] Variables testées avec `python src/backend/config.py`
- [ ] Application démarre correctement
- [ ] Anciens fichiers supprimés ou archivés

## 🔍 Tester la configuration

```bash
# Vérifier que toutes les variables obligatoires sont définies
python src/backend/config.py

# Démarrer l'application
python start.py

# Vérifier les logs
# Aucune erreur de variable manquante ne doit apparaître
```

## 🆘 En cas de problème

### Erreur "OPENAI_API_KEY non définie"

```bash
# Vérifier que .env existe
ls -la .env

# Vérifier le contenu
grep OPENAI_API_KEY .env

# Recharger les variables
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('OPENAI_API_KEY'))"
```

### Restaurer depuis la sauvegarde

```bash
# Si vous avez fait une erreur
cp .env.backup .env
```

### Repartir de zéro

```bash
# Copier le template
cp .env.template .env

# Éditer et ajouter vos vraies valeurs
nano .env
```

## 📞 Support

Pour toute question sur la configuration :
1. Consulter [.env.template](../.env.template)
2. Voir [src/backend/config.py](../src/backend/config.py) pour la validation
3. Créer une issue GitHub avec les logs (sans vos clés!)
