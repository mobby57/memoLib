# -*- coding: utf-8 -*-
"""
Module de chiffrement pour stocker de manière sécurisée l'App Password Gmail
Utilise cryptography (Fernet) + dérivation de clé PBKDF2 depuis un mot de passe maître
Version 2.0 - Sécurisé contre CWE-22 Path Traversal
"""

import os, base64, json, secrets, stat, logging, re, html
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from datetime import datetime
from src.core.config import Config

CREDENTIALS_FILE = "credentials.enc"
SALT_FILE = "salt.bin"
METADATA_FILE = "metadata.json"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _valider_chemin_securise(base_dir, filename):
    """Valide et sécurise un chemin contre path traversal (CWE-22)"""
    base_dir = os.path.abspath(os.path.normpath(base_dir))
    full_path = os.path.abspath(os.path.normpath(os.path.join(base_dir, filename)))
    if not full_path.startswith(base_dir + os.sep) and full_path != base_dir:
        raise ValueError(f"Path traversal détecté: {filename}")
    return full_path

def _securiser_fichier(filepath):
    """Définit les permissions restrictives sur un fichier"""
    try:
        os.chmod(filepath, stat.S_IRUSR | stat.S_IWUSR)
    except Exception:
        pass

def sanitize_input(input_str, max_length=500):
    """Sanitise les entrées utilisateur contre XSS et injections"""
    if not input_str or not isinstance(input_str, str):
        return ""
    input_str = input_str[:max_length]
    input_str = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', input_str)
    input_str = html.escape(input_str, quote=True)
    return input_str.strip()

def valider_email(email):
    """Valide le format d'un email"""
    if not email:
        return True
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email)) and len(email) <= 254

def valider_force_mot_de_passe(mot_de_passe):
    """Valide la force du mot de passe maître - Retourne (bool, str)"""
    if len(mot_de_passe) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    if not any(c.isupper() for c in mot_de_passe):
        return False, "Le mot de passe doit contenir au moins une majuscule"
    if not any(c.islower() for c in mot_de_passe):
        return False, "Le mot de passe doit contenir au moins une minuscule"
    if not any(c.isdigit() for c in mot_de_passe):
        return False, "Le mot de passe doit contenir au moins un chiffre"
    return True, "Mot de passe valide"

def generer_cle_fernet(mot_de_passe_maitre, salt):
    """Génère une clé Fernet à partir d'un mot de passe maître et d'un salt"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=Config.PBKDF2_ITERATIONS
    )
    key = base64.urlsafe_b64encode(kdf.derive(mot_de_passe_maitre.encode('utf-8')))
    return key

def sauvegarder_metadata(app_dir, credential_type):
    """Sauvegarde les métadonnées (date de création, type)"""
    metadata_path = _valider_chemin_securise(app_dir, METADATA_FILE)
    metadata = {}
    
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    
    metadata[credential_type] = {
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    _securiser_fichier(metadata_path)

def recuperer_metadata(app_dir):
    """Récupère les métadonnées des credentials"""
    metadata_path = _valider_chemin_securise(app_dir, METADATA_FILE)
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return {}

def credentials_existent(app_dir):
    """Vérifie si les credentials Gmail existent"""
    cred_path = _valider_chemin_securise(app_dir, CREDENTIALS_FILE)
    return os.path.exists(cred_path)

def api_key_existe(app_dir):
    """Vérifie si la clé API OpenAI existe"""
    api_path = _valider_chemin_securise(app_dir, "openai_api.enc")
    return os.path.exists(api_path)

def sauvegarder_app_password(app_password, mot_de_passe_maitre, app_dir, email=""):
    """Chiffre et sauvegarde l'App Password dans credentials.enc"""
    if not app_password or not mot_de_passe_maitre:
        logger.error("Tentative de sauvegarde avec données vides")
        return False
    
    email = sanitize_input(email, max_length=254)
    if email and not valider_email(email):
        logger.error("Format d'email invalide")
        return False
    
    salt_path = _valider_chemin_securise(app_dir, SALT_FILE)
    cred_path = _valider_chemin_securise(app_dir, CREDENTIALS_FILE)
    
    try:
        if os.path.exists(salt_path):
            with open(salt_path, 'rb') as f:
                salt = f.read()
        else:
            salt = secrets.token_bytes(32)
            with open(salt_path, 'wb') as f:
                f.write(salt)
            _securiser_fichier(salt_path)
        
        key = generer_cle_fernet(mot_de_passe_maitre, salt)
        fernet = Fernet(key)
        data = json.dumps({'password': app_password, 'email': email})
        encrypted = fernet.encrypt(data.encode('utf-8'))
        
        with open(cred_path, 'wb') as f:
            f.write(encrypted)
        _securiser_fichier(cred_path)
        
        sauvegarder_metadata(app_dir, 'gmail')
        logger.info("Credentials Gmail sauvegardés avec succès")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde: {type(e).__name__}")
        return False

