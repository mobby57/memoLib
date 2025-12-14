#!/usr/bin/env python3
"""
Application Email Inclusive - Adaptée pour personnes illettrées, sourdes et muettes
Interface ultra-simple basée sur des icônes et interactions visuelles
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import sys
import json
from datetime import datetime
import logging

# Ajouter le répertoire src au path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from src.accessibility.inclusive_app import inclusive_app
    from src.services.ai_service import AIService
    from src.services.email_service import EmailService
    from src.core.database import Database
except ImportError:
    # Fallback simple si les modules ne sont pas disponibles
    class MockService:
        def generate_simple_email(self, context):
            return {
                'subject': f'Demande concernant: {context}',
                'body': f'Bonjour,\n\nJe vous contacte concernant {context}.\n\nMerci de votre aide.\n\nCordialement'
            }
        
        def analyze_document(self, file):
            return f"Document analysé: {file.filename}"
        
        def send_simple_email(self, to, subject, body):
            return {'success': True, 'message': 'Email envoyé (simulation)'}
    
    class InclusiveApp:
        def __init__(self):
            self.ai_service = MockService()
            self.email_service = MockService()
        
        def setup_routes(self, app):
            pass
    
    inclusive_app = InclusiveApp()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Configuration pour les personnes avec difficultés
app.config.update(
    UPLOAD_FOLDER='uploads',
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,  # 16MB max
    TEMPLATES_AUTO_RELOAD=True
)

# Logging simple
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Templates d'emails simplifiés par catégorie
EMAIL_TEMPLATES = {
    'document': {
        'carte_identite': {
            'subject': 'Demande de carte d\'identité',
            'body': 'Bonjour,\n\nJe souhaite faire une demande de carte d\'identité.\n\nPouvez-vous me dire quels documents je dois apporter et quand je peux venir ?\n\nMerci beaucoup.\n\nCordialement'
        },
        'attestation_logement': {
            'subject': 'Demande d\'attestation de logement',
            'body': 'Bonjour,\n\nJ\'ai besoin d\'une attestation de logement.\n\nPouvez-vous me l\'envoyer ou me dire comment l\'obtenir ?\n\nMerci de votre aide.\n\nCordialement'
        },
        'releve_compte': {
            'subject': 'Demande de relevé de compte',
            'body': 'Bonjour,\n\nJe voudrais recevoir mon relevé de compte.\n\nPouvez-vous me l\'envoyer par courrier ou email ?\n\nMerci.\n\nCordialement'
        },
        'certificat_medical': {
            'subject': 'Demande de certificat médical',
            'body': 'Bonjour,\n\nJ\'ai besoin d\'un certificat médical.\n\nQuand puis-je prendre rendez-vous ?\n\nMerci.\n\nCordialement'
        }
    },
    'money': {
        'pas_recu': {
            'subject': 'Problème de paiement non reçu',
            'body': 'Bonjour,\n\nJe n\'ai pas reçu mon paiement ce mois-ci.\n\nPouvez-vous vérifier et me dire quand je vais le recevoir ?\n\nMerci de votre aide.\n\nCordialement'
        },
        'question_montant': {
            'subject': 'Question sur le montant',
            'body': 'Bonjour,\n\nJ\'ai une question sur le montant de mon paiement.\n\nPouvez-vous m\'expliquer pourquoi il a changé ?\n\nMerci.\n\nCordialement'
        },
        'changer_date': {
            'subject': 'Changement de date de paiement',
            'body': 'Bonjour,\n\nJe voudrais changer la date de mes paiements.\n\nEst-ce possible ? Comment faire ?\n\nMerci de votre réponse.\n\nCordialement'
        },
        'remboursement': {
            'subject': 'Demande de remboursement',
            'body': 'Bonjour,\n\nJe voudrais demander un remboursement.\n\nPouvez-vous me dire comment faire ?\n\nMerci.\n\nCordialement'
        }
    },
    'health': {
        'rendez_vous': {
            'subject': 'Demande de rendez-vous',
            'body': 'Bonjour,\n\nJe voudrais prendre rendez-vous.\n\nQuand avez-vous de la place ?\n\nMerci.\n\nCordialement'
        },
        'resultats': {
            'subject': 'Demande de résultats',
            'body': 'Bonjour,\n\nJe voudrais avoir mes résultats d\'analyse.\n\nSont-ils prêts ?\n\nMerci.\n\nCordialement'
        },
        'ordonnance': {
            'subject': 'Renouvellement d\'ordonnance',
            'body': 'Bonjour,\n\nJ\'ai besoin de renouveler mon ordonnance.\n\nQuand puis-je venir ?\n\nMerci.\n\nCordialement'
        },
        'urgence': {
            'subject': 'URGENT - Besoin d\'aide',
            'body': 'Bonjour,\n\nJ\'ai un problème urgent de santé.\n\nPouvez-vous me recevoir rapidement ?\n\nMerci.\n\nCordialement'
        }
    },
    'housing': {
        'reparation': {
            'subject': 'Demande de réparation',
            'body': 'Bonjour,\n\nIl y a quelque chose à réparer dans mon logement.\n\nPouvez-vous envoyer quelqu\'un ?\n\nMerci.\n\nCordialement'
        },
        'loyer': {
            'subject': 'Question sur le loyer',
            'body': 'Bonjour,\n\nJ\'ai une question sur mon loyer.\n\nPouvez-vous m\'aider ?\n\nMerci.\n\nCordialement'
        },
        'demande_logement': {
            'subject': 'Demande de logement',
            'body': 'Bonjour,\n\nJe cherche un logement.\n\nAvez-vous quelque chose de disponible ?\n\nMerci.\n\nCordialement'
        },
        'contact_proprio': {
            'subject': 'Contact propriétaire',
            'body': 'Bonjour,\n\nJe voudrais parler avec le propriétaire.\n\nComment le contacter ?\n\nMerci.\n\nCordialement'
        }
    }
}

@app.route('/')
def home():
    return redirect('/inclusive')

@app.route('/inclusive')
def inclusive_home():
    return render_template('inclusive/ultra_simple.html')

@app.route('/inclusive/simple')
def simple_interface():
    return render_template('inclusive/simple.html')

@app.route('/inclusive/visual-compose')
def visual_compose():
    return render_template('inclusive/visual_compose.html')

@app.route('/inclusive/flow')
def navigation_flow():
    return render_template('inclusive/navigation_flow.html')

@app.route('/inclusive/analyze-document', methods=['POST'])
def analyze_document():
    try:
        # Analyser le document ou le texte vocal
        if 'document' in request.files:
            file = request.files['document']
            content = f"Document: {file.filename}"
        elif 'voice_text' in request.form:
            content = request.form['voice_text']
        else:
            return jsonify({'error': 'Aucun contenu à analyser'}), 400
        
        # Suggestions simples basées sur des mots-clés
        suggestions = []
        content_lower = content.lower()
        
        if any(word in content_lower for word in ['carte', 'identité', 'papier', 'document']):
            suggestions.append({
                'icon': '📄',
                'text': 'Demander un document',
                'template': 'carte_identite'
            })
        
        if any(word in content_lower for word in ['argent', 'paiement', 'euro', 'allocation']):
            suggestions.append({
                'icon': '💰',
                'text': 'Question d\'argent',
                'template': 'pas_recu'
            })
        
        if any(word in content_lower for word in ['médecin', 'santé', 'malade', 'docteur']):
            suggestions.append({
                'icon': '🏥',
                'text': 'Problème de santé',
                'template': 'rendez_vous'
            })
        
        if any(word in content_lower for word in ['logement', 'appartement', 'maison', 'loyer']):
            suggestions.append({
                'icon': '🏠',
                'text': 'Problème de logement',
                'template': 'reparation'
            })
        
        # Suggestions par défaut si rien trouvé
        if not suggestions:
            suggestions = [
                {'icon': '📄', 'text': 'Demander un document', 'template': 'carte_identite'},
                {'icon': '💰', 'text': 'Question d\'argent', 'template': 'pas_recu'},
                {'icon': '🏥', 'text': 'Problème de santé', 'template': 'rendez_vous'},
                {'icon': '🏠', 'text': 'Problème de logement', 'template': 'reparation'}
            ]
        
        return jsonify({
            'content': content,
            'simple_options': suggestions
        })
        
    except Exception as e:
        logger.error(f"Erreur analyse: {e}")
        return jsonify({'error': 'Erreur lors de l\'analyse'}), 500

@app.route('/inclusive/generate-email', methods=['POST'])
def generate_email():
    try:
        data = request.json
        email_type = data.get('type', 'document')
        answer = data.get('answer', 'carte_identite')
        context = data.get('context', '')
        details = data.get('details', '')
        
        # Récupérer le template approprié
        template = None
        for category in EMAIL_TEMPLATES.values():
            if answer in category:
                template = category[answer]
                break
        
        if not template:
            # Template par défaut
            template = {
                'subject': 'Demande d\'information',
                'body': 'Bonjour,\n\nJe vous contacte pour une demande.\n\nMerci de votre aide.\n\nCordialement'
            }
        
        # Ajouter les détails si fournis
        if details:
            template['body'] += f'\n\nDétails supplémentaires:\n{details}'
        
        return jsonify({
            'subject': template['subject'],
            'body': template['body'],
            'visual_preview': {
                'icons': ['📧'],
                'sentiment': {'type': 'neutral', 'icon': '😐', 'color': 'blue'},
                'length': 'court' if len(template['body']) < 200 else 'long'
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur génération: {e}")
        return jsonify({'error': 'Erreur lors de la génération'}), 500

@app.route('/inclusive/vocal')
def vocal_interface():
    return render_template('inclusive/vocal_simple.html')

@app.route('/inclusive/generate-from-voice')
def generate_from_voice():
    return render_template('inclusive/ultra_simple.html')

@app.route('/inclusive/send-email', methods=['POST'])
def send_email():
    try:
        data = request.json
        
        # Simulation d'envoi (remplacer par vraie logique d'envoi)
        logger.info(f"Email simulé envoyé à: {data.get('to')}")
        logger.info(f"Sujet: {data.get('subject')}")
        
        return jsonify({
            'success': True,
            'message': '✅ Email envoyé!',
            'visual_feedback': {
                'color': 'green',
                'icon': '✅',
                'animation': 'success',
                'message': 'Email parti!'
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur envoi: {e}")
        return jsonify({
            'success': False,
            'message': '❌ Erreur lors de l\'envoi',
            'visual_feedback': {
                'color': 'red',
                'icon': '❌',
                'animation': 'error',
                'message': 'Problème!'
            }
        }), 500

# Configuration des routes de l'app inclusive
try:
    inclusive_app.setup_routes(app)
except:
    pass

if __name__ == '__main__':
    # Créer le dossier uploads s'il n'existe pas
    os.makedirs('uploads', exist_ok=True)
    
    print("🚀 Démarrage de l'application Email Inclusive")
    print("📧 Interface adaptée pour personnes illettrées, sourdes et muettes")
    print("🌐 Accès: http://127.0.0.1:5000/inclusive")
    print("=" * 60)
    
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True,
        use_reloader=True
    )