# Tests integration
import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def test_workflow_email_complet():
    """Test workflow generation + envoi email"""
    try:
        from src.backend.services.ai_generator import generate_email
    except ImportError:
        from services.ai_generator import generate_email
    from models.workflow_manager import creer_workflow, maj_workflow
    
    # Creer workflow
    wf_id = creer_workflow("user1", "test@example.com")
    assert wf_id
    
    # Generer email
    email = generate_email("Demande de reunion", "professionnel")
    assert 'subject' in email
    assert 'body' in email
    
    # Maj workflow
    maj_workflow(wf_id, 4, "generation", email)
    
    print("OK Test integration OK")

def test_attachments():
    """Test pieces jointes"""
    try:
        from src.backend.services.attachment_service import allowed_file
    except ImportError:
        from services.attachment_service import allowed_file
    
    assert allowed_file("doc.pdf") == True
    assert allowed_file("image.jpg") == True
    assert allowed_file("script.exe") == False
    
    print("OK Test attachments OK")

def test_signatures():
    """Test signatures"""
    from models.signature_manager import set_signature, get_signature, format_signature
    
    sig = {
        'nom': 'John Doe',
        'poste': 'CEO',
        'entreprise': 'ACME Corp',
        'telephone': '0123456789',
        'email': 'john@acme.com',
        'site_web': 'https://acme.com',
        'template': 'simple'
    }
    
    set_signature('user1', sig)
    retrieved = get_signature('user1')
    assert retrieved['nom'] == 'John Doe'
    
    html = format_signature(sig)
    assert 'John Doe' in html
    
    print("OK Test signatures OK")

if __name__ == "__main__":
    test_workflow_email_complet()
    test_attachments()
    test_signatures()
    print("\nOK Tous les tests integration OK")
