# Test workflow complet
import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.workflow_manager import creer_workflow, maj_workflow, get_workflow

def test_workflow_complet():
    # Etape 1: Identification
    wf_id = creer_workflow("user123", "test@example.com")
    assert wf_id is not None
    
    # Etape 2: Collecte
    maj_workflow(wf_id, 2, "collecte", {"contexte": "Test email"})
    wf = get_workflow(wf_id)
    assert wf['etape_actuelle'] == 2
    
    # Etape 3: Normalisation
    maj_workflow(wf_id, 3, "normalisation", {"destinataire": "test@example.com"})
    
    # Etape 4: Generation IA
    maj_workflow(wf_id, 4, "generation", {"objet": "Test", "corps": "Contenu"})
    
    # Etape 5: Preview
    maj_workflow(wf_id, 5, "preview", {"valide": True})
    
    # Etape 6: Envoi
    maj_workflow(wf_id, 6, "envoi", {"statut": "envoye"})
    
    # Etape 7: Archive
    maj_workflow(wf_id, 7, "archive", {"archive_id": "arch123"})
    
    # Etape 8: Notification
    maj_workflow(wf_id, 8, "notification", {"notif_envoyee": True})
    
    # Etape 9: Reponses
    maj_workflow(wf_id, 9, "termine", {"workflow_termine": True})
    
    wf_final = get_workflow(wf_id)
    assert wf_final['etape_actuelle'] == 9
    assert wf_final['statut'] == 'termine'

if __name__ == "__main__":
    test_workflow_complet()
    print("OK Test workflow OK")
