"""
API REST Blueprint pour IA Poste Manager v4.0

Architecture séparée Frontend/Backend.
Ce module expose des endpoints JSON pour consommation par frontend React/mobile.
"""

from .routes import api_bp

__all__ = ['api_bp']
