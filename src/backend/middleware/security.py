from flask import request, jsonify
from functools import wraps
import time
from collections import defaultdict

class SecurityMiddleware:
    def __init__(self, app=None):
        self.app = app
        self.rate_limits = defaultdict(list)
        
    def init_app(self, app):
        self.app = app
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        # Rate limiting
        client_ip = request.remote_addr
        current_time = time.time()
        
        # Clean old requests (older than 1 minute)
        self.rate_limits[client_ip] = [
            req_time for req_time in self.rate_limits[client_ip] 
            if current_time - req_time < 60
        ]
        
        # Check rate limit (60 requests per minute)
        if len(self.rate_limits[client_ip]) >= 60:
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        self.rate_limits[client_ip].append(current_time)
    
    def after_request(self, response):
        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # CORS for production
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5000'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response