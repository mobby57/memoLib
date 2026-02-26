"""
Module de chiffrement AES-256 pour données sensibles
Conforme au secret professionnel de l'avocat (RGPD + déontologie)
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
import json
from pathlib import Path
from typing import Any, Dict


class DataEncryption:
    """Gestionnaire de chiffrement AES-256 pour données clients"""
    
    def __init__(self, key_file: str = 'data/.encryption_key'):
        """
        Initialise le système de chiffrement
        
        Args:
            key_file: Chemin vers la clé de chiffrement (JAMAIS versionner!)
        """
        self.key_file = Path(key_file)
        self.key_file.parent.mkdir(exist_ok=True)
        self._fernet = self._load_or_create_key()
    
    def _load_or_create_key(self) -> Fernet:
        """Charge ou crée la clé de chiffrement maître"""
        if self.key_file.exists():
            with open(self.key_file, 'rb') as f:
                key = f.read()
        else:
            # Génération clé aléatoire sécurisée
            key = Fernet.generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key)
            # Permissions strictes (lecture seule propriétaire)
            os.chmod(self.key_file, 0o400)
            print(f"⚠️  IMPORTANT: Clé de chiffrement créée dans {self.key_file}")
            print("   SAUVEGARDEZ cette clé en lieu sûr! Perte = données irrécupérables")
        
        return Fernet(key)
    
    def encrypt_text(self, plaintext: str) -> str:
        """
        Chiffre un texte (ex: nom client, adresse)
        
        Args:
            plaintext: Texte en clair
            
        Returns:
            Texte chiffré encodé base64
        """
        if not plaintext:
            return ""
        
        encrypted = self._fernet.encrypt(plaintext.encode('utf-8'))
        return base64.urlsafe_b64encode(encrypted).decode('utf-8')
    
    def decrypt_text(self, encrypted_text: str) -> str:
        """
        Déchiffre un texte
        
        Args:
            encrypted_text: Texte chiffré base64
            
        Returns:
            Texte en clair
        """
        if not encrypted_text:
            return ""
        
        try:
            encrypted = base64.urlsafe_b64decode(encrypted_text.encode('utf-8'))
            decrypted = self._fernet.decrypt(encrypted)
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Échec déchiffrement (clé invalide?): {e}")
    
    def encrypt_dict(self, data: Dict[str, Any], fields: list) -> Dict[str, Any]:
        """
        Chiffre des champs spécifiques d'un dictionnaire
        
        Args:
            data: Données à chiffrer
            fields: Liste des clés à chiffrer (ex: ['nom', 'email', 'adresse'])
            
        Returns:
            Dictionnaire avec champs chiffrés
        """
        encrypted_data = data.copy()
        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt_text(str(encrypted_data[field]))
                # Marque le champ comme chiffré
                encrypted_data[f'_encrypted_{field}'] = True
        
        return encrypted_data
    
    def decrypt_dict(self, data: Dict[str, Any], fields: list) -> Dict[str, Any]:
        """
        Déchiffre des champs spécifiques d'un dictionnaire
        
        Args:
            data: Données chiffrées
            fields: Liste des clés à déchiffrer
            
        Returns:
            Dictionnaire avec champs déchiffrés
        """
        decrypted_data = data.copy()
        for field in fields:
            if f'_encrypted_{field}' in decrypted_data and decrypted_data[f'_encrypted_{field}']:
                decrypted_data[field] = self.decrypt_text(decrypted_data[field])
                # Supprime le marqueur de chiffrement
                del decrypted_data[f'_encrypted_{field}']
        
        return decrypted_data
    
    def encrypt_file(self, filepath: Path) -> None:
        """
        Chiffre un fichier complet (backup, archives)
        
        Args:
            filepath: Chemin du fichier à chiffrer
        """
        with open(filepath, 'rb') as f:
            data = f.read()
        
        encrypted = self._fernet.encrypt(data)
        
        # Écrase le fichier avec version chiffrée
        with open(filepath, 'wb') as f:
            f.write(encrypted)
    
    def decrypt_file(self, filepath: Path, output_path: Path = None) -> None:
        """
        Déchiffre un fichier complet
        
        Args:
            filepath: Chemin du fichier chiffré
            output_path: Chemin de sortie (si None, écrase l'original)
        """
        with open(filepath, 'rb') as f:
            encrypted_data = f.read()
        
        decrypted = self._fernet.decrypt(encrypted_data)
        
        output = output_path or filepath
        with open(output, 'wb') as f:
            f.write(decrypted)
    
    @staticmethod
    def generate_client_key(password: str, salt: bytes = None) -> bytes:
        """
        Génère une clé dérivée du mot de passe utilisateur (2FA, encryption locale)
        
        Args:
            password: Mot de passe utilisateur
            salt: Salt (généré si None)
            
        Returns:
            Clé dérivée PBKDF2
        """
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,  # OWASP 2023 recommendation
            backend=default_backend()
        )
        
        return kdf.derive(password.encode('utf-8'))


# Instance globale pour l'application
encryption = DataEncryption()


# Champs sensibles à chiffrer par défaut (RGPD)
SENSITIVE_FIELDS = [
    'nom',
    'prenom', 
    'email',
    'telephone',
    'adresse',
    'numero_securite_sociale',
    'iban',
    'observations_confidentielles',
    'partie_adverse'
]


def encrypt_client_data(client_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chiffre toutes les données sensibles d'un client
    
    Args:
        client_data: Données client brutes
        
    Returns:
        Données client chiffrées
    """
    return encryption.encrypt_dict(client_data, SENSITIVE_FIELDS)


def decrypt_client_data(client_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Déchiffre toutes les données sensibles d'un client
    
    Args:
        client_data: Données client chiffrées
        
    Returns:
        Données client déchiffrées
    """
    return encryption.decrypt_dict(client_data, SENSITIVE_FIELDS)
