"""
Analysis Pipeline Package
Moteur d'analyse des flux légaux

Modules:
- pipelines: Pipeline orchestration and rule engine
- schemas: Pydantic schemas for data validation
- config: Configuration management
"""

__version__ = "1.0.0"
__author__ = "MemoLib Team"

from analysis.pipelines.pipeline import AnalysisPipeline

__all__ = ["AnalysisPipeline"]
