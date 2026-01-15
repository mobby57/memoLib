#!/usr/bin/env python3
"""
🚀 IA POSTE MANAGER - Application Factory
Première IA juridique CESEDA au monde
Architecture v4.0 - API REST + Frontend séparés
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import check_password_hash, generate_password_hash
import os
import json
from datetime import datetime, timedelta
# from ceseda_expert_ai import CESEDAExpert  # TODO: Activer après install numpy

def create_app():
    """Factory pattern pour créer l'application Flask"""
    app = Flask(__name__)
    app.secret_key = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    
    # ✅ PHASE 1 - Configuration API REST v4.0
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    
    # Initialisation JWT
    jwt = JWTManager(app)
    
    # Configuration CORS pour frontend séparé
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "https://votre-frontend.vercel.app"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Initialize CESEDA AI Expert
    # ceseda_ai = CESEDAExpert()  # TODO: Activer après install numpy
    
    # ✅ Enregistrement Blueprint API v4.0
    from src.backend.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    
    # Routes principales (v3.0 - templates HTML - coexistence)
    @app.route('/')
    def index():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return redirect(url_for('dashboard'))
    
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            username = request.form['username']
            password = request.form['password']
            
            # Simple auth (améliorer en production)
            if username == 'admin' and password == 'admin123':
                session['user_id'] = username
                session['user_role'] = 'avocat'
                flash('Connexion réussie!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Identifiants incorrects', 'error')
        
        return render_template('auth/login.html')
    
    @app.route('/logout')
    def logout():
        session.clear()
        flash('Déconnexion réussie', 'info')
        return redirect(url_for('login'))
    
    @app.route('/dashboard')
    def dashboard():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        # Données dashboard
        dashboard_data = {
            'total_cases': 23,
            'urgent_cases': 5,
            'success_rate': 87,
            'monthly_revenue': 2400,
            'recent_cases': [
                {'client': 'Mme HASSAN', 'type': 'OQTF', 'success_prob': 87, 'urgency': 'critique', 'days_left': 2},
                {'client': 'M. GARCIA', 'type': 'Titre séjour', 'success_prob': 65, 'urgency': 'normal', 'days_left': 15},
                {'client': 'Mme CHEN', 'type': 'Regroupement', 'success_prob': 92, 'urgency': 'suivi', 'days_left': 30}
            ]
        }
        
        return render_template('dashboard/avocat_dashboard.html', data=dashboard_data)
    
    @app.route('/ceseda/analyze', methods=['GET', 'POST'])
    def ceseda_analyze():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        if request.method == 'POST':
            # Récupérer données formulaire
            case_data = {
                'client_name': request.form.get('client_name'),
                'nationality': request.form.get('nationality'),
                'procedure_type': request.form.get('procedure_type'),
                'duration_in_france': int(request.form.get('duration_in_france', 0)),
                'family_situation': request.form.get('family_situation'),
                'employment_status': request.form.get('employment_status'),
                'has_lawyer': True,
                'documents_complete': request.form.get('documents_complete') == 'on',
                'previous_refusals': int(request.form.get('previous_refusals', 0))
            }
            
            # Analyse IA CESEDA
            analysis = ceseda_ai.analyze_ceseda_case(case_data)
            prediction = ceseda_ai.predict_case_success(case_data)
            
            return render_template('legal/case_analysis.html', 
                                 case_data=case_data, 
                                 analysis=analysis, 
                                 prediction=prediction)
        
        return render_template('legal/ceseda_form.html')
    
    @app.route('/api/ceseda/predict', methods=['POST'])
    def api_ceseda_predict():
        """API endpoint pour prédiction CESEDA"""
        if 'user_id' not in session:
            return jsonify({'error': 'Non autorisé'}), 401
        
        case_data = request.json
        prediction = ceseda_ai.predict_case_success(case_data)
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/api/ceseda/generate-document', methods=['POST'])
    def api_generate_document():
        """API endpoint pour génération documents"""
        if 'user_id' not in session:
            return jsonify({'error': 'Non autorisé'}), 401
        
        data = request.json
        doc_type = data.get('doc_type', 'recours_ta')
        case_data = data.get('case_data', {})
        language = data.get('language', 'fr')
        
        document = ceseda_ai.generate_legal_document(doc_type, case_data, language)
        
        return jsonify({
            'success': True,
            'document': document,
            'doc_type': doc_type,
            'language': language
        })
    
    @app.route('/documents/generator')
    def document_generator():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        return render_template('legal/document_generator.html')
    
    @app.route('/analytics')
    def analytics():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        analytics_data = {
            'ai_accuracy': 87,
            'cases_processed': 156,
            'time_saved_hours': 109,
            'client_satisfaction': 94,
            'revenue_generated': 2400,
            'costs_avoided': 45000,
            'roi_percentage': 340,
            'new_clients': 15
        }
        
        return render_template('analytics/performance_dashboard.html', data=analytics_data)
    
    @app.route('/settings')
    def settings():
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        return render_template('settings/cabinet_settings.html')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return render_template('errors/500.html'), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)