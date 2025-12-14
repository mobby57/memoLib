"""Gestionnaire JWT simple"""
import json
import base64
import hmac
import hashlib
from datetime import datetime, timedelta

class JWTManager:
    def __init__(self, secret_key="default-secret"):
        self.secret_key = secret_key
    
    def generate_token(self, payload, expires_in=3600):
        """Génère un token JWT simple"""
        # Header
        header = {
            "alg": "HS256",
            "typ": "JWT"
        }
        
        # Payload avec expiration
        payload['exp'] = (datetime.now() + timedelta(seconds=expires_in)).timestamp()
        payload['iat'] = datetime.now().timestamp()
        
        # Encoder
        header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
        
        # Signature
        message = f"{header_encoded}.{payload_encoded}"
        signature = hmac.new(
            self.secret_key.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        return f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    
    def verify_token(self, token):
        """Vérifie un token JWT"""
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return False, None
            
            header_encoded, payload_encoded, signature_encoded = parts
            
            # Vérifier la signature
            message = f"{header_encoded}.{payload_encoded}"
            expected_signature = hmac.new(
                self.secret_key.encode(),
                message.encode(),
                hashlib.sha256
            ).digest()
            expected_signature_encoded = base64.urlsafe_b64encode(expected_signature).decode().rstrip('=')
            
            if signature_encoded != expected_signature_encoded:
                return False, None
            
            # Décoder le payload
            payload_padded = payload_encoded + '=' * (4 - len(payload_encoded) % 4)
            payload = json.loads(base64.urlsafe_b64decode(payload_padded).decode())
            
            # Vérifier l'expiration
            if payload.get('exp', 0) < datetime.now().timestamp():
                return False, None
            
            return True, payload
            
        except Exception:
            return False, None

# Instance globale
jwt_manager = JWTManager()