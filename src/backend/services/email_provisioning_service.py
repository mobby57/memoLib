"""
Service de création automatique d'adresses email génériques
Permet aux utilisateurs de créer des adresses email@votre-domaine.com directement depuis l'application
"""
import os
import secrets
import string
from typing import Dict, Optional
import requests
from datetime import datetime

class EmailProvisioningService:
    """
    Service pour créer automatiquement des adresses email via API cloud
    Supporte: AWS SES, SendGrid, Microsoft 365, Google Workspace
    """
    
    def __init__(self):
        self.provider = os.getenv('EMAIL_PROVIDER', 'sendgrid')  # sendgrid, aws-ses, microsoft365, google
        self.domain = os.getenv('EMAIL_DOMAIN', 'iapostemanager.com')
        self.api_key = os.getenv('EMAIL_PROVISIONING_API_KEY')
        
    def generate_random_password(self, length=16) -> str:
        """Génère un mot de passe sécurisé"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def create_generic_email(
        self, 
        username: str, 
        display_name: str,
        user_id: int
    ) -> Dict:
        """
        Crée une adresse email générique pour l'utilisateur
        
        Args:
            username: Partie locale (ex: "contact", "support")
            display_name: Nom d'affichage (ex: "Support Client")
            user_id: ID utilisateur dans la base
            
        Returns:
            Dict avec email, password, status
        """
        email_address = f"{username}@{self.domain}"
        password = self.generate_random_password()
        
        # Créer selon le provider
        if self.provider == 'sendgrid':
            result = self._create_sendgrid_subuser(username, email_address, password)
        elif self.provider == 'aws-ses':
            result = self._create_aws_ses_identity(email_address)
        elif self.provider == 'microsoft365':
            result = self._create_microsoft365_mailbox(username, email_address, password, display_name)
        elif self.provider == 'google':
            result = self._create_google_workspace_user(username, email_address, password, display_name)
        else:
            return {
                'success': False,
                'error': f'Provider {self.provider} non supporté'
            }
        
        if result['success']:
            # Sauvegarder dans la base de données
            self._save_email_account(user_id, email_address, username, display_name)
            
        return result
    
    def _create_sendgrid_subuser(self, username: str, email: str, password: str) -> Dict:
        """Crée un sous-utilisateur SendGrid"""
        url = 'https://api.sendgrid.com/v3/subusers'
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        data = {
            'username': username,
            'email': email,
            'password': password,
            'ips': []  # Utilise les IPs partagées
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 201:
                return {
                    'success': True,
                    'email': email,
                    'password': password,
                    'smtp_server': 'smtp.sendgrid.net',
                    'smtp_port': 587,
                    'smtp_username': username,
                    'smtp_password': password
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('errors', 'Erreur création SendGrid')
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _create_aws_ses_identity(self, email: str) -> Dict:
        """Vérifie une identité email AWS SES"""
        try:
            import boto3
            ses = boto3.client('ses', region_name=os.getenv('AWS_REGION', 'eu-west-1'))
            
            # Vérifier l'email
            ses.verify_email_identity(EmailAddress=email)
            
            # Créer credentials SMTP
            response = ses.create_smtp_credentials(UserName=email.replace('@', '-'))
            
            return {
                'success': True,
                'email': email,
                'password': response['SmtpPassword'],
                'smtp_server': f'email-smtp.{os.getenv("AWS_REGION", "eu-west-1")}.amazonaws.com',
                'smtp_port': 587,
                'smtp_username': response['SmtpUsername'],
                'smtp_password': response['SmtpPassword'],
                'note': f'Email de vérification envoyé à {email}'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _create_microsoft365_mailbox(
        self, 
        username: str, 
        email: str, 
        password: str,
        display_name: str
    ) -> Dict:
        """Crée une boîte mail Microsoft 365"""
        # Nécessite Microsoft Graph API
        url = 'https://graph.microsoft.com/v1.0/users'
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        data = {
            'accountEnabled': True,
            'displayName': display_name,
            'mailNickname': username,
            'userPrincipalName': email,
            'passwordProfile': {
                'forceChangePasswordNextSignIn': False,
                'password': password
            },
            'usageLocation': 'FR'
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            if response.status_code == 201:
                return {
                    'success': True,
                    'email': email,
                    'password': password,
                    'smtp_server': 'smtp.office365.com',
                    'smtp_port': 587,
                    'smtp_username': email,
                    'smtp_password': password,
                    'webmail': 'https://outlook.office365.com'
                }
            else:
                return {
                    'success': False,
                    'error': response.json().get('error', {}).get('message', 'Erreur Microsoft 365')
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _create_google_workspace_user(
        self,
        username: str,
        email: str,
        password: str,
        display_name: str
    ) -> Dict:
        """Crée un utilisateur Google Workspace"""
        # Nécessite Google Workspace Admin API
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        
        try:
            credentials = service_account.Credentials.from_service_account_file(
                os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE'),
                scopes=['https://www.googleapis.com/auth/admin.directory.user']
            )
            
            service = build('admin', 'directory_v1', credentials=credentials)
            
            user_body = {
                'primaryEmail': email,
                'name': {
                    'givenName': display_name.split()[0],
                    'familyName': display_name.split()[-1] if len(display_name.split()) > 1 else 'User'
                },
                'password': password,
                'changePasswordAtNextLogin': False
            }
            
            result = service.users().insert(body=user_body).execute()
            
            return {
                'success': True,
                'email': email,
                'password': password,
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'smtp_username': email,
                'smtp_password': password,
                'webmail': 'https://mail.google.com'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _save_email_account(self, user_id: int, email: str, username: str, display_name: str):
        """Sauvegarde le compte email créé dans la base de données"""
        import sqlite3
        import os
        from datetime import datetime
        
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'unified.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO email_accounts (
                    user_id, email_address, username, display_name, 
                    provider, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id, email, username, display_name,
                self.provider, 'active', 
                datetime.utcnow().isoformat(), 
                datetime.utcnow().isoformat()
            ))
            
            conn.commit()
            
            # Log l'opération
            cursor.execute('''
                INSERT INTO email_provisioning_logs (
                    user_id, action, status, created_at
                ) VALUES (?, ?, ?, ?)
            ''', (
                user_id, 'create', 'success', datetime.utcnow().isoformat()
            ))
            
            conn.commit()
        except Exception as e:
            print(f"Erreur sauvegarde email account: {e}")
        finally:
            conn.close()
    
    def check_email_availability(self, username: str) -> bool:
        """Vérifie si l'adresse email est disponible"""
        import sqlite3
        import os
        
        email = f"{username}@{self.domain}"
        
        # Vérifier dans la base de données
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'unified.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM email_accounts WHERE email_address = ?', (email,))
        count = cursor.fetchone()[0]
        conn.close()
        
        if count > 0:
            return False
        
        # Vérifier via API du provider (optionnel)
        if self.provider == 'sendgrid' and self.api_key:
            try:
                url = f'https://api.sendgrid.com/v3/subusers?username={username}'
                headers = {'Authorization': f'Bearer {self.api_key}'}
                response = requests.get(url, headers=headers)
                return response.status_code == 404  # Disponible si non trouvé
            except:
                pass
        
        return True
    
    def suggest_usernames(self, base_name: str, count: int = 5) -> list:
        """Suggère des noms d'utilisateur disponibles"""
        suggestions = [base_name]
        
        # Ajouter variations
        suggestions.extend([
            f"{base_name}{i}" for i in range(1, count)
        ])
        suggestions.extend([
            f"{base_name}.contact",
            f"{base_name}.info",
            f"{base_name}.support"
        ])
        
        # Filtrer les disponibles
        available = []
        for username in suggestions:
            if self.check_email_availability(username):
                available.append(username)
                if len(available) >= count:
                    break
        
        return available


