"""
Tests unitaires pour le module de chiffrement
Vérification du chiffrement AES-256 des données sensibles
"""
import pytest
from pathlib import Path
import json
import tempfile
import os
from src.backend.security.encryption import DataEncryption, encrypt_client_data, decrypt_client_data


@pytest.fixture
def temp_key_file():
    """Crée un fichier de clé temporaire pour les tests"""
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.key') as f:
        temp_path = f.name
    
    yield temp_path
    
    # Nettoyage
    if os.path.exists(temp_path):
        os.unlink(temp_path)


@pytest.fixture
def encryption(temp_key_file):
    """Fixture pour créer une instance de DataEncryption"""
    return DataEncryption(key_file=temp_key_file)


class TestChiffrementTexte:
    """Tests de chiffrement/déchiffrement de texte"""
    
    def test_chiffrement_dechiffrement_simple(self, encryption):
        """Test chiffrement puis déchiffrement"""
        texte_original = "Informations confidentielles du client"
        
        # Chiffrement
        texte_chiffre = encryption.encrypt_text(texte_original)
        assert texte_chiffre != texte_original
        assert len(texte_chiffre) > 0
        
        # Déchiffrement
        texte_dechiffre = encryption.decrypt_text(texte_chiffre)
        assert texte_dechiffre == texte_original
    
    def test_chiffrement_texte_vide(self, encryption):
        """Test avec texte vide"""
        assert encryption.encrypt_text("") == ""
        assert encryption.decrypt_text("") == ""
    
    def test_chiffrement_caracteres_speciaux(self, encryption):
        """Test avec caractères spéciaux et accents"""
        texte = "Maître Jean-François Dupont, avocat à la cour d'appel"
        texte_chiffre = encryption.encrypt_text(texte)
        texte_dechiffre = encryption.decrypt_text(texte_chiffre)
        
        assert texte_dechiffre == texte
    
    def test_dechiffrement_avec_mauvaise_cle(self, temp_key_file):
        """Test échec de déchiffrement avec mauvaise clé"""
        # Chiffrement avec une clé
        enc1 = DataEncryption(key_file=temp_key_file)
        texte_chiffre = enc1.encrypt_text("Secret")
        
        # Tentative de déchiffrement avec une autre clé
        os.unlink(temp_key_file)  # Supprime la clé
        enc2 = DataEncryption(key_file=temp_key_file)  # Génère nouvelle clé
        
        with pytest.raises(ValueError):
            enc2.decrypt_text(texte_chiffre)


class TestChiffrementDictionnaire:
    """Tests de chiffrement de dictionnaires"""
    
    def test_chiffrement_dict_champs_selectionnes(self, encryption):
        """Test chiffrement de champs spécifiques"""
        data = {
            'nom': 'Dupont',
            'prenom': 'Jean',
            'email': 'jean.dupont@example.com',
            'numero_dossier': '2024-0001',  # Ne sera pas chiffré
            'telephone': '0601020304'
        }
        
        champs_a_chiffrer = ['nom', 'prenom', 'email', 'telephone']
        
        # Chiffrement
        data_chiffree = encryption.encrypt_dict(data, champs_a_chiffrer)
        
        # Vérifications
        assert data_chiffree['nom'] != data['nom']
        assert data_chiffree['numero_dossier'] == '2024-0001'  # Pas chiffré
        assert '_encrypted_nom' in data_chiffree
        
        # Déchiffrement
        data_dechiffree = encryption.decrypt_dict(data_chiffree, champs_a_chiffrer)
        assert data_dechiffree['nom'] == 'Dupont'
        assert '_encrypted_nom' not in data_dechiffree
    
    def test_chiffrement_donnees_client(self):
        """Test des fonctions helper encrypt_client_data/decrypt_client_data"""
        client_data = {
            'nom': 'Martin',
            'prenom': 'Sophie',
            'email': 'sophie.martin@example.com',
            'telephone': '0612345678',
            'adresse': '123 Rue de la Paix, 75001 Paris',
            'numero_dossier': '2024-0042',
            'type_affaire': 'Divorce'
        }
        
        # Chiffrement
        client_chiffre = encrypt_client_data(client_data)
        
        # Les données sensibles doivent être chiffrées
        assert client_chiffre['nom'] != 'Martin'
        assert client_chiffre['email'] != 'sophie.martin@example.com'
        
        # Les métadonnées non sensibles restent en clair
        assert client_chiffre.get('type_affaire') == 'Divorce'
        
        # Déchiffrement
        client_dechiffre = decrypt_client_data(client_chiffre)
        assert client_dechiffre['nom'] == 'Martin'
        assert client_dechiffre['email'] == 'sophie.martin@example.com'


class TestChiffrementFichier:
    """Tests de chiffrement de fichiers complets"""
    
    def test_chiffrement_fichier_json(self, encryption):
        """Test chiffrement/déchiffrement d'un fichier JSON"""
        # Création d'un fichier temporaire
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            data = {'secret': 'données confidentielles', 'count': 42}
            json.dump(data, f)
            temp_file = Path(f.name)
        
        try:
            # Lecture contenu original
            with open(temp_file, 'r') as f:
                original_content = f.read()
            
            # Chiffrement du fichier
            encryption.encrypt_file(temp_file)
            
            # Vérification que le contenu est chiffré
            with open(temp_file, 'rb') as f:
                encrypted_content = f.read()
            
            assert encrypted_content != original_content.encode()
            
            # Déchiffrement
            encryption.decrypt_file(temp_file)
            
            # Vérification contenu restauré
            with open(temp_file, 'r') as f:
                restored_data = json.load(f)
            
            assert restored_data == data
        
        finally:
            # Nettoyage
            if temp_file.exists():
                temp_file.unlink()


class TestGenerationCleClient:
    """Tests de génération de clés dérivées"""
    
    def test_generation_cle_pbkdf2(self):
        """Test génération de clé avec PBKDF2"""
        password = "MotDePasseComplexe123!"
        salt = b'salt1234567890ab'  # 16 bytes
        
        key = DataEncryption.generate_client_key(password, salt)
        
        # Vérifications
        assert len(key) == 32  # 256 bits
        assert isinstance(key, bytes)
        
        # Même password + salt = même clé
        key2 = DataEncryption.generate_client_key(password, salt)
        assert key == key2
        
        # Password différent = clé différente
        key3 = DataEncryption.generate_client_key("AutreMotDePasse", salt)
        assert key != key3


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
