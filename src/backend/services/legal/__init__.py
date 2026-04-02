"""
Modules juridiques pour la gestion d'un cabinet d'avocat
"""

from .deadline_manager import DeadlineManager
from .billing_manager import BillingManager
from .compliance_manager import ComplianceManager
from .advanced_templates import TemplateGenerator

__all__ = [
    'DeadlineManager',
    'BillingManager',
    'ComplianceManager',
    'TemplateGenerator'
]
