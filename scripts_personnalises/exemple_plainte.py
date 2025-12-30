# exemple_plainte.py
def generer_message(data):
    """
    Script pour générer une plainte ou réclamation formelle
    data contient: nom, info_brutes, from_email, to_email
    Retourne (objet, corps)
    """
    info = data.get("info_brutes","").strip()
    objet = "Réclamation formelle - Demande d'intervention"
    corps = f"""Madame, Monsieur,

Je me permets de porter à votre connaissance une situation problématique nécessitant votre intervention :
{info}

Cette situation me cause un préjudice important et je sollicite une prise en charge rapide de ce dossier ainsi qu'une réponse détaillée dans les meilleurs délais.

Je me tiens à votre disposition pour tout complément d'information et reste dans l'attente de votre retour.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Cordialement,
{data.get('nom','')}
"""
    return objet, corps
