from flask import Blueprint, render_template, request, jsonify, session
from ..services.email_manager import EmailManager, EmailFilter
from ..services.ai_email_filter import AIEmailFilter
from ..core.database import Database
from ..core.validation import EmailValidator
from ..monitoring.health_check import HealthChecker

def get_db_connection():
    return Database().db_path
import json

email_bp = Blueprint('email', __name__)

@email_bp.before_request
def validate_session():
    if request.endpoint and 'api' in request.endpoint:
        if not session.get('authenticated'):
            return jsonify({'success': False, 'error': 'Session expirée'}), 401

@email_bp.route('/emails')
def email_dashboard():
    return render_template('emails/dashboard.html')

@email_bp.route('/modern')
def modern_dashboard():
    return render_template('modern_dashboard.html')

@email_bp.route('/api/emails/fetch', methods=['POST'])
def fetch_emails():
    try:
        data = request.get_json()
        page = data.get('page', 1)
        limit = min(data.get('limit', 50), 200)  # Max 200 emails
        
        # Sauvegarder credentials de manière sécurisée
        from ..security.secure_credentials import SecureCredentialManager
        cred_manager = SecureCredentialManager()
        cred_manager.encrypt_imap_credentials(
            data['email'],
            data['password'], 
            data['imap_server']
        )
        
        manager = EmailManager()
        emails = manager.fetch_emails(limit=limit)
        
        # Pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_emails = emails[start_idx:end_idx]
        
        suggestions = manager.get_smart_suggestions(emails)
        
        return jsonify({
            'success': True,
            'emails': paginated_emails,
            'suggestions': suggestions,
            'count': len(paginated_emails),
            'total': len(emails),
            'page': page,
            'has_more': end_idx < len(emails)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_bp.route('/api/emails/filter', methods=['POST'])
def filter_emails():
    try:
        data = request.get_json()
        filter_params = data.get('filters', {})
        
        # Validation des paramètres
        validation = EmailValidator.validate_filter_params(filter_params)
        if not validation['valid']:
            return jsonify({
                'success': False, 
                'error': 'Paramètres invalides: ' + ', '.join(validation['errors'])
            }), 400
        
        # Sanitize inputs
        for key, value in filter_params.items():
            if isinstance(value, str):
                filter_params[key] = EmailValidator.sanitize_input(value, 200)
        
        # Récupérer emails depuis DB
        import sqlite3
        conn = sqlite3.connect(get_db_connection())
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM received_emails ORDER BY date DESC LIMIT 1000')
        rows = cursor.fetchall()
        conn.close()
        
        emails = [dict(row) for row in rows]
        
        # Appliquer filtres
        filters = EmailFilter(**filter_params)
        manager = EmailManager()
        filtered_emails = manager.apply_filters(emails, filters)
        
        return jsonify({
            'success': True,
            'emails': filtered_emails,
            'count': len(filtered_emails),
            'total': len(emails)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_bp.route('/api/emails/suggestions')
def get_suggestions():
    try:
        import sqlite3
        conn = sqlite3.connect(get_db_connection())
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM received_emails ORDER BY date DESC LIMIT 1000')
        rows = cursor.fetchall()
        conn.close()
        
        emails = [dict(row) for row in rows]
        manager = EmailManager('', '', '')
        suggestions = manager.get_smart_suggestions(emails)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_bp.route('/api/emails/auto-organize', methods=['POST'])
def auto_organize():
    """Organisation automatique par IA"""
    try:
        data = request.get_json()
        
        import sqlite3
        conn = sqlite3.connect(get_db_connection())
        cursor = conn.cursor()
        
        # Créer dossiers automatiques basés sur l'IA
        categories = ['finance', 'meeting', 'urgent', 'marketing', 'general']
        
        for category in categories:
            cursor.execute('''
                INSERT OR IGNORE INTO email_folders (name, auto_rules, created_at)
                VALUES (?, ?, datetime('now'))
            ''', (category.title(), json.dumps({'category': category})))
        
        # Organiser emails existants
        cursor.execute('SELECT * FROM received_emails')
        emails = cursor.fetchall()
        
        organized_count = 0
        for email in emails:
            folder_name = email['category'].title() if email['category'] else 'General'
            cursor.execute('''
                UPDATE received_emails SET folder = ? WHERE id = ?
            ''', (folder_name, email['id']))
            organized_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'organized_count': organized_count,
            'folders_created': len(categories)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_bp.route('/api/emails/smart-filters', methods=['POST'])
def create_smart_filters():
    """Crée des filtres intelligents basés sur l'IA"""
    try:
        import sqlite3
        conn = sqlite3.connect(get_db_connection())
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM received_emails ORDER BY date DESC LIMIT 1000')
        emails = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        ai_filter = AIEmailFilter()
        smart_filters = ai_filter.create_smart_filters(emails)
        organization = ai_filter.suggest_organization(emails)
        
        return jsonify({
            'success': True,
            'smart_filters': smart_filters,
            'organization_suggestions': organization
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@email_bp.route('/api/emails/health')
def health_check():
    """Vérification de l'état du système email"""
    try:
        health_checker = HealthChecker()
        status = health_checker.get_system_status()
        
        status_code = 200
        if status['overall_status'] == 'unhealthy':
            status_code = 503
        elif status['overall_status'] == 'warning':
            status_code = 200
        
        return jsonify(status), status_code
    
    except Exception as e:
        return jsonify({
            'overall_status': 'unhealthy',
            'error': str(e)
        }), 500