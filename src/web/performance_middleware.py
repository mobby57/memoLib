"""Middleware de performance pour Flask"""
from functools import wraps
from flask import request, jsonify, g
import time
import gzip
import io

class PerformanceMiddleware:
    def __init__(self, app=None):
        self.app = app
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        g.start_time = time.time()
    
    def after_request(self, response):
        # Ajouter temps de réponse
        if hasattr(g, 'start_time'):
            response.headers['X-Response-Time'] = f"{(time.time() - g.start_time) * 1000:.2f}ms"
        
        # Compression gzip pour réponses > 1KB
        if (response.content_length and response.content_length > 1024 and
            'gzip' in request.headers.get('Accept-Encoding', '') and
            response.mimetype.startswith('application/json')):
            
            gzip_buffer = io.BytesIO()
            with gzip.GzipFile(fileobj=gzip_buffer, mode='wb') as gzip_file:
                gzip_file.write(response.get_data())
            
            response.set_data(gzip_buffer.getvalue())
            response.headers['Content-Encoding'] = 'gzip'
            response.headers['Content-Length'] = len(response.get_data())
        
        # Headers de cache pour ressources statiques
        if request.endpoint and 'static' in request.endpoint:
            response.headers['Cache-Control'] = 'public, max-age=3600'
        
        return response

def cache_response(timeout=300):
    """Décorateur pour cache simple"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            cache_key = f"{request.path}_{request.args}"
            # Implémentation cache simple ici
            return f(*args, **kwargs)
        return wrapper
    return decorator

def async_route(f):
    """Décorateur pour routes asynchrones"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    return wrapper