def sauvegarder_api_key(api_key, org_id, mot_de_passe_maitre, app_dir):
    """Chiffre et sauvegarde la clé API OpenAI + Organization ID"""
    if not api_key or not mot_de_passe_maitre:
        logger.error("Tentative de sauvegarde avec données vides")
        return False
    
    org_id = sanitize_input(org_id, max_length=100) if org_id else ""
    
    salt_path = _valider_chemin_securise(app_dir, SALT_FILE)
    api_path = _valider_chemin_securise(app_dir, "openai_api.enc")
    
    try:
        if os.path.exists(salt_path):
            with open(salt_path, 'rb') as f:
                salt = f.read()
        else:
            salt = secrets.token_bytes(32)
            with open(salt_path, 'wb') as f:
                f.write(salt)
            _securiser_fichier(salt_path)
        
        key = generer_cle_fernet(mot_de_passe_maitre, salt)
        fernet = Fernet(key)
        data = json.dumps({'api_key': api_key, 'org_id': org_id})
        encrypted = fernet.encrypt(data.encode('utf-8'))
        
        with open(api_path, 'wb') as f:
            f.write(encrypted)
        _securiser_fichier(api_path)
        
        sauvegarder_metadata(app_dir, 'openai')
        logger.info("Clé API OpenAI sauvegardée avec succès")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde: {type(e).__name__}")
        return False

def recuperer_app_password(mot_de_passe_maitre, app_dir):
    """Déchiffre et retourne l'App Password depuis credentials.enc"""
    if not mot_de_passe_maitre:
        return None, None
    
    salt_path = _valider_chemin_securise(app_dir, SALT_FILE)
    cred_path = _valider_chemin_securise(app_dir, CREDENTIALS_FILE)
    
    if not os.path.exists(salt_path) or not os.path.exists(cred_path):
        return None, None
    
    try:
        with open(salt_path, 'rb') as f:
            salt = f.read()
        
        with open(cred_path, 'rb') as f:
            encrypted = f.read()
        
        key = generer_cle_fernet(mot_de_passe_maitre, salt)
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted)
        data = json.loads(decrypted.decode('utf-8'))
        
        if isinstance(data, dict):
            return data.get('password'), data.get('email', '')
        return data, ''
    except Exception:
        logger.warning("Échec de déchiffrement des credentials Gmail")
        return None, None

def recuperer_api_key(mot_de_passe_maitre, app_dir):
    """Déchiffre et retourne la clé API OpenAI + Organization ID"""
    if not mot_de_passe_maitre:
        return None, None
    
    salt_path = _valider_chemin_securise(app_dir, SALT_FILE)
    api_path = _valider_chemin_securise(app_dir, "openai_api.enc")
    
    if not os.path.exists(salt_path) or not os.path.exists(api_path):
        return None, None
    
    try:
        with open(salt_path, 'rb') as f:
            salt = f.read()
        
        with open(api_path, 'rb') as f:
            encrypted = f.read()
        
        key = generer_cle_fernet(mot_de_passe_maitre, salt)
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted)
        data = json.loads(decrypted.decode('utf-8'))
        return data.get('api_key'), data.get('org_id', '')
    except Exception:
        logger.warning("Échec de déchiffrement de la clé API OpenAI")
        return None, None

def supprimer_credentials(app_dir):
    """Supprime de manière sécurisée les fichiers de credentials stockés"""
    salt_path = _valider_chemin_securise(app_dir, SALT_FILE)
    cred_path = _valider_chemin_securise(app_dir, CREDENTIALS_FILE)
    api_path = _valider_chemin_securise(app_dir, "openai_api.enc")
    metadata_path = _valider_chemin_securise(app_dir, METADATA_FILE)
    
    for path in [salt_path, cred_path, api_path, metadata_path]:
        if os.path.exists(path):
            try:
                os.remove(path)
                logger.info(f"Fichier supprimé: {os.path.basename(path)}")
            except Exception as e:
                logger.error(f"Erreur suppression {path}: {e}")
                return False
    return True
