"""
Optimisations spécifiques pour vrais utilisateurs
Améliorations basées sur retours d'accessibilité
"""

import json
import os
from datetime import datetime

class AccessibilityOptimizer:
    def __init__(self):
        self.user_preferences = {}
        self.usage_stats = {}
        self.load_preferences()
    
    def load_preferences(self):
        """Charger préférences utilisateur"""
        try:
            if os.path.exists('data/accessibility_prefs.json'):
                with open('data/accessibility_prefs.json', 'r') as f:
                    self.user_preferences = json.load(f)
        except:
            self.user_preferences = self.get_default_preferences()
    
    def get_default_preferences(self):
        """Préférences par défaut optimisées"""
        return {
            'tts': {
                'speed': 120,  # Plus lent pour illettrés
                'volume': 0.95,
                'voice_type': 'female',  # Voix féminine plus claire
                'pause_between_sentences': 0.8
            },
            'visual': {
                'font_size': 'large',  # 24px minimum
                'high_contrast': False,
                'button_size': 'extra_large',  # 80px minimum
                'animation_reduced': True
            },
            'interaction': {
                'click_delay': 0.5,  # Éviter double-clics accidentels
                'voice_timeout': 15,  # Plus de temps pour parler
                'auto_repeat_instructions': True,
                'confirmation_required': True
            },
            'language': {
                'use_simple_words': True,
                'avoid_technical_terms': True,
                'repeat_important_info': True
            }
        }
    
    def save_preferences(self):
        """Sauvegarder préférences"""
        os.makedirs('data', exist_ok=True)
        with open('data/accessibility_prefs.json', 'w') as f:
            json.dump(self.user_preferences, f, indent=2)
    
    def optimize_tts_for_user(self, user_profile):
        """Optimiser TTS selon profil utilisateur"""
        if user_profile == 'illettré':
            return {
                'speed': 100,  # Très lent
                'volume': 1.0,
                'pause_long': 1.2,
                'repeat_twice': True
            }
        elif user_profile == 'aveugle':
            return {
                'speed': 140,  # Normal
                'volume': 0.9,
                'detailed_descriptions': True,
                'navigation_sounds': True
            }
        elif user_profile == 'âgé':
            return {
                'speed': 110,  # Lent
                'volume': 1.0,
                'simple_vocabulary': True,
                'patient_mode': True
            }
        return self.user_preferences['tts']
    
    def get_simplified_instructions(self, action):
        """Instructions ultra-simplifiées"""
        instructions = {
            'créer_message': [
                "Cliquez sur le gros bouton bleu",
                "Parlez maintenant",
                "Dites ce que vous voulez écrire",
                "L'ordinateur va comprendre"
            ],
            'joindre_fichier': [
                "Cliquez sur le bouton avec le trombone",
                "Choisissez votre photo ou document",
                "Cliquez sur ouvrir"
            ],
            'envoyer': [
                "Cliquez sur le bouton vert",
                "Dites l'adresse email",
                "Dites oui pour envoyer"
            ]
        }
        return instructions.get(action, ["Suivez les instructions à l'écran"])
    
    def track_user_difficulty(self, action, success, time_taken):
        """Suivre difficultés utilisateur"""
        if action not in self.usage_stats:
            self.usage_stats[action] = {
                'attempts': 0,
                'successes': 0,
                'avg_time': 0,
                'difficulties': []
            }
        
        stats = self.usage_stats[action]
        stats['attempts'] += 1
        if success:
            stats['successes'] += 1
        
        # Détecter si l'utilisateur a des difficultés
        if time_taken > 60:  # Plus d'1 minute
            stats['difficulties'].append({
                'timestamp': datetime.now().isoformat(),
                'time_taken': time_taken,
                'success': success
            })
        
        # Auto-ajustement des préférences
        if stats['attempts'] > 3:
            success_rate = stats['successes'] / stats['attempts']
            if success_rate < 0.5:  # Moins de 50% de réussite
                self.auto_adjust_for_difficulty(action)
    
    def auto_adjust_for_difficulty(self, action):
        """Ajustement automatique en cas de difficulté"""
        adjustments = {
            'créer_message': {
                'tts.speed': max(80, self.user_preferences['tts']['speed'] - 20),
                'interaction.voice_timeout': min(30, self.user_preferences['interaction']['voice_timeout'] + 5),
                'interaction.auto_repeat_instructions': True
            },
            'joindre_fichier': {
                'visual.button_size': 'maximum',
                'interaction.confirmation_required': True
            },
            'envoyer': {
                'interaction.confirmation_required': True,
                'tts.repeat_twice': True
            }
        }
        
        if action in adjustments:
            for key, value in adjustments[action].items():
                keys = key.split('.')
                if len(keys) == 2:
                    self.user_preferences[keys[0]][keys[1]] = value
            
            self.save_preferences()
    
    def get_error_recovery_help(self, error_type):
        """Aide de récupération d'erreur"""
        help_messages = {
            'microphone_not_found': [
                "Votre microphone n'est pas détecté",
                "Vérifiez qu'il est bien branché",
                "Ou utilisez les boutons à la place"
            ],
            'speech_not_recognized': [
                "Je n'ai pas compris",
                "Parlez plus fort et plus lentement",
                "Ou choisissez un modèle de message"
            ],
            'email_failed': [
                "L'envoi a échoué",
                "Vérifiez l'adresse email",
                "Réessayez dans quelques minutes"
            ],
            'file_too_large': [
                "Le fichier est trop gros",
                "Choisissez une image plus petite",
                "Ou un document plus court"
            ]
        }
        return help_messages.get(error_type, ["Une erreur s'est produite", "Réessayez"])
    
    def generate_personalized_tutorial(self, user_profile):
        """Tutoriel personnalisé selon profil"""
        tutorials = {
            'illettré': {
                'steps': [
                    "Bienvenue ! Cette application vous aide à envoyer des emails",
                    "Vous n'avez pas besoin de savoir lire ou écrire",
                    "Parlez simplement, l'ordinateur comprend",
                    "Il y a 3 gros boutons : Créer, Joindre, Envoyer",
                    "Commençons par créer votre premier message"
                ],
                'demo_mode': True,
                'extra_patience': True
            },
            'aveugle': {
                'steps': [
                    "Interface accessible aux lecteurs d'écran",
                    "Navigation par tabulation ou raccourcis",
                    "Touche 1 : Créer message",
                    "Touche 2 : Joindre fichier", 
                    "Touche 3 : Envoyer",
                    "Touche H : Aide"
                ],
                'keyboard_focus': True,
                'detailed_descriptions': True
            },
            'sourd': {
                'steps': [
                    "Interface visuelle claire avec icônes",
                    "Pas besoin d'audio",
                    "Suivez les instructions à l'écran",
                    "Utilisez les modèles de messages",
                    "Tout est expliqué par écrit"
                ],
                'visual_emphasis': True,
                'no_audio_required': True
            }
        }
        return tutorials.get(user_profile, tutorials['illettré'])

# Instance globale
accessibility_optimizer = AccessibilityOptimizer()