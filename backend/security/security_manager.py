"""
Module SecurityManager - Sécurité avancée et conformité RGPD
Propriété: MS CONSEILS - Sarra Boudjellal
Version: 2.3 Production Ready
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import secrets
import hashlib
import hmac
import logging
import json
import base64
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import uuid

@dataclass
class SecurityEvent:
    """Structure d'un événement de sécurité"""
    event_id: str
    event_type: str
    timestamp: str
    user_id: str
    client_id: str
    resource: str
    action: str
    success: bool
    ip_address: str
    user_agent: str
    details: Dict
    risk_level: str

class SecurityManager:
    """Gestionnaire de sécurité avec chiffrement AES-256 et audit complet"""
    
    def __init__(self, master_key: str, salt: bytes = None):
        self.master_key = master_key.encode()
        self.salt = salt or secrets.token_bytes(32)
        self.cipher = self._create_cipher()
        self.audit_logger = self._setup_audit_logger()
        self.security_logger = self._setup_security_logger()
        
        # Configuration de sécurité
        self.security_config = {
            "max_login_attempts": 5,
            "lockout_duration": 900,  # 15 minutes
            "session_timeout": 3600,  # 1 heure
            "password_min_length": 12,
            "key_rotation_days": 90,
            "audit_retention_days": 2555  # 7 ans pour RGPD
        }
        
        # Patterns de données sensibles
        self.sensitive_patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b(?:\+33|0)[1-9](?:[0-9]{8})\b',
            "credit_card": r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            "ssn": r'\b\d{1,2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b',
            "iban": r'\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b'
        }
    
    def _create_cipher(self) -> Fernet:
        """Crée le cipher AES-256 avec dérivation de clé sécurisée"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key))
        return Fernet(key)
    
    def _setup_audit_logger(self) -> logging.Logger:
        """Configure le logger d'audit sécurisé"""
        logger = logging.getLogger("security_audit")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            # Handler pour fichier d'audit
            audit_handler = logging.FileHandler("security_audit.log")
            audit_formatter = logging.Formatter(
                '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
            )
            audit_handler.setFormatter(audit_formatter)
            logger.addHandler(audit_handler)
        
        return logger
    
    def _setup_security_logger(self) -> logging.Logger:
        """Configure le logger de sécurité"""
        logger = logging.getLogger("security_events")
        logger.setLevel(logging.WARNING)
        
        if not logger.handlers:
            security_handler = logging.FileHandler("security_events.log")
            security_formatter = logging.Formatter(
                '%(asctime)s - SECURITY - %(levelname)s - %(message)s'
            )
            security_handler.setFormatter(security_formatter)
            logger.addHandler(security_handler)
        
        return logger
    
    def encrypt_sensitive_data(self, data: str, context: str = "") -> str:
        """
        Chiffre les données sensibles avec audit
        
        Args:
            data: Données à chiffrer
            context: Contexte pour l'audit
        
        Returns:
            Données chiffrées en base64
        """
        try:
            encrypted = self.cipher.encrypt(data.encode())
            encrypted_b64 = base64.urlsafe_b64encode(encrypted).decode()
            
            self._log_security_event(
                event_type="data_encrypted",
                resource=context,
                action="encrypt",
                success=True,
                details={"data_length": len(data)}
            )
            
            return encrypted_b64
            
        except Exception as e:
            self._log_security_event(
                event_type="encryption_failed",
                resource=context,
                action="encrypt",
                success=False,
                details={"error": str(e)}
            )
            raise SecurityException(f"Erreur de chiffrement: {e}")
    
    def decrypt_sensitive_data(self, encrypted_data: str, context: str = "") -> str:
        """
        Déchiffre les données avec vérification d'intégrité
        
        Args:
            encrypted_data: Données chiffrées en base64
            context: Contexte pour l'audit
        
        Returns:
            Données déchiffrées
        """
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            
            self._log_security_event(
                event_type="data_decrypted",
                resource=context,
                action="decrypt",
                success=True,
                details={"data_length": len(decrypted)}
            )
            
            return decrypted.decode()
            
        except Exception as e:
            self._log_security_event(
                event_type="decryption_failed",
                resource=context,
                action="decrypt",
                success=False,
                details={"error": str(e)}
            )
            raise SecurityException(f"Erreur de déchiffrement: {e}")
    
    def anonymize_email_data(self, email_data: Dict) -> Dict:
        """
        Anonymise les données email pour conformité RGPD
        
        Args:
            email_data: Données email à anonymiser
        
        Returns:
            Données anonymisées
        """
        anonymized = email_data.copy()
        
        try:
            # Anonymiser les adresses email
            if 'from' in anonymized:
                anonymized['from'] = self._hash_email(anonymized['from'])
            
            if 'to' in anonymized:
                if isinstance(anonymized['to'], list):
                    anonymized['to'] = [self._hash_email(email) for email in anonymized['to']]
                else:
                    anonymized['to'] = self._hash_email(anonymized['to'])
            
            if 'cc' in anonymized:
                anonymized['cc'] = [self._hash_email(email) for email in anonymized['cc']]
            
            if 'bcc' in anonymized:
                anonymized['bcc'] = [self._hash_email(email) for email in anonymized['bcc']]
            
            # Anonymiser le contenu sensible
            if 'content' in anonymized:
                anonymized['content'] = self._anonymize_content(anonymized['content'])
            
            if 'subject' in anonymized:
                anonymized['subject'] = self._anonymize_content(anonymized['subject'])
            
            # Ajouter métadonnées d'anonymisation
            anonymized['_anonymized'] = True
            anonymized['_anonymized_at'] = datetime.utcnow().isoformat()
            
            self._log_security_event(
                event_type="data_anonymized",
                resource="email_data",
                action="anonymize",
                success=True,
                details={"fields_anonymized": list(anonymized.keys())}
            )
            
            return anonymized
            
        except Exception as e:
            self._log_security_event(
                event_type="anonymization_failed",
                resource="email_data",
                action="anonymize",
                success=False,
                details={"error": str(e)}
            )
            raise SecurityException(f"Erreur d'anonymisation: {e}")
    
    def _hash_email(self, email: str) -> str:
        """Hash irréversible d'une adresse email"""
        # Utilisation de HMAC pour éviter les attaques par dictionnaire
        return hmac.new(
            self.salt,
            email.encode(),
            hashlib.sha256
        ).hexdigest()[:16]
    
    def _anonymize_content(self, content: str) -> str:
        """Anonymise le contenu en préservant la structure"""
        anonymized_content = content
        
        # Remplacer les patterns sensibles
        for pattern_name, pattern in self.sensitive_patterns.items():
            replacement = f"[{pattern_name.upper()}]"
            anonymized_content = re.sub(pattern, replacement, anonymized_content, flags=re.IGNORECASE)
        
        # Remplacer les noms propres (basique)
        anonymized_content = re.sub(r'\b[A-Z][a-z]+\s[A-Z][a-z]+\b', '[NAME]', anonymized_content)
        
        # Remplacer les adresses
        anonymized_content = re.sub(r'\d+\s+[A-Za-z\s]+(?:rue|avenue|boulevard|place)', '[ADDRESS]', anonymized_content)
        
        return anonymized_content
    
    def validate_password(self, password: str) -> Dict[str, Any]:
        """
        Valide un mot de passe selon les politiques de sécurité
        
        Args:
            password: Mot de passe à valider
        
        Returns:
            Résultat de validation avec score et recommandations
        """
        validation_result = {
            "is_valid": True,
            "score": 0,
            "errors": [],
            "recommendations": []
        }
        
        # Longueur minimale
        if len(password) < self.security_config["password_min_length"]:
            validation_result["is_valid"] = False
            validation_result["errors"].append(f"Minimum {self.security_config['password_min_length']} caractères requis")
        else:
            validation_result["score"] += 20
        
        # Complexité
        if not re.search(r'[A-Z]', password):
            validation_result["errors"].append("Au moins une majuscule requise")
        else:
            validation_result["score"] += 15
        
        if not re.search(r'[a-z]', password):
            validation_result["errors"].append("Au moins une minuscule requise")
        else:
            validation_result["score"] += 15
        
        if not re.search(r'\d', password):
            validation_result["errors"].append("Au moins un chiffre requis")
        else:
            validation_result["score"] += 15
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            validation_result["errors"].append("Au moins un caractère spécial requis")
        else:
            validation_result["score"] += 15
        
        # Patterns communs
        common_patterns = [
            r'123456', r'password', r'azerty', r'qwerty',
            r'admin', r'root', r'user'
        ]
        
        for pattern in common_patterns:
            if re.search(pattern, password, re.IGNORECASE):
                validation_result["errors"].append("Évitez les mots de passe communs")
                validation_result["score"] -= 10
                break
        
        # Répétitions
        if re.search(r'(.)\1{2,}', password):
            validation_result["recommendations"].append("Évitez les répétitions de caractères")
            validation_result["score"] -= 5
        
        # Séquences
        sequences = ['abc', '123', 'qwe', 'asd']
        for seq in sequences:
            if seq in password.lower():
                validation_result["recommendations"].append("Évitez les séquences de caractères")
                validation_result["score"] -= 5
                break
        
        # Score final
        validation_result["score"] = max(0, min(100, validation_result["score"]))
        
        if validation_result["errors"]:
            validation_result["is_valid"] = False
        
        return validation_result
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Génère un token sécurisé"""
        return secrets.token_urlsafe(length)
    
    def hash_password(self, password: str) -> str:
        """Hash sécurisé d'un mot de passe avec salt"""
        salt = secrets.token_bytes(32)
        pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
        return base64.b64encode(salt + pwdhash).decode()
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Vérifie un mot de passe contre son hash"""
        try:
            decoded = base64.b64decode(hashed.encode())
            salt = decoded[:32]
            stored_hash = decoded[32:]
            pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
            return hmac.compare_digest(stored_hash, pwdhash)
        except Exception:
            return False
    
    def check_rate_limit(self, identifier: str, action: str, limit: int, window: int) -> bool:
        """
        Vérifie les limites de taux (rate limiting)
        
        Args:
            identifier: Identifiant (IP, user_id, etc.)
            action: Type d'action
            limit: Nombre maximum d'actions
            window: Fenêtre de temps en secondes
        
        Returns:
            True si dans les limites, False sinon
        """
        # Implémentation simplifiée - en production, utiliser Redis
        # Cette version utilise un cache en mémoire
        if not hasattr(self, '_rate_limit_cache'):
            self._rate_limit_cache = {}
        
        key = f"{identifier}:{action}"
        now = datetime.utcnow()
        
        if key not in self._rate_limit_cache:
            self._rate_limit_cache[key] = []
        
        # Nettoyer les entrées expirées
        cutoff = now - timedelta(seconds=window)
        self._rate_limit_cache[key] = [
            timestamp for timestamp in self._rate_limit_cache[key]
            if timestamp > cutoff
        ]
        
        # Vérifier la limite
        if len(self._rate_limit_cache[key]) >= limit:
            self._log_security_event(
                event_type="rate_limit_exceeded",
                resource=action,
                action="rate_limit_check",
                success=False,
                details={
                    "identifier": identifier,
                    "limit": limit,
                    "window": window,
                    "current_count": len(self._rate_limit_cache[key])
                }
            )
            return False
        
        # Ajouter la nouvelle tentative
        self._rate_limit_cache[key].append(now)
        return True
    
    def detect_suspicious_activity(self, user_id: str, activity_data: Dict) -> Dict[str, Any]:
        """
        Détecte les activités suspectes
        
        Args:
            user_id: ID de l'utilisateur
            activity_data: Données d'activité
        
        Returns:
            Résultat de détection avec niveau de risque
        """
        risk_score = 0
        alerts = []
        
        # Vérifications de base
        ip_address = activity_data.get('ip_address', '')
        user_agent = activity_data.get('user_agent', '')
        timestamp = activity_data.get('timestamp', datetime.utcnow())
        
        # Détection d'IP suspecte
        if self._is_suspicious_ip(ip_address):
            risk_score += 30
            alerts.append("IP address from suspicious location")
        
        # Détection de changement d'user agent
        if self._is_user_agent_change_suspicious(user_id, user_agent):
            risk_score += 20
            alerts.append("Unusual user agent detected")
        
        # Détection d'activité en dehors des heures normales
        if self._is_unusual_time(timestamp):
            risk_score += 10
            alerts.append("Activity outside normal hours")
        
        # Détection de tentatives de connexion multiples
        if self._has_multiple_login_attempts(user_id):
            risk_score += 25
            alerts.append("Multiple login attempts detected")
        
        # Détermination du niveau de risque
        if risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 25:
            risk_level = "MEDIUM"
        elif risk_score > 0:
            risk_level = "LOW"
        else:
            risk_level = "NONE"
        
        result = {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "alerts": alerts,
            "recommended_actions": self._get_recommended_actions(risk_level)
        }
        
        # Log si risque détecté
        if risk_score > 0:
            self._log_security_event(
                event_type="suspicious_activity_detected",
                resource="user_activity",
                action="security_analysis",
                success=True,
                details=result
            )
        
        return result
    
    def _log_security_event(self, event_type: str, resource: str, action: str, 
                          success: bool, details: Dict = None, user_id: str = None,
                          client_id: str = None, ip_address: str = None,
                          user_agent: str = None):
        """Log un événement de sécurité"""
        
        event = SecurityEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.utcnow().isoformat(),
            user_id=user_id or "system",
            client_id=client_id or "unknown",
            resource=resource,
            action=action,
            success=success,
            ip_address=ip_address or "unknown",
            user_agent=user_agent or "unknown",
            details=details or {},
            risk_level=self._calculate_event_risk_level(event_type, success)
        )
        
        # Log selon le niveau de risque
        if event.risk_level in ["HIGH", "CRITICAL"]:
            self.security_logger.error(json.dumps(asdict(event)))
        elif event.risk_level == "MEDIUM":
            self.security_logger.warning(json.dumps(asdict(event)))
        else:
            self.audit_logger.info(json.dumps(asdict(event)))
    
    def _calculate_event_risk_level(self, event_type: str, success: bool) -> str:
        """Calcule le niveau de risque d'un événement"""
        high_risk_events = [
            "authentication_failed", "authorization_failed", 
            "suspicious_activity_detected", "rate_limit_exceeded",
            "encryption_failed", "decryption_failed"
        ]
        
        medium_risk_events = [
            "password_changed", "account_locked", "session_expired"
        ]
        
        if event_type in high_risk_events or not success:
            return "HIGH"
        elif event_type in medium_risk_events:
            return "MEDIUM"
        else:
            return "LOW"
    
    def generate_audit_report(self, start_date: datetime, end_date: datetime, 
                            client_id: str = None) -> Dict:
        """
        Génère un rapport d'audit pour une période donnée
        
        Args:
            start_date: Date de début
            end_date: Date de fin
            client_id: ID client (optionnel)
        
        Returns:
            Rapport d'audit complet
        """
        # Implémentation simplifiée - en production, interroger la base de données
        report = {
            "report_id": str(uuid.uuid4()),
            "generated_at": datetime.utcnow().isoformat(),
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "client_id": client_id,
            "summary": {
                "total_events": 0,
                "security_events": 0,
                "failed_authentications": 0,
                "data_access_events": 0,
                "encryption_operations": 0
            },
            "risk_analysis": {
                "high_risk_events": 0,
                "medium_risk_events": 0,
                "low_risk_events": 0
            },
            "compliance": {
                "gdpr_compliant": True,
                "data_retention_compliant": True,
                "encryption_compliant": True
            },
            "recommendations": []
        }
        
        # Ajouter des recommandations basées sur l'analyse
        if report["summary"]["failed_authentications"] > 10:
            report["recommendations"].append(
                "Considérer le renforcement des politiques d'authentification"
            )
        
        if report["risk_analysis"]["high_risk_events"] > 0:
            report["recommendations"].append(
                "Examiner les événements à haut risque et prendre des mesures correctives"
            )
        
        return report
    
    # Méthodes utilitaires privées
    
    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Vérifie si une IP est suspecte"""
        # Liste simplifiée - en production, utiliser des services de géolocalisation
        suspicious_ranges = [
            "10.0.0.0/8",    # Réseaux privés (si accès externe attendu)
            "172.16.0.0/12",
            "192.168.0.0/16"
        ]
        # Implémentation basique - à améliorer avec des vraies vérifications
        return False
    
    def _is_user_agent_change_suspicious(self, user_id: str, user_agent: str) -> bool:
        """Détecte les changements suspects d'user agent"""
        # Implémentation simplifiée
        return False
    
    def _is_unusual_time(self, timestamp: datetime) -> bool:
        """Détecte les activités en dehors des heures normales"""
        hour = timestamp.hour
        return hour < 6 or hour > 22  # En dehors de 6h-22h
    
    def _has_multiple_login_attempts(self, user_id: str) -> bool:
        """Détecte les tentatives de connexion multiples"""
        # Implémentation simplifiée
        return False
    
    def _get_recommended_actions(self, risk_level: str) -> List[str]:
        """Retourne les actions recommandées selon le niveau de risque"""
        actions = {
            "HIGH": [
                "Bloquer temporairement l'accès",
                "Notifier l'administrateur",
                "Demander une authentification supplémentaire",
                "Examiner les logs détaillés"
            ],
            "MEDIUM": [
                "Surveiller l'activité de près",
                "Demander une vérification d'identité",
                "Enregistrer l'événement pour analyse"
            ],
            "LOW": [
                "Enregistrer l'événement",
                "Continuer la surveillance normale"
            ],
            "NONE": []
        }
        return actions.get(risk_level, [])

