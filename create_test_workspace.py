#!/usr/bin/env python
"""Script pour créer un workspace de test manuellement"""

import sys
from pathlib import Path
from datetime import datetime

# Add paths
root_path = Path(__file__).parent
sys.path.insert(0, str(root_path))
sys.path.insert(0, str(root_path / 'src'))

from src.backend.services.database_service import get_database_service

def main():
    db_service = get_database_service()
    
    # Create a test workspace simulating what the email poller would create
    workspace = db_service.create_workspace(
        user_id=200,  # email_system user
        title='[TEST MANUEL] Verification Frontend - ' + datetime.now().strftime('%H:%M:%S'),
        source='email',
        priority='HIGH',
        workspace_metadata={
            'email_data': {
                'from': 'test@example.com',
                'to': 'sarraboudjellal57@gmail.com',
                'date': datetime.now().isoformat(),
                'message_id': '<test-123@example.com>',
                'has_attachments': False,
                'attachment_count': 0
            }
        }
    )
    
    print(f'✅ Workspace cree: ID {workspace["id"]}')
    print(f'📝 Titre: {workspace["title"]}')
    print(f'📊 Source: {workspace["source"]}')
    print(f'🔴 Priorite: {workspace["priority"]}')
    
    # Add a message
    message = db_service.create_message(
        workspace_id=workspace['id'],
        role='USER',
        content='Ceci est un message de test pour verifier affichage dans le frontend React.',
        message_metadata={
            'sender': 'test@example.com',
            'email_subject': workspace['title']
        }
    )
    
    print(f'💬 Message ajoute: ID {message["id"]}')
    print('')
    print(f'🌐 Verifiez le frontend: http://localhost:3000/workspaces')
    print(f'🔑 Login: email_system / EmailSystem2025!')
    
if __name__ == '__main__':
    main()
