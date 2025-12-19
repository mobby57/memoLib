"""Planificateur d'emails"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
import logging

logger = logging.getLogger(__name__)

class EmailScheduler:
    def __init__(self, db_url='sqlite:///data/scheduler.db'):
        jobstores = {
            'default': SQLAlchemyJobStore(url=db_url)
        }
        self.scheduler = BackgroundScheduler(jobstores=jobstores)
        self.scheduler.start()
    
    def schedule_email(self, email_data, send_time):
        """Programmer un email"""
        try:
            job = self.scheduler.add_job(
                func=self._send_scheduled_email,
                trigger='date',
                run_date=send_time,
                args=[email_data],
                id=f"email_{email_data['recipient']}_{send_time.timestamp()}"
            )
            logger.info(f"Email programmé: {job.id}")
            return job.id
        except Exception as e:
            logger.error(f"Erreur programmation: {e}")
            return None
    
    def cancel_email(self, job_id):
        """Annuler un email programmé"""
        try:
            self.scheduler.remove_job(job_id)
            return True
        except:
            return False
    
    def _send_scheduled_email(self, email_data):
        """Envoyer email programmé"""
        # Logique d'envoi
        logger.info(f"Envoi programmé: {email_data['recipient']}")
    
    def get_scheduled_emails(self):
        """Liste des emails programmés"""
        return [
            {
                'id': job.id,
                'next_run': job.next_run_time,
                'args': job.args[0] if job.args else {}
            }
            for job in self.scheduler.get_jobs()
        ]