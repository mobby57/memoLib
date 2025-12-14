# ⚡ Démarrage Rapide - SecureVault v2.0

## Installation (2 minutes)

### Option 1: Script automatique
```bash
python scripts/setup.py
```

### Option 2: Manuel
```bash
pip install -r requirements.txt
mkdir data\databases data\encrypted data\uploads
```

## Lancement

### Application Web
```bash
python src/web/app.py
# ou
LANCER_V2.bat
```
**URL**: http://127.0.0.1:5000

### Interface GUI
```bash
python gui/main_app.py
```

### Inscription Utilisateur
```bash
python gui/inscription.py
```

## Configuration

1. **Copier .env.example vers .env**
```bash
copy .env.example .env
```

2. **Éditer .env avec vos clés**
```env
OPENAI_API_KEY=sk-votre_cle_ici
STRIPE_API_KEY=sk_test_votre_cle_ici
```

## Premier Email

1. Accéder à http://127.0.0.1:5000/agent
2. Configurer email + App Password Gmail
3. Configurer clé API OpenAI
4. Dicter ou écrire votre idée
5. L'IA génère l'email
6. Envoyer !

## Tests

```bash
pytest tests/ -v
# ou
LANCER_TESTS.bat
```

## Docker

```bash
docker-compose up -d
```

## Support

- Documentation: [docs/README.md](README.md)
- Issues: GitHub Issues
- Email: support@securevault.com
