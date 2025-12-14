import sqlite3
import schedule
import time
import threading
from datetime import datetime

class EmailScheduler:
    def __init__(self, db_path="data/scheduler.db"):
        self.db_path = db_path
        self.init_db()
        self.running = False
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS scheduled_emails (
                    id INTEGER PRIMARY KEY,
                    recipient TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    scheduled_time TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
    
    def schedule_email(self, recipient, subject, body, send_time):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO scheduled_emails (recipient, subject, body, scheduled_time)
                VALUES (?, ?, ?, ?)
            ''', (recipient, subject, body, send_time))
        return True
    
    def get_pending_emails(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM scheduled_emails 
                WHERE status = 'pending' AND scheduled_time <= ?
            ''', (datetime.now().isoformat(),))
            return [dict(row) for row in cursor.fetchall()]
    
    def get_all_scheduled_emails(self):
        """Récupère tous les emails programmés (pending et sent)"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM scheduled_emails 
                ORDER BY scheduled_time DESC
            ''')
            return [dict(row) for row in cursor.fetchall()]
    
    def cancel_scheduled_email(self, email_id):
        """Annule un email programmé"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE scheduled_emails 
                SET status = 'cancelled'
                WHERE id = ? AND status = 'pending'
            ''', (email_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def mark_as_sent(self, email_id):
        """Marque un email comme envoyé"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE scheduled_emails 
                SET status = 'sent'
                WHERE id = ?
            ''', (email_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def mark_as_failed(self, email_id, error_message=""):
        """Marque un email comme échoué"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE scheduled_emails 
                SET status = 'failed'
                WHERE id = ?
            ''', (email_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def start_scheduler(self):
        self.running = True
        def run():
            while self.running:
                schedule.run_pending()
                time.sleep(60)
        
        thread = threading.Thread(target=run)
        thread.daemon = True
        thread.start()
    
    def stop_scheduler(self):
        """Arrête le scheduler"""
        self.running = False