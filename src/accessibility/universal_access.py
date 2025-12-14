"""
Système d'Accessibilité Universel
Support pour personnes sourdes, muettes et aveugles
"""

import pyttsx3
import threading
import json
import os
from datetime import datetime
from typing import Optional, Dict, List

class UniversalAccessibilityService:
    """Service d'accessibilité universel avec support multi-handicap"""
    
    def __init__(self):
        # TTS (Text-to-Speech) pour aveugles
        self.tts_engine = None
        self.tts_enabled = True
        self.tts_rate = 150
        self.tts_volume = 1.0
        
        # Transcription en temps réel pour sourds
        self.transcript_buffer = []
        self.max_buffer_size = 100
        
        # Mode haut contraste pour malvoyants
        self.high_contrast = False
        
        # Taille de police pour malvoyants
        self.font_size = "normal"  # small, normal, large, xlarge
        
        # Historique des actions pour tous
        self.action_history = []
        
        self._init_tts()
    
    def _init_tts(self):
        """Initialise le moteur TTS"""
        try:
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', self.tts_rate)
            self.tts_engine.setProperty('volume', self.tts_volume)
            
            # Choisir une voix française si disponible
            voices = self.tts_engine.getProperty('voices')
            for voice in voices:
                if 'french' in voice.name.lower() or 'fr' in voice.id.lower():
                    self.tts_engine.setProperty('voice', voice.id)
                    break
        except Exception as e:
            print(f"Erreur initialisation TTS: {e}")
            self.tts_enabled = False
    
    def speak(self, text: str, priority: str = "normal"):
        """
        Prononce le texte à voix haute (pour aveugles)
        
        Args:
            text: Texte à prononcer
            priority: urgent, normal, low
        """
        if not self.tts_enabled or not self.tts_engine:
            return
        
        def _speak():
            try:
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
            except Exception as e:
                print(f"Erreur TTS: {e}")
        
        # Exécuter dans un thread séparé
        thread = threading.Thread(target=_speak)
        thread.daemon = True
        thread.start()
        
        # Ajouter à l'historique
        self._add_to_history("speech", text, priority)
    
    def add_visual_transcript(self, text: str, speaker: str = "system", type: str = None):
        """
        Ajoute une transcription visuelle (pour sourds)
        
        Args:
            text: Texte à afficher
            speaker: Qui parle (system, user, assistant)
            type: Type de message (optionnel, pour compatibilité)
        """
        transcript_entry = {
            'timestamp': datetime.now().isoformat(),
            'speaker': type or speaker,
            'text': text
        }
        
        self.transcript_buffer.append(transcript_entry)
        
        # Limiter la taille du buffer
        if len(self.transcript_buffer) > self.max_buffer_size:
            self.transcript_buffer = self.transcript_buffer[-self.max_buffer_size:]
        
        self._add_to_history("transcript", text, "normal")
        
        return transcript_entry
    
    def get_transcripts(self, limit: int = 50) -> List[Dict]:
        """Récupère les dernières transcriptions"""
        return self.transcript_buffer[-limit:]
    
    def announce_action(self, action: str, details: str = "", speak: bool = True, show: bool = True):
        """
        Annonce une action de manière universelle
        
        Args:
            action: Action effectuée (ex: "email_sent", "file_uploaded")
            details: Détails supplémentaires
            speak: Annoncer vocalement (aveugles)
            show: Afficher visuellement (sourds)
        """
        # Message formaté
        messages = {
            "email_sent": f"Email envoyé avec succès. {details}",
            "email_received": f"Nouvel email reçu. {details}",
            "recording_started": f"Enregistrement démarré. {details}",
            "recording_stopped": f"Enregistrement arrêté. {details}",
            "transcription_ready": f"Transcription terminée. {details}",
            "file_uploaded": f"Fichier téléchargé. {details}",
            "error": f"Erreur: {details}",
            "success": f"Opération réussie. {details}",
            "warning": f"Attention: {details}"
        }
        
        message = messages.get(action, f"{action}. {details}")
        
        # Annoncer vocalement pour aveugles
        if speak and self.tts_enabled:
            self.speak(message)
        
        # Afficher visuellement pour sourds
        if show:
            self.add_visual_transcript(message, "system")
        
        return {
            'action': action,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'spoken': speak,
            'shown': show
        }
    
    def describe_screen(self, elements: List[Dict]):
        """
        Décrit les éléments à l'écran (pour aveugles)
        
        Args:
            elements: Liste de dict avec {type, label, position}
        """
        description = "Éléments présents: "
        element_descriptions = []
        
        for elem in elements:
            elem_type = elem.get('type', 'élément')
            label = elem.get('label', 'sans nom')
            element_descriptions.append(f"{elem_type} {label}")
        
        description += ", ".join(element_descriptions)
        
        self.speak(description)
        return description
    
    def get_keyboard_shortcuts(self) -> Dict[str, str]:
        """
        Retourne les raccourcis clavier pour navigation sans souris
        """
        return {
            # Navigation
            "Tab": "Élément suivant",
            "Shift+Tab": "Élément précédent",
            "Enter": "Activer/Sélectionner",
            "Espace": "Activer bouton/case",
            
            # Actions rapides
            "Ctrl+N": "Nouvel email",
            "Ctrl+S": "Sauvegarder",
            "Ctrl+Enter": "Envoyer email",
            "Ctrl+R": "Démarrer/Arrêter enregistrement",
            "Ctrl+T": "Activer/Désactiver TTS",
            
            # Navigation interface
            "Alt+1": "Dashboard",
            "Alt+2": "Envoyer email",
            "Alt+3": "Boîte de réception",
            "Alt+4": "Transcription vocale",
            "Alt+5": "Configuration",
            
            # Accessibilité
            "Ctrl++": "Augmenter taille police",
            "Ctrl+-": "Diminuer taille police",
            "Ctrl+H": "Activer/Désactiver haut contraste",
            "Ctrl+L": "Lire l'écran (TTS)",
            "Ctrl+M": "Menu accessibilité",
            
            # Aide
            "F1": "Aide contextuelle",
            "Ctrl+?": "Liste raccourcis clavier"
        }
    
    def set_tts_settings(self, rate: Optional[int] = None, volume: Optional[float] = None):
        """Configure les paramètres TTS"""
        if self.tts_engine:
            if rate is not None:
                self.tts_rate = rate
                self.tts_engine.setProperty('rate', rate)
            if volume is not None:
                self.tts_volume = volume
                self.tts_engine.setProperty('volume', volume)
    
    def toggle_tts(self):
        """Active/Désactive le TTS"""
        self.tts_enabled = not self.tts_enabled
        status = "activé" if self.tts_enabled else "désactivé"
        self.add_visual_transcript(f"Synthèse vocale {status}", "system")
        return self.tts_enabled
    
    def set_font_size(self, size: str):
        """Configure la taille de police (small, normal, large, xlarge)"""
        if size in ["small", "normal", "large", "xlarge"]:
            self.font_size = size
            self.announce_action("font_size_changed", f"Taille: {size}", speak=True, show=True)
            return True
        return False
    
    def toggle_high_contrast(self):
        """Active/Désactive le mode haut contraste"""
        self.high_contrast = not self.high_contrast
        status = "activé" if self.high_contrast else "désactivé"
        self.announce_action("contrast_changed", f"Mode haut contraste {status}", speak=True, show=True)
        return self.high_contrast
    
    def _add_to_history(self, action_type: str, content: str, priority: str):
        """Ajoute une action à l'historique"""
        self.action_history.append({
            'type': action_type,
            'content': content,
            'priority': priority,
            'timestamp': datetime.now().isoformat()
        })
        
        # Limiter l'historique
        if len(self.action_history) > 200:
            self.action_history = self.action_history[-200:]
    
    def get_action_history(self, limit: int = 50) -> List[Dict]:
        """Récupère l'historique des actions"""
        return self.action_history[-limit:]
    
    def generate_audio_description(self, context: Dict) -> str:
        """
        Génère une description audio du contexte actuel
        
        Args:
            context: Dict avec page, elements, notifications, etc.
        """
        page = context.get('page', 'Page inconnue')
        elements = context.get('elements', [])
        notifications = context.get('notifications', [])
        
        description = f"Vous êtes sur la page {page}. "
        
        if notifications:
            description += f"{len(notifications)} notification(s). "
            for notif in notifications[:3]:  # Max 3 notifs
                description += f"{notif.get('message', '')}. "
        
        if elements:
            description += f"{len(elements)} éléments disponibles. "
            # Décrire les 3 premiers éléments importants
            important = [e for e in elements if e.get('important', False)][:3]
            for elem in important:
                description += f"{elem.get('type', 'Élément')} {elem.get('label', '')}. "
        
        return description
    
    def create_accessibility_profile(self, user_needs: List[str]) -> Dict:
        """
        Crée un profil d'accessibilité personnalisé
        
        Args:
            user_needs: Liste de besoins (blind, deaf, mute, low_vision, motor_impaired)
        
        Returns:
            Dict avec name, description, settings, features
        """
        profile = {
            'name': '',
            'description': '',
            'needs': user_needs,
            'settings': {},
            'features': [],
            'recommendations': []
        }
        
        # Configuration pour aveugles
        if 'blind' in user_needs:
            profile['name'] = 'Profil Aveugle'
            profile['description'] = 'Synthèse vocale active + navigation clavier complète'
            profile['settings']['tts_enabled'] = True
            profile['settings']['tts_rate'] = 150
            profile['settings']['keyboard_navigation'] = True
            profile['settings']['screen_reader_mode'] = True
            profile['settings']['high_contrast'] = True
            profile['settings']['font_size'] = 'x-large'
            profile['features'].append("Synthèse vocale pour tout le contenu")
            profile['features'].append("Descriptions audio des actions")
            profile['features'].append("Navigation complète au clavier")
            profile['features'].append("Compatibilité lecteurs d'écran")
            profile['recommendations'].append("Utiliser Tab pour naviguer")
            profile['recommendations'].append("Ctrl+L pour lire l'écran")
        
        # Configuration pour sourds
        if 'deaf' in user_needs:
            profile['name'] = 'Profil Sourd'
            profile['description'] = 'Transcriptions visuelles + notifications visuelles'
            profile['settings']['visual_notifications'] = True
            profile['settings']['transcript_enabled'] = True
            profile['settings']['video_captions'] = True
            profile['settings']['font_size'] = 'large'
            profile['features'].append("Transcriptions visuelles en temps réel")
            profile['features'].append("Notifications visuelles")
            profile['features'].append("Sous-titres sur tous les messages")
            profile['features'].append("Indicateurs visuels d'état")
            profile['recommendations'].append("Activer les transcriptions visuelles")
            profile['recommendations'].append("Notifications visuelles activées")
        
        # Configuration pour muets
        if 'mute' in user_needs:
            profile['name'] = 'Profil Muet'
            profile['description'] = 'Alternatives textuelles + templates'
            profile['settings']['text_input_only'] = True
            profile['settings']['alternative_communication'] = True
            profile['features'].append("Saisie de texte partout")
            profile['features'].append("Templates pré-définis")
            profile['features'].append("Alternatives au vocal")
            profile['features'].append("Communication par texte")
            profile['recommendations'].append("Utiliser le clavier pour toutes les entrées")
            profile['recommendations'].append("Templates disponibles")
        
        # Configuration pour malvoyants
        if 'low_vision' in user_needs:
            profile['name'] = 'Profil Malvoyant'
            profile['description'] = 'Haut contraste + grande police'
            profile['settings']['high_contrast'] = True
            profile['settings']['font_size'] = 'x-large'
            profile['settings']['zoom_enabled'] = True
            profile['features'].append("Mode haut contraste")
            profile['features'].append("Taille de police agrandie")
            profile['features'].append("Zoom disponible")
            profile['recommendations'].append("Ctrl++ pour agrandir")
            profile['recommendations'].append("Ctrl+H pour haut contraste")
        
        # Configuration pour handicap moteur
        if 'motor_impaired' in user_needs:
            profile['name'] = 'Profil Mobilité Réduite'
            profile['description'] = 'Raccourcis clavier + grandes zones cliquables'
            profile['settings']['keyboard_only'] = True
            profile['settings']['sticky_keys'] = True
            profile['settings']['large_click_targets'] = True
            profile['features'].append("Raccourcis clavier complets")
            profile['features'].append("Navigation Tab optimisée")
            profile['features'].append("Grandes zones cliquables")
            profile['features'].append("Pas de double-clic requis")
            profile['recommendations'].append("Navigation complète au clavier")
            profile['recommendations'].append("Touches de raccourci disponibles")
        
        # Nom par défaut si multiple needs
        if len(user_needs) > 1 and not profile['name']:
            profile['name'] = 'Profil Personnalisé'
            profile['description'] = f'Combinaison de {len(user_needs)} besoins'
        
        return profile

# Instance globale
accessibility_service = UniversalAccessibilityService()
