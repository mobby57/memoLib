"""
Module de chiffrement avancé pour IA Poste Manager
==================================================

Fournit des fonctions de chiffrement/déchiffrement pour :
- Données personnelles (RGPD)
- Contenu des emails
- Fichiers uploadés
- Journaux d'audit

Algorithmes : AES-256-GCM, RSA-4096, ChaCha20-Poly1305
Conformité : RGPD, ANSSI, ISO 27001
"""

import os
import base64
import hashlib
import secrets
from typing import Union, Optional, Tuple
from datetime import datetime
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt


class DataEncryption:
    """Classe pour chiffrement/déchiffrement de données"""
    
    def __init__(self, master_key: Optional[str] = None):
        """
        Initialise le module de chiffrement
        
        Args:
            master_key: Clé maître (récupérée depuis env si None)
        """
        self.master_key = master_key or os.getenv('MASTER_ENCRYPTION_KEY')
        
        if not self.master_key:
            raise ValueError("MASTER_ENCRYPTION_KEY requise")
        
        # Dériver une clé de 256 bits pour AES
        self.aes_key = self._derive_key(self.master_key.encode())
        
        # Initialiser AES-GCM et ChaCha20
        self.aesgcm = AESGCM(self.aes_key)
        self.chacha = ChaCha20Poly1305(self.aes_key)
    
    def _derive_key(self, password: bytes, salt: Optional[bytes] = None) -> bytes:
        """
        Dérive une clé cryptographique depuis un mot de passe
        
        Args:
            password: Mot de passe source
            salt: Salt (généré si None)
        
        Returns:
            Clé dérivée de 32 bytes
        """
        if salt is None:
            # Salt statique pour la clé maître (en prod, stocker séparément)
            salt = hashlib.sha256(b'iapostemanager_2025').digest()
        
        kdf = Scrypt(
            salt=salt,
            length=32,
            n=2**14,  # Paramètre CPU/memory cost
            r=8,
            p=1,
            backend=default_backend()
        )
        
        return kdf.derive(password)
    
    def encrypt_text(
        self, 
        plaintext: str, 
        algorithm: str = 'AES-GCM'
    ) -> str:
        """
        Chiffre du texte avec AES-GCM ou ChaCha20
        
        Args:
            plaintext: Texte en clair
            algorithm: 'AES-GCM' ou 'CHACHA20'
        
        Returns:
            Texte chiffré encodé en base64 (format: nonce||ciphertext||tag)
        """
        plaintext_bytes = plaintext.encode('utf-8')
        
        # Générer un nonce aléatoire (12 bytes pour AES-GCM)
        nonce = secrets.token_bytes(12)
        
        # Chiffrer
        if algorithm == 'CHACHA20':
            ciphertext = self.chacha.encrypt(nonce, plaintext_bytes, None)
        else:  # AES-GCM par défaut
            ciphertext = self.aesgcm.encrypt(nonce, plaintext_bytes, None)
        
        # Combiner nonce + ciphertext et encoder en base64
        encrypted_data = nonce + ciphertext
        
        return base64.urlsafe_b64encode(encrypted_data).decode('utf-8')
    
    def decrypt_text(
        self, 
        ciphertext_b64: str, 
        algorithm: str = 'AES-GCM'
    ) -> str:
        """
        Déchiffre du texte chiffré
        
        Args:
            ciphertext_b64: Texte chiffré en base64
            algorithm: 'AES-GCM' ou 'CHACHA20'
        
        Returns:
            Texte en clair
        """
        # Décoder base64
        encrypted_data = base64.urlsafe_b64decode(ciphertext_b64.encode('utf-8'))
        
        # Extraire nonce et ciphertext
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        
        # Déchiffrer
        if algorithm == 'CHACHA20':
            plaintext_bytes = self.chacha.decrypt(nonce, ciphertext, None)
        else:  # AES-GCM
            plaintext_bytes = self.aesgcm.decrypt(nonce, ciphertext, None)
        
        return plaintext_bytes.decode('utf-8')
    
    def encrypt_file(
        self, 
        input_path: Union[str, Path], 
        output_path: Optional[Union[str, Path]] = None
    ) -> Path:
        """
        Chiffre un fichier complet
        
        Args:
            input_path: Chemin du fichier source
            output_path: Chemin du fichier chiffré (auto si None)
        
        Returns:
            Chemin du fichier chiffré
        """
        input_path = Path(input_path)
        
        if output_path is None:
            output_path = input_path.with_suffix(input_path.suffix + '.enc')
        else:
            output_path = Path(output_path)
        
        # Lire le fichier
        with open(input_path, 'rb') as f:
            plaintext = f.read()
        
        # Générer nonce
        nonce = secrets.token_bytes(12)
        
        # Chiffrer
        ciphertext = self.aesgcm.encrypt(nonce, plaintext, None)
        
        # Écrire nonce + ciphertext
        with open(output_path, 'wb') as f:
            f.write(nonce + ciphertext)
        
        return output_path
    
    def decrypt_file(
        self, 
        input_path: Union[str, Path], 
        output_path: Optional[Union[str, Path]] = None
    ) -> Path:
        """
        Déchiffre un fichier
        
        Args:
            input_path: Chemin du fichier chiffré
            output_path: Chemin du fichier déchiffré (auto si None)
        
        Returns:
            Chemin du fichier déchiffré
        """
        input_path = Path(input_path)
        
        if output_path is None:
            # Retirer l'extension .enc
            if input_path.suffix == '.enc':
                output_path = input_path.with_suffix('')
            else:
                output_path = input_path.with_suffix('.dec')
        else:
            output_path = Path(output_path)
        
        # Lire le fichier chiffré
        with open(input_path, 'rb') as f:
            encrypted_data = f.read()
        
        # Extraire nonce et ciphertext
        nonce = encrypted_data[:12]
        ciphertext = encrypted_data[12:]
        
        # Déchiffrer
        plaintext = self.aesgcm.decrypt(nonce, ciphertext, None)
        
        # Écrire le fichier déchiffré
        with open(output_path, 'wb') as f:
            f.write(plaintext)
        
        return output_path
    
    def hash_password(self, password: str) -> str:
        """
        Hash un mot de passe avec Scrypt
        
        Args:
            password: Mot de passe en clair
        
        Returns:
            Hash en base64 (format: salt||hash)
        """
        # Générer un salt aléatoire
        salt = secrets.token_bytes(32)
        
        # Dériver le hash
        password_hash = self._derive_key(password.encode(), salt)
        
        # Combiner salt + hash
        combined = salt + password_hash
        
        return base64.urlsafe_b64encode(combined).decode('utf-8')
    
    def verify_password(self, password: str, password_hash_b64: str) -> bool:
        """
        Vérifie un mot de passe contre son hash
        
        Args:
            password: Mot de passe à vérifier
            password_hash_b64: Hash stocké
        
        Returns:
            True si le mot de passe est correct
        """
        try:
            # Décoder
            combined = base64.urlsafe_b64decode(password_hash_b64.encode('utf-8'))
            
            # Extraire salt et hash
            salt = combined[:32]
            stored_hash = combined[32:]
            
            # Recalculer le hash
            computed_hash = self._derive_key(password.encode(), salt)
            
            # Comparaison sécurisée (temps constant)
            return secrets.compare_digest(computed_hash, stored_hash)
            
        except Exception:
            return False
    
    def anonymize_email(self, email: str) -> str:
        """
        Anonymise une adresse email (conformité RGPD)
        
        Args:
            email: Adresse email
        
        Returns:
            Hash de l'email (irréversible)
        """
        return hashlib.sha256(email.encode()).hexdigest()[:16]
    
    def anonymize_text(self, text: str, keep_length: bool = True) -> str:
        """
        Anonymise du texte en préservant optionnellement la longueur
        
        Args:
            text: Texte à anonymiser
            keep_length: Conserver la longueur du texte
        
        Returns:
            Texte anonymisé
        """
        if keep_length:
            # Remplacer par des 'X' en conservant espaces et ponctuation
            anonymized = ''
            for char in text:
                if char.isalnum():
                    anonymized += 'X'
                else:
                    anonymized += char
            return anonymized
        else:
            # Hash simple
            return hashlib.sha256(text.encode()).hexdigest()[:32]


