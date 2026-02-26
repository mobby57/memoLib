"""
Configuration et variables d'environnement pour le pipeline d'analyse
"""

import os
from typing import Optional

# Configuration du pipeline
PIPELINE_API_BASE_URL = os.getenv("ANALYSIS_API_URL", "http://localhost:3000")
PIPELINE_BACKEND_URL = os.getenv("ANALYSIS_BACKEND_URL", "http://localhost:5000")

# Seuils des règles (customizable)
RULE_DEADLINE_CRITICAL_DAYS = int(os.getenv("RULE_DEADLINE_CRITICAL_DAYS", "3"))
RULE_DEADLINE_APPROACHING_DAYS = int(os.getenv("RULE_DEADLINE_APPROACHING_DAYS", "7"))
RULE_REPETITION_THRESHOLD = int(os.getenv("RULE_REPETITION_THRESHOLD", "2"))
RULE_REPETITION_WINDOW_DAYS = int(os.getenv("RULE_REPETITION_WINDOW_DAYS", "30"))

# Configuration du fuzzy matching
FUZZY_MATCH_THRESHOLD = float(os.getenv("FUZZY_MATCH_THRESHOLD", "0.95"))
METADATA_MATCH_TIME_WINDOW_SECONDS = int(
    os.getenv("METADATA_MATCH_TIME_WINDOW_SECONDS", "300")
)

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
SENTRY_DSN = os.getenv("SENTRY_DSN")

# Batch processing
PIPELINE_BATCH_SIZE = int(os.getenv("PIPELINE_BATCH_SIZE", "100"))
PIPELINE_TIMEOUT_SECONDS = int(os.getenv("PIPELINE_TIMEOUT_SECONDS", "300"))

# Scheduling (APScheduler)
PIPELINE_SCHEDULE_INTERVAL_HOURS = int(
    os.getenv("PIPELINE_SCHEDULE_INTERVAL_HOURS", "4")
)

# Defaults
DEFAULT_TENANT_ID = os.getenv("DEFAULT_TENANT_ID", "default")
DEFAULT_UNIT_STATUS = os.getenv("DEFAULT_UNIT_STATUS", "RECEIVED")

# Feature flags
ENABLE_DUPLICATE_DETECTION = (
    os.getenv("ENABLE_DUPLICATE_DETECTION", "true").lower() == "true"
)
ENABLE_SEMANTIC_ANALYSIS = (
    os.getenv("ENABLE_SEMANTIC_ANALYSIS", "true").lower() == "true"
)
ENABLE_AUTO_PERSISTENCE = os.getenv("ENABLE_AUTO_PERSISTENCE", "true").lower() == "true"


def get_config() -> dict:
    """Retourne la configuration actuelle du pipeline"""
    return {
        "api_base_url": PIPELINE_API_BASE_URL,
        "backend_url": PIPELINE_BACKEND_URL,
        "rule_deadline_critical_days": RULE_DEADLINE_CRITICAL_DAYS,
        "fuzzy_match_threshold": FUZZY_MATCH_THRESHOLD,
        "batch_size": PIPELINE_BATCH_SIZE,
        "schedule_interval_hours": PIPELINE_SCHEDULE_INTERVAL_HOURS,
        "features": {
            "duplicate_detection": ENABLE_DUPLICATE_DETECTION,
            "semantic_analysis": ENABLE_SEMANTIC_ANALYSIS,
            "auto_persistence": ENABLE_AUTO_PERSISTENCE,
        },
    }
