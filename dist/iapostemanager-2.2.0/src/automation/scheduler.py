import time
import threading
import json
from datetime import datetime, timedelta
from typing import Dict, List, Callable
import sqlite3

class EmailScheduler:
    def __init__(self, db_path="data/scheduler.db"):
        self.db_path = db_path
        self.running = False
        self.thread = None
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS scheduled_emails (
                    id INTEGER PRIMARY KEY,
                    recipient TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    scheduled_time TIMESTAMP NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    sent_at TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS campaigns (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    body TEXT NOT NULL,
                    recipients TEXT NOT NULL,
                    status TEXT DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    sent_count INTEGER DEFAULT 0
                );
            ''')
    
    def schedule_email(self, recipient: str, subject: str, body: str, send_time: datetime) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO scheduled_emails (recipient, subject, body, scheduled_time)
                VALUES (?, ?, ?, ?)
            ''', (recipient, subject, body, send_time))
            return cursor.lastrowid
    
    def create_campaign(self, name: str, subject: str, body: str, recipients: List[str]) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO campaigns (name, subject, body, recipients)
                VALUES (?, ?, ?, ?)
            ''', (name, subject, body, json.dumps(recipients)))
            return cursor.lastrowid
    
    def get_pending_emails(self) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM scheduled_emails 
                WHERE status = 'pending' AND scheduled_time <= CURRENT_TIMESTAMP
            ''')
            return [dict(row) for row in cursor.fetchall()]
    
    def mark_sent(self, email_id: int):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                UPDATE scheduled_emails 
                SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (email_id,))
    
    def start(self, email_sender_callback: Callable):
        if self.running:
            return
        
        self.running = True
        self.email_sender = email_sender_callback
        self.thread = threading.Thread(target=self._run)
        self.thread.daemon = True
        self.thread.start()
    
    def stop(self):
        self.running = False
    
    def _run(self):
        while self.running:
            try:
                pending = self.get_pending_emails()
                for email in pending:
                    success = self.email_sender(
                        email['recipient'], 
                        email['subject'], 
                        email['body']
                    )
                    if success:
                        self.mark_sent(email['id'])
            except Exception as e:
                print(f"Scheduler error: {e}")
            
            time.sleep(60)  # Vérifier chaque minute