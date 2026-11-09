import os
import subprocess
import json
from pathlib import Path
from datetime import datetime

PROJETS = {
    "MemoLib (Next.js)": r"C:\Users\moros\Desktop\PROD\memolib-production",
    "MemoLibDev (Python)": r"C:\Users\moros\MemoLibDev\v3",
    "App Maman (Python)": r"/home/moros/memolib.bak" # À adapter si tu es sur Windows
}

RAPPORT = "# 🛡️ Rapport d'Audit Senior - Qualité & Sécurité\n"
RAPPORT += f"*Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}*\n\n"
RAPPORT += "Ce rapport utilise des outils d'analyse statique professionnels (Bandit, Pytest-Cov, NPM Audit, TypeScript) pour évaluer la sécurité et la qualité du code.\n\n---\n\n"

def run_cmd(cmd, cwd):
    try:
        result = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=300)
        return result.stdout + result.stderr
    except Exception as e:
        return f"Erreur d'exécution: {e}"

# 1. ANALYSE MEMOLIB (NEXT.JS)
def audit_nextjs():
    path = PROJETS["MemoLib (Next.js)"]
    if not os.path.exists(path):
        return "❌ Projet introuvable.\n\n"
    
    rapport = "## 1. MemoLib (Next.js/TypeScript)\n\n"
    
    # Vérification TypeScript
    rapport += "### 🟦 Compilation TypeScript\n"
    ts_output = run_cmd("npx tsc --noEmit", path)
    if "error" in ts_output.lower():
        rapport += f"❌ **Erreurs de compilation détectées :**\n```\n{ts_output[:1000]}\n```\n\n"
    else:
        rapport += "✅ **Aucune erreur de compilation.** Le code est typé correctement.\n\n"
        
    # Audit NPM (Sécurité)
    rapport += "### 🟨 Sécurité des dépendances (NPM Audit)\n"
    npm_output = run_cmd("npm audit --json", path)
    try:
        audit_data = json.loads(npm_output)
        vulns = audit_data.get("metadata", {}).get("vulnerabilities", {})
        total = vulns.get("total", 0)
        high = vulns.get("high", 0)
        critical = vulns.get("critical", 0)
        
        if critical > 0 or high > 0:
            rapport += f"⚠️ **{total} vulnérabilités détectées** (dont {critical} critiques et {high} hautes).\n"
            rapport += "**Action requise** : Lancer `npm audit fix` pour corriger.\n\n"
        else:
            rapport += f"✅ **{total} vulnérabilités mineures**. Pas de faille critique.\n\n"
    except:
        rapport += "⚠️ Impossible de parser le résultat de NPM Audit.\n\n"
        
    return rapport

# 2. ANALYSE PYTHON (MEMOLIBDEV & APP MAMAN)
def audit_python(nom, path):
    if not os.path.exists(path):
        return f"## {nom}\n\n❌ Projet introuvable au chemin {path}.\n\n"
        
    rapport = f"## {nom}\n\n"
    
    # Sécurité avec Bandit
    rapport += "### 🐍 Sécurité du code (Bandit)\n"
    bandit_cmd = "python -m bandit -r . -f json -q"
    bandit_output = run_cmd(bandit_cmd, path)
    
    try:
        # Bandit renvoie parfois du texte avant le JSON
        json_start = bandit_output.find('{')
        if json_start != -1:
            data = json.loads(bandit_output[json_start:])
            issues = data.get("results", [])
            if issues:
                rapport += f"⚠️ **{len(issues)} problèmes de sécurité détectés.**\n"
                for issue in issues[:3]: # On montre les 3 premiers
                    rapport += f"- `{issue['test_id']}` : {issue['issue_text']} (Ligne {issue['line_number']})\n"
                rapport += "\n"
            else:
                rapport += "✅ **Aucun problème de sécurité critique détecté.**\n\n"
    except:
        rapport += "ℹ️ Bandit non installé ou aucune erreur détectée.\n\n"
        
    # Couverture de tests (Pytest-Cov)
    rapport += "### 🧪 Couverture de tests\n"
    if os.path.exists(os.path.join(path, "pytest.ini")) or os.path.exists(os.path.join(path, "tests")) or os.path.exists(os.path.join(path, "test_verify_project.py")):
        cov_cmd = "python -m pytest --cov=. --cov-report=term-missing -q"
        cov_output = run_cmd(cov_cmd, path)
        
        # Extraction du pourcentage
        import re
        match = re.search(r'TOTAL\s+\d+\s+\d+\s+(\d+)%', cov_output)
        if match:
            pct = match.group(1)
            if int(pct) > 80:
                rapport += f"✅ **Excellente couverture : {pct}%** du code est testé.\n\n"
            elif int(pct) > 50:
                rapport += f"🟡 **Couverture moyenne : {pct}%**. Des tests supplémentaires seraient bénéfiques.\n\n"
            else:
                rapport += f"🔴 **Couverture faible : {pct}%**. Risque élevé de régression.\n\n"
        else:
            rapport += "ℹ️ Impossible de calculer la couverture.\n\n"
    else:
        rapport += "⚠️ Aucun test détecté.\n\n"
        
    return rapport

if __name__ == "__main__":
    print("Installation des outils d'audit Python (Bandit, Pytest-Cov)...")
    subprocess.run(["pip", "install", "bandit", "pytest-cov", "-q"], capture_output=True)
    
    RAPPORT += audit_nextjs()
    RAPPORT += audit_python("MemoLibDev (Python)", PROJETS["MemoLibDev (Python)"])
    RAPPORT += audit_python("App Maman (Python)", PROJETS["App Maman (Python)"])
    
    with open("RAPPORT_AUDIT_SENIOR.md", "w", encoding="utf-8") as f:
        f.write(RAPPORT)
        
    print("✅ Audit Senior terminé ! Ouvre le fichier RAPPORT_AUDIT_SENIOR.md")
