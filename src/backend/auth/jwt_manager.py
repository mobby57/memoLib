import jwt
import os
from datetime import datetime, timedelta

class JWTManager:
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET', 'jwt-secret-key')
        self.algorithm = 'HS256'
        self.access_token_expire = 15  # minutes
        self.refresh_token_expire = 7  # days
    
    def generate_tokens(self, user_id):
        access_payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(minutes=self.access_token_expire),
            'type': 'access'
        }
        
        refresh_payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=self.refresh_token_expire),
            'type': 'refresh'
        }
        
        access_token = jwt.encode(access_payload, self.secret_key, self.algorithm)
        refresh_token = jwt.encode(refresh_payload, self.secret_key, self.algorithm)
        
        return {'access_token': access_token, 'refresh_token': refresh_token}
    
    def verify_token(self, token):
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None