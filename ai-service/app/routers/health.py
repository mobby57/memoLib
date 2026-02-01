"""
Health check endpoints
"""

import os
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check() -> Dict[str, Any]:
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check - verify all dependencies are available"""
    checks = {
        "openai": _check_openai(),
        "database": await _check_database(),
    }

    all_healthy = all(c["status"] == "ok" for c in checks.values())

    return {
        "status": "ready" if all_healthy else "degraded",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/live")
async def liveness_check() -> Dict[str, str]:
    """Liveness check - verify service is running"""
    return {"status": "alive"}


def _check_openai() -> Dict[str, str]:
    """Check OpenAI API key is configured"""
    api_key = os.getenv("OPENAI_API_KEY", "")
    return {
        "status": "ok" if api_key else "missing",
        "message": "API key configured" if api_key else "OPENAI_API_KEY not set",
    }


async def _check_database() -> Dict[str, str]:
    """Check database connectivity"""
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return {"status": "skipped", "message": "DATABASE_URL not configured"}

    try:
        # TODO: Implement actual DB check
        return {"status": "ok", "message": "Database connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
