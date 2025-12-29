from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
from ..services.legal_payment_service import LegalPaymentService
from ..utils.auth import require_auth
from ..utils.validators import validate_file_upload

legal_bp = Blueprint('legal', __name__)
legal_service = LegalPaymentService()

UPLOAD_FOLDER = 'uploads/legal'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@legal_bp.route('/import-excel', methods=['POST'])
@require_auth
def import_excel_payments():
    """Import Excel des délais de paiement et génération d'emails"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Aucun fichier sélectionné'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Format de fichier non supporté. Utilisez .xlsx ou .xls'}), 400
        
        # Sauvegarde sécurisée
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Traitement
        results = legal_service.process_batch_emails(file_path)
        
        # Nettoyage
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': f'{results["generated"]} emails générés sur {results["total"]} clients',
            'data': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legal_bp.route('/generate-email', methods=['POST'])
@require_auth
def generate_single_email():
    """Génère un email pour un client spécifique"""
    try:
        data = request.get_json()
        
        required_fields = ['nom_client', 'email', 'montant', 'date_facture', 'delai_jours', 'type_affaire', 'statut']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Champ manquant: {field}'}), 400
        
        email_data = legal_service.generate_legal_email(data)
        
        return jsonify({
            'success': True,
            'email': email_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legal_bp.route('/template', methods=['GET'])
@require_auth
def download_template():
    """Télécharge le template Excel"""
    try:
        template_path = os.path.join(UPLOAD_FOLDER, 'template_delais_paiement.xlsx')
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        legal_service.create_excel_template(template_path)
        
        return send_file(
            template_path,
            as_attachment=True,
            download_name='template_delais_paiement.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@legal_bp.route('/preview-emails', methods=['POST'])
@require_auth
def preview_emails():
    """Prévisualise les emails sans les envoyer"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['file']
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Import et génération sans envoi
        clients_data = legal_service.import_excel_payments(file_path)
        previews = []
        
        for client in clients_data[:5]:  # Limite à 5 pour preview
            email_data = legal_service.generate_legal_email(client)
            previews.append({
                'client': client['nom_client'],
                'subject': email_data['subject'],
                'urgency': email_data['urgency'],
                'amount': email_data['amount'],
                'preview': email_data['body'][:200] + '...'
            })
        
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'total_clients': len(clients_data),
            'previews': previews
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500