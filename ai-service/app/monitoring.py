"""
Monitoring and Metrics for AI Service

Provides:
- Prometheus metrics endpoint
- Request duration tracking
- Error rate monitoring
- Custom business metrics
"""

import time
from functools import wraps
from typing import Callable

import structlog
from fastapi import Request, Response
from prometheus_client import Counter, Gauge, Histogram
from prometheus_fastapi_instrumentator import Instrumentator, metrics

logger = structlog.get_logger()

# =============================================================================
# Custom Prometheus Metrics
# =============================================================================

# Document processing
DOCUMENTS_PROCESSED = Counter(
    "ai_documents_processed_total",
    "Total documents processed",
    ["document_type", "status"],
)

DOCUMENT_PROCESSING_TIME = Histogram(
    "ai_document_processing_seconds",
    "Time spent processing documents",
    ["document_type"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

# AI Generation
GENERATIONS_TOTAL = Counter(
    "ai_generations_total", "Total document generations", ["document_type", "status"]
)

GENERATION_TOKENS = Histogram(
    "ai_generation_tokens",
    "Tokens used in generation",
    ["model"],
    buckets=[100, 500, 1000, 2000, 4000, 8000, 16000],
)

# Analysis
ANALYSIS_TOTAL = Counter(
    "ai_analysis_total", "Total text analyses performed", ["analysis_type", "language"]
)

ANALYSIS_TEXT_LENGTH = Histogram(
    "ai_analysis_text_length",
    "Length of text analyzed",
    buckets=[100, 500, 1000, 5000, 10000, 50000],
)

# System health
ACTIVE_REQUESTS = Gauge("ai_active_requests", "Currently active requests")

OPENAI_API_ERRORS = Counter(
    "ai_openai_api_errors_total", "OpenAI API errors", ["error_type"]
)


# =============================================================================
# Instrumentator Setup
# =============================================================================


def setup_metrics(app):
    """
    Setup Prometheus metrics instrumentation for FastAPI app.

    Call this in main.py:
        from app.monitoring import setup_metrics
        setup_metrics(app)
    """
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/health", "/health/live", "/health/ready", "/metrics"],
        inprogress_name="ai_inprogress_requests",
        inprogress_labels=True,
    )

    # Add default metrics
    instrumentator.add(
        metrics.default(
            metric_namespace="ai",
            metric_subsystem="http",
        )
    )

    # Add latency histogram
    instrumentator.add(
        metrics.latency(
            metric_namespace="ai",
            metric_subsystem="http",
        )
    )

    # Add request size
    instrumentator.add(
        metrics.request_size(
            metric_namespace="ai",
            metric_subsystem="http",
        )
    )

    # Add response size
    instrumentator.add(
        metrics.response_size(
            metric_namespace="ai",
            metric_subsystem="http",
        )
    )

    # Instrument and expose
    instrumentator.instrument(app)
    instrumentator.expose(app, endpoint="/metrics", include_in_schema=False)

    logger.info("prometheus_metrics_enabled", endpoint="/metrics")

    return instrumentator


# =============================================================================
# Decorators for tracking
# =============================================================================


def track_processing_time(document_type: str):
    """Decorator to track document processing time"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                DOCUMENTS_PROCESSED.labels(
                    document_type=document_type, status="success"
                ).inc()
                return result
            except Exception as e:
                DOCUMENTS_PROCESSED.labels(
                    document_type=document_type, status="error"
                ).inc()
                raise
            finally:
                duration = time.time() - start_time
                DOCUMENT_PROCESSING_TIME.labels(document_type=document_type).observe(
                    duration
                )

        return wrapper

    return decorator


def track_generation(document_type: str, model: str = "gpt-4"):
    """Decorator to track AI generation metrics"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                result = await func(*args, **kwargs)
                GENERATIONS_TOTAL.labels(
                    document_type=document_type, status="success"
                ).inc()

                # Track tokens if available in result
                if hasattr(result, "usage") and result.usage:
                    GENERATION_TOKENS.labels(model=model).observe(
                        result.usage.total_tokens
                    )

                return result
            except Exception as e:
                GENERATIONS_TOTAL.labels(
                    document_type=document_type, status="error"
                ).inc()
                raise

        return wrapper

    return decorator


def track_analysis(analysis_type: str = "general"):
    """Decorator to track analysis metrics"""

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get text from args/kwargs to measure length
            text = kwargs.get("text", args[0] if args else "")
            if hasattr(text, "text"):  # Pydantic model
                text = text.text

            ANALYSIS_TEXT_LENGTH.observe(len(str(text)))

            try:
                result = await func(*args, **kwargs)
                ANALYSIS_TOTAL.labels(
                    analysis_type=analysis_type,
                    language=kwargs.get("language", "unknown"),
                ).inc()
                return result
            except Exception:
                raise

        return wrapper

    return decorator


# =============================================================================
# Structured Logging Middleware
# =============================================================================


async def logging_middleware(request: Request, call_next):
    """
    Middleware for structured request logging.

    Add to app:
        app.middleware("http")(logging_middleware)
    """
    start_time = time.time()

    # Generate request ID
    request_id = request.headers.get("X-Request-ID", str(time.time_ns()))

    # Bind request context to logger
    log = logger.bind(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else "unknown",
    )

    ACTIVE_REQUESTS.inc()

    try:
        response: Response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        log.info(
            "request_completed",
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        return response
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log.error(
            "request_failed",
            error=str(e),
            duration_ms=round(duration_ms, 2),
        )
        raise
    finally:
        ACTIVE_REQUESTS.dec()
