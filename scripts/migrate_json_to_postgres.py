"""
Script de migration des données JSON vers PostgreSQL
Créé: 28 Décembre 2025
"""

import json
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

from models.database import (
    create_engine_and_session,
    User, Workspace, Message, Template, Signature,
    WorkspaceStatus, WorkspacePriority, MessageRole
)

def load_json_file(filepath):
    """Charger un fichier JSON"""
    if not os.path.exists(filepath):
        print(f"⚠️  Fichier non trouvé: {filepath}")
        return []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data, list) else [data]
    except Exception as e:
        print(f"❌ Erreur lecture {filepath}: {e}")
        return []

def migrate_users(session):
    """Migrer les utilisateurs"""
    print("\n👤 Migration des utilisateurs...")
    
    users_data = load_json_file('data/users.json')
    
    # Vérifier si user admin existe déjà
    existing_user = session.query(User).filter_by(email='admin@iapostemanager.com').first()
    
    if not users_data or all(not u.get('email') for u in users_data):
        if existing_user:
            print("   ℹ️  Utilisateur admin existe déjà")
            return 0
        
        print("   ℹ️  Aucun utilisateur valide dans users.json, création utilisateur par défaut...")
        # Créer utilisateur par défaut
        default_user = User(
            username='admin',
            email='admin@iapostemanager.com',
            password_hash='default_hash_change_me',
            first_name='Admin',
            last_name='System',
            role='admin',
            is_active=True
        )
        session.add(default_user)
        session.commit()
        print("   ✅ 1 utilisateur par défaut créé")
        return 1
    
    migrated = 0
    for user_json in users_data:
        # Skip si pas d'email
        if not user_json.get('email'):
            continue
            
        # Skip si existe déjà
        existing = session.query(User).filter_by(email=user_json.get('email')).first()
        if existing:
            continue
            
        try:
            user = User(
                username=user_json.get('username', user_json.get('email', '').split('@')[0]),
                email=user_json.get('email'),
                password_hash=user_json.get('password', 'default_hash'),
                first_name=user_json.get('name', '').split()[0] if user_json.get('name') else None,
                last_name=' '.join(user_json.get('name', '').split()[1:]) if user_json.get('name') and len(user_json.get('name', '').split()) > 1 else None,
                role=user_json.get('role', 'user'),
                preferences=user_json.get('preferences', {}),
                is_active=True
            )
            
            session.add(user)
            migrated += 1
            
        except Exception as e:
            print(f"   ⚠️  Erreur user {user_json.get('email')}: {e}")
    
    session.commit()
    print(f"   ✅ {migrated} utilisateurs migrés")
    
    return migrated

def migrate_templates(session):
    """Migrer les templates"""
    print("\n📄 Migration des templates...")
    
    templates_data = load_json_file('data/templates.json')
    
    # Récupérer un user par défaut
    default_user = session.query(User).first()
    if not default_user:
        print("   ⚠️  Aucun utilisateur trouvé, création d'un utilisateur par défaut...")
        default_user = User(
            username='admin',
            email='admin@iapostemanager.com',
            password_hash='default_hash',
            role='admin',
            is_active=True
        )
        session.add(default_user)
        session.commit()
    
    migrated = 0
    for template_json in templates_data:
        try:
            template = Template(
                user_id=default_user.id,
                name=template_json.get('name', 'Template sans nom'),
                description=template_json.get('description'),
                category=template_json.get('category', 'general'),
                subject=template_json.get('subject'),
                body=template_json.get('body', ''),
                is_html=template_json.get('is_html', False),
                variables=template_json.get('variables', []),
                is_active=True,
                usage_count=template_json.get('usage_count', 0)
            )
            
            session.add(template)
            migrated += 1
            
        except Exception as e:
            print(f"   ⚠️  Erreur template {template_json.get('name')}: {e}")
    
    session.commit()
    print(f"   ✅ {migrated} templates migrés")
    
    return migrated

