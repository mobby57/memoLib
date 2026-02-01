from flask import Blueprint, request, jsonify, session
import json
import re
from datetime import datetime
from pathlib import Path

legal_ai = Blueprint('legal_ai', __name__)

# Legal knowledge base
CESEDA_KNOWLEDGE = {
    "procedures": {
        "titre_sejour": {
            "delai": "2-4 mois",
            "documents": ["passeport", "justificatifs_revenus", "attestation_logement"],
            "success_rate": 0.78
        },
        "regroupement_familial": {
            "delai": "6-12 mois", 
            "documents": ["acte_mariage", "justificatifs_revenus", "logement"],
            "success_rate": 0.65
        },
        "naturalisation": {
            "delai": "12-18 mois",
            "documents": ["certificat_integration", "justificatifs_revenus", "casier_judiciaire"],
            "success_rate": 0.82
        }
    },
    "urgences": ["expulsion", "oqtf", "detention", "dublin"],
    "languages": ["fr", "en", "ar", "es", "pt", "ru", "zh"]
}

def analyze_legal_case(description, procedure_type):
    """Analyze legal case and provide AI recommendations"""
    
    # Detect urgency keywords
    urgent_keywords = ["expulsion", "oqtf", "détention", "dublin", "urgence"]
    is_urgent = any(keyword in description.lower() for keyword in urgent_keywords)
    
    # Get procedure info
    procedure_info = CESEDA_KNOWLEDGE["procedures"].get(procedure_type, {})
    
    # Generate recommendations
    recommendations = []
    if is_urgent:
        recommendations.append("URGENCE: Déposer recours sous 48h")
        recommendations.append("Contacter avocat spécialisé immédiatement")
    
    if procedure_info:
        recommendations.append(f"Délai moyen: {procedure_info['delai']}")
        recommendations.append(f"Taux de succès: {int(procedure_info['success_rate']*100)}%")
        recommendations.append("Documents requis: " + ", ".join(procedure_info['documents']))
    
    return {
        "urgency": "HIGH" if is_urgent else "NORMAL",
        "procedure": procedure_type,
        "recommendations": recommendations,
        "estimated_duration": procedure_info.get("delai", "Non défini"),
        "success_probability": procedure_info.get("success_rate", 0.5)
    }

@legal_ai.route('/api/legal/analyze', methods=['POST'])
def analyze_case():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    if not data or 'description' not in data:
        return jsonify({'error': 'Description manquante'}), 400
    
    description = data['description']
    procedure_type = data.get('procedure_type', 'titre_sejour')
    
    analysis = analyze_legal_case(description, procedure_type)
    
    # Save analysis
    analyses_file = Path('data/legal_analyses.json')
    analyses = []
    if analyses_file.exists():
        with open(analyses_file, 'r') as f:
            analyses = json.load(f)
    
    analyses.append({
        'id': len(analyses) + 1,
        'user': session['user_id'],
        'description': description,
        'analysis': analysis,
        'created_at': datetime.now().isoformat()
    })
    
    with open(analyses_file, 'w') as f:
        json.dump(analyses, f, indent=2)
    
    return jsonify({
        'success': True,
        'analysis': analysis
    })

@legal_ai.route('/api/legal/generate-document', methods=['POST'])
def generate_document():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    if not data or 'type' not in data:
        return jsonify({'error': 'Type de document manquant'}), 400
    
    doc_type = data['type']
    client_info = data.get('client_info', {})
    
    # Document templates
    templates = {
        "recours_oqtf": f"""
RECOURS CONTRE OBLIGATION DE QUITTER LE TERRITOIRE FRANÇAIS

Madame, Monsieur le Président du Tribunal Administratif,

J'ai l'honneur de vous présenter le présent recours contre l'OQTF notifiée le {client_info.get('date_notification', '[DATE]')}.

FAITS:
{client_info.get('situation', '[DÉCRIRE LA SITUATION]')}

MOYENS:
1. Violation du droit au respect de la vie privée et familiale
2. Erreur manifeste d'appréciation
3. Défaut de motivation

Je sollicite l'annulation de cette décision.

Fait à {client_info.get('ville', '[VILLE]')}, le {datetime.now().strftime('%d/%m/%Y')}
        """,
        
        "demande_titre_sejour": f"""
DEMANDE DE TITRE DE SÉJOUR

Madame, Monsieur le Préfet,

J'ai l'honneur de solliciter la délivrance d'un titre de séjour.

SITUATION PERSONNELLE:
- Nom: {client_info.get('nom', '[NOM]')}
- Nationalité: {client_info.get('nationalite', '[NATIONALITÉ]')}
- Situation familiale: {client_info.get('situation_familiale', '[SITUATION]')}

JUSTIFICATIONS:
{client_info.get('justifications', '[MOTIFS DE LA DEMANDE]')}

Je vous prie d'agréer mes salutations respectueuses.

Fait à {client_info.get('ville', '[VILLE]')}, le {datetime.now().strftime('%d/%m/%Y')}
        """
    }
    
    document_content = templates.get(doc_type, "Template non disponible")
    
    return jsonify({
        'success': True,
        'document': {
            'type': doc_type,
            'content': document_content,
            'generated_at': datetime.now().isoformat()
        }
    })

@legal_ai.route('/api/legal/predict-outcome', methods=['POST'])
def predict_outcome():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    if not data or 'case_details' not in data:
        return jsonify({'error': 'Détails du dossier manquants'}), 400
    
    case_details = data['case_details']
    procedure_type = data.get('procedure_type', 'titre_sejour')
    
    # Simple prediction algorithm based on keywords and procedure type
    positive_factors = 0
    negative_factors = 0
    
    # Analyze case details
    positive_keywords = ["famille", "enfants", "travail", "intégration", "français"]
    negative_keywords = ["condamnation", "trouble", "ordre public", "fraude"]
    
    for keyword in positive_keywords:
        if keyword in case_details.lower():
            positive_factors += 1
    
    for keyword in negative_keywords:
        if keyword in case_details.lower():
            negative_factors += 1
    
    # Base success rate from knowledge base
    base_rate = CESEDA_KNOWLEDGE["procedures"].get(procedure_type, {}).get("success_rate", 0.5)
    
    # Adjust based on factors
    adjustment = (positive_factors - negative_factors) * 0.1
    predicted_success = max(0.1, min(0.9, base_rate + adjustment))
    
    return jsonify({
        'success': True,
        'prediction': {
            'success_probability': round(predicted_success, 2),
            'confidence': 0.75,
            'factors': {
                'positive': positive_factors,
                'negative': negative_factors
            },
            'recommendation': "Favorable" if predicted_success > 0.6 else "Défavorable" if predicted_success < 0.4 else "Incertain"
        }
    })

def register_legal_routes(app):
    """Register legal AI routes with Flask app"""
    app.register_blueprint(legal_ai)