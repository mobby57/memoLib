"""
Utilitaire pour gérer l'audit trail - Traçabilité complète
"""
from database import db, AuditTrail
from flask import request
from datetime import datetime

def log_audit(user_id, action, resource_type, resource_id=None, details=None):
    """
    Enregistre une action dans la piste d'audit
    
    Args:
        user_id: ID de l'utilisateur qui effectue l'action
        action: Type d'action (create, update, delete, view, export, login, logout)
        resource_type: Type de ressource (dossier, client, document, facture, user)
        resource_id: ID de la ressource concernée (optionnel)
        details: Description textuelle de l'action
    """
    try:
        # Récupérer le contexte de la requête
        ip_address = request.remote_addr if request else None
        user_agent = request.headers.get('User-Agent', '')[:255] if request else None
        
        # Créer l'entrée d'audit
        audit = AuditTrail(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(audit)
        db.session.commit()
        
        return True
    except Exception as e:
        print(f"❌ Erreur audit trail: {e}")
        db.session.rollback()
        return False


def get_resource_history(resource_type, resource_id, limit=50):
    """
    Récupère l'historique complet d'une ressource
    
    Args:
        resource_type: Type de ressource (dossier, client, etc.)
        resource_id: ID de la ressource
        limit: Nombre max d'entrées à retourner
    
    Returns:
        Liste des actions sur cette ressource
    """
    try:
        history = AuditTrail.query\
            .filter_by(resource_type=resource_type, resource_id=str(resource_id))\
            .order_by(AuditTrail.timestamp.desc())\
            .limit(limit)\
            .all()
        
        return [audit.to_dict() for audit in history]
    except Exception as e:
        print(f"❌ Erreur récupération historique: {e}")
        return []


def get_user_activity(user_id, limit=100):
    """
    Récupère l'activité récente d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        limit: Nombre max d'actions à retourner
    
    Returns:
        Liste des actions de l'utilisateur
    """
    try:
        activity = AuditTrail.query\
            .filter_by(user_id=user_id)\
            .order_by(AuditTrail.timestamp.desc())\
            .limit(limit)\
            .all()
        
        return [audit.to_dict() for audit in activity]
    except Exception as e:
        print(f"❌ Erreur récupération activité: {e}")
        return []


def search_audit(filters, limit=100):
    """
    Recherche dans l'audit trail avec filtres
    
    Args:
        filters: Dict des filtres (user_id, action, resource_type, date_debut, date_fin)
        limit: Nombre max de résultats
    
    Returns:
        Liste des entrées d'audit correspondantes
    """
    try:
        query = AuditTrail.query
        
        if filters.get('user_id'):
            query = query.filter_by(user_id=filters['user_id'])
        
        if filters.get('action'):
            query = query.filter_by(action=filters['action'])
        
        if filters.get('resource_type'):
            query = query.filter_by(resource_type=filters['resource_type'])
        
        if filters.get('resource_id'):
            query = query.filter_by(resource_id=str(filters['resource_id']))
        
        if filters.get('date_debut'):
            query = query.filter(AuditTrail.timestamp >= filters['date_debut'])
        
        if filters.get('date_fin'):
            query = query.filter(AuditTrail.timestamp <= filters['date_fin'])
        
        results = query.order_by(AuditTrail.timestamp.desc()).limit(limit).all()
        
        return [audit.to_dict() for audit in results]
    except Exception as e:
        print(f"❌ Erreur recherche audit: {e}")
        return []
