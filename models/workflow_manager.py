# -*- coding: utf-8 -*-
import json
import os
from datetime import datetime

WORKFLOW_FILE = "data/workflow_history.json"

def charger_historique(app_dir='.'):
    filepath = os.path.join(app_dir, WORKFLOW_FILE)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def sauvegarder_historique(app_dir, historique):
    filepath = os.path.join(app_dir, WORKFLOW_FILE)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(historique, f, indent=2, ensure_ascii=False)

def creer_workflow(user_id, destinataire, app_dir='.'):
    """Etape 1: Identification utilisateur"""
    historique = charger_historique(app_dir)
    workflow = {
        'id': len(historique) + 1,
        'user_id': user_id,
        'destinataire': destinataire,
        'etape_actuelle': 1,
        'statut': 'identification',
        'input_brut': None,
        'input_normalise': None,
        'mail_genere': None,
        'valide': False,
        'envoye': False,
        'archive': False,
        'notifie': False,
        'cree_le': datetime.now().isoformat()
    }
    historique.append(workflow)
    sauvegarder_historique(app_dir, historique)
    return workflow['id']

def maj_workflow(workflow_id, etape, statut, data=None, app_dir='.'):
    """Met a jour un workflow"""
    historique = charger_historique(app_dir)
    for w in historique:
        if w['id'] == workflow_id:
            w['etape_actuelle'] = etape
            w['statut'] = statut
            if data:
                w.update(data)
            w['maj_le'] = datetime.now().isoformat()
            break
    sauvegarder_historique(app_dir, historique)

def get_workflow(workflow_id, app_dir='.'):
    historique = charger_historique(app_dir)
    return next((w for w in historique if w['id'] == workflow_id), None)

def get_all_workflows(app_dir='.'):
    return charger_historique(app_dir)
