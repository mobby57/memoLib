#!/usr/bin/env python3
"""
ALTERNATIVES DEPLOIEMENT GRATUIT
Render, Vercel, Heroku, PythonAnywhere
"""

def render_deployment():
    """Deploiement Render (gratuit)"""
    print("RENDER.COM - DEPLOIEMENT GRATUIT")
    print("=" * 40)
    print("AVANTAGES:")
    print("- 750h/mois gratuit")
    print("- Auto-deploy GitHub")
    print("- PostgreSQL gratuit")
    print("- SSL automatique")
    print()
    print("ETAPES:")
    print("1. Aller sur render.com")
    print("2. Connecter GitHub")
    print("3. New > Web Service")
    print("4. Selectionner repo")
    print("5. Build: pip install -r requirements.txt")
    print("6. Start: python app.py")
    print("7. Variables environnement:")
    print("   FLASK_ENV=production")
    print("   SECRET_KEY=your-key")
    print("   DATABASE_URL=postgresql://...")
    print()

def vercel_deployment():
    """Deploiement Vercel (gratuit)"""
    print("VERCEL.COM - DEPLOIEMENT GRATUIT")
    print("=" * 40)
    print("AVANTAGES:")
    print("- Illimite gratuit")
    print("- CDN global")
    print("- Serverless")
    print("- GitHub integration")
    print()
    print("ETAPES:")
    print("1. Installer Vercel CLI: npm i -g vercel")
    print("2. vercel login")
    print("3. vercel --prod")
    print("4. Creer vercel.json:")
    
    vercel_config = """{
  "version": 2,
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ]
}"""
    print(vercel_config)
    print()

def heroku_deployment():
    """Deploiement Heroku (gratuit limite)"""
    print("HEROKU.COM - DEPLOIEMENT GRATUIT")
    print("=" * 40)
    print("AVANTAGES:")
    print("- 550h/mois gratuit")
    print("- Add-ons gratuits")
    print("- CLI puissant")
    print()
    print("ETAPES:")
    print("1. Installer Heroku CLI")
    print("2. heroku login")
    print("3. heroku create iapostemanager")
    print("4. git push heroku main")
    print("5. Creer Procfile:")
    print("   web: gunicorn app:app")
    print("6. Variables:")
    print("   heroku config:set FLASK_ENV=production")
    print()

def pythonanywhere_deployment():
    """Deploiement PythonAnywhere (gratuit)"""
    print("PYTHONANYWHERE.COM - DEPLOIEMENT GRATUIT")
    print("=" * 40)
    print("AVANTAGES:")
    print("- Toujours gratuit")
    print("- Interface web")
    print("- MySQL inclus")
    print("- Cron jobs")
    print()
    print("ETAPES:")
    print("1. Creer compte sur pythonanywhere.com")
    print("2. Upload fichiers via interface")
    print("3. Web > Add new web app")
    print("4. Flask > Python 3.x")
    print("5. Configurer WSGI file")
    print("6. Reload web app")
    print()

def netlify_deployment():
    """Deploiement Netlify (statique + functions)"""
    print("NETLIFY.COM - DEPLOIEMENT GRATUIT")
    print("=" * 40)
    print("AVANTAGES:")
    print("- 100GB bandwidth")
    print("- Functions serverless")
    print("- Forms handling")
    print()
    print("ETAPES:")
    print("1. Aller sur netlify.com")
    print("2. New site from Git")
    print("3. Connecter GitHub")
    print("4. Build: pip install -r requirements.txt")
    print("5. Publish: dist/")
    print("Note: Necessite adaptation pour serverless")
    print()

def docker_deployment():
    """Deploiement Docker gratuit"""
    print("DOCKER + SERVICES GRATUITS")
    print("=" * 40)
    print("OPTIONS:")
    print("- Google Cloud Run (2M requetes/mois)")
    print("- AWS Lambda (1M requetes/mois)")
    print("- Azure Container Instances")
    print()
    print("DOCKERFILE:")
    dockerfile = """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]"""
    print(dockerfile)
    print()

def show_all_alternatives():
    """Affiche toutes les alternatives"""
    print("ALTERNATIVES DEPLOIEMENT GRATUIT")
    print("=" * 50)
    print()
    
    alternatives = [
        ("1. RENDER", render_deployment),
        ("2. VERCEL", vercel_deployment), 
        ("3. HEROKU", heroku_deployment),
        ("4. PYTHONANYWHERE", pythonanywhere_deployment),
        ("5. NETLIFY", netlify_deployment),
        ("6. DOCKER CLOUD", docker_deployment)
    ]
    
    for name, func in alternatives:
        print(name)
        func()
        print()
    
    print("RECOMMANDATION:")
    print("1. RENDER - Le plus simple (comme Railway)")
    print("2. VERCEL - Le plus rapide (serverless)")
    print("3. PYTHONANYWHERE - Le plus stable")
    print()
    print("COUT: 0 euros pour tous")

if __name__ == "__main__":
    show_all_alternatives()