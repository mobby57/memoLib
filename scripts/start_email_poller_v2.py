#!/usr/bin/env python
"""
Script de démarrage du Email Poller V2 (PostgreSQL)
Lance le service de polling automatique avec création de workspaces PostgreSQL
"""

import sys
import os
import asyncio
from pathlib import Path

# Ajouter le chemin racine au PYTHONPATH
root_path = Path(__file__).parent.parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / 'src'))

from dotenv import load_dotenv
from src.backend.services.email_poller_v2 import EmailPollerV2, main

# Charger variables d'environnement
load_dotenv()


if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     📧  IA POSTE MANAGER - EMAIL POLLER V2 (PostgreSQL)           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

Fonctionnalités V2:
  ✓ Polling automatique IMAP toutes les {interval}s
  ✓ Création workspace PostgreSQL pour chaque email
  ✓ Extraction metadata (from, subject, date, attachments)
  ✓ Détection priorité automatique (HIGH/MEDIUM/LOW)
  ✓ Stockage messages dans PostgreSQL
  ✓ Détection pièces jointes

Améliorations vs V1:
  → PostgreSQL au lieu de SQLite
  → Workspaces avec statuts et priorités
  → User system intégré
  → Messages avec métadonnées riches
  → Compatible avec l'API v2 et le frontend React

Configuration (.env):
  IMAP_USERNAME = {imap_user}
  IMAP_HOST = {imap_host}
  POLL_INTERVAL = {interval}s

Backend API:  http://localhost:5000/api/v2
Frontend UI:  http://localhost:3000/workspaces

Appuyez sur CTRL+C pour arrêter
""".format(
        imap_user=os.getenv('IMAP_USERNAME', '(non configuré)'),
        imap_host=os.getenv('IMAP_HOST', 'imap.gmail.com'),
        interval=os.getenv('IMAP_POLL_INTERVAL', 60)
    ))
    
    input("Appuyez sur ENTRÉE pour démarrer... ")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n✅ Service arrêté proprement\n")
    except Exception as e:
        print(f"\n\n❌ Erreur fatale: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
