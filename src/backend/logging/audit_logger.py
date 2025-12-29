import json
import logging
from datetime import datetime
from flask import request, g

class AuditLogger:
    def __init__(self, log_file='logs/audit.log'):
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(logging.INFO)
        
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter('%(asctime)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
    
    def log_action(self, action, user_id=None, details=None):
        audit_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'user_id': user_id or getattr(g, 'user_id', None),
            'ip_address': request.remote_addr if request else None,
            'user_agent': request.headers.get('User-Agent') if request else None,
            'details': details
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_login(self, user_id, success=True):
        self.log_action('login', user_id, {'success': success})
    
    def log_api_call(self, endpoint, method, status_code):
        self.log_action('api_call', details={
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code
        })