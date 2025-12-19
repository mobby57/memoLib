import sqlite3
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

class UserManager:
    def __init__(self, db_path="data/users.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    settings TEXT DEFAULT '{}'
                );
                
                CREATE TABLE IF NOT EXISTS organizations (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    domain TEXT,
                    settings TEXT DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS user_organizations (
                    user_id INTEGER,
                    org_id INTEGER,
                    role TEXT DEFAULT 'member',
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (org_id) REFERENCES organizations (id)
                );
                
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
            ''')
    
    def create_user(self, username: str, email: str, password: str, role: str = 'user') -> Tuple[bool, str]:
        try:
            salt = secrets.token_hex(32)
            password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO users (username, email, password_hash, salt, role)
                    VALUES (?, ?, ?, ?, ?)
                ''', (username, email, password_hash.hex(), salt, role))
            
            return True, "Utilisateur créé"
        except sqlite3.IntegrityError:
            return False, "Utilisateur ou email déjà existant"
        except Exception as e:
            return False, str(e)
    
    def authenticate(self, username: str, password: str) -> Tuple[bool, Optional[Dict]]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM users WHERE username = ? AND status = 'active'
                ''', (username,))
                
                user = cursor.fetchone()
                if not user:
                    return False, None
                
                # Vérifier mot de passe
                password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), user['salt'].encode(), 100000)
                
                if password_hash.hex() == user['password_hash']:
                    # Mettre à jour dernière connexion
                    conn.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
                    return True, dict(user)
                
                return False, None
        except Exception:
            return False, None
    
    def create_session(self, user_id: int, ip_address: str = '', user_agent: str = '') -> str:
        session_id = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO sessions (id, user_id, expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            ''', (session_id, user_id, expires_at, ip_address, user_agent))
        
        return session_id
    
    def validate_session(self, session_id: str) -> Optional[Dict]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT u.*, s.expires_at FROM users u
                    JOIN sessions s ON u.id = s.user_id
                    WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
                ''', (session_id,))
                
                return dict(cursor.fetchone()) if cursor.fetchone() else None
        except Exception:
            return None
    
    def get_users(self, org_id: Optional[int] = None) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            if org_id:
                cursor.execute('''
                    SELECT u.*, uo.role as org_role FROM users u
                    JOIN user_organizations uo ON u.id = uo.user_id
                    WHERE uo.org_id = ?
                ''', (org_id,))
            else:
                cursor.execute('SELECT * FROM users')
            
            return [dict(row) for row in cursor.fetchall()]
    
    def update_user_role(self, user_id: int, role: str) -> bool:
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('UPDATE users SET role = ? WHERE id = ?', (role, user_id))
            return True
        except Exception:
            return False