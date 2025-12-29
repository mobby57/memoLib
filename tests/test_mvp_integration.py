"""
Tests d'intégration du MVP
===========================

Tests end-to-end du workflow complet :
1. Message entrant → Workspace créé
2. Questions générées si info manquante
3. Formulaire généré
4. Soumission → Réponse générée
"""

import pytest
import asyncio
from datetime import datetime

from src.backend.mvp_orchestrator import get_orchestrator, Channel
from src.backend.services.workspace_service import WorkspaceType, WorkspaceStatus


@pytest.fixture
async def orchestrator():
    """Fixture orchestrateur"""
    orch = get_orchestrator()
    await orch.initialize()
    return orch


@pytest.mark.asyncio
async def test_complete_workflow_with_missing_info(orchestrator):
    """
    Test workflow complet : message incomplet → questions → formulaire → réponse
    """
    
    # 1. Message entrant incomplet
    result = await orchestrator.process_incoming_message(
        content="Je voudrais faire une demande MDPH",
        subject="Demande MDPH",
        sender="test@example.com",
        channel=Channel.EMAIL
    )
    
    assert result['success'] is True
    assert 'workspace_id' in result
    
    workspace_id = result['workspace_id']
    processing_result = result['result']
    
    # 2. Vérifier que des questions ont été générées
    assert processing_result['needs_user_input'] is True
    assert processing_result['status'] == WorkspaceStatus.WAITING_INFO.value
    assert 'questions' in processing_result
    assert 'form' in processing_result
    
    questions = processing_result['questions']
    form = processing_result['form']
    
    print(f"\n✅ Workspace créé : {workspace_id}")
    print(f"✅ Questions générées : {len(questions)}")
    print(f"✅ Formulaire généré : {form.get('form_id')}")
    
    # 3. Simuler soumission du formulaire
    form_responses = {
        'nom': 'Dupont',
        'prenom': 'Jean',
        'date_naissance': '1980-01-01',
        'adresse': '123 rue de la Paix, Paris'
    }
    
    form_result = await orchestrator.submit_form_response(
        workspace_id=workspace_id,
        form_id=form['form_id'],
        responses=form_responses
    )
    
    assert form_result['success'] is True
    
    print(f"✅ Formulaire soumis avec succès")


@pytest.mark.asyncio
async def test_complete_workflow_with_full_info(orchestrator):
    """
    Test workflow complet : message complet → réponse directe
    """
    
    # Message avec toutes les infos
    result = await orchestrator.process_incoming_message(
        content="""
        Bonjour,
        
        Je souhaite faire une demande de reconnaissance de handicap MDPH.
        
        Nom : Dupont
        Prénom : Jean
        Date de naissance : 01/01/1980
        Adresse : 123 rue de la Paix, 75001 Paris
        Téléphone : 0123456789
        
        Je suis atteint de troubles moteurs suite à un accident.
        """,
        subject="Demande MDPH - Reconnaissance handicap",
        sender="jean.dupont@example.com",
        channel=Channel.EMAIL
    )
    
    assert result['success'] is True
    
    processing_result = result['result']
    
    # Vérifier qu'une réponse a été générée directement
    # (ou que très peu de questions sont posées)
    assert 'response' in processing_result or 'questions' in processing_result
    
    print(f"\n✅ Workflow complet testé avec succès")


@pytest.mark.asyncio
async def test_multi_channel_support(orchestrator):
    """
    Test support multi-canal
    """
    
    channels_to_test = [
        Channel.EMAIL,
        Channel.CHAT,
        Channel.SMS,
        Channel.WEB_FORM
    ]
    
    for channel in channels_to_test:
        result = await orchestrator.process_incoming_message(
            content=f"Test message via {channel.value}",
            subject="Test",
            sender="test@example.com",
            channel=channel
        )
        
        assert result['success'] is True
        print(f"✅ Canal {channel.value} supporté")


@pytest.mark.asyncio
async def test_workspace_type_detection(orchestrator):
    """
    Test détection automatique du type de workspace
    """
    
    test_cases = [
        ("Demande MDPH pour handicap", WorkspaceType.MDPH),
        ("Consultation juridique avocat", WorkspaceType.LEGAL),
        ("Demande certificat médical", WorkspaceType.MEDICAL),
        ("Demande carte d'identité mairie", WorkspaceType.ADMINISTRATIVE)
    ]
    
    for content, expected_type in test_cases:
        result = await orchestrator.process_incoming_message(
            content=content,
            subject=content,
            sender="test@example.com"
        )
        
        workspace = result['workspace']
        detected_type = workspace.get('workspace_type')
        
        assert detected_type == expected_type.value
        print(f"✅ Type détecté : {detected_type} pour '{content[:30]}...'")


@pytest.mark.asyncio
async def test_security_integration(orchestrator):
    """
    Test intégration de la sécurité
    """
    
    # Vérifier que les services de sécurité sont initialisés
    assert orchestrator.secrets_manager is not None
    assert orchestrator.encryption is not None
    assert orchestrator.security is not None
    
    # Vérifier l'anonymisation
    test_email = "test@example.com"
    anonymized = orchestrator.encryption.anonymize_email(test_email)
    
    assert anonymized != test_email
    assert len(anonymized) == 64  # SHA-256 hex
    
    print(f"✅ Sécurité intégrée : {test_email} → {anonymized[:16]}...")


@pytest.mark.asyncio
async def test_performance_logging(orchestrator):
    """
    Test logging des performances
    """
    
    start = datetime.utcnow()
    
    result = await orchestrator.process_incoming_message(
        content="Test performance",
        sender="test@example.com"
    )
    
    assert result['success'] is True
    assert 'processing_time' in result
    
    processing_time = result['processing_time']
    assert processing_time > 0
    assert processing_time < 10  # Should be < 10s
    
    print(f"✅ Performance : {processing_time:.3f}s")


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v', '-s'])
