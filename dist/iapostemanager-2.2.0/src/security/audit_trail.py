"""Système d'audit trail pour tracer toutes les opérations"""
import json
import os
from datetime import datetime
from src.core.crypto_utils import _valider_chemin_securise, _securiser_fichier

class AuditTrail:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.audit_file = _valider_chemin_securise(app_dir, "audit_trail.json")
    
    def log_event(self, event_type, user_email, details, status="success"):
        """Enregistre un événement dans l'audit trail"""
        event = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'user_email': user_email,
            'details': details,
            'status': status
        }
        
        events = self._load_events()
        events.append(event)
        self._save_events(events)
    
    def get_events(self, user_email=None, event_type=None, limit=100):
        """Récupère les événements filtrés"""
        events = self._load_events()
        
        if user_email:
            events = [e for e in events if e['user_email'] == user_email]
        if event_type:
            events = [e for e in events if e['event_type'] == event_type]
        
        return events[-limit:]
    
    def _load_events(self):
        """Charge les événements"""
        if not os.path.exists(self.audit_file):
            return []
        with open(self.audit_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _save_events(self, events):
        """Sauvegarde les événements"""
        with open(self.audit_file, 'w', encoding='utf-8') as f:
            json.dump(events, f, indent=2, ensure_ascii=False)
        _securiser_fichier(self.audit_file)
