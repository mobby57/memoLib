"""
Security module - AES-256 encryption/decryption
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import hashlib


def get_encryption_key():
    """Get or generate encryption key"""
    key = os.getenv('ENCRYPTION_KEY')
    if not key:
        # Generate a key from a secret phrase for development
        key = hashlib.sha256(b'dev-encryption-key-change-in-production').digest()
        return key
    return base64.b64decode(key)


def encrypt_data(data: str) -> str:
    """
    Encrypt data using AES-256-CBC
    
    Args:
        data: String to encrypt
        
    Returns:
        Base64 encoded encrypted string with IV prepended
    """
    key = get_encryption_key()
    
    # Generate random IV
    iv = os.urandom(16)
    
    # Create cipher
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    
    # Pad data to block size
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(data.encode()) + padder.finalize()
    
    # Encrypt
    encrypted = encryptor.update(padded_data) + encryptor.finalize()
    
    # Prepend IV and encode
    result = base64.b64encode(iv + encrypted).decode()
    
    return result


def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt data using AES-256-CBC
    
    Args:
        encrypted_data: Base64 encoded encrypted string with IV prepended
        
    Returns:
        Decrypted string
    """
    key = get_encryption_key()
    
    # Decode
    encrypted_bytes = base64.b64decode(encrypted_data)
    
    # Extract IV and encrypted data
    iv = encrypted_bytes[:16]
    encrypted = encrypted_bytes[16:]
    
    # Create cipher
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    
    # Decrypt
    padded_data = decryptor.update(encrypted) + decryptor.finalize()
    
    # Unpad
    unpadder = padding.PKCS7(128).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()
    
    return data.decode()
