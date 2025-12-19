"""Async task queue with Celery"""
from celery import Celery
import os

celery = Celery(
    'securevault',
    broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

@celery.task
def send_email_async(recipient, subject, body):
    """Send email asynchronously"""
    from src.services.smtp_service import SMTPService
    smtp = SMTPService()
    return smtp.send_email(recipient, subject, body)

@celery.task
def generate_email_async(context, tone):
    """Generate email with AI asynchronously"""
    from src.services.openai_service import OpenAIService
    ai = OpenAIService()
    return ai.generate_email(context, tone)

@celery.task
def backup_database_async():
    """Backup database asynchronously"""
    from scripts.backup_db import backup_database
    return backup_database()
