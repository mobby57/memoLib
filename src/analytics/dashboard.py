"""Dashboard analytics et monitoring"""
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from src.core.crypto_utils import _valider_chemin_securise

class AnalyticsDashboard:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.stats_file = _valider_chemin_securise(app_dir, "analytics.json")
    
    def enregistrer_envoi(self, email_dest, status, error=None):
        """Enregistre un envoi d'email"""
        stats = self._load_stats()
        stats['envois'].append({
            'timestamp': datetime.now().isoformat(),
            'destinataire': email_dest,
            'status': status,
            'error': error
        })
        self._save_stats(stats)
    
    def enregistrer_generation_ia(self, tokens_used, model, success):
        """Enregistre une génération IA"""
        stats = self._load_stats()
        stats['ia_generations'].append({
            'timestamp': datetime.now().isoformat(),
            'tokens': tokens_used,
            'model': model,
            'success': success
        })
        self._save_stats(stats)
    
    def get_stats_envois(self, jours=30):
        """Statistiques des envois"""
        stats = self._load_stats()
        cutoff = datetime.now() - timedelta(days=jours)
        envois = [e for e in stats['envois'] 
                  if datetime.fromisoformat(e['timestamp']) > cutoff]
        
        return {
            'total': len(envois),
            'success': len([e for e in envois if e['status'] == 'success']),
            'echecs': len([e for e in envois if e['status'] == 'failure']),
            'taux_succes': len([e for e in envois if e['status'] == 'success']) / len(envois) * 100 if envois else 0
        }
    
    def get_stats_ia(self, jours=30):
        """Statistiques IA"""
        stats = self._load_stats()
        cutoff = datetime.now() - timedelta(days=jours)
        gens = [g for g in stats['ia_generations'] 
                if datetime.fromisoformat(g['timestamp']) > cutoff]
        
        return {
            'total_generations': len(gens),
            'total_tokens': sum(g['tokens'] for g in gens),
            'success_rate': len([g for g in gens if g['success']]) / len(gens) * 100 if gens else 0
        }
    
    def _load_stats(self):
        """Charge les statistiques"""
        if not os.path.exists(self.stats_file):
            return {'envois': [], 'ia_generations': []}
        with open(self.stats_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _save_stats(self, stats):
        """Sauvegarde les statistiques"""
        with open(self.stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
