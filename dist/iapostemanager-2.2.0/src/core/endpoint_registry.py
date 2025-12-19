"""Registre centralisé des endpoints"""

class EndpointRegistry:
    def __init__(self):
        self.endpoints = {
            # Authentification
            'auth': {
                'login': {'method': 'POST', 'path': '/login', 'auth': False},
                'logout': {'method': 'POST', 'path': '/logout', 'auth': True}
            },
            
            # API Core
            'api': {
                'health': {'method': 'GET', 'path': '/api/health', 'auth': False},
                'stats': {'method': 'GET', 'path': '/api/stats', 'auth': True},
                'version': {'method': 'GET', 'path': '/api/version', 'auth': False}
            },
            
            # Emails
            'emails': {
                'send': {'method': 'POST', 'path': '/api/emails/send', 'auth': True},
                'history': {'method': 'GET', 'path': '/api/emails/history', 'auth': True},
                'status': {'method': 'GET', 'path': '/api/emails/{id}/status', 'auth': True}
            },
            
            # IA
            'ai': {
                'generate': {'method': 'POST', 'path': '/api/ai/generate', 'auth': True},
                'templates': {'method': 'GET', 'path': '/api/ai/templates', 'auth': True}
            },
            
            # Templates
            'templates': {
                'list': {'method': 'GET', 'path': '/api/templates', 'auth': True},
                'create': {'method': 'POST', 'path': '/api/templates', 'auth': True},
                'update': {'method': 'PUT', 'path': '/api/templates/{id}', 'auth': True},
                'delete': {'method': 'DELETE', 'path': '/api/templates/{id}', 'auth': True}
            },
            
            # Admin
            'admin': {
                'users': {'method': 'GET', 'path': '/api/admin/users', 'auth': True},
                'backup': {'method': 'POST', 'path': '/api/admin/backup', 'auth': True},
                'security': {'method': 'POST', 'path': '/api/admin/security-scan', 'auth': True}
            }
        }
    
    def get_all_endpoints(self):
        """Récupérer tous les endpoints"""
        all_endpoints = []
        for category, endpoints in self.endpoints.items():
            for name, config in endpoints.items():
                all_endpoints.append({
                    'category': category,
                    'name': name,
                    'method': config['method'],
                    'path': config['path'],
                    'auth_required': config['auth']
                })
        return all_endpoints
    
    def get_endpoint_docs(self):
        """Documentation des endpoints"""
        return {
            'version': '3.1',
            'base_url': 'http://localhost:5000',
            'authentication': 'Session-based',
            'response_format': {
                'success': 'boolean',
                'data': 'object|array|null',
                'message': 'string',
                'timestamp': 'number',
                'version': 'string'
            },
            'endpoints': self.get_all_endpoints()
        }

registry = EndpointRegistry()