class RSAEncryption:
    """Classe pour chiffrement asymétrique RSA"""
    
    def __init__(self):
        """Initialise le module RSA"""
        self.private_key = None
        self.public_key = None
    
    def generate_keypair(self, key_size: int = 4096) -> Tuple[bytes, bytes]:
        """
        Génère une paire de clés RSA
        
        Args:
            key_size: Taille de la clé (2048, 3072, 4096)
        
        Returns:
            (private_key_pem, public_key_pem)
        """
        # Générer la clé privée
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
        
        # Dériver la clé publique
        self.public_key = self.private_key.public_key()
        
        # Sérialiser en PEM
        private_pem = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return private_pem, public_pem
    
    def load_private_key(self, private_key_pem: bytes) -> None:
        """Charge une clé privée depuis PEM"""
        self.private_key = serialization.load_pem_private_key(
            private_key_pem,
            password=None,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
    
    def load_public_key(self, public_key_pem: bytes) -> None:
        """Charge une clé publique depuis PEM"""
        self.public_key = serialization.load_pem_public_key(
            public_key_pem,
            backend=default_backend()
        )
    
    def encrypt(self, plaintext: str) -> str:
        """
        Chiffre avec la clé publique
        
        Args:
            plaintext: Texte en clair
        
        Returns:
            Texte chiffré en base64
        """
        if not self.public_key:
            raise ValueError("Clé publique non chargée")
        
        plaintext_bytes = plaintext.encode('utf-8')
        
        ciphertext = self.public_key.encrypt(
            plaintext_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return base64.urlsafe_b64encode(ciphertext).decode('utf-8')
    
    def decrypt(self, ciphertext_b64: str) -> str:
        """
        Déchiffre avec la clé privée
        
        Args:
            ciphertext_b64: Texte chiffré en base64
        
        Returns:
            Texte en clair
        """
        if not self.private_key:
            raise ValueError("Clé privée non chargée")
        
        ciphertext = base64.urlsafe_b64decode(ciphertext_b64.encode('utf-8'))
        
        plaintext_bytes = self.private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        
        return plaintext_bytes.decode('utf-8')


# Instances globales
_data_encryption_instance: Optional[DataEncryption] = None


def get_encryption() -> DataEncryption:
    """Récupère l'instance singleton de chiffrement"""
    global _data_encryption_instance
    
    if _data_encryption_instance is None:
        _data_encryption_instance = DataEncryption()
    
    return _data_encryption_instance


# Fonctions utilitaires
def encrypt(text: str) -> str:
    """Raccourci pour chiffrer du texte"""
    return get_encryption().encrypt_text(text)


def decrypt(ciphertext: str) -> str:
    """Raccourci pour déchiffrer du texte"""
    return get_encryption().decrypt_text(ciphertext)
