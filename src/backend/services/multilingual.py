from flask import Blueprint, request, jsonify, session
import json
from datetime import datetime

multilingual = Blueprint('multilingual', __name__)

# Language support
SUPPORTED_LANGUAGES = {
    'fr': 'Français',
    'en': 'English', 
    'ar': 'العربية',
    'es': 'Español',
    'pt': 'Português',
    'ru': 'Русский',
    'zh': '中文',
    'tr': 'Türkçe',
    'de': 'Deutsch',
    'it': 'Italiano'
}

# Legal translations
LEGAL_TRANSLATIONS = {
    'fr': {
        'titre_sejour': 'Titre de séjour',
        'regroupement_familial': 'Regroupement familial',
        'naturalisation': 'Naturalisation',
        'recours_oqtf': 'Recours OQTF',
        'urgence': 'URGENCE',
        'analyse_complete': 'Analyse complète du dossier',
        'probabilite_succes': 'Probabilité de succès',
        'documents_requis': 'Documents requis',
        'delai_estime': 'Délai estimé'
    },
    'en': {
        'titre_sejour': 'Residence permit',
        'regroupement_familial': 'Family reunification',
        'naturalisation': 'Naturalization',
        'recours_oqtf': 'OQTF appeal',
        'urgence': 'URGENT',
        'analyse_complete': 'Complete case analysis',
        'probabilite_succes': 'Success probability',
        'documents_requis': 'Required documents',
        'delai_estime': 'Estimated timeframe'
    },
    'ar': {
        'titre_sejour': 'تصريح الإقامة',
        'regroupement_familial': 'لم الشمل',
        'naturalisation': 'التجنس',
        'recours_oqtf': 'طعن ضد قرار المغادرة',
        'urgence': 'عاجل',
        'analyse_complete': 'تحليل شامل للملف',
        'probabilite_succes': 'احتمالية النجاح',
        'documents_requis': 'الوثائق المطلوبة',
        'delai_estime': 'المدة المقدرة'
    },
    'es': {
        'titre_sejour': 'Permiso de residencia',
        'regroupement_familial': 'Reagrupación familiar',
        'naturalisation': 'Naturalización',
        'recours_oqtf': 'Recurso OQTF',
        'urgence': 'URGENTE',
        'analyse_complete': 'Análisis completo del expediente',
        'probabilite_succes': 'Probabilidad de éxito',
        'documents_requis': 'Documentos requeridos',
        'delai_estime': 'Plazo estimado'
    }
}

def translate_text(text, target_lang='fr'):
    """Simple translation function - can be enhanced with Google Translate API"""
    if target_lang not in LEGAL_TRANSLATIONS:
        return text
    
    translations = LEGAL_TRANSLATIONS[target_lang]
    
    # Simple keyword replacement
    for key, value in translations.items():
        text = text.replace(key, value)
    
    return text

def get_client_language(request_data):
    """Detect client language from request or browser"""
    # Priority: explicit language > browser language > default French
    if 'language' in request_data:
        return request_data['language']
    
    # Browser language detection (simplified)
    accept_lang = request.headers.get('Accept-Language', 'fr')
    for lang in SUPPORTED_LANGUAGES.keys():
        if lang in accept_lang:
            return lang
    
    return 'fr'  # Default to French

@multilingual.route('/api/multilingual/analyze', methods=['POST'])
def multilingual_analyze():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    if not data or 'description' not in data:
        return jsonify({'error': 'Description manquante'}), 400
    
    client_lang = get_client_language(data)
    description = data['description']
    procedure_type = data.get('procedure_type', 'titre_sejour')
    
    # Basic analysis (same as before but with translations)
    urgent_keywords = {
        'fr': ['expulsion', 'oqtf', 'détention', 'dublin', 'urgence'],
        'en': ['expulsion', 'removal', 'detention', 'dublin', 'urgent'],
        'ar': ['طرد', 'احتجاز', 'عاجل'],
        'es': ['expulsión', 'detención', 'urgente']
    }
    
    keywords = urgent_keywords.get(client_lang, urgent_keywords['fr'])
    is_urgent = any(keyword in description.lower() for keyword in keywords)
    
    # Generate multilingual response
    analysis = {
        'urgency': translate_text('urgence' if is_urgent else 'normal', client_lang),
        'procedure': translate_text(procedure_type, client_lang),
        'recommendations': [
            translate_text('Constituer un dossier complet', client_lang),
            translate_text('Rassembler les justificatifs', client_lang),
            translate_text('Consulter un avocat spécialisé', client_lang)
        ],
        'language': client_lang,
        'success_probability': 0.75 if not is_urgent else 0.45
    }
    
    return jsonify({
        'success': True,
        'analysis': analysis,
        'language': client_lang
    })

@multilingual.route('/api/multilingual/document', methods=['POST'])
def multilingual_document():
    if 'user_id' not in session:
        return jsonify({'error': 'Non autorisé'}), 401
    
    data = request.get_json()
    client_lang = get_client_language(data)
    doc_type = data.get('type', 'recours_oqtf')
    client_info = data.get('client_info', {})
    
    # Multilingual document templates
    templates = {
        'fr': {
            'recours_oqtf': f"""
RECOURS CONTRE OBLIGATION DE QUITTER LE TERRITOIRE

Monsieur le Président du Tribunal Administratif,

J'ai l'honneur de contester l'OQTF du {client_info.get('date', '[DATE]')}.

Situation: {client_info.get('situation', '[SITUATION]')}

Cordialement,
{datetime.now().strftime('%d/%m/%Y')}
            """
        },
        'en': {
            'recours_oqtf': f"""
APPEAL AGAINST REMOVAL ORDER

Dear President of the Administrative Court,

I have the honor to contest the removal order dated {client_info.get('date', '[DATE]')}.

Situation: {client_info.get('situation', '[SITUATION]')}

Sincerely,
{datetime.now().strftime('%d/%m/%Y')}
            """
        },
        'ar': {
            'recours_oqtf': f"""
طعن ضد قرار المغادرة الإجبارية

سيدي رئيس المحكمة الإدارية،

أتشرف بالطعن في قرار المغادرة المؤرخ {client_info.get('date', '[التاريخ]')}.

الوضعية: {client_info.get('situation', '[الوضعية]')}

مع فائق الاحترام،
{datetime.now().strftime('%d/%m/%Y')}
            """
        }
    }
    
    lang_templates = templates.get(client_lang, templates['fr'])
    document_content = lang_templates.get(doc_type, "Template non disponible")
    
    return jsonify({
        'success': True,
        'document': {
            'type': doc_type,
            'content': document_content,
            'language': client_lang,
            'generated_at': datetime.now().isoformat()
        }
    })

@multilingual.route('/api/multilingual/languages', methods=['GET'])
def get_languages():
    return jsonify({
        'success': True,
        'languages': SUPPORTED_LANGUAGES
    })

def register_multilingual_routes(app):
    """Register multilingual routes with Flask app"""
    app.register_blueprint(multilingual)