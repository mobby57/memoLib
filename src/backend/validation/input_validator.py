from flask import request, jsonify
from functools import wraps
import re

class InputValidator:
    @staticmethod
    def validate_email(email):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_required_fields(required_fields):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                data = request.get_json() or {}
                missing = [field for field in required_fields if field not in data]
                if missing:
                    return jsonify({'error': f'Missing fields: {missing}'}), 400
                return f(*args, **kwargs)
            return decorated
        return decorator
    
    @staticmethod
    def sanitize_input(text):
        if not isinstance(text, str):
            return text
        # Remove potential XSS
        text = re.sub(r'<script.*?</script>', '', text, flags=re.IGNORECASE)
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
        return text.strip()