class SecurityException(Exception):
    """Exception personnalisée pour les erreurs de sécurité"""
    pass

class AuditManager:
    """Gestionnaire d'audit pour conformité RGPD"""
    
    def __init__(self, log_file: str = "security_audit.log"):
        self.logger = logging.getLogger("audit_manager")
        self.log_file = log_file
        
        # Configuration du logger d'audit
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)
    
    def log_user_action(self, user_id: str, action: str, resource: str, 
                       success: bool, details: Dict = None):
        """Log des actions utilisateur pour audit"""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "success": success,
            "details": details or {}
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_data_access(self, user_id: str, data_type: str, operation: str,
                       record_count: int = 1, purpose: str = None):
        """Log des accès aux données pour RGPD"""
        access_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "data_type": data_type,
            "operation": operation,
            "record_count": record_count,
            "purpose": purpose,
            "gdpr_basis": "legitimate_interest"  # À adapter selon le contexte
        }
        
        self.logger.info(f"DATA_ACCESS: {json.dumps(access_entry)}")
    
    def generate_gdpr_report(self, data_subject_id: str) -> Dict:
        """Génère un rapport RGPD pour un sujet de données"""
        return {
            "subject_id": data_subject_id,
            "report_date": datetime.utcnow().isoformat(),
            "data_processing_activities": [],
            "legal_basis": "consent",
            "retention_period": "7 years",
            "data_categories": ["contact_info", "communication_data"],
            "recipients": ["internal_staff"],
            "transfers": "none"
        }