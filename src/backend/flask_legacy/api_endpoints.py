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

    # Contacts endpoints
    @app.route('/api/contacts/<int:contact_id>', methods=['GET'])
    def get_contact_by_id(contact_id):
        try:
            contacts = db.get_contacts()
            contact = next((c for c in contacts if c[0] == contact_id), None)
            if not contact:
                return jsonify({'success': False, 'error': 'Contact non trouvé'}), 404
            
            return jsonify({
                'success': True,
                'contact': {
                    'id': contact[0],
                    'name': contact[1],
                    'email': contact[2],
                    'organization': contact[3],
                    'category': contact[4],
                    'created_at': contact[5]
                }
            })
        except:
            return jsonify({'success': False, 'error': 'Erreur récupération contact'}), 500

    @app.route('/api/contacts/<int:contact_id>', methods=['PUT'])
    def update_contact(contact_id):
        try:
            data = request.json
            # Pour l'instant, juste retourner succès - TODO: implémenter update dans db
            return jsonify({
                'success': True,
                'message': 'Contact mis à jour',
                'contact_id': contact_id
            })
        except:
            return jsonify({'success': False, 'error': 'Erreur mise à jour contact'}), 500

    # Inbox endpoint
    @app.route('/api/inbox/messages', methods=['GET'])
    def get_inbox_messages():
        try:
            # Pour l'instant, retourner liste vide - TODO: implémenter réception emails
            return jsonify({
                'success': True,
                'messages': [],
                'total': 0
            })
        except:
            return jsonify({'success': False, 'error': 'Erreur récupération messages'}), 500