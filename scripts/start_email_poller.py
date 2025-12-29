#!/usr/bin/env python
"""
Script de démarrage du Email Poller
Lance le service de polling automatique des emails
"""

import sys
import os
import asyncio
from pathlib import Path

# Ajouter le chemin racine au PYTHONPATH
root_path = Path(__file__).parent.parent
sys.path.insert(0, str(root_path))

from dotenv import load_dotenv
from src.backend.services.email_poller import EmailPoller, main

# Charger variables d'environnement
load_dotenv()


if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║        📧  IA POSTE MANAGER - EMAIL POLLER SERVICE                ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

Fonctionnalités:
  ✓ Polling automatique IMAP toutes les 60s
  ✓ Création workspace pour chaque email
  ✓ Analyse IA et génération réponse
  ✓ Envoi automatique par SMTP
  ✓ Threading email (Re: et références)

Configuration (.env):
  IMAP_USERNAME = {imap_user}
  IMAP_HOST = {imap_host}
  SMTP_HOST = {smtp_host}
  POLL_INTERVAL = {interval}s

Appuyez sur CTRL+C pour arrêter
""".format(
        imap_user=os.getenv('IMAP_USERNAME', '(non configuré)'),
        imap_host=os.getenv('IMAP_HOST', 'imap.gmail.com'),
        smtp_host=os.getenv('SMTP_HOST', 'smtp.gmail.com'),
        interval=os.getenv('IMAP_POLL_INTERVAL', 60)
    ))
    
    input("Appuyez sur ENTRÉE pour démarrer... ")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n✅ Service arrêté proprement\n")
    except Exception as e:
        print(f"\n\n❌ Erreur fatale: {e}\n")
        sys.exit(1)
