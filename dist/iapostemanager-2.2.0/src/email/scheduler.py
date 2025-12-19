"""Planification d'envois d'emails différés"""
import json
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from crypto_utils import _valider_chemin_securise

class EmailScheduler:
    def __init__(self, app_dir):
        self.app_dir = app_dir
        self.scheduler = BackgroundScheduler()
        self.scheduled_file = _valider_chemin_securise(app_dir, "scheduled_emails.json")
        self.scheduler.start()
    
    def planifier_envoi(self, email_data, date_envoi, callback):
        """Planifie un envoi d'email"""
        job = self.scheduler.add_job(
            callback,
            'date',
            run_date=date_envoi,
            args=[email_data],
            id=f"email_{datetime.now().timestamp()}"
        )
        
        self._enregistrer_planification(job.id, email_data, date_envoi)
        return job.id
    
    def annuler_envoi(self, job_id):
        """Annule un envoi planifié"""
        try:
            self.scheduler.remove_job(job_id)
            return True
        except:
            return False
    
    def get_envois_planifies(self):
        """Liste les envois planifiés"""
        if not os.path.exists(self.scheduled_file):
            return []
        with open(self.scheduled_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _enregistrer_planification(self, job_id, email_data, date_envoi):
        """Enregistre une planification"""
        planifications = self.get_envois_planifies()
        planifications.append({
            'job_id': job_id,
            'email_data': email_data,
            'date_envoi': date_envoi.isoformat(),
            'created_at': datetime.now().isoformat()
        })
        with open(self.scheduled_file, 'w', encoding='utf-8') as f:
            json.dump(planifications, f, indent=2, ensure_ascii=False)
    
    def shutdown(self):
        """Arrête le scheduler"""
        self.scheduler.shutdown()
