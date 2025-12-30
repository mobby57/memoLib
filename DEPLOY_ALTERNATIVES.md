# DEPLOIEMENT ALTERNATIVES

## HEROKU (Recommande)
1. https://heroku.com → New App
2. Connect GitHub repo
3. Variables: SECRET_KEY
4. Deploy branch: main
5. URL automatique

## RENDER
1. https://render.com → New Web Service
2. Connect repo
3. Build: pip install -r requirements.txt
4. Start: gunicorn app:app
5. Variables: SECRET_KEY

## RAILWAY
1. https://railway.app → New Project
2. Deploy from GitHub
3. Variables: SECRET_KEY
4. Port: 5000

TOUS GRATUITS ET PLUS SIMPLES QUE VERCEL!