"""
Intégration de l'interface accessible avec l'app principale
Routes et services partagés
"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
import sys
import os

# Import des services principaux
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'core'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'accessibility'))

from database import Database
from email_service import EmailService
from ai_service import AIService
from accessibility_optimizer import accessibility_optimizer

# Blueprint pour intégration
accessible_bp = Blueprint('accessible', __name__, url_prefix='/accessible')

@accessible_bp.route('/')
def accessible_home():
    """Page d'accueil accessible intégrée"""
    if 'user_id' not in session:
        return redirect(url_for('accessible.accessible_login'))
    
    return render_template('accessible/integrated_home.html', 
                         user_name=session.get('nom', ''))

@accessible_bp.route('/login')
def accessible_login():
    """Login simplifié pour interface accessible"""
    return render_template('accessible/simple_login.html')

@accessible_bp.route('/api/quick_setup', methods=['POST'])
def quick_setup():
    """Configuration rapide pour nouveaux utilisateurs"""
    data = request.get_json()
    
    # Créer utilisateur avec configuration minimale
    db = Database()
    user_data = {
        'nom': data.get('nom'),
        'prenom': data.get('prenom'), 
        'email': data.get('email'),
        'accessibility_profile': data.get('profile', 'standard'),
        'auto_configured': True
    }
    
    # Auto-configuration email si possible
    email_service = EmailService()
    if email_service.can_auto_configure():
        user_data['email_configured'] = True
    
    # Sauvegarder
    user_id = db.create_accessible_user(user_data)
    session['user_id'] = user_id
    session['accessibility_mode'] = True
    
    return jsonify({
        'success': True,
        'user_id': user_id,
        'needs_email_config': not user_data.get('email_configured', False)
    })

@accessible_bp.route('/api/smart_compose', methods=['POST'])
def smart_compose():
    """Composition intelligente avec IA intégrée"""
    data = request.get_json()
    voice_input = data.get('voice_input', '')
    context = data.get('context', 'general')
    
    # Utiliser IA principale si disponible
    ai_service = AIService()
    
    if ai_service.is_configured():
        # Prompt optimisé pour accessibilité
        prompt = f"""
        Transforme ce message parlé en email professionnel et accessible:
        "{voice_input}"
        
        Contexte: {context}
        
        Règles:
        - Langage simple et clair
        - Phrases courtes
        - Poli mais direct
        - Éviter jargon technique
        """
        
        generated_content = ai_service.generate_email_content(prompt)
    else:
        # Fallback avec templates intelligents
        generated_content = generate_smart_template(voice_input, context)
    
    return jsonify({
        'success': True,
        'content': generated_content,
        'suggestions': get_improvement_suggestions(generated_content)
    })

def generate_smart_template(voice_input, context):
    """Templates intelligents selon contexte"""
    templates = {
        'administration': f"Madame, Monsieur,\n\nJe vous contacte concernant {voice_input}.\n\nPourriez-vous m'indiquer la marche à suivre ?\n\nJe vous remercie.\n\nCordialement,",
        'service_client': f"Bonjour,\n\nJ'ai besoin d'aide pour {voice_input}.\n\nPouvez-vous m'aider à résoudre ce problème ?\n\nMerci d'avance.\n\nCordialement,",
        'professionnel': f"Bonjour,\n\nJe me permets de vous écrire au sujet de {voice_input}.\n\nSeriez-vous disponible pour en discuter ?\n\nBien cordialement,",
        'personnel': f"Bonjour,\n\n{voice_input}\n\nJ'espère que vous allez bien.\n\nÀ bientôt,"
    }
    
    return templates.get(context, templates['professionnel'])

def get_improvement_suggestions(content):
    """Suggestions d'amélioration du message"""
    suggestions = []
    
    if len(content) > 500:
        suggestions.append("Message un peu long - voulez-vous le raccourcir ?")
    
    if not any(word in content.lower() for word in ['merci', 'cordialement', 'salutations']):
        suggestions.append("Ajouter une formule de politesse ?")
    
    if '?' not in content and 'demande' in content.lower():
        suggestions.append("Transformer en question pour plus de clarté ?")
    
    return suggestions

