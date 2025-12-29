"""
Email Poller V2 - PostgreSQL Integration
Polling automatique des emails + création de workspaces PostgreSQL
"""

import asyncio
import time
from typing import Optional
import logging
import sys
import os

# Ajouter le chemin racine au PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from src.backend.services.email_connector import EmailConnector, EmailMessage
from src.backend.services.workspace_service_postgres import get_workspace_service
from src.backend.services.user_service_postgres import get_user_service
from dotenv import load_dotenv

# Charger variables d'environnement
load_dotenv()

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EmailPollerV2:
    """
    Service de polling automatique des emails avec PostgreSQL
    Crée automatiquement des workspaces pour chaque email reçu
    """
    
    def __init__(self, interval: int = 60, default_user_id: int = None):
        """
        Initialise le poller
        
        Args:
            interval: Intervalle de polling en secondes (défaut: 60s)
            default_user_id: ID utilisateur par défaut pour les workspaces (None = auto)
        """
        self.interval = interval
        self.connector = EmailConnector()
        self.workspace_service = get_workspace_service()
        self.user_service = get_user_service()
        self.running = False
        self.processed_ids = set()
        self.default_user_id = default_user_id
        
        logger.info(f"📧 Email Poller V2 initialisé (intervalle: {interval}s)")
    
    async def start(self):
        """Démarre le polling en boucle infinie"""
        self.running = True
        logger.info("🚀 Démarrage du polling email (PostgreSQL)...")
        
        # Obtenir/créer utilisateur par défaut pour les emails
        if not self.default_user_id:
            self.default_user_id = await self._get_or_create_email_user()
        
        # Test de connexion initial
        test_results = self.connector.test_connection()
        if not test_results['imap']:
            logger.error("❌ Connexion IMAP impossible. Vérifiez la configuration.")
            return
        
        logger.info("✅ Connexion IMAP établie")
        logger.info(f"✅ User ID par défaut: {self.default_user_id}")
        
        poll_count = 0
        while self.running:
            try:
                poll_count += 1
                logger.info(f"\n{'='*60}")
                logger.info(f"🔄 Poll #{poll_count} - {time.strftime('%H:%M:%S')}")
                logger.info(f"{'='*60}")
                
                await self._poll_emails()
                
                logger.info(f"⏳ Prochaine vérification dans {self.interval}s...\n")
                await asyncio.sleep(self.interval)
                
            except KeyboardInterrupt:
                logger.info("\n⚠️ Interruption utilisateur détectée")
                self.stop()
                break
                
            except Exception as e:
                logger.error(f"❌ Erreur dans la boucle de polling: {e}")
                logger.info(f"⏳ Nouvelle tentative dans {self.interval}s...")
                await asyncio.sleep(self.interval)
    
    async def _get_or_create_email_user(self) -> int:
        """Crée ou récupère l'utilisateur système pour les emails"""
        try:
            # Essayer de se connecter avec utilisateur existant
            username = "email_system"
            email = "system@iapostemanager.local"
            password = "EmailSystem2025!"
            
            # Essayer d'authentifier
            user = self.user_service.authenticate_user(username, password)
            if user:
                logger.info(f"✅ Utilisateur système trouvé: {username}")
                return user['id']
            
            # Créer l'utilisateur
            logger.info(f"📝 Création utilisateur système: {username}")
            user = self.user_service.register_user(
                username=username,
                email=email,
                password=password,
                role='system'
            )
            return user['id']
            
        except Exception as e:
            logger.error(f"❌ Erreur création utilisateur système: {e}")
            # Fallback: utiliser le premier utilisateur disponible
            return 1
    
    async def _poll_emails(self):
        """Vérifie les nouveaux emails et crée des workspaces"""
        try:
            # Récupérer les nouveaux emails
            emails = self.connector.fetch_new_emails(mark_as_read=False)
            
            if not emails:
                logger.info("📭 Aucun nouvel email")
                return
            
            logger.info(f"📬 {len(emails)} nouveau(x) email(s) trouvé(s)")
            
            # Traiter chaque email
            for i, email_msg in enumerate(emails, 1):
                # Éviter de retraiter les emails déjà processés
                if email_msg.message_id in self.processed_ids:
                    logger.info(f"   ⏭️ Email {i}/{len(emails)} déjà traité, skip")
                    continue
                
                logger.info(f"\n   📧 Email {i}/{len(emails)}:")
                logger.info(f"   De: {email_msg.from_address}")
                logger.info(f"   Sujet: {email_msg.subject}")
                logger.info(f"   Corps: {email_msg.body[:100]}{'...' if len(email_msg.body) > 100 else ''}")
                
                # Créer workspace depuis email
                try:
                    workspace = await self._create_workspace_from_email(email_msg)
                    
                    if workspace:
                        logger.info(f"   ✅ Workspace créé: #{workspace['id']} - {workspace['title']}")
                        self.processed_ids.add(email_msg.message_id)
                    else:
                        logger.warning(f"   ⚠️ Échec création workspace")
                        
                except Exception as e:
                    logger.error(f"   ❌ Erreur traitement email: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"❌ Erreur polling: {e}")
    
    async def _create_workspace_from_email(self, email_msg: EmailMessage) -> Optional[dict]:
        """
        Crée un workspace PostgreSQL depuis un email
        
        Args:
            email_msg: Email à traiter
            
        Returns:
            Workspace créé ou None
        """
        try:
            # Déterminer la priorité depuis le sujet
            subject_lower = email_msg.subject.lower()
            if any(word in subject_lower for word in ['urgent', 'important', 'asap']):
                priority = 'HIGH'
            elif any(word in subject_lower for word in ['low', 'fyi', 'info']):
                priority = 'LOW'
            else:
                priority = 'MEDIUM'
            
            # Créer le workspace
            workspace = self.workspace_service.create_workspace(
                user_id=self.default_user_id,
                title=email_msg.subject or '(Sans sujet)',
                source='email',
                priority=priority,
                workspace_metadata={
                    'email_data': {
                        'from': email_msg.from_address,
                        'to': email_msg.to_address,
                        'message_id': email_msg.message_id,
                        'date': email_msg.date,
                        'in_reply_to': email_msg.in_reply_to,
                        'references': email_msg.references,
                        'has_attachments': len(email_msg.attachments) > 0,
                        'attachment_count': len(email_msg.attachments)
                    }
                }
            )
            
            logger.info(f"   📁 Workspace PostgreSQL créé: {workspace['id']}")
            
            # Ajouter le message initial (corps de l'email)
            message = self.workspace_service.add_message(
                workspace_id=workspace['id'],
                role='user',
                content=email_msg.body or '(Corps vide)',
                metadata={
                    'sender': email_msg.from_address,
                    'email_subject': email_msg.subject,
                    'received_at': email_msg.date
                }
            )
            
            logger.info(f"   💬 Message ajouté: #{message['id']}")
            
            # Si il y a des pièces jointes, les mentionner dans un message
            if email_msg.attachments:
                attachments_info = f"📎 {len(email_msg.attachments)} pièce(s) jointe(s): {', '.join(att.filename for att in email_msg.attachments)}"
                self.workspace_service.add_message(
                    workspace_id=workspace['id'],
                    role='system',
                    content=attachments_info
                )
                logger.info(f"   {attachments_info}")
            
            return workspace
            
        except Exception as e:
            logger.error(f"   ❌ Erreur create_workspace_from_email: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def stop(self):
        """Arrête le polling"""
        self.running = False
        logger.info("🛑 Arrêt du polling demandé")


async def main():
    """Point d'entrée principal"""
    # Intervalle de polling (peut être configuré via .env)
    interval = int(os.getenv('IMAP_POLL_INTERVAL', 60))
    
    poller = EmailPollerV2(interval=interval)
    
    try:
        await poller.start()
    except KeyboardInterrupt:
        poller.stop()
        logger.info("✅ Service arrêté proprement")


if __name__ == '__main__':
    asyncio.run(main())
