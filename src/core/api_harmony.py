"""Harmonisation des endpoints API"""
from functools import wraps
from flask import jsonify, request
import time

class APIHarmony:
    def __init__(self):
        self.response_format = {
            'success': True,
            'data': None,
            'message': '',
            'timestamp': None,
            'version': '3.1'
        }
    
    def standardize_response(self, func):
        """Standardiser format réponse"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                
                # Si déjà formaté
                if isinstance(result, tuple) and len(result) == 2:
                    return result
                
                # Standardiser
                if isinstance(result, dict):
                    if 'success' in result:
                        return jsonify(result)
                    
                    response = self.response_format.copy()
                    response['data'] = result
                    response['timestamp'] = time.time()
                    return jsonify(response)
                
                return result
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': str(e),
                    'timestamp': time.time(),
                    'version': '3.1'
                }), 500
        
        return wrapper
    
    def validate_input(self, required_fields=None):
        """Validation input standardisée"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                if request.method in ['POST', 'PUT', 'PATCH']:
                    data = request.get_json()
                    if not data:
                        return jsonify({
                            'success': False,
                            'error': 'JSON data required',
                            'timestamp': time.time()
                        }), 400
                    
                    if required_fields:
                        missing = [f for f in required_fields if f not in data]
                        if missing:
                            return jsonify({
                                'success': False,
                                'error': f'Missing fields: {missing}',
                                'timestamp': time.time()
                            }), 400
                
                return func(*args, **kwargs)
            return wrapper
        return decorator

# Instance globale
api_harmony = APIHarmony()