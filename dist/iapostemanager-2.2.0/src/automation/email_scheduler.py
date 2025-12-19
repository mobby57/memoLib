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
    
    def start_scheduler(self):
        self.running = True
        def run():
            while self.running:
                schedule.run_pending()
                time.sleep(60)
        
        thread = threading.Thread(target=run)
        thread.daemon = True
        thread.start()