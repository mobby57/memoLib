from cryptography.fernet import Fernet
import base64
import os
import json
from ..core.config import Config

class SecureCredentialManager:
    def __init__(self):
        self.key_file = os.path.join(Config.APP_DIR, 'imap_key.key')
        self.creds_file = os.path.join(Config.APP_DIR, 'imap_creds.enc')
        
    def _get_or_create_key(self):
        if os.path.exists(self.key_file):
            with open(self.key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            os.makedirs(os.path.dirname(self.key_file), exist_ok=True)
            with open(self.key_file, 'wb') as f:
                f.write(key)
            return key
    
    def encrypt_imap_credentials(self, email, password, imap_server):
        key = self._get_or_create_key()
        fernet = Fernet(key)
        
        data = {
            'email': email,
            'password': password,
            'imap_server': imap_server
        }
        
        encrypted_data = fernet.encrypt(json.dumps(data).encode())
        
        with open(self.creds_file, 'wb') as f:
            f.write(encrypted_data)
        
        return True
    
    def decrypt_imap_credentials(self):
        if not os.path.exists(self.creds_file) or not os.path.exists(self.key_file):
            return None
            
        try:
            with open(self.key_file, 'rb') as f:
                key = f.read()
            
            fernet = Fernet(key)
            
            with open(self.creds_file, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = fernet.decrypt(encrypted_data)
            return json.loads(decrypted_data.decode())
        except:
            return None