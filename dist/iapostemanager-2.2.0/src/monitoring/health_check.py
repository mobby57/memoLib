import sqlite3
import imaplib
from typing import Dict, Any
from ..core.config import Config
from ..security.secure_credentials import SecureCredentialManager

class HealthChecker:
    def __init__(self):
        self.credential_manager = SecureCredentialManager()
    
    def check_database(self) -> Dict[str, Any]:
        try:
            conn = sqlite3.connect(f"{Config.APP_DIR}/app.db")
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM received_emails")
            count = cursor.fetchone()[0]
            conn.close()
            
            return {
                'status': 'healthy',
                'email_count': count,
                'message': 'Base de données accessible'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Erreur base de données'
            }
    
    def check_imap_connection(self) -> Dict[str, Any]:
        try:
            creds = self.credential_manager.decrypt_imap_credentials()
            if not creds:
                return {
                    'status': 'warning',
                    'message': 'Aucune credential IMAP configurée'
                }
            
            mail = imaplib.IMAP4_SSL(creds['imap_server'])
            mail.login(creds['email'], creds['password'])
            mail.select('inbox')
            mail.logout()
            
            return {
                'status': 'healthy',
                'server': creds['imap_server'],
                'message': 'Connexion IMAP OK'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Erreur connexion IMAP'
            }
    
    def check_cache(self) -> Dict[str, Any]:
        try:
            from ..core.cache_manager import cache
            test_key = 'health_check_test'
            cache.set(test_key, 'test_value')
            value = cache.get(test_key)
            cache.delete(test_key)
            
            if value == 'test_value':
                return {
                    'status': 'healthy',
                    'message': 'Cache fonctionnel'
                }
            else:
                return {
                    'status': 'warning',
                    'message': 'Cache non fonctionnel'
                }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Erreur cache'
            }
    
    def get_system_status(self) -> Dict[str, Any]:
        db_status = self.check_database()
        imap_status = self.check_imap_connection()
        cache_status = self.check_cache()
        
        overall_status = 'healthy'
        if any(check['status'] == 'unhealthy' for check in [db_status, imap_status, cache_status]):
            overall_status = 'unhealthy'
        elif any(check['status'] == 'warning' for check in [db_status, imap_status, cache_status]):
            overall_status = 'warning'
        
        return {
            'overall_status': overall_status,
            'components': {
                'database': db_status,
                'imap': imap_status,
                'cache': cache_status
            },
            'timestamp': __import__('datetime').datetime.now().isoformat()
        }