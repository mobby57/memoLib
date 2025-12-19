from typing import List, Dict, Any
import re
from datetime import datetime, timedelta

class AIEmailFilter:
    def __init__(self):
        self.rules = {
            'spam_keywords': ['lottery', 'winner', 'congratulations', 'free money', 'click here'],
            'urgent_keywords': ['urgent', 'asap', 'emergency', 'immediate', 'deadline'],
            'finance_keywords': ['invoice', 'payment', 'bill', 'facture', 'paiement'],
            'meeting_keywords': ['meeting', 'réunion', 'rendez-vous', 'calendar', 'agenda']
        }
    
    def create_smart_filters(self, emails: List[Dict]) -> List[Dict]:
        """Crée des filtres intelligents basés sur l'analyse des emails"""
        filters = []
        
        # Analyse des domaines fréquents
        domain_count = {}
        for email in emails:
            domain = email.get('domain', '')
            domain_count[domain] = domain_count.get(domain, 0) + 1
        
        # Filtres par domaine populaire
        for domain, count in sorted(domain_count.items(), key=lambda x: x[1], reverse=True)[:5]:
            if count > 5:
                filters.append({
                    'name': f'Emails de {domain}',
                    'type': 'domain',
                    'value': domain,
                    'count': count,
                    'auto_apply': True
                })
        
        # Filtre emails récents
        recent_count = len([e for e in emails if self._is_recent(e.get('date', ''), 7)])
        if recent_count > 0:
            filters.append({
                'name': 'Emails récents (7 jours)',
                'type': 'date_range',
                'value': {'days': 7},
                'count': recent_count,
                'auto_apply': False
            })
        
        # Filtre priorité haute
        high_priority = [e for e in emails if e.get('priority') == 'high']
        if high_priority:
            filters.append({
                'name': 'Priorité haute',
                'type': 'priority',
                'value': 'high',
                'count': len(high_priority),
                'auto_apply': True
            })
        
        return filters
    
    def suggest_organization(self, emails: List[Dict]) -> Dict[str, Any]:
        """Suggère une organisation automatique"""
        suggestions = {
            'folders': [],
            'rules': [],
            'actions': []
        }
        
        # Analyse par catégorie
        categories = {}
        for email in emails:
            cat = email.get('category', 'general')
            categories[cat] = categories.get(cat, 0) + 1
        
        # Créer dossiers pour catégories importantes
        for category, count in categories.items():
            if count > 3:
                suggestions['folders'].append({
                    'name': category.title(),
                    'rule': f"category == '{category}'",
                    'count': count
                })
        
        # Règles de tri automatique
        suggestions['rules'].extend([
            {'condition': 'priority == "high"', 'action': 'move_to_folder', 'target': 'Urgent'},
            {'condition': 'has_attachments == true', 'action': 'add_tag', 'target': 'Pièces jointes'},
            {'condition': 'category == "finance"', 'action': 'move_to_folder', 'target': 'Finance'}
        ])
        
        return suggestions
    
    def _is_recent(self, date_str: str, days: int) -> bool:
        """Vérifie si un email est récent"""
        try:
            import email.utils
            email_date = email.utils.parsedate_to_datetime(date_str)
            return email_date > datetime.now() - timedelta(days=days)
        except:
            return False