@accessible_bp.route('/api/send_with_integration', methods=['POST'])
def send_with_integration():
    """Envoi intégré avec services principaux"""
    data = request.get_json()
    
    recipient = data.get('recipient')
    content = data.get('content')
    subject = data.get('subject', 'Message depuis SecureVault')
    
    # Utiliser service email principal
    email_service = EmailService()
    
    try:
        success = email_service.send_email(
            to_email=recipient,
            subject=subject,
            body=content,
            from_name=f"{session.get('prenom', '')} {session.get('nom', '')}"
        )
        
        if success:
            # Logger dans base principale
            db = Database()
            db.log_email(
                sender=session.get('email_auto'),
                recipient=recipient,
                subject=subject,
                content=content,
                status='sent'
            )
            
            return jsonify({
                'success': True,
                'message': 'Email envoyé avec succès !',
                'tracking_id': f"ACC_{session['user_id']}_{int(datetime.now().timestamp())}"
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Erreur lors de l\'envoi',
                'fallback_options': ['Réessayer plus tard', 'Vérifier l\'adresse email']
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erreur technique',
            'error': str(e)
        })

@accessible_bp.route('/api/user_stats')
def user_stats():
    """Statistiques utilisateur simplifiées"""
    if 'user_id' not in session:
        return jsonify({'error': 'Non connecté'}), 401
    
    db = Database()
    stats = db.get_user_email_stats(session['user_id'])
    
    # Simplifier pour interface accessible
    simple_stats = {
        'emails_sent': stats.get('total_sent', 0),
        'last_email': stats.get('last_sent_date', 'Jamais'),
        'success_rate': f"{stats.get('success_rate', 0):.0f}%",
        'favorite_contacts': stats.get('top_recipients', [])[:3]
    }
    
    return jsonify(simple_stats)

@accessible_bp.route('/api/accessibility_feedback', methods=['POST'])
def accessibility_feedback():
    """Collecte feedback accessibilité"""
    data = request.get_json()
    
    feedback = {
        'user_id': session.get('user_id'),
        'difficulty_level': data.get('difficulty', 'normal'),
        'feature_used': data.get('feature'),
        'success': data.get('success', True),
        'time_taken': data.get('time_taken', 0),
        'comments': data.get('comments', ''),
        'timestamp': datetime.now().isoformat()
    }
    
    # Sauvegarder feedback
    os.makedirs('data/feedback', exist_ok=True)
    with open(f'data/feedback/accessibility_{session["user_id"]}.json', 'a') as f:
        f.write(json.dumps(feedback) + '\n')
    
    # Auto-ajustement basé sur feedback
    accessibility_optimizer.track_user_difficulty(
        data.get('feature'),
        data.get('success', True),
        data.get('time_taken', 0)
    )
    
    return jsonify({'success': True, 'message': 'Merci pour votre retour'})

# Fonctions utilitaires pour l'intégration
def register_accessible_routes(main_app):
    """Enregistrer les routes accessibles dans l'app principale"""
    main_app.register_blueprint(accessible_bp)
    
    # Ajouter middleware pour détecter mode accessible
    @main_app.before_request
    def detect_accessibility_mode():
        if request.path.startswith('/accessible'):
            session['accessibility_mode'] = True
        elif 'accessibility_mode' in session and not request.path.startswith('/accessible'):
            # Proposer de rester en mode accessible
            if request.endpoint and 'api' not in request.endpoint:
                return redirect(url_for('accessible.accessible_home'))

def get_accessible_navigation():
    """Navigation simplifiée pour mode accessible"""
    return [
        {'url': '/accessible/', 'text': '🏠 Accueil', 'key': '1'},
        {'url': '/accessible/compose', 'text': '📝 Écrire', 'key': '2'},
        {'url': '/accessible/files', 'text': '📎 Fichiers', 'key': '3'},
        {'url': '/accessible/help', 'text': '❓ Aide', 'key': 'H'}
    ]