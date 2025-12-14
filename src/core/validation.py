"""Module de validation des données"""
import re
import html

class EmailValidator:
    def __init__(self):
        self.email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    def validate_email(self, email):
        """Valide le format d'un email"""
        if not email:
            return False
        return bool(re.match(self.email_pattern, email)) and len(email) <= 254
    
    def sanitize_input(self, input_str, max_length=500):
        """Sanitise les entrées utilisateur"""
        if not input_str or not isinstance(input_str, str):
            return ""
        
        # Limiter la longueur
        input_str = input_str[:max_length]
        
        # Supprimer les caractères de contrôle
        input_str = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', input_str)
        
        # Échapper les caractères HTML
        input_str = html.escape(input_str, quote=True)
        
        return input_str.strip()
    
    def validate_subject(self, subject):
        """Valide un sujet d'email"""
        if not subject:
            return False, "Le sujet est requis"
        
        if len(subject) > 200:
            return False, "Le sujet est trop long (max 200 caractères)"
        
        return True, "Valide"
    
    def validate_body(self, body):
        """Valide le corps d'un email"""
        if not body:
            return False, "Le corps du message est requis"
        
        if len(body) > 10000:
            return False, "Le message est trop long (max 10000 caractères)"
        
        return True, "Valide"