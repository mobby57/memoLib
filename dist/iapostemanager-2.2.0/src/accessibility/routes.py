"""Routes Flask pour l'accessibilité"""
from flask import Blueprint, request, jsonify, send_file
from .accessibility_manager import AccessibilityManager, ModeAccessibilite
import logging

logger = logging.getLogger(__name__)
accessibility_bp = Blueprint('accessibility', __name__, url_prefix='/api/accessibility')
manager = AccessibilityManager()

@accessibility_bp.route('/mode', methods=['POST'])
def set_mode():
    """Définit le mode d'accessibilité"""
    data = request.json
    mode = data.get('mode', 'standard')
    try:
        manager.set_mode(mode)
        return jsonify({'success': True, 'mode': mode})
    except ValueError:
        return jsonify({'success': False, 'error': 'Mode invalide'}), 400

@accessibility_bp.route('/tts', methods=['POST'])
def text_to_speech():
    """Convertit du texte en audio"""
    data = request.json
    texte = data.get('texte', '')
    if not texte:
        return jsonify({'success': False, 'error': 'Texte requis'}), 400
    
    import os
    import tempfile
    temp_dir = tempfile.gettempdir()
    audio_path = os.path.join(temp_dir, 'temp_tts.wav')
    
    if manager.tts.sauvegarder_audio(texte, audio_path):
        return send_file(audio_path, mimetype='audio/wav', as_attachment=False)
    return jsonify({'success': False, 'error': 'Erreur TTS'}), 500

@accessibility_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """Transcrit un audio en texte"""
    import os
    import tempfile
    from pydub import AudioSegment
    
    try:
        if 'audio' not in request.files:
            # Utiliser le microphone
            texte = manager.transcription.transcrire_microphone()
        else:
            # Transcrire le fichier uploadé
            audio_file = request.files['audio']
            temp_dir = tempfile.gettempdir()
            
            # Convertir webm en wav
            webm_path = os.path.join(temp_dir, 'temp_audio.webm')
            wav_path = os.path.join(temp_dir, 'temp_audio.wav')
            
            audio_file.save(webm_path)
            
            # Conversion webm -> wav
            audio = AudioSegment.from_file(webm_path, format="webm")
            audio.export(wav_path, format="wav")
            
            texte = manager.transcription.transcrire_fichier(wav_path)
            
            # Nettoyer les fichiers temporaires
            try:
                os.remove(webm_path)
                os.remove(wav_path)
            except:
                pass
        
        if texte:
            return jsonify({'success': True, 'texte': texte})
        return jsonify({'success': False, 'error': 'Aucun texte détecté'}), 400
    except Exception as e:
        logger.error(f"Erreur transcription: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@accessibility_bp.route('/email/read', methods=['POST'])
def read_email():
    """Lit un email à voix haute"""
    data = request.json
    email_data = data.get('email', {})
    if manager.tts.lire_email(email_data):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Erreur lecture'}), 500

@accessibility_bp.route('/feedback', methods=['POST'])
def vocal_feedback():
    """Donne un feedback vocal"""
    data = request.json
    message = data.get('message', '')
    manager.feedback_vocal(message)
    return jsonify({'success': True})
