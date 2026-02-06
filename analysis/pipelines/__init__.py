"""
Analysis Pipeline - Moteur d'analyse légale pour MemoLib

Module: Déterministe, traçable, explicable

Exports:
- RuleEngine: Moteur d'application des règles
- EventPreparer: Normalisation des unités
- DuplicateChecker: Détection intelligente
- EventLogger: Génération des EventLog
- AnalysisPipeline: Orchestrateur complet
"""

from .detect_duplicates import DuplicateChecker
from .generate_events import EventLogger
from .pipeline import AnalysisPipeline
from .prepare_events import EventPreparer
from .rules_engine import DeadlineExtractor, DuplicateDetector, RuleEngine

__version__ = "1.0.0"
__all__ = [
    "RuleEngine",
    "DeadlineExtractor",
    "DuplicateDetector",
    "EventPreparer",
    "DuplicateChecker",
    "EventLogger",
    "AnalysisPipeline",
]
