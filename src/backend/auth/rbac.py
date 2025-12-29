from functools import wraps
from flask import jsonify, g

class RoleManager:
    ROLES = {
        'admin': ['read', 'write', 'delete', 'manage_users'],
        'user': ['read', 'write'],
        'viewer': ['read']
    }
    
    @classmethod
    def require_permission(cls, permission):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                user_role = getattr(g, 'user_role', 'viewer')
                permissions = cls.ROLES.get(user_role, [])
                
                if permission not in permissions:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                
                return f(*args, **kwargs)
            return decorated
        return decorator
    
    @classmethod
    def require_role(cls, required_role):
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                user_role = getattr(g, 'user_role', 'viewer')
                role_hierarchy = ['viewer', 'user', 'admin']
                
                if role_hierarchy.index(user_role) < role_hierarchy.index(required_role):
                    return jsonify({'error': 'Insufficient role'}), 403
                
                return f(*args, **kwargs)
            return decorated
        return decorator