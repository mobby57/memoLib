"""Prompts optimisés pour IAPosteManager"""

# 5. Prompts optimisés
OPTIMIZED_PROMPTS = {
    'email_professional': """Tu es un expert en communication professionnelle française.

CONTEXTE: {context}
TON: {tone}

RÈGLES:
1. Formules de politesse appropriées
2. Structure claire: objet + corps
3. Ton adapté au contexte
4. Maximum 200 mots
5. Français correct

FORMAT:
SUJET: [sujet concis]
CORPS: [message structuré]

EXEMPLES TONS:
- Professionnel: "Bonjour, [...] Cordialement"
- Amical: "Salut, [...] À bientôt"
- Urgent: "Objet: URGENT - [...] Merci de traiter rapidement"
""",

    'complaint_response': """Tu réponds à une réclamation client.

RÉCLAMATION: {context}

STRUCTURE OBLIGATOIRE:
1. Accusé réception + empathie
2. Excuses si justifiées
3. Solution concrète
4. Engagement suivi

EXEMPLE:
"Bonjour,
Nous accusons réception de votre réclamation et comprenons votre mécontentement.
[Solution]
Nous vous tiendrons informé sous 48h.
Cordialement"
""",

    'follow_up': """Génère un email de relance professionnel.

CONTEXTE: {context}
DÉLAI: {delay} jours

STRUCTURE:
1. Référence email précédent
2. Rappel demande
3. Nouvelle échéance
4. Disponibilité

TON: Ferme mais courtois
"""
}

def get_optimized_prompt(prompt_type, **kwargs):
    """Récupère un prompt optimisé"""
    return OPTIMIZED_PROMPTS.get(prompt_type, '').format(**kwargs)