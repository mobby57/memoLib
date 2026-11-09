import os
import json
from pathlib import Path
from datetime import datetime

# Les 3 projets à auditer
PROJETS = {
    "MemoLib (Next.js/LegalTech)": r"C:\Users\moros\Desktop\PROD\memolib-production",
    "App Maman (Python/Streamlit)": r"/home/moros/memolib.bak", # Adapte si tu es sur Windows
    "MemoLibDev (Python/Outil)": r"C:\Users\moros\MemoLibDev\v3"
}

def analyser_dossier(nom, chemin):
    p = Path(chemin)
    if not p.exists():
        return {"nom": nom, "statut": "❌ Introuvable", "chemin": chemin}

    # 1. Compter les fichiers par extension
    stats = {".py": 0, ".ts": 0, ".tsx": 0, ".md": 0, ".json": 0}
    total_lignes = 0
    has_tests = False
    has_env = False
    has_docker = False

    for root, dirs, files in os.walk(p):
        # Ignorer les dossiers lourds
        if any(x in root for x in ["node_modules", ".next", "venv", "__pycache__", ".git"]):
            continue
            
        for f in files:
            ext = os.path.splitext(f)[1]
            if ext in stats:
                stats[ext] += 1
            
            # Détection de tests
            if "test" in f.lower():
                has_tests = True
            
            # Détection de .env (Sécurité)
            if f == ".env" or f == ".env.local":
                has_env = True
            
            # Détection de Docker
            if f == "docker-compose.yml" or f == "Dockerfile":
                has_docker = True
            
            # Compter les lignes (approximatif pour le code)
            if ext in [".py", ".ts", ".tsx"]:
                try:
                    with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as file:
                        total_lignes += len(file.readlines())
                except:
                    pass

    return {
        "nom": nom,
        "chemin": str(p),
        "statut": "✅ Trouvé",
        "fichiers_python": stats[".py"],
        "fichiers_typescript": stats[".ts"] + stats[".tsx"],
        "fichiers_markdown": stats[".md"],
        "lignes_de_code": total_lignes,
        "a_des_tests": has_tests,
        "a_fichier_env": has_env,
        "a_docker": has_docker
    }

def generer_rapport(resultats):
    rapport = f"# 📊 Rapport d'Audit Interne - {datetime.now().strftime('%d/%m/%Y')}\n\n"
    
    for res in resultats:
        rapport += f"## {res['nom']}\n"
        if res.get("statut") == "❌ Introuvable":
            rapport += f"- **Statut** : Non trouvé au chemin `{res['chemin']}`\n\n"
            continue
            
        rapport += f"- **Statut** : {res['statut']}\n"
        rapport += f"- **Lignes de code** : {res['lignes_de_code']:,}\n"
        rapport += f"- **Fichiers Python** : {res['fichiers_python']}\n"
        rapport += f"- **Fichiers TS/TSX** : {res['fichiers_typescript']}\n"
        rapport += f"- **Documentation (MD)** : {res['fichiers_markdown']} fichiers\n"
        
        # Scoring basé sur tes propres critères
        score = 0
        rapport += "\n### 🎯 Évaluation selon la grille de maturité :\n"
        
        if res['a_des_tests']:
            rapport += "- ✅ **Tests** : Présence de fichiers de tests détectée.\n"
            score += 25
        else:
            rapport += "- ❌ **Tests** : Aucun test détecté (Risque de régression).\n"
            
        if res['a_fichier_env']:
            rapport += "- ✅ **Sécurité** : Fichier d'environnement (.env) présent.\n"
            score += 25
        else:
            rapport += "- ⚠️ **Sécurité** : Pas de .env détecté (Attention aux secrets).\n"
            
        if res['fichiers_markdown'] >= 3:
            rapport += "- ✅ **Documentation** : Documentation technique fournie.\n"
            score += 25
        else:
            rapport += "- ⚠️ **Documentation** : Peu ou pas de documentation.\n"
            
        if res['a_docker']:
            rapport += "- ✅ **Déploiement** : Configuration Docker présente.\n"
            score += 25
        else:
            rapport += "- ⚠️ **Déploiement** : Pas de Dockerfile (Déploiement manuel).\n"
            
        rapport += f"\n**Score de Maturité Technique : {score}/100**\n\n---\n"
        
    return rapport

if __name__ == "__main__":
    print("🔍 Lancement de l'audit interne...")
    resultats = []
    for nom, chemin in PROJETS.items():
        print(f"Analyse de {nom}...")
        resultats.append(analyser_dossier(nom, chemin))
        
    rapport_final = generer_rapport(resultats)
    
    with open("AUDIT_INTERNE_MEMOLIB.md", "w", encoding="utf-8") as f:
        f.write(rapport_final)
        
    print("✅ Audit terminé ! Ouvre le fichier AUDIT_INTERNE_MEMOLIB.md")
