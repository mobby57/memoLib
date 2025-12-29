#!/usr/bin/env python
"""Script simple pour envoyer un email de test"""

import sys
from pathlib import Path
from datetime import datetime

# Add paths
root_path = Path(__file__).parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / 'src'))

from src.backend.services.email_connector import EmailConnector

def main():
    connector = EmailConnector()
    test_time = datetime.now().strftime('%H:%M:%S')
    
    subject = f'[NOUVEAU TEST] Workspace PostgreSQL - {test_time}'
    body = f'''Bonjour,

Ceci est un nouveau test end-to-end du système Email → Workspace PostgreSQL.

Heure d'envoi: {test_time}
Source: Email Poller V2
Backend: PostgreSQL + Flask API v2
Frontend: React http://localhost:3000/workspaces

Ce workspace devrait apparaître automatiquement dans le frontend après le prochain poll (max 60s).

Métadonnées attendues:
- Source: email
- Priority: MEDIUM (pas de mot-clé urgent/fyi)
- Status: IN_PROGRESS
- Message: Corps de cet email
- User: email_system (ID 200)

Cordialement,
Test automatique
'''
    
    print(f'📧 Envoi email de test...')
    print(f'📝 Sujet: {subject}')
    print(f'📧 Destinataire: {connector.imap_user}')
    
    result = connector.send_email(
        to=connector.imap_user,
        subject=subject,
        body=body
    )
    
    print(f'✅ Email envoyé avec succès!')
    print(f'⏳ Attendez max 60s pour le prochain poll du poller...')
    print(f'🌐 Vérifiez le frontend: http://localhost:3000/workspaces')

if __name__ == '__main__':
    main()