# Endpoint Flask pour l'API
def register_email_provisioning_routes(app):
    """Enregistre les routes Flask pour la création d'emails"""
    
    from flask import request, jsonify, session
    import sqlite3
    import os
    
    email_service = EmailProvisioningService()
    
    def get_db_connection():
        """Connexion à la base de données SQLite"""
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'unified.db')
        return sqlite3.connect(db_path)
    
    @app.route('/api/email/check-availability', methods=['POST'])
    def check_email_availability():
        """Vérifie si un nom d'utilisateur est disponible"""
        data = request.get_json()
        username = data.get('username', '').lower().strip()
        
        if not username:
            return jsonify({'error': 'Username requis'}), 400
        
        # Validation
        if not username.replace('-', '').replace('_', '').isalnum():
            return jsonify({'error': 'Username invalide (alphanumérique uniquement)'}), 400
        
        available = email_service.check_email_availability(username)
        suggestions = email_service.suggest_usernames(username) if not available else []
        
        return jsonify({
            'available': available,
            'email': f"{username}@{email_service.domain}",
            'suggestions': suggestions
        })
    
    @app.route('/api/email/create', methods=['POST'])
    def create_email_account():
        """Crée un nouveau compte email"""
        data = request.get_json()
        username = data.get('username', '').lower().strip()
        display_name = data.get('display_name', username)
        user_id = session.get('user_id', 1)  # Default user_id = 1 si pas de session
        
        if not username:
            return jsonify({'error': 'Username requis'}), 400
        
        # Vérifier disponibilité
        if not email_service.check_email_availability(username):
            return jsonify({'error': 'Email déjà utilisé'}), 409
        
        # Créer l'email
        result = email_service.create_generic_email(username, display_name, user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'email': result['email'],
                'credentials': {
                    'smtp_server': result.get('smtp_server'),
                    'smtp_port': result.get('smtp_port'),
                    'smtp_username': result.get('smtp_username'),
                    'smtp_password': result.get('smtp_password')
                },
                'message': f"Email {result['email']} créé avec succès!",
                'webmail': result.get('webmail')
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Erreur lors de la création')
            }), 500
    
    @app.route('/api/email/my-accounts', methods=['GET'])
    def list_my_email_accounts():
        """Liste les comptes email de l'utilisateur"""
        user_id = session.get('user_id', 1)
        
        # Récupérer depuis la base de données
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, email_address, display_name, status, created_at, emails_sent_today, emails_sent_month FROM email_accounts WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        
        accounts = []
        for row in rows:
            accounts.append({
                'id': row[0],
                'email': row[1],
                'display_name': row[2],
                'status': row[3],
                'created_at': row[4],
                'emails_sent_today': row[5],
                'emails_sent_month': row[6]
            })
        
        return jsonify({'accounts': accounts})
