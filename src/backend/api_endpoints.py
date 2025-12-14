# API Endpoints pour corriger les erreurs Failed to fetch
from flask import jsonify, request

def add_api_endpoints(app, db):
    
    @app.route('/api/dashboard/stats')
    def get_dashboard_stats():
        try:
            emails = db.get_email_history(100)
            total_emails = len(emails)
            success_count = len([e for e in emails if e[4] == 'sent'])
            success_rate = (success_count / total_emails * 100) if total_emails > 0 else 0
            
            return jsonify({
                'success': True,
                'stats': {
                    'total_emails': total_emails,
                    'success_rate': round(success_rate, 1),
                    'unique_recipients': len(set([e[1] for e in emails])),
                    'last_30_days': total_emails
                }
            })
        except:
            return jsonify({'success': False, 'error': 'Erreur stats'})

    @app.route('/api/email/history')
    def get_email_history():
        try:
            emails = db.get_email_history(50)
            history = []
            for email in emails:
                history.append({
                    'id': email[0],
                    'recipient': email[1],
                    'subject': email[2],
                    'body': email[3][:100] + '...' if len(email[3]) > 100 else email[3],
                    'status': email[4],
                    'created_at': email[5]
                })
            
            return jsonify({
                'success': True,
                'history': history
            })
        except:
            return jsonify({'success': False, 'error': 'Erreur historique'})

    @app.route('/api/accessibility/settings', methods=['GET', 'POST'])
    def accessibility_settings():
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'settings': {
                    'tts_enabled': False,
                    'tts_rate': 150,
                    'tts_volume': 1.0,
                    'font_size': 'medium',
                    'high_contrast': False
                }
            })
        else:
            return jsonify({
                'success': True,
                'settings': {
                    'tts_enabled': request.json.get('toggle_tts', False),
                    'tts_rate': request.json.get('tts_rate', 150),
                    'tts_volume': request.json.get('tts_volume', 1.0),
                    'font_size': request.json.get('font_size', 'medium'),
                    'high_contrast': request.json.get('toggle_contrast', False)
                }
            })

    @app.route('/api/accessibility/profile', methods=['POST'])
    def create_accessibility_profile():
        needs = request.json.get('needs', [])
        
        profiles = {
            'blind': {
                'description': 'Profil optimisé pour les personnes aveugles',
                'features': ['TTS activé', 'Navigation clavier', 'Descriptions audio']
            },
            'deaf': {
                'description': 'Profil optimisé pour les personnes sourdes',
                'features': ['Transcription visuelle', 'Notifications visuelles', 'Sous-titres']
            },
            'mute': {
                'description': 'Profil optimisé pour les personnes muettes',
                'features': ['Saisie texte', 'Templates', 'Communication écrite']
            },
            'motor_impaired': {
                'description': 'Profil optimisé pour mobilité réduite',
                'features': ['Raccourcis clavier', 'Navigation Tab', 'Grandes zones cliquables']
            }
        }
        
        profile = profiles.get(needs[0] if needs else 'blind', profiles['blind'])
        
        return jsonify({
            'success': True,
            'profile': profile
        })

    @app.route('/api/accessibility/transcripts')
    def get_transcripts():
        return jsonify({
            'success': True,
            'transcripts': []
        })

    @app.route('/api/accessibility/speak', methods=['POST'])
    def speak_text():
        text = request.json.get('text', '')
        return jsonify({
            'success': True,
            'message': f'TTS: {text[:50]}...'
        })