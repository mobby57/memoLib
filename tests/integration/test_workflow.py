"""Tests d'intégration - Workflow complet"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.core.crypto_utils import *
from src.security.audit_trail import AuditTrail
from src.analytics.dashboard import AnalyticsDashboard

def test_workflow_complet_inscription(temp_dir, master_password, test_email, test_app_password, test_api_key):
    """Test workflow complet d'inscription"""
    # 1. Sauvegarder credentials
    assert sauvegarder_app_password(test_app_password, master_password, temp_dir, test_email)
    assert sauvegarder_api_key(test_api_key, "org-test", master_password, temp_dir)
    
    # 2. Vérifier existence
    assert credentials_existent(temp_dir)
    assert api_key_existe(temp_dir)
    
    # 3. Récupérer credentials
    pwd, email = recuperer_app_password(master_password, temp_dir)
    assert pwd == test_app_password
    assert email == test_email
    
    # 4. Audit trail
    audit = AuditTrail(temp_dir)
    audit.log_event("inscription", test_email, {"success": True})
    events = audit.get_events(user_email=test_email)
    assert len(events) == 1

def test_workflow_analytics(temp_dir):
    """Test workflow analytics"""
    analytics = AnalyticsDashboard(temp_dir)
    
    # Enregistrer envois
    analytics.enregistrer_envoi("dest1@test.com", "success")
    analytics.enregistrer_envoi("dest2@test.com", "success")
    analytics.enregistrer_envoi("dest3@test.com", "failure", "SMTP error")
    
    # Vérifier stats
    stats = analytics.get_stats_envois(jours=1)
    assert stats['total'] == 3
    assert stats['success'] == 2
    assert stats['echecs'] == 1
    assert stats['taux_succes'] > 60

def test_workflow_ia_generation(temp_dir):
    """Test workflow génération IA"""
    analytics = AnalyticsDashboard(temp_dir)
    
    # Enregistrer générations
    analytics.enregistrer_generation_ia(150, "gpt-3.5-turbo", True)
    analytics.enregistrer_generation_ia(200, "gpt-3.5-turbo", True)
    
    # Vérifier stats
    stats = analytics.get_stats_ia(jours=1)
    assert stats['total_generations'] == 2
    assert stats['total_tokens'] == 350
    assert stats['success_rate'] == 100.0
