# Gestion signatures personnalisees
import json
import os

SIGNATURES_FILE = "data/signatures.json"

def load_signatures():
    if not os.path.exists(SIGNATURES_FILE):
        return {}
    with open(SIGNATURES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_signatures(signatures):
    os.makedirs("data", exist_ok=True)
    with open(SIGNATURES_FILE, 'w', encoding='utf-8') as f:
        json.dump(signatures, f, indent=2, ensure_ascii=False)

def get_signature(user_id):
    """Recupere signature utilisateur"""
    signatures = load_signatures()
    return signatures.get(str(user_id), {
        'nom': '',
        'poste': '',
        'entreprise': '',
        'telephone': '',
        'email': '',
        'site_web': '',
        'template': 'simple'
    })

def set_signature(user_id, data):
    """Definit signature utilisateur"""
    signatures = load_signatures()
    signatures[str(user_id)] = data
    save_signatures(signatures)
    return True

def format_signature(signature):
    """Formate signature en HTML"""
    if signature['template'] == 'simple':
        return f"""
<br><br>
--<br>
{signature['nom']}<br>
{signature['poste']}<br>
{signature['entreprise']}<br>
{signature['telephone']} | {signature['email']}
"""
    elif signature['template'] == 'professionnel':
        return f"""
<br><br>
<div style="border-top: 2px solid #0066cc; padding-top: 10px;">
    <strong>{signature['nom']}</strong><br>
    <em>{signature['poste']}</em><br>
    {signature['entreprise']}<br>
    📞 {signature['telephone']} | ✉️ {signature['email']}<br>
    🌐 <a href="{signature['site_web']}">{signature['site_web']}</a>
</div>
"""
    return ""
