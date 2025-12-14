# exemple_agence_assainissement.py
def generer_message(data):
    """
    data contient:
      - nom
      - info_brutes
      - from_email
      - to_email
    Retourne (objet, corps)
    """
    info = data.get("info_brutes","").strip()
    objet = "Demande : transmission du rapport d'assainissement"
    corps = f"""Madame, Monsieur,

Je me permets de vous contacter au sujet de la prestation d'assainissement mentionnée ci-dessous :
{info}

Je vous prie de bien vouloir me transmettre le rapport complet relatif à cette prestation, ainsi que tout document justificatif.

En vous remerciant par avance de votre retour, je vous prie d'agréer mes salutations distinguées.

Cordialement,
{data.get('nom','')}
"""
    return objet, corps
