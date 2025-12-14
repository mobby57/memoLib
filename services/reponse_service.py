# -*- coding: utf-8 -*-
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

REPONSES_FILE = "reponses.json"

def charger_reponses(app_dir):
    filepath = os.path.join(app_dir, REPONSES_FILE)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def sauvegarder_reponse(app_dir, workflow_id, expediteur, sujet, corps):
    """Enregistre une réponse reçue"""
    reponses = charger_reponses(app_dir)
    reponse = {
        'id': len(reponses) + 1,
        'workflow_id': workflow_id,
        'expediteur': expediteur,
        'sujet': sujet,
        'corps': corps,
        'recu_le': datetime.now().isoformat(),
        'lu': False
    }
    reponses.append(reponse)
    
    filepath = os.path.join(app_dir, REPONSES_FILE)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(reponses, f, indent=2, ensure_ascii=False)
    
    return reponse

def marquer_lu(app_dir, reponse_id):
    reponses = charger_reponses(app_dir)
    for r in reponses:
        if r['id'] == reponse_id:
            r['lu'] = True
            break
    
    filepath = os.path.join(app_dir, REPONSES_FILE)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(reponses, f, indent=2, ensure_ascii=False)

def get_reponses_workflow(app_dir, workflow_id):
    reponses = charger_reponses(app_dir)
    return [r for r in reponses if r['workflow_id'] == workflow_id]
