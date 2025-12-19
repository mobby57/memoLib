from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
from datetime import datetime
from ..services.ai_service import AIService
from ..services.email_service import EmailService
from ..core.database import Database

app = Flask(__name__)
app.secret_key = os.urandom(24)

class InclusiveEmailApp:
    def __init__(self):
        self.ai_service = AIService()
        self.email_service = EmailService()
        self.db = Database()
        
    def setup_routes(self, app):
        @app.route('/inclusive')
        def inclusive_home():
            return render_template('inclusive/home.html')
        
        @app.route('/inclusive/simple')
        def simple_interface():
            return render_template('inclusive/simple.html')
        
        @app.route('/inclusive/visual-compose')
        def visual_compose():
            return render_template('inclusive/visual_compose.html')
        
        @app.route('/inclusive/analyze-document', methods=['POST'])
        def analyze_document():
            if 'document' not in request.files:
                return jsonify({'error': 'Aucun document'}), 400
            
            file = request.files['document']
            if file.filename == '':
                return jsonify({'error': 'Fichier vide'}), 400
            
            # Analyser le document avec l'IA
            content = self.ai_service.analyze_document(file)
            suggestions = self.ai_service.generate_email_suggestions(content)
            
            return jsonify({
                'content': content,
                'suggestions': suggestions,
                'simple_options': self._create_simple_options(suggestions)
            })
        
        @app.route('/inclusive/generate-email', methods=['POST'])
        def generate_email():
            data = request.json
            prompt_type = data.get('type', 'simple')
            context = data.get('context', '')
            
            if prompt_type == 'icon':
                email_content = self._generate_from_icons(data.get('icons', []))
            elif prompt_type == 'voice':
                email_content = self._generate_from_voice(data.get('audio_text', ''))
            else:
                email_content = self._generate_simple_email(context)
            
            return jsonify({
                'subject': email_content['subject'],
                'body': email_content['body'],
                'visual_preview': self._create_visual_preview(email_content)
            })
        
        @app.route('/inclusive/send-email', methods=['POST'])
        def send_email():
            data = request.json
            
            # Interface ultra-simple pour l'envoi
            result = self.email_service.send_simple_email(
                to=data['to'],
                subject=data['subject'],
                body=data['body']
            )
            
            return jsonify({
                'success': result['success'],
                'message': '✅ Email envoyé!' if result['success'] else '❌ Erreur',
                'visual_feedback': self._create_visual_feedback(result)
            })
    
    def _create_simple_options(self, suggestions):
        """Créer des options visuelles simples"""
        return [
            {
                'icon': '📄',
                'text': 'Demande de document',
                'color': 'blue',
                'template': 'request_document'
            },
            {
                'icon': '💰',
                'text': 'Question argent',
                'color': 'green',
                'template': 'money_question'
            },
            {
                'icon': '🏥',
                'text': 'Santé/Médical',
                'color': 'red',
                'template': 'health'
            },
            {
                'icon': '🏠',
                'text': 'Logement',
                'color': 'orange',
                'template': 'housing'
            }
        ]
    
    def _generate_from_icons(self, icons):
        """Générer email à partir d'icônes sélectionnées"""
        context = " ".join([icon['meaning'] for icon in icons])
        return self.ai_service.generate_simple_email(context)
    
    def _generate_from_voice(self, audio_text):
        """Générer email à partir de transcription vocale"""
        return self.ai_service.generate_email_from_speech(audio_text)
    
    def _generate_simple_email(self, context):
        """Générer email simple"""
        return self.ai_service.generate_basic_email(context)
    
    def _create_visual_preview(self, email_content):
        """Créer aperçu visuel de l'email"""
        return {
            'icons': self._extract_icons_from_content(email_content['body']),
            'sentiment': self._analyze_sentiment(email_content['body']),
            'length': 'court' if len(email_content['body']) < 200 else 'long'
        }
    
    def _create_visual_feedback(self, result):
        """Créer feedback visuel pour l'envoi"""
        if result['success']:
            return {
                'color': 'green',
                'icon': '✅',
                'animation': 'success',
                'message': 'Email parti!'
            }
        else:
            return {
                'color': 'red',
                'icon': '❌',
                'animation': 'error',
                'message': 'Problème!'
            }
    
    def _extract_icons_from_content(self, content):
        """Extraire des icônes représentatives du contenu"""
        icons = []
        if 'document' in content.lower():
            icons.append('📄')
        if 'argent' in content.lower() or 'euro' in content.lower():
            icons.append('💰')
        if 'urgent' in content.lower():
            icons.append('🚨')
        return icons
    
    def _analyze_sentiment(self, content):
        """Analyser le sentiment du contenu"""
        positive_words = ['merci', 'content', 'heureux', 'bien']
        negative_words = ['problème', 'urgent', 'aide', 'difficile']
        
        content_lower = content.lower()
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        if positive_count > negative_count:
            return {'type': 'positive', 'icon': '😊', 'color': 'green'}
        elif negative_count > positive_count:
            return {'type': 'negative', 'icon': '😟', 'color': 'red'}
        else:
            return {'type': 'neutral', 'icon': '😐', 'color': 'blue'}

inclusive_app = InclusiveEmailApp()