"""
Validation utilities for iaPosteManager
"""
import re
from typing import Optional, Dict, Any

__all__ = ['Validator', 'EmailValidator']


class Validator:
    """Validation class for common validation tasks"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password(password: str) -> Dict[str, Any]:
        """Validate password strength"""
        result = {
            'valid': True,
            'errors': []
        }
        
        if len(password) < 8:
            result['valid'] = False
            result['errors'].append('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one digit')
        
        return result
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format"""
        if not username or len(username) < 3:
            return False
        
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, username))
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize user input"""
        if not text:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\']', '', text)
        return sanitized.strip()


class EmailValidator(Validator):
    """Extended validator for email-related operations"""
    
    def sanitize_input(self, text: str, max_length: Optional[int] = None) -> str:
        """
        Sanitize user input with optional length limit
        
        Args:
            text: Input text to sanitize
            max_length: Maximum allowed length (optional)
            
        Returns:
            Sanitized string
        """
        if not text:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\']', '', str(text))
        sanitized = sanitized.strip()
        
        # Apply length limit if specified
        if max_length and len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized
