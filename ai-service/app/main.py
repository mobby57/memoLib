"""
AI Service - FastAPI Application
Service IA pour memoLib : OCR, NLP, génération de documents
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import structlog
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .monitoring import logging_middleware, setup_metrics
from .routers import analysis, documents, generation, health

# Structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# FastAPI App
app = FastAPI(
    title="IA Poste Manager - AI Service",
    description="Service IA pour OCR, NLP, et génération de documents juridiques",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(generation.router, prefix="/api/generation", tags=["Generation"])

# Setup Prometheus metrics
setup_metrics(app)

# Add logging middleware
app.middleware("http")(logging_middleware)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info(
        "ai_service_starting", version="1.0.0", environment=settings.ENVIRONMENT
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("ai_service_shutdown")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ai-service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled",
    }
