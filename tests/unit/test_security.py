"""Tests unitaires pour modules de sécurité"""
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.security.two_factor_auth import TwoFactorAuth
from src.security.audit_trail import AuditTrail
from src.security.key_rotation import KeyRotation

def test_2fa_generer_secret(temp_dir, test_email):
    """Test génération secret 2FA"""
    tfa = TwoFactorAuth()
    secret = tfa.generate_secret(test_email)
    uri = tfa.get_qr_code(test_email, secret)
    assert secret is not None
    assert len(secret) == 32
    assert "SecureVault" in uri or "base64" in uri  # QR code is base64 encoded

def test_2fa_verifier_code(temp_dir, test_email):
    """Test vérification code 2FA"""
    tfa = TwoFactorAuth()
    secret = tfa.generate_secret(test_email)
    
    import pyotp
    totp = pyotp.TOTP(secret)
    code = totp.now()
    
    assert tfa.verify_token(secret, code)
    assert not tfa.verify_token(secret, "000000")

def test_audit_log_event(temp_dir, test_email):
    """Test enregistrement événement audit"""
    audit = AuditTrail(temp_dir)
    audit.log_event("login", test_email, {"ip": "127.0.0.1"}, "success")
    
    events = audit.get_events(user_email=test_email)
    assert len(events) == 1
    assert events[0]['event_type'] == "login"
    assert events[0]['status'] == "success"

def test_audit_get_events_filtered(temp_dir, test_email):
    """Test récupération événements filtrés"""
    audit = AuditTrail(temp_dir)
    audit.log_event("login", test_email, {}, "success")
    audit.log_event("logout", test_email, {}, "success")
    audit.log_event("login", "other@test.com", {}, "failure")
    
    events = audit.get_events(user_email=test_email)
    assert len(events) == 2
    
    events = audit.get_events(event_type="login")
    assert len(events) == 2

def test_key_rotation_besoin(temp_dir):
    """Test vérification besoin rotation"""
    kr = KeyRotation(temp_dir, rotation_days=90)
    assert kr.besoin_rotation()
