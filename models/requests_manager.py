# -*- coding: utf-8 -*-
import json
import os
from datetime import datetime
from crypto_utils import sanitize_input

REQUESTS_FILE = "requests.json"

def charger_demandes(app_dir):
    filepath = os.path.join(app_dir, REQUESTS_FILE)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def sauvegarder_demandes(app_dir, demandes):
    filepath = os.path.join(app_dir, REQUESTS_FILE)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(demandes, f, indent=2, ensure_ascii=False)

def ajouter_demande(app_dir, texte_brut, sujet, corps, destinataire, statut='brouillon'):
    demandes = charger_demandes(app_dir)
    demande = {
        'id': len(demandes) + 1,
        'texte_brut': sanitize_input(texte_brut, 5000),
        'sujet': sanitize_input(sujet, 500),
        'corps': sanitize_input(corps, 10000),
        'destinataire': sanitize_input(destinataire, 254),
        'statut': statut,
        'cree_le': datetime.now().isoformat()
    }
    demandes.append(demande)
    sauvegarder_demandes(app_dir, demandes)
    return demande

def mettre_a_jour_statut(app_dir, demande_id, statut):
    demandes = charger_demandes(app_dir)
    for d in demandes:
        if d['id'] == demande_id:
            d['statut'] = statut
            d['envoye_le'] = datetime.now().isoformat()
            break
    sauvegarder_demandes(app_dir, demandes)
