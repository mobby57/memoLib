"""Tests unitaires pour crypto_utils"""
import pytest
import os
import tempfile
from src.core.crypto_utils import (
    sauvegarder_app_password,
    recuperer_app_password,
    supprimer_credentials,
    valider_email,
    valider_force_mot_de_passe
)

@pytest.fixture
def temp_dir():
    """Créer un répertoire temporaire pour les tests"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir

def test_save_and_retrieve_password(temp_dir):
    """Test sauvegarde et récupération de mot de passe"""
    master_pwd = "TestPassword123!"
    app_pwd = "test_app_password"
    email = "test@example.com"
    
    # Sauvegarder
    assert sauvegarder_app_password(app_pwd, master_pwd, temp_dir, email)
    
    # Récupérer
    retrieved_pwd, retrieved_email = recuperer_app_password(master_pwd, temp_dir)
    assert retrieved_pwd == app_pwd
    assert retrieved_email == email

def test_wrong_master_password(temp_dir):
    """Test avec mauvais mot de passe maître"""
    master_pwd = "TestPassword123!"
    app_pwd = "test_app_password"
    
    sauvegarder_app_password(app_pwd, master_pwd, temp_dir)
    
    # Mauvais mot de passe
    retrieved_pwd, _ = recuperer_app_password("WrongPassword", temp_dir)
    assert retrieved_pwd is None

def test_delete_credentials(temp_dir):
    """Test suppression des credentials"""
    master_pwd = "TestPassword123!"
    app_pwd = "test_app_password"
    
    sauvegarder_app_password(app_pwd, master_pwd, temp_dir)
    assert supprimer_credentials(temp_dir)
    
    # Vérifier suppression
    retrieved_pwd, _ = recuperer_app_password(master_pwd, temp_dir)
    assert retrieved_pwd is None

def test_email_validation():
    """Test validation email"""
    assert valider_email("test@example.com")
    assert valider_email("user.name+tag@example.co.uk")
    assert not valider_email("invalid.email")
    assert not valider_email("@example.com")
    assert not valider_email("test@")

def test_password_strength():
    """Test validation force mot de passe"""
    # Valide
    valid, _ = valider_force_mot_de_passe("TestPass123!")
    assert valid
    
    # Trop court
    valid, msg = valider_force_mot_de_passe("Test1!")
    assert not valid
    assert "8 caractères" in msg
    
    # Pas de majuscule
    valid, msg = valider_force_mot_de_passe("testpass123!")
    assert not valid
    assert "majuscule" in msg
    
    # Pas de chiffre
    valid, msg = valider_force_mot_de_passe("TestPassword!")
    assert not valid
    assert "chiffre" in msg
