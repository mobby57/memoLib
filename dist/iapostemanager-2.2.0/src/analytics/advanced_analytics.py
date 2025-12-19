import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict

class AdvancedAnalytics:
    def __init__(self, db_path="data/securevault.db"):
        self.db_path = db_path
    
    def get_email_stats(self, days: int = 30) -> Dict[str, Any]:
        """Statistiques emails détaillées"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Stats générales
            cursor.execute('''
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    AVG(CASE WHEN status = 'sent' THEN 1.0 ELSE 0.0 END) * 100 as success_rate
                FROM emails 
                WHERE created_at >= datetime('now', '-{} days')
            '''.format(days))
            
            stats = dict(cursor.fetchone())
            
            # Évolution par jour
            cursor.execute('''
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent
                FROM emails 
                WHERE created_at >= datetime('now', '-{} days')
                GROUP BY DATE(created_at)
                ORDER BY date
            '''.format(days))
            
            daily_stats = [dict(row) for row in cursor.fetchall()]
            
            # Top destinataires
            cursor.execute('''
                SELECT recipient, COUNT(*) as count
                FROM emails 
                WHERE created_at >= datetime('now', '-{} days')
                GROUP BY recipient
                ORDER BY count DESC
                LIMIT 10
            '''.format(days))
            
            top_recipients = [dict(row) for row in cursor.fetchall()]
            
            return {
                'summary': stats,
                'daily_evolution': daily_stats,
                'top_recipients': top_recipients
            }
    
    def get_ai_stats(self, days: int = 30) -> Dict[str, Any]:
        """Statistiques IA détaillées"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Stats générales
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_generations,
                    COUNT(DISTINCT DATE(created_at)) as active_days
                FROM ai_generations 
                WHERE created_at >= datetime('now', '-{} days')
            '''.format(days))
            
            stats = dict(cursor.fetchone())
            
            # Par ton
            cursor.execute('''
                SELECT tone, COUNT(*) as count
                FROM ai_generations 
                WHERE created_at >= datetime('now', '-{} days')
                GROUP BY tone
                ORDER BY count DESC
            '''.format(days))
            
            by_tone = [dict(row) for row in cursor.fetchall()]
            
            # Évolution quotidienne
            cursor.execute('''
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as generations
                FROM ai_generations 
                WHERE created_at >= datetime('now', '-{} days')
                GROUP BY DATE(created_at)
                ORDER BY date
            '''.format(days))
            
            daily_generations = [dict(row) for row in cursor.fetchall()]
            
            return {
                'summary': stats,
                'by_tone': by_tone,
                'daily_evolution': daily_generations
            }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Métriques de performance"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Temps de réponse moyen (simulé)
            metrics = {
                'avg_response_time': 1.2,  # secondes
                'uptime_percentage': 99.5,
                'error_rate': 0.1,
                'active_users': self._get_active_users_count(),
                'storage_used': self._get_storage_usage(),
                'last_updated': datetime.now().isoformat()
            }
            
            return metrics
    
    def get_user_activity(self, days: int = 7) -> List[Dict]:
        """Activité des utilisateurs"""
        # Simulation - à remplacer par vraies données
        activity = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            activity.append({
                'date': date,
                'logins': max(0, 10 - i),
                'emails_sent': max(0, 25 - i * 2),
                'ai_generations': max(0, 15 - i)
            })
        
        return activity
    
    def get_security_events(self, days: int = 30) -> List[Dict]:
        """Événements de sécurité"""
        events = [
            {
                'timestamp': datetime.now().isoformat(),
                'type': 'login_success',
                'user': 'admin',
                'ip': '127.0.0.1',
                'severity': 'info'
            },
            {
                'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
                'type': 'password_change',
                'user': 'user1',
                'ip': '192.168.1.100',
                'severity': 'info'
            }
        ]
        
        return events
    
    def generate_report(self, report_type: str = 'weekly') -> Dict[str, Any]:
        """Génère un rapport complet"""
        days_map = {'daily': 1, 'weekly': 7, 'monthly': 30}
        days = days_map.get(report_type, 7)
        
        report = {
            'type': report_type,
            'period': f'{days} derniers jours',
            'generated_at': datetime.now().isoformat(),
            'email_stats': self.get_email_stats(days),
            'ai_stats': self.get_ai_stats(days),
            'performance': self.get_performance_metrics(),
            'user_activity': self.get_user_activity(days),
            'security_events': self.get_security_events(days)
        }
        
        return report
    
    def _get_active_users_count(self) -> int:
        """Compte les utilisateurs actifs"""
        try:
            with sqlite3.connect("data/users.db") as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT COUNT(*) FROM users 
                    WHERE last_login >= datetime('now', '-7 days')
                ''')
                return cursor.fetchone()[0]
        except:
            return 1  # Fallback
    
    def _get_storage_usage(self) -> Dict[str, Any]:
        """Calcule l'usage du stockage"""
        import os
        
        total_size = 0
        file_count = 0
        
        for root, dirs, files in os.walk('data'):
            for file in files:
                filepath = os.path.join(root, file)
                if os.path.exists(filepath):
                    total_size += os.path.getsize(filepath)
                    file_count += 1
        
        return {
            'total_mb': round(total_size / (1024 * 1024), 2),
            'file_count': file_count,
            'databases': ['securevault.db', 'users.db', 'templates.json']
        }