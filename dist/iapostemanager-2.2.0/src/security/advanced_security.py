import hashlib
import secrets
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import sqlite3

class SecurityManager:
    def __init__(self, db_path="data/security.db"):
        self.db_path = db_path
        self.failed_attempts = {}
        self.blocked_ips = {}
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS security_events (
                    id INTEGER PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    user_id TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    details TEXT,
                    severity TEXT DEFAULT 'info',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY,
                    key_hash TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    permissions TEXT DEFAULT '{}',
                    rate_limit INTEGER DEFAULT 100,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                );
                
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id TEXT PRIMARY KEY,
                    count INTEGER DEFAULT 0,
                    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
    
    def log_security_event(self, event_type: str, user_id: str = None, 
                          ip_address: str = None, details: Dict = None, 
                          severity: str = 'info'):
        """Enregistre un événement de sécurité"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO security_events 
                (event_type, user_id, ip_address, details, severity)
                VALUES (?, ?, ?, ?, ?)
            ''', (event_type, user_id, ip_address, json.dumps(details or {}), severity))
    
    def check_rate_limit(self, identifier: str, limit: int = 60, window: int = 3600) -> bool:
        """Vérifie les limites de taux"""
        now = datetime.now()
        window_start = now - timedelta(seconds=window)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT count, window_start FROM rate_limits WHERE id = ?
            ''', (identifier,))
            
            result = cursor.fetchone()
            
            if not result:
                # Première requête
                conn.execute('''
                    INSERT INTO rate_limits (id, count, window_start)
                    VALUES (?, 1, ?)
                ''', (identifier, now))
                return True
            
            count, stored_window = result
            stored_window = datetime.fromisoformat(stored_window)
            
            if stored_window < window_start:
                # Nouvelle fenêtre
                conn.execute('''
                    UPDATE rate_limits SET count = 1, window_start = ? WHERE id = ?
                ''', (now, identifier))
                return True
            
            if count >= limit:
                return False
            
            # Incrémenter compteur
            conn.execute('''
                UPDATE rate_limits SET count = count + 1 WHERE id = ?
            ''', (identifier,))
            
            return True
    
    def detect_brute_force(self, ip_address: str, max_attempts: int = 5) -> bool:
        """Détecte les attaques par force brute"""
        if ip_address not in self.failed_attempts:
            self.failed_attempts[ip_address] = []
        
        # Nettoyer les tentatives anciennes (> 1 heure)
        cutoff = time.time() - 3600
        self.failed_attempts[ip_address] = [
            t for t in self.failed_attempts[ip_address] if t > cutoff
        ]
        
        return len(self.failed_attempts[ip_address]) >= max_attempts
    
    def record_failed_attempt(self, ip_address: str):
        """Enregistre une tentative échouée"""
        if ip_address not in self.failed_attempts:
            self.failed_attempts[ip_address] = []
        
        self.failed_attempts[ip_address].append(time.time())
        
        # Bloquer si trop de tentatives
        if self.detect_brute_force(ip_address):
            self.block_ip(ip_address, duration=3600)  # 1 heure
    
    def block_ip(self, ip_address: str, duration: int = 3600):
        """Bloque une IP temporairement"""
        self.blocked_ips[ip_address] = time.time() + duration
        self.log_security_event('ip_blocked', ip_address=ip_address, 
                               details={'duration': duration}, severity='warning')
    
    def is_ip_blocked(self, ip_address: str) -> bool:
        """Vérifie si une IP est bloquée"""
        if ip_address in self.blocked_ips:
            if time.time() < self.blocked_ips[ip_address]:
                return True
            else:
                del self.blocked_ips[ip_address]
        return False
    
    def generate_api_key(self, name: str, permissions: Dict = None) -> str:
        """Génère une clé API sécurisée"""
        api_key = f"sk-{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO api_keys (key_hash, name, permissions)
                VALUES (?, ?, ?)
            ''', (key_hash, name, json.dumps(permissions or {})))
        
        return api_key
    
    def validate_api_key(self, api_key: str) -> Optional[Dict]:
        """Valide une clé API"""
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM api_keys 
                WHERE key_hash = ? AND is_active = 1
            ''', (key_hash,))
            
            result = cursor.fetchone()
            if result:
                # Mettre à jour dernière utilisation
                conn.execute('''
                    UPDATE api_keys SET last_used = CURRENT_TIMESTAMP 
                    WHERE key_hash = ?
                ''', (key_hash,))
                
                return dict(result)
        
        return None
    
    def get_security_events(self, limit: int = 100) -> List[Dict]:
        """Récupère les événements de sécurité"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM security_events 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            return [dict(row) for row in cursor.fetchall()]

class TwoFactorAuth:
    def __init__(self):
        self.pending_codes = {}
    
    def generate_code(self, user_id: str) -> str:
        """Génère un code 2FA"""
        code = f"{secrets.randbelow(1000000):06d}"
        self.pending_codes[user_id] = {
            'code': code,
            'expires': time.time() + 300  # 5 minutes
        }
        return code
    
    def verify_code(self, user_id: str, code: str) -> bool:
        """Vérifie un code 2FA"""
        if user_id not in self.pending_codes:
            return False
        
        stored = self.pending_codes[user_id]
        
        if time.time() > stored['expires']:
            del self.pending_codes[user_id]
            return False
        
        if stored['code'] == code:
            del self.pending_codes[user_id]
            return True
        
        return False