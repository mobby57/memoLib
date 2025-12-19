import re
from typing import Any, Optional, Dict
from datetime import datetime

class EmailValidator:
    @staticmethod
    def validate_email(email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_domain(domain: str) -> bool:
        pattern = r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, domain))
    
    @staticmethod
    def sanitize_input(text: str, max_length: int = 1000) -> str:
        if not isinstance(text, str):
            return ""
        
        # Remove dangerous characters
        text = re.sub(r'[<>"\']', '', text)
        
        # Limit length
        return text[:max_length].strip()
    
    @staticmethod
    def validate_date_range(date_from: str, date_to: str) -> Dict[str, Any]:
        try:
            if date_from:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
            else:
                from_date = None
                
            if date_to:
                to_date = datetime.strptime(date_to, '%Y-%m-%d')
            else:
                to_date = None
            
            if from_date and to_date and from_date > to_date:
                return {'valid': False, 'error': 'Date de début postérieure à la date de fin'}
            
            return {'valid': True, 'from_date': from_date, 'to_date': to_date}
        except ValueError:
            return {'valid': False, 'error': 'Format de date invalide'}
    
    @staticmethod
    def validate_filter_params(params: Dict) -> Dict[str, Any]:
        errors = []
        
        # Validate email if provided
        if 'sender' in params and params['sender']:
            if '@' in params['sender'] and not EmailValidator.validate_email(params['sender']):
                errors.append('Format email expéditeur invalide')
        
        # Validate domain
        if 'domain' in params and params['domain']:
            if not EmailValidator.validate_domain(params['domain']):
                errors.append('Format domaine invalide')
        
        # Validate date range
        if 'date_from' in params or 'date_to' in params:
            date_validation = EmailValidator.validate_date_range(
                params.get('date_from'), 
                params.get('date_to')
            )
            if not date_validation['valid']:
                errors.append(date_validation['error'])
        
        # Validate category and priority
        valid_categories = ['finance', 'meeting', 'urgent', 'marketing', 'general']
        valid_priorities = ['high', 'medium', 'low']
        
        if 'category' in params and params['category'] and params['category'] not in valid_categories:
            errors.append('Catégorie invalide')
        
        if 'priority' in params and params['priority'] and params['priority'] not in valid_priorities:
            errors.append('Priorité invalide')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }