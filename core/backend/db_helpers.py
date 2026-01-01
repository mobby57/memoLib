"""
Database helper functions using SQLAlchemy ORM
Replaces raw SQL queries throughout the application
"""
from database import db, User, Dossier, Facture, AuditTrail
from sqlalchemy import func
from datetime import datetime

def get_all_dossiers_with_creator():
    """Get all dossiers with creator username"""
    return db.session.query(Dossier, User.username).join(
        User, Dossier.created_by == User.id, isouter=True
    ).order_by(Dossier.created_at.desc()).all()

def get_dossier_by_id(dossier_id):
    """Get dossier by ID with creator info"""
    result = db.session.query(Dossier, User.username).join(
        User, Dossier.created_by == User.id, isouter=True
    ).filter(Dossier.id == dossier_id).first()
    
    if not result:
        return None
    
    dossier, username = result
    data = dossier.to_dict()
    data['created_by_name'] = username
    return data

def create_dossier(data, created_by):
    """Create new dossier"""
    dossier = Dossier(
        numero=data['numero'],
        client_nom=data['client_nom'],
        client_email=data.get('client_email'),
        type_dossier=data['type_dossier'],
        description=data.get('description'),
        prediction_ia=data.get('prediction_ia'),
        strategie_recommandee=data.get('strategie_recommandee'),
        created_by=created_by
    )
    db.session.add(dossier)
    db.session.commit()
    return dossier

def update_dossier(dossier_id, data):
    """Update existing dossier"""
    dossier = Dossier.query.get(dossier_id)
    if not dossier:
        return False
    
    if 'client_nom' in data:
        dossier.client_nom = data['client_nom']
    if 'client_email' in data:
        dossier.client_email = data['client_email']
    if 'type_dossier' in data:
        dossier.type_dossier = data['type_dossier']
    if 'statut' in data:
        dossier.statut = data['statut']
    if 'description' in data:
        dossier.description = data['description']
    
    dossier.updated_at = datetime.utcnow()
    db.session.commit()
    return True

def delete_dossier(dossier_id):
    """Delete dossier"""
    dossier = Dossier.query.get(dossier_id)
    if not dossier:
        return False
    
    db.session.delete(dossier)
    db.session.commit()
    return True

def get_all_factures():
    """Get all factures with dossier info"""
    return db.session.query(Facture, Dossier.numero).join(
        Dossier, Facture.dossier_id == Dossier.id, isouter=True
    ).order_by(Facture.created_at.desc()).all()

def get_facture_by_id(facture_id):
    """Get facture by ID"""
    facture = Facture.query.get(facture_id)
    return facture.to_dict() if facture else None

def create_facture(data):
    """Create new facture"""
    facture = Facture(
        numero=data['numero'],
        dossier_id=data.get('dossier_id'),
        client_nom=data['client_nom'],
        montant_ht=data['montant_ht'],
        tva=data.get('tva', 20.0),
        montant_ttc=data['montant_ttc'],
        statut=data.get('statut', 'emise'),
        date_echeance=data.get('date_echeance'),
        description=data.get('description')
    )
    db.session.add(facture)
    db.session.commit()
    return facture

def get_dashboard_stats():
    """Get dashboard statistics"""
    stats = {}
    
    # Dossiers stats
    stats['total_dossiers'] = Dossier.query.count()
    stats['dossiers_nouveau'] = Dossier.query.filter_by(statut='nouveau').count()
    stats['dossiers_en_cours'] = Dossier.query.filter_by(statut='en_cours').count()
    stats['dossiers_termine'] = Dossier.query.filter_by(statut='termine').count()
    
    # Factures stats
    total_factures = Facture.query.count()
    total_montant = db.session.query(func.sum(Facture.montant_ttc)).scalar() or 0
    stats['total_factures'] = total_factures
    stats['total_chiffre_affaires'] = float(total_montant)
    
    # Factures payées
    factures_payees = Facture.query.filter_by(statut='payee').count()
    montant_encaisse = db.session.query(func.sum(Facture.montant_ttc)).filter(
        Facture.statut == 'payee'
    ).scalar() or 0
    stats['factures_payees'] = factures_payees
    stats['montant_encaisse'] = float(montant_encaisse)
    
    # IA prediction average
    avg_prediction = db.session.query(func.avg(Dossier.prediction_ia)).filter(
        Dossier.prediction_ia.isnot(None)
    ).scalar()
    stats['avg_prediction'] = float(avg_prediction) if avg_prediction else 0.0
    
    # Recent activity
    recent_dossiers = Dossier.query.order_by(Dossier.created_at.desc()).limit(10).all()
    stats['recent_dossiers'] = [d.to_dict() for d in recent_dossiers]
    
    return stats
