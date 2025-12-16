"""
Modèle de base de données pour les comptes email provisionnés
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

class EmailAccount(db.Model):
    """Comptes email génériques créés par les utilisateurs"""
    __tablename__ = 'email_accounts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email_address = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), nullable=False)
    display_name = Column(String(255))
    
    # Configuration SMTP
    smtp_server = Column(String(255))
    smtp_port = Column(Integer)
    smtp_username = Column(String(255))
    # Note: Ne PAS stocker smtp_password en clair, utiliser un vault
    
    # Métadonnées
    provider = Column(String(50))  # sendgrid, aws-ses, microsoft365, google
    status = Column(String(20), default='active')  # active, suspended, deleted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Quotas
    emails_sent_today = Column(Integer, default=0)
    emails_sent_month = Column(Integer, default=0)
    daily_limit = Column(Integer, default=500)
    monthly_limit = Column(Integer, default=10000)
    
    # Relations
    user = relationship('User', backref='email_accounts')
    
    def __repr__(self):
        return f'<EmailAccount {self.email_address}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email_address,
            'display_name': self.display_name,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'emails_sent_today': self.emails_sent_today,
            'emails_sent_month': self.emails_sent_month,
            'usage_percent': round((self.emails_sent_month / self.monthly_limit) * 100, 1)
        }


class EmailProvisioningLog(db.Model):
    """Log des opérations de provisioning"""
    __tablename__ = 'email_provisioning_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    email_account_id = Column(Integer, ForeignKey('email_accounts.id'))
    action = Column(String(50))  # create, suspend, delete, update
    status = Column(String(20))  # success, failed
    error_message = Column(String(500))
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<EmailProvisioningLog {self.action} - {self.status}>'


# Migration Alembic
"""
Migration pour ajouter les tables de provisioning email

Revision ID: add_email_provisioning
Revises: previous_revision
Create Date: 2025-12-16

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Créer table email_accounts
    op.create_table(
        'email_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_address', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(255)),
        sa.Column('smtp_server', sa.String(255)),
        sa.Column('smtp_port', sa.Integer()),
        sa.Column('smtp_username', sa.String(255)),
        sa.Column('provider', sa.String(50)),
        sa.Column('status', sa.String(20)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('emails_sent_today', sa.Integer(), default=0),
        sa.Column('emails_sent_month', sa.Integer(), default=0),
        sa.Column('daily_limit', sa.Integer(), default=500),
        sa.Column('monthly_limit', sa.Integer(), default=10000),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('email_address')
    )
    op.create_index('ix_email_accounts_user_id', 'email_accounts', ['user_id'])
    op.create_index('ix_email_accounts_email_address', 'email_accounts', ['email_address'])
    op.create_index('ix_email_accounts_status', 'email_accounts', ['status'])
    
    # Créer table email_provisioning_logs
    op.create_table(
        'email_provisioning_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('email_account_id', sa.Integer()),
        sa.Column('action', sa.String(50)),
        sa.Column('status', sa.String(20)),
        sa.Column('error_message', sa.String(500)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['email_account_id'], ['email_accounts.id'])
    )
    op.create_index('ix_provisioning_logs_user_id', 'email_provisioning_logs', ['user_id'])
    op.create_index('ix_provisioning_logs_created_at', 'email_provisioning_logs', ['created_at'])

def downgrade():
    op.drop_table('email_provisioning_logs')
    op.drop_table('email_accounts')
