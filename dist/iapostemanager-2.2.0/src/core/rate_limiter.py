"""Rate limiting implementation"""
from functools import wraps
from flask import request, jsonify
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.limits = {
            'default': (100, 60),  # 100 requests per minute
            'auth': (5, 60),       # 5 auth attempts per minute
            'api': (1000, 3600)    # 1000 API calls per hour
        }
    
    def is_allowed(self, key, limit_type='default'):
        max_requests, window = self.limits.get(limit_type, self.limits['default'])
        now = time.time()
        
        # Clean old requests
        self.requests[key] = [req_time for req_time in self.requests[key] 
                              if now - req_time < window]
        
        if len(self.requests[key]) >= max_requests:
            return False
        
        self.requests[key].append(now)
        return True
    
    def limit(self, limit_type='default'):
        def decorator(f):
            @wraps(f)
            def wrapped(*args, **kwargs):
                key = f"{request.remote_addr}:{request.endpoint}"
                if not self.is_allowed(key, limit_type):
                    return jsonify({'error': 'Rate limit exceeded'}), 429
                return f(*args, **kwargs)
            return wrapped
        return decorator

rate_limiter = RateLimiter()
