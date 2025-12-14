"""Analytics avancées pour l'application"""
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

class AdvancedAnalytics:
    def __init__(self, app_dir="data"):
        self.app_dir = app_dir
        self.analytics_file = os.path.join(app_dir, 'analytics.json')
        self.ensure_analytics_file()
    
    def ensure_analytics_file(self):
        """S'assure que le fichier d'analytics existe"""
        if not os.path.exists(self.analytics_file):
            default_analytics = {
                "events": [],
                "metrics": {},
                "reports": {}
            }
            
            os.makedirs(os.path.dirname(self.analytics_file), exist_ok=True)
            with open(self.analytics_file, 'w', encoding='utf-8') as f:
                json.dump(default_analytics, f, indent=2, ensure_ascii=False)
    
    def track_event(self, event_type, data=None):
        """Enregistre un événement"""
        try:
            with open(self.analytics_file, 'r', encoding='utf-8') as f:
                analytics = json.load(f)
            
            event = {
                'type': event_type,
                'timestamp': datetime.now().isoformat(),
                'data': data or {}
            }
            
            analytics['events'].append(event)
            
            # Garder seulement les 1000 derniers événements
            if len(analytics['events']) > 1000:
                analytics['events'] = analytics['events'][-1000:]
            
            with open(self.analytics_file, 'w', encoding='utf-8') as f:
                json.dump(analytics, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Erreur tracking event: {e}")
    
    def generate_report(self, period='weekly'):
        """Génère un rapport d'analytics"""
        try:
            with open(self.analytics_file, 'r', encoding='utf-8') as f:
                analytics = json.load(f)
            
            events = analytics.get('events', [])
            
            # Définir la période
            if period == 'daily':
                since = datetime.now() - timedelta(days=1)
            elif period == 'weekly':
                since = datetime.now() - timedelta(days=7)
            elif period == 'monthly':
                since = datetime.now() - timedelta(days=30)
            else:
                since = datetime.now() - timedelta(days=7)
            
            # Filtrer les événements
            recent_events = [
                e for e in events 
                if datetime.fromisoformat(e['timestamp']) >= since
            ]
            
            # Compter par type
            event_counts = defaultdict(int)
            for event in recent_events:
                event_counts[event['type']] += 1
            
            report = {
                'period': period,
                'start_date': since.isoformat(),
                'end_date': datetime.now().isoformat(),
                'total_events': len(recent_events),
                'event_counts': dict(event_counts),
                'summary': {
                    'emails_sent': event_counts.get('email_sent', 0),
                    'ai_generations': event_counts.get('ai_generation', 0),
                    'logins': event_counts.get('login', 0),
                    'templates_used': event_counts.get('template_used', 0)
                }
            }
            
            return report
            
        except Exception as e:
            print(f"Erreur génération rapport: {e}")
            return {
                'period': period,
                'error': str(e),
                'total_events': 0,
                'event_counts': {},
                'summary': {}
            }
    
    def get_usage_stats(self):
        """Retourne les statistiques d'utilisation"""
        try:
            report = self.generate_report('monthly')
            
            return {
                'monthly_emails': report['summary'].get('emails_sent', 0),
                'monthly_ai_generations': report['summary'].get('ai_generations', 0),
                'monthly_logins': report['summary'].get('logins', 0),
                'most_used_features': self.get_most_used_features(report)
            }
            
        except Exception:
            return {
                'monthly_emails': 0,
                'monthly_ai_generations': 0,
                'monthly_logins': 0,
                'most_used_features': []
            }
    
    def get_most_used_features(self, report):
        """Identifie les fonctionnalités les plus utilisées"""
        event_counts = report.get('event_counts', {})
        
        # Trier par utilisation
        sorted_features = sorted(
            event_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return [
            {'feature': feature, 'usage_count': count}
            for feature, count in sorted_features[:5]
        ]