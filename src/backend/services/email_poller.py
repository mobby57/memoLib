"""
Email Poller - Polling automatique des emails entrants
Vérifie les nouveaux emails toutes les X secondes et les traite via le MVP Orchestrator
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
from src.backend.mvp_orchestrator import MVPOrchestrator
from dotenv import load_dotenv

# Charger variables d'environnement
load_dotenv()

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EmailPoller:
    """
    Service de polling automatique des emails
    Vérifie régulièrement la boîte mail et traite les nouveaux messages
    """
    
    def __init__(self, interval: int = 60):
        """
        Initialise le poller
        
        Args:
            interval: Intervalle de polling en secondes (défaut: 60s)
        """
        self.interval = interval
        self.connector = EmailConnector()
        self.orchestrator = MVPOrchestrator()
        self.running = False
        self.processed_ids = set()  # Éviter de retraiter les mêmes emails
        
        logger.info(f"📧 Email Poller initialisé (intervalle: {interval}s)")
    
    async def start(self):
        """Démarre le polling en boucle infinie"""
        self.running = True
        logger.info("🚀 Démarrage du polling email...")
        
        # Test de connexion initial
        test_results = self.connector.test_connection()
        if not test_results['imap']:
            logger.error("❌ Connexion IMAP impossible. Vérifiez la configuration.")
            return
        
        logger.info("✅ Connexion IMAP établie")
        
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
    
    async def _poll_emails(self):
        """Vérifie les nouveaux emails et les traite"""
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
                logger.info(f"   Corps: {email_msg.body[:150]}{'...' if len(email_msg.body) > 150 else ''}")
                
                # Traiter via orchestrateur
                try:
                    result = await self._process_email(email_msg)
                    
                    if result and result.get('status') == 'completed':
                        logger.info(f"   ✅ Email traité avec succès")
                        
                        # Envoyer réponse automatique
                        await self._send_response(email_msg, result)
                        
                        # Marquer comme traité
                        self.processed_ids.add(email_msg.message_id)
                    else:
                        logger.warning(f"   ⚠️ Traitement incomplet: {result.get('status', 'unknown')}")
                        
                except Exception as e:
                    logger.error(f"   ❌ Erreur traitement email: {e}")
                    continue
            
        except Exception as e:
            logger.error(f"❌ Erreur polling: {e}")
    
    async def _process_email(self, email_msg: EmailMessage) -> Optional[dict]:
        """
        Traite un email via le MVP Orchestrator
        
        Args:
            email_msg: Email à traiter
            
        Returns:
            Résultat du traitement orchestrateur
        """
        try:
            # Créer workspace depuis email
            workspace_data = {
                'title': email_msg.subject,
                'channel': 'email',
                'metadata': {
                    'from': email_msg.from_address,
                    'to': email_msg.to_address,
                    'message_id': email_msg.message_id,
                    'date': email_msg.date,
                    'in_reply_to': email_msg.in_reply_to,
                    'references': email_msg.references
                }
            }
            
            workspace = self.orchestrator.workspace_service.create_workspace(**workspace_data)
            logger.info(f"   📁 Workspace créé: {workspace['id']}")
            
            # Ajouter le message initial
            self.orchestrator.workspace_service.add_message(
                workspace['id'],
                content=email_msg.body,
                sender=email_msg.from_address
            )
            
            # Exécuter le workflow complet
            result = await self.orchestrator.process_new_message(
                workspace['id'],
                email_msg.body
            )
            
            return result
            
        except Exception as e:
            logger.error(f"   ❌ Erreur process_email: {e}")
            return None
    
    async def _send_response(self, original_email: EmailMessage, result: dict):
        """
        Envoie une réponse automatique par email
        
        Args:
            original_email: Email original
            result: Résultat du traitement contenant la réponse
        """
        try:
            if not result.get('response'):
                logger.warning("   ⚠️ Pas de réponse générée")
                return
            
            response_content = result['response'].get('content', '')
            if not response_content:
                logger.warning("   ⚠️ Contenu de réponse vide")
                return
            
            # Préparer le sujet (Re: ...)
            subject = original_email.subject
            if not subject.lower().startswith('re:'):
                subject = f"Re: {subject}"
            
            # Envoyer la réponse
            success = self.connector.send_email(
                to=original_email.from_address,
                subject=subject,
                body=response_content,
                html=False,
                in_reply_to=original_email.message_id,
                references=original_email.references or original_email.message_id
            )
            
            if success:
                logger.info(f"   📤 Réponse envoyée à {original_email.from_address}")
            else:
                logger.error(f"   ❌ Échec envoi réponse")
                
        except Exception as e:
            logger.error(f"   ❌ Erreur send_response: {e}")
    
    def stop(self):
        """Arrête le polling"""
        logger.info("🛑 Arrêt du polling...")
        self.running = False


async def main():
    """Point d'entrée principal"""
    print("\n" + "="*70)
    print("📧 IA POSTE MANAGER - EMAIL POLLER")
    print("="*70)
    print()
    print("Configuration:")
    print(f"  - Intervalle: {os.getenv('IMAP_POLL_INTERVAL', 60)}s")
    print(f"  - IMAP Host: {os.getenv('IMAP_HOST', 'imap.gmail.com')}")
    print(f"  - IMAP User: {os.getenv('IMAP_USERNAME', '(non configuré)')}")
    print()
    print("Fonctionnement:")
    print("  1. Vérifie les nouveaux emails toutes les 60s")
    print("  2. Crée un workspace pour chaque email")
    print("  3. Analyse et génère une réponse via IA")
    print("  4. Envoie la réponse automatiquement")
    print()
    print("Appuyez sur CTRL+C pour arrêter")
    print("="*70 + "\n")
    
    # Récupérer l'intervalle depuis .env
    interval = int(os.getenv('IMAP_POLL_INTERVAL', 60))
    
    # Créer et lancer le poller
    poller = EmailPoller(interval=interval)
    
    try:
        await poller.start()
    except KeyboardInterrupt:
        logger.info("\n⚠️ Arrêt demandé")
    finally:
        poller.stop()
        logger.info("✅ Email poller arrêté proprement\n")


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n✅ Programme terminé\n")
