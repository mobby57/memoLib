from flask import request, make_response
import os
from datetime import datetime, timedelta

class StaticCacheMiddleware:
    def __init__(self, app=None):
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        app.after_request(self.add_cache_headers)
    
    def add_cache_headers(self, response):
        if request.endpoint == 'static':
            # Cache static files for 1 year
            response.cache_control.max_age = 31536000
            response.cache_control.public = True
            
            # Add ETag for better caching
            if response.data:
                etag = str(hash(response.data))
                response.set_etag(etag)
                
                if request.headers.get('If-None-Match') == etag:
                    return make_response('', 304)
        
        elif request.path.startswith('/api/'):
            # No cache for API endpoints
            response.cache_control.no_cache = True
            response.cache_control.no_store = True
        
        return response