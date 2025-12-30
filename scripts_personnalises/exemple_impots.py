# exemple_impots.py
def generer_message(data):
    """
    Script pour générer une demande aux impôts
    data contient: nom, info_brutes, from_email, to_email
    Retourne (objet, corps)
    """
    info = data.get("info_brutes","").strip()
    objet = "Demande de renseignements - Administration fiscale"
    corps = f"""Madame, Monsieur,

Je me permets de vous solliciter concernant ma situation fiscale, plus précisément :
{info}

Je souhaiterais obtenir des éclaircissements et/ou les documents nécessaires afin de régulariser ma situation.

Je reste à votre disposition pour tout complément d'information.

En vous remerciant par avance de votre attention, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Cordialement,
{data.get('nom','')}
"""
    return objet, corps
