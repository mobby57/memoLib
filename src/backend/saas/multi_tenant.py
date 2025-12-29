from flask import g, request, jsonify
from functools import wraps

class MultiTenantManager:
    def __init__(self, db):
        self.db = db
    
    def tenant_required(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):
            tenant_id = request.headers.get('X-Tenant-ID')
            if not tenant_id:
                return jsonify({'error': 'Tenant ID required'}), 400
            
            g.tenant_id = tenant_id
            return f(*args, **kwargs)
        return decorated
    
    def get_tenant_config(self, tenant_id):
        return {
            'branding': {
                'logo': f'/static/tenants/{tenant_id}/logo.png',
                'colors': {'primary': '#007bff', 'secondary': '#6c757d'},
                'name': f'Client {tenant_id}'
            },
            'features': {
                'ai_generation': True,
                'templates': True,
                'analytics': True
            },
            'limits': {
                'users': 50,
                'emails_per_month': 1000,
                'storage_gb': 10
            }
        }
    
    def create_tenant_schema(self, tenant_id):
        schema_sql = f"""
        CREATE SCHEMA IF NOT EXISTS tenant_{tenant_id};
        CREATE TABLE IF NOT EXISTS tenant_{tenant_id}.users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """
        self.db.session.execute(schema_sql)
        self.db.session.commit()