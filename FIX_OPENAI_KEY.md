# Configuration de la clé API OpenAI

## Problème détecté
```
Error code: 401 - Incorrect API key provided
```

## Solution rapide

### 1. Obtenir une clé API valide
1. Aller sur https://platform.openai.com/account/api-keys
2. Créer une nouvelle clé API (commence par `sk-proj-`)
3. Copier la clé complète

### 2. Configurer la clé

**Option A - Fichier .env (Recommandé)**
```bash
# Éditer c:\Users\moros\Desktop\iaPostemanage\.env
OPENAI_API_KEY=sk-proj-VOTRE_CLE_COMPLETE_ICI
OPENAI_ORG_ID=org-VOTRE_ORG_ID
OPENAI_PROJECT_ID=proj_VOTRE_PROJECT_ID
```

**Option B - Via l'interface web**
1. Démarrer l'application: `python src\backend\app.py`
2. Aller sur http://localhost:5000
3. Se connecter
4. Aller dans Settings > Credentials
5. Entrer la clé OpenAI

### 3. Vérifier la configuration
```bash
# Tester la clé
python -c "from openai import OpenAI; client = OpenAI(api_key='VOTRE_CLE'); print(client.models.list())"
```

### 4. Relancer les tests
```bash
.\TEST_ASSISTANTS.bat
```

## Notes importantes
- La clé doit être complète (pas tronquée)
- Vérifier les crédits sur https://platform.openai.com/usage
- La clé doit avoir accès aux APIs Assistants/Vector Stores