def migrate_signatures(session):
    """Migrer les signatures"""
    print("\n✍️  Migration des signatures...")
    
    signatures_data = load_json_file('data/signatures.json')
    
    # Récupérer un user par défaut
    default_user = session.query(User).first()
    if not default_user:
        print("   ⚠️  Aucun utilisateur trouvé")
        return 0
    
    migrated = 0
    for sig_json in signatures_data:
        try:
            signature = Signature(
                user_id=default_user.id,
                name=sig_json.get('name', 'Signature'),
                content=sig_json.get('content', ''),
                is_html=sig_json.get('is_html', False),
                is_default=sig_json.get('is_default', False),
                is_active=True
            )
            
            session.add(signature)
            migrated += 1
            
        except Exception as e:
            print(f"   ⚠️  Erreur signature {sig_json.get('name')}: {e}")
    
    session.commit()
    print(f"   ✅ {migrated} signatures migrées")
    
    return migrated

def migrate_workspaces(session):
    """Migrer les workspaces depuis workflow_history.json"""
    print("\n📁 Migration des workspaces...")
    
    # Essayer workflow_history.json d'abord
    workspaces_data = load_json_file('data/workflow_history.json')
    
    if not workspaces_data:
        print("   ℹ️  Aucun workspace à migrer")
        return 0
    
    # Récupérer un user par défaut
    default_user = session.query(User).first()
    if not default_user:
        print("   ⚠️  Aucun utilisateur trouvé")
        return 0
    
    migrated = 0
    for ws_json in workspaces_data:
        try:
            # Déterminer le statut
            status_str = ws_json.get('status', 'in_progress').lower()
            if status_str == 'completed':
                status = WorkspaceStatus.COMPLETED
            elif status_str == 'not_started':
                status = WorkspaceStatus.NOT_STARTED
            elif status_str == 'archived':
                status = WorkspaceStatus.ARCHIVED
            else:
                status = WorkspaceStatus.IN_PROGRESS
            
            # Déterminer la priorité
            priority_str = ws_json.get('priority', 'medium').lower()
            if priority_str == 'high':
                priority = WorkspacePriority.HIGH
            elif priority_str == 'low':
                priority = WorkspacePriority.LOW
            elif priority_str == 'urgent':
                priority = WorkspacePriority.URGENT
            else:
                priority = WorkspacePriority.MEDIUM
            
            workspace = Workspace(
                user_id=default_user.id,
                title=ws_json.get('title', 'Workspace sans titre'),
                description=ws_json.get('description'),
                status=status,
                priority=priority,
                progress=ws_json.get('progress', 0.0),
                source=ws_json.get('source', 'web'),
                source_id=ws_json.get('source_id'),
                workspace_metadata=ws_json.get('metadata', {}),
                tags=ws_json.get('tags', [])
            )
            
            session.add(workspace)
            session.flush()  # Pour obtenir l'ID
            
            # Migrer les messages si présents
            messages_data = ws_json.get('messages', [])
            for msg_json in messages_data:
                role_str = msg_json.get('role', 'user').lower()
                if role_str == 'assistant':
                    role = MessageRole.ASSISTANT
                elif role_str == 'system':
                    role = MessageRole.SYSTEM
                else:
                    role = MessageRole.USER
                
                message = Message(
                    workspace_id=workspace.id,
                    role=role,
                    content=msg_json.get('content', ''),
                    message_metadata=msg_json.get('metadata', {})
                )
                session.add(message)
            
            migrated += 1
            
        except Exception as e:
            print(f"   ⚠️  Erreur workspace {ws_json.get('title')}: {e}")
            import traceback
            traceback.print_exc()
    
    session.commit()
    print(f"   ✅ {migrated} workspaces migrés")
    
    return migrated

def main():
    """Migration principale"""
    print("=" * 60)
    print("📦 MIGRATION DONNÉES JSON → POSTGRESQL")
    print("=" * 60)
    
    # Créer session
    engine, SessionLocal = create_engine_and_session()
    session = SessionLocal()
    
    try:
        # Migrations
        users_count = migrate_users(session)
        templates_count = migrate_templates(session)
        signatures_count = migrate_signatures(session)
        workspaces_count = migrate_workspaces(session)
        
        # Résumé
        print("\n" + "=" * 60)
        print("✅ MIGRATION TERMINÉE")
        print("=" * 60)
        print(f"\n📊 Résumé:")
        print(f"   - {users_count} utilisateurs")
        print(f"   - {templates_count} templates")
        print(f"   - {signatures_count} signatures")
        print(f"   - {workspaces_count} workspaces")
        print(f"\n   Total: {users_count + templates_count + signatures_count + workspaces_count} enregistrements")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        session.rollback()
    finally:
        session.close()
        engine.dispose()

if __name__ == '__main__':
